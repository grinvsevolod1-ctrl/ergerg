"""
Queue Service - Flood Wait Manager for Telegram API.
Handles rate limiting and automatic retry logic.
"""
import asyncio
import time
import logging
from typing import Dict, Callable, Any, Optional
from functools import wraps

logger = logging.getLogger(__name__)


class FloodManager:
    """Manages flood wait times for different phone numbers/operations."""
    
    def __init__(self):
        self._wait_times: Dict[str, float] = {}  # phone -> timestamp when wait ends
        self._lock = asyncio.Lock()
    
    async def get_wait_time(self, phone: str) -> int:
        """Get remaining wait time in seconds for a phone number."""
        async with self._lock:
            if phone not in self._wait_times:
                return 0
            
            remaining = self._wait_times[phone] - time.time()
            if remaining <= 0:
                del self._wait_times[phone]
                return 0
            
            return int(remaining)
    
    async def set_wait(self, phone: str, seconds: int):
        """Set flood wait time for a phone number."""
        async with self._lock:
            self._wait_times[phone] = time.time() + seconds
            logger.info(f"Set flood wait for {phone}: {seconds}s")
    
    async def clear_wait(self, phone: str):
        """Clear flood wait for a phone number."""
        async with self._lock:
            if phone in self._wait_times:
                del self._wait_times[phone]
    
    async def is_waiting(self, phone: str) -> bool:
        """Check if phone number is in flood wait."""
        return await self.get_wait_time(phone) > 0


# Global flood manager instance
flood_manager = FloodManager()


async def with_flood_retry(
    func: Callable,
    phone: str = "",
    max_retries: int = 3,
    initial_delay: float = 1.0
) -> Any:
    """
    Wrapper that handles FloodWaitError with automatic retry.
    
    Args:
        func: Async function to execute
        phone: Phone number for tracking flood waits
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay between retries (exponential backoff)
    
    Returns:
        Result of the function call
    
    Raises:
        FloodWaitError: If max retries exceeded
        Any other exception from the function
    """
    from telethon.errors import FloodWaitError
    
    delay = initial_delay
    last_error = None
    
    for attempt in range(max_retries + 1):
        # Check if we're in flood wait
        if phone:
            wait_time = await flood_manager.get_wait_time(phone)
            if wait_time > 0:
                if attempt < max_retries:
                    logger.info(f"Waiting {wait_time}s for flood wait to expire (attempt {attempt + 1})")
                    await asyncio.sleep(min(wait_time, 30))  # Wait max 30s per iteration
                    continue
                else:
                    raise FloodWaitError(request=None, capture=wait_time)
        
        try:
            result = await func()
            # Success - clear any wait time
            if phone:
                await flood_manager.clear_wait(phone)
            return result
            
        except FloodWaitError as e:
            last_error = e
            wait_seconds = e.seconds if hasattr(e, 'seconds') else 60
            
            logger.warning(f"FloodWaitError: waiting {wait_seconds}s (attempt {attempt + 1}/{max_retries + 1})")
            
            # Record the wait time
            if phone:
                await flood_manager.set_wait(phone, wait_seconds)
            
            if attempt < max_retries:
                # Wait and retry
                actual_wait = min(wait_seconds, 60)  # Cap at 60s per retry
                await asyncio.sleep(actual_wait)
                delay *= 2  # Exponential backoff
            else:
                raise
        
        except Exception as e:
            # Non-flood errors - don't retry
            logger.error(f"Error in with_flood_retry: {e}")
            raise
    
    # Should not reach here, but just in case
    if last_error:
        raise last_error
    raise RuntimeError("Max retries exceeded")


def flood_protected(phone_arg: str = "phone", max_retries: int = 2):
    """
    Decorator for flood-protected async functions.
    
    Usage:
        @flood_protected(phone_arg="phone")
        async def send_code(phone: str):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Try to get phone from kwargs or args
            phone = kwargs.get(phone_arg, "")
            if not phone and args:
                # Try to find phone in args based on function signature
                import inspect
                sig = inspect.signature(func)
                params = list(sig.parameters.keys())
                if phone_arg in params:
                    idx = params.index(phone_arg)
                    if idx < len(args):
                        phone = args[idx]
            
            async def _call():
                return await func(*args, **kwargs)
            
            return await with_flood_retry(_call, phone=phone, max_retries=max_retries)
        
        return wrapper
    return decorator
