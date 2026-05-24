"""
Queue Service for handling Telegram API rate limits and FloodWaitError
Implements exponential backoff and task queuing
"""
import asyncio
import logging
from typing import Callable, Any, Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict
from dataclasses import dataclass, field
from enum import Enum
import time

from telethon.errors import FloodWaitError, SlowModeWaitError

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRY = "retry"


@dataclass
class QueueTask:
    """Represents a queued task."""
    id: str
    func: Callable
    args: tuple = field(default_factory=tuple)
    kwargs: dict = field(default_factory=dict)
    phone: str = ""  # Account phone for per-account queuing
    status: TaskStatus = TaskStatus.PENDING
    retries: int = 0
    max_retries: int = 3
    created_at: datetime = field(default_factory=datetime.utcnow)
    retry_after: Optional[datetime] = None
    result: Any = None
    error: Optional[str] = None


class FloodWaitManager:
    """
    Manages flood wait timers per Telegram account.
    Prevents requests while account is in flood wait.
    """
    
    def __init__(self):
        self._wait_until: Dict[str, datetime] = {}
        self._lock = asyncio.Lock()
    
    async def set_wait(self, phone: str, seconds: int):
        """Set flood wait for an account."""
        async with self._lock:
            wait_until = datetime.utcnow() + timedelta(seconds=seconds)
            self._wait_until[phone] = wait_until
            logger.warning(f"FloodWait set for {phone}: {seconds}s until {wait_until}")
    
    async def get_wait_time(self, phone: str) -> int:
        """Get remaining wait time in seconds. Returns 0 if no wait."""
        async with self._lock:
            wait_until = self._wait_until.get(phone)
            if not wait_until:
                return 0
            
            remaining = (wait_until - datetime.utcnow()).total_seconds()
            if remaining <= 0:
                del self._wait_until[phone]
                return 0
            
            return int(remaining)
    
    async def can_proceed(self, phone: str) -> bool:
        """Check if account can make requests."""
        return await self.get_wait_time(phone) == 0
    
    async def wait_if_needed(self, phone: str) -> int:
        """Wait if account is in flood wait. Returns seconds waited."""
        wait_time = await self.get_wait_time(phone)
        if wait_time > 0:
            logger.info(f"Waiting {wait_time}s for {phone} flood wait")
            await asyncio.sleep(wait_time)
            return wait_time
        return 0


