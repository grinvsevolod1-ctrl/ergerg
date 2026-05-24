"""
Telegram Service - Telethon wrapper with MASTER SESSION support.
All accounts share the same auth_key to avoid "new login" notifications.
"""
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import (
    SessionPasswordNeededError, PhoneCodeInvalidError,
    PhoneCodeExpiredError, PasswordHashInvalidError,
    FloodWaitError, PhoneNumberBannedError, PhoneNumberInvalidError
)
from cryptography.fernet import Fernet
import base64, hashlib, os
import asyncio
import logging
from typing import Dict, Any, Optional
from .queue_service import with_flood_retry, flood_manager

logger = logging.getLogger(__name__)


class TelegramService:
    CLIENT_PARAMS = {
        "device_model": "Desktop",
        "system_version": "Windows 11",
        "app_version": "5.10.3 x64",
        "lang_code": "en",
        "system_lang_code": "en-US"
    }

    def __init__(self, api_id: int, api_hash: str, encryption_key: str):
        self.api_id = api_id
        self.api_hash = api_hash
        key = hashlib.sha256(encryption_key.encode()).digest()
        self.fernet = Fernet(base64.urlsafe_b64encode(key))
        self._clients: Dict[str, TelegramClient] = {}
        
        # Master session - one auth_key for all accounts
        self._master_session: Optional[str] = None
        self._master_client: Optional[TelegramClient] = None
        
        # Load master session from config if exists
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config.json')
        try:
            with open(config_path, 'r') as f:
                config = __import__('json').load(f)
            if config.get('master_session_string'):
                self._master_session = config['master_session_string']
                print(f"Loaded master session from config")
        except:
            pass

    # ============ MASTER CLIENT ============
    
    async def _get_master_client(self) -> TelegramClient:
        """Get or create the master client with shared auth_key."""
        if self._master_client and self._master_client.is_connected():
            return self._master_client
        
        if self._master_session:
            session = StringSession(self._master_session)
        else:
            session = StringSession()
        
        self._master_client = TelegramClient(session, self.api_id, self.api_hash, **self.CLIENT_PARAMS)
        await self._master_client.connect()
        return self._master_client

    def _save_master_session(self, session_string: str):
        """Save the master session string."""
        self._master_session = session_string
        # Also persist to file
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config.json')
        try:
            with open(config_path, 'r') as f:
                config = __import__('json').load(f)
            config['master_session_string'] = session_string
            with open(config_path, 'w') as f:
                __import__('json').dump(config, f, indent=2)
        except:
            pass

    # ============ AUTH METHODS ============

    async def send_code(self, phone: str) -> Dict[str, Any]:
        """Send verification code. Always creates a fresh client to avoid session conflicts."""
        # Check if we're in flood wait for this phone
        wait_time = await flood_manager.get_wait_time(phone)
        if wait_time > 0:
            return {"success": False, "error": f"Подождите {wait_time} сек", "flood_wait": wait_time}
        
        try:
            # Always create a fresh client for code requests
            # Do NOT use master session here - log_out() kills the client
            client = TelegramClient(StringSession(), self.api_id, self.api_hash, **self.CLIENT_PARAMS)
            await client.connect()
            
            sent_code = await client.send_code_request(phone)
            self._clients[phone] = client
            
            # Save master session on first use
            if not self._master_session:
                self._save_master_session(client.session.save())
            
            return {"success": True, "phone_code_hash": sent_code.phone_code_hash}
        except PhoneNumberInvalidError:
            return {"success": False, "error": "Неверный номер телефона"}
        except PhoneNumberBannedError:
            return {"success": False, "error": "Номер заблокирован"}
        except FloodWaitError as e:
            await flood_manager.set_wait(phone, e.seconds)
            logger.warning(f"FloodWait for {phone}: {e.seconds}s")
            return {"success": False, "error": f"Подождите {e.seconds} сек", "flood_wait": e.seconds}
        except Exception as e:
            logger.error(f"send_code error for {phone}: {e}")
            return {"success": False, "error": str(e)}

    async def sign_in(self, phone: str, code: str, phone_code_hash: str) -> Dict[str, Any]:
        client = self._clients.get(phone)
        if not client:
            return {"success": False, "error": "Сессия не найдена"}
        try:
            user = await client.sign_in(phone=phone, code=code, phone_code_hash=phone_code_hash)
            session_string = client.session.save()
            
            # Auto-delete new login notification
            await self._delete_new_login_notifications(client)
            
            del self._clients[phone]
            return {
                "success": True, "session_string": session_string,
                "user": {"id": user.id, "first_name": user.first_name,
                         "last_name": user.last_name, "username": user.username, "phone": user.phone}
            }
        except SessionPasswordNeededError:
            return {"success": False, "requires_2fa": True}
        except PhoneCodeInvalidError:
            return {"success": False, "error": "Неверный код"}
        except PhoneCodeExpiredError:
            return {"success": False, "error": "Код истек"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def check_2fa(self, phone: str, password: str) -> Dict[str, Any]:
        client = self._clients.get(phone)
        if not client:
            return {"success": False, "error": "Сессия не найдена"}
        try:
            user = await client.sign_in(password=password)
            session_string = client.session.save()
            # Auto-delete new login notification
            await self._delete_new_login_notifications(client)
            del self._clients[phone]
            return {
                "success": True, "session_string": session_string,
                "user": {"id": user.id, "first_name": user.first_name,
                         "last_name": user.last_name, "username": user.username, "phone": user.phone}
            }
        except PasswordHashInvalidError:
            return {"success": False, "error": "Неверный пароль"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ============ ENCRYPTION ============
    
    def encrypt_session(self, session_string: str) -> str:
        return self.fernet.encrypt(session_string.encode()).decode()

    def decrypt_session(self, encrypted_session: str) -> str:
        return self.fernet.decrypt(encrypted_session.encode()).decode()

    # ============ OPERATIONS ============

    async def _get_operational_client(self, session_string: str) -> TelegramClient:
        """Get a client for dialogs/messages. Uses master session if available."""
        if self._master_session:
            # Use master session for all operations
            client = TelegramClient(
                StringSession(self._master_session),
                self.api_id, self.api_hash, **self.CLIENT_PARAMS
            )
            await client.connect()
            if not await client.is_user_authorized():
                # Fallback to provided session
                await client.disconnect()
                client = TelegramClient(
                    StringSession(session_string),
                    self.api_id, self.api_hash, **self.CLIENT_PARAMS
                )
                await client.connect()
        else:
            client = TelegramClient(
                StringSession(session_string),
                self.api_id, self.api_hash, **self.CLIENT_PARAMS
            )
            await client.connect()
        return client

    async def get_dialogs(self, session_string: str, limit: int = 100) -> list:
        client = await self._get_operational_client(session_string)
        try:
            dialogs = await client.get_dialogs(limit=limit)
            result = []
            for d in dialogs:
                last_text = d.message.text[:100] if d.message and d.message.text else None
                last_date = d.message.date.isoformat() if d.message and d.message.date else None
                result.append({
                    "id": d.id, "name": d.name or "Unknown",
                    "type": self._get_dialog_type(d),
                    "unread_count": d.unread_count,
                    "last_message": last_text, "last_message_date": last_date
                })
            return result
        finally:
            await client.disconnect()

    async def get_messages(self, session_string: str, chat_id: int, limit: int = 50, offset_id: int = 0) -> list:
        client = await self._get_operational_client(session_string)
        try:
            kwargs = {"entity": chat_id, "limit": limit}
            if offset_id and offset_id > 0:
                kwargs["offset_id"] = offset_id
            messages = await client.get_messages(**kwargs)
            result = []
            for m in messages:
                if not m:
                    continue
                if m.out:
                    sender_name = "Вы"
                else:
                    sender_name = "Unknown"
                    if m.sender_id:
                        try:
                            sender = await m.get_sender()
                            if sender:
                                sender_name = getattr(sender, 'first_name', None) or getattr(sender, 'title', '') or str(m.sender_id)
                        except:
                            sender_name = str(m.sender_id)
                media_type = None
                if m.media:
                    media_type = type(m.media).__name__.replace('MessageMedia', '').lower()
                text = m.text
                if not text and hasattr(m.media, 'caption'):
                    text = m.media.caption
                result.append({
                    "id": m.id, "text": text,
                    "date": m.date.isoformat() if m.date else "",
                    "out": m.out, "sender_id": m.sender_id,
                    "sender_name": sender_name, "media_type": media_type
                })
            return result
        finally:
            await client.disconnect()

    async def send_message(self, session_string: str, chat_id: int, text: str, reply_to: Optional[int] = None, phone: str = "") -> dict:
        """Send message with automatic flood wait handling."""
        client = await self._get_operational_client(session_string)
        try:
            async def _send():
                return await client.send_message(chat_id, text, reply_to=reply_to if reply_to else None)
            
            # Use flood retry wrapper
            message = await with_flood_retry(_send, phone, max_retries=2)
            return {"success": True, "message_id": message.id, "text": message.text, "date": message.date.isoformat(), "out": True}
        except FloodWaitError as e:
            await flood_manager.set_wait(phone, e.seconds)
            return {"success": False, "error": f"Подождите {e.seconds} сек", "flood_wait": e.seconds}
        except Exception as e:
            logger.error(f"send_message error: {e}")
            return {"success": False, "error": str(e)}
        finally:
            await client.disconnect()

    def _get_dialog_type(self, dialog) -> str:
        if dialog.is_user:
            return "user"
        elif dialog.is_group:
            return "group"
        elif dialog.is_channel:
            return "channel"
        return "unknown"

    async def _delete_new_login_notifications(self, client: TelegramClient):
        """Delete 'new login' service messages from Telegram official account."""
        try:
            # Telegram official account ID
            TELEGRAM_ID = 777000
            messages = await client.get_messages(TELEGRAM_ID, limit=5)
            for m in messages:
                if m and m.text and ("new login" in m.text.lower() or "новый вход" in m.text.lower()):
                    await m.delete()
        except Exception:
            pass  # Ignore errors

    async def _get_or_create_client(self, session_string: str) -> TelegramClient:
        """Get or create a connected client from session string."""
        return await self._get_operational_client(session_string)

    async def create_client_from_session(self, encrypted_session: str) -> TelegramClient:
        """Create a connected client from encrypted session."""
        session_string = self.decrypt_session(encrypted_session)
        client = TelegramClient(
            StringSession(session_string),
            self.api_id, self.api_hash, **self.CLIENT_PARAMS
        )
        await client.connect()
        return client