class TaskQueue:
    """
    Priority queue for Telegram API tasks with rate limiting.
    Handles FloodWaitError with automatic retry.
    """
    
    def __init__(self, max_concurrent: int = 5, base_delay: float = 0.5):
        self._queue: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self._running: Dict[str, QueueTask] = {}
        self._completed: Dict[str, QueueTask] = {}
        self._flood_manager = FloodWaitManager()
        self._max_concurrent = max_concurrent
        self._base_delay = base_delay
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._running_tasks: Dict[str, asyncio.Task] = {}
        self._per_account_delay: Dict[str, float] = defaultdict(lambda: base_delay)
        self._started = False
        self._worker_task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the queue worker."""
        if self._started:
            return
        self._started = True
        self._worker_task = asyncio.create_task(self._worker())
        logger.info("TaskQueue worker started")
    
    async def stop(self):
        """Stop the queue worker."""
        self._started = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("TaskQueue worker stopped")
    
    async def enqueue(
        self,
        task_id: str,
        func: Callable,
        phone: str,
        *args,
        priority: int = 5,
        max_retries: int = 3,
        **kwargs
    ) -> QueueTask:
        """
        Add a task to the queue.
        Priority: 1 = highest, 10 = lowest
        """
        task = QueueTask(
            id=task_id,
            func=func,
            args=args,
            kwargs=kwargs,
            phone=phone,
            max_retries=max_retries
        )
        
        # Priority tuple: (priority, timestamp, task_id)
        await self._queue.put((priority, time.time(), task))
        logger.debug(f"Enqueued task {task_id} for {phone} with priority {priority}")
        return task
    
    async def _worker(self):
        """Background worker that processes queued tasks."""
        while self._started:
            try:
                # Get next task (blocks until available)
                try:
                    priority, timestamp, task = await asyncio.wait_for(
                        self._queue.get(), timeout=1.0
                    )
                except asyncio.TimeoutError:
                    continue
                
                # Process task with semaphore for concurrency control
                async with self._semaphore:
                    await self._process_task(task)
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Queue worker error: {e}")
    
    async def _process_task(self, task: QueueTask):
        """Process a single task with retry logic."""
        task.status = TaskStatus.RUNNING
        self._running[task.id] = task
        
        try:
            # Check flood wait
            await self._flood_manager.wait_if_needed(task.phone)
            
            # Add per-account delay to avoid rate limits
            delay = self._per_account_delay[task.phone]
            if delay > 0:
                await asyncio.sleep(delay)
            
            # Execute the task
            result = await task.func(*task.args, **task.kwargs)
            
            # Success - reduce delay
            self._per_account_delay[task.phone] = max(
                self._base_delay, 
                self._per_account_delay[task.phone] * 0.9
            )
            
            task.result = result
            task.status = TaskStatus.COMPLETED
            logger.debug(f"Task {task.id} completed successfully")
            
        except FloodWaitError as e:
            # Handle flood wait
            await self._flood_manager.set_wait(task.phone, e.seconds)
            
            if task.retries < task.max_retries:
                task.retries += 1
                task.status = TaskStatus.RETRY
                task.retry_after = datetime.utcnow() + timedelta(seconds=e.seconds)
                
                # Increase per-account delay
                self._per_account_delay[task.phone] = min(
                    30.0,  # Max 30 seconds delay
                    self._per_account_delay[task.phone] * 2
                )
                
                # Re-queue with lower priority
                await self._queue.put((8, time.time(), task))
                logger.warning(f"Task {task.id} re-queued after FloodWait ({e.seconds}s)")
            else:
                task.status = TaskStatus.FAILED
                task.error = f"FloodWaitError after {task.retries} retries"
                logger.error(f"Task {task.id} failed: {task.error}")
                
        except SlowModeWaitError as e:
            # Handle slow mode (similar to flood wait)
            task.error = f"SlowModeWaitError: {e.seconds}s"
            task.status = TaskStatus.FAILED
            logger.warning(f"Task {task.id} failed due to slow mode: {e.seconds}s")
            
        except Exception as e:
            # Handle other errors with retry
            if task.retries < task.max_retries:
                task.retries += 1
                task.status = TaskStatus.RETRY
                
                # Exponential backoff
                backoff = min(60, (2 ** task.retries) * self._base_delay)
                task.retry_after = datetime.utcnow() + timedelta(seconds=backoff)
                
                await asyncio.sleep(backoff)
                await self._queue.put((7, time.time(), task))
                logger.warning(f"Task {task.id} retry {task.retries}/{task.max_retries}: {e}")
            else:
                task.status = TaskStatus.FAILED
                task.error = str(e)
                logger.error(f"Task {task.id} failed: {e}")
        
        finally:
            self._running.pop(task.id, None)
            if task.status in (TaskStatus.COMPLETED, TaskStatus.FAILED):
                self._completed[task.id] = task
    
    def get_task_status(self, task_id: str) -> Optional[QueueTask]:
        """Get task by ID."""
        if task_id in self._running:
            return self._running[task_id]
        return self._completed.get(task_id)
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics."""
        return {
            "pending": self._queue.qsize(),
            "running": len(self._running),
            "completed": len(self._completed),
            "flood_waits": {
                phone: wait_time 
                for phone, wait_until in self._flood_manager._wait_until.items()
                if (wait_time := (wait_until - datetime.utcnow()).total_seconds()) > 0
            }
        }
    
    async def clear_completed(self, older_than_seconds: int = 3600):
        """Clear completed tasks older than specified time."""
        cutoff = datetime.utcnow() - timedelta(seconds=older_than_seconds)
        to_remove = [
            tid for tid, task in self._completed.items()
            if task.created_at < cutoff
        ]
        for tid in to_remove:
            del self._completed[tid]
        return len(to_remove)


# Global queue instance
task_queue = TaskQueue()
flood_manager = FloodWaitManager()


async def with_flood_retry(
    func: Callable,
    phone: str,
    *args,
    max_retries: int = 3,
    **kwargs
) -> Any:
    """
    Execute a function with automatic flood wait retry.
    Use this for simple one-off calls that need flood handling.
    """
    retries = 0
    last_error = None
    
    while retries <= max_retries:
        try:
            # Wait if in flood wait
            await flood_manager.wait_if_needed(phone)
            
            return await func(*args, **kwargs)
            
        except FloodWaitError as e:
            await flood_manager.set_wait(phone, e.seconds)
            retries += 1
            last_error = e
            
            if retries <= max_retries:
                logger.warning(
                    f"FloodWaitError for {phone}: waiting {e.seconds}s "
                    f"(retry {retries}/{max_retries})"
                )
                await asyncio.sleep(e.seconds)
            
        except Exception as e:
            # For non-flood errors, retry with backoff
            retries += 1
            last_error = e
            
            if retries <= max_retries:
                backoff = min(30, (2 ** retries))
                logger.warning(f"Error for {phone}: {e}, retrying in {backoff}s")
                await asyncio.sleep(backoff)
    
    raise last_error or Exception("Max retries exceeded")
