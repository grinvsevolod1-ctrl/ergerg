#!/usr/bin/env python3
"""
Telegram Service for Nexik - Powered by UCD Panel's TelegramService.
Runs on port 8005.
"""
import os, sys, hashlib, base64, logging
from aiohttp import web

# Import TelegramService from local copy
sys.path.insert(0, '/var/www/netnext-new/telegram-service')
from telegram_service import TelegramService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_ID = 33416167
API_HASH = '3c2e15d97493ce6928949701e9cd0cce'
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', 'd03a026281d195e29be1e1499780d9e7')

# Init TelegramService with CLIENT_PARAMS
telegram_service = TelegramService(API_ID, API_HASH, ENCRYPTION_KEY)

async def health(request):
    """Health check endpoint."""
    return web.json_response({
        'status': 'ok',
        'service': 'telegram-service',
        'version': '1.0.0'
    })

async def ping(request):
    return web.json_response({'status': 'ok', 'service': 'telegram-service'})

async def send_code(request):
    """Send verification code to phone number."""
    try:
        data = await request.json()
        phone = data.get('phone', '').strip().replace(' ', '')
        if not phone.startswith('+'):
            phone = '+' + phone
        if len(phone) < 10:
            return web.json_response({'error': 'Invalid phone number'}, status=400)

        logger.info(f"Sending code to {phone}")
        result = await telegram_service.send_code(phone)
        
        if result.get('success'):
            return web.json_response({
                'success': True,
                'phone_code_hash': result['phone_code_hash']
            })
        else:
            return web.json_response({
                'success': False,
                'error': result.get('error', 'Failed to send code')
            }, status=400)
    except Exception as e:
        logger.error(f"Send code error: {e}")
        return web.json_response({'error': str(e)}, status=500)

async def sign_in(request):
    """Sign in with code. Returns encrypted session_string on success."""
    try:
        data = await request.json()
        phone = data.get('phone', '').strip().replace(' ', '')
        if not phone.startswith('+'):
            phone = '+' + phone
        code = data.get('code', '').strip()
        phone_code_hash = data.get('phone_code_hash', '')

        if not code:
            return web.json_response({'error': 'Code required'}, status=400)

        logger.info(f"Signing in {phone}")
        
        # Try sign in with code
        result = await telegram_service.sign_in(phone, code, phone_code_hash)
        
        if result.get('requires_2fa'):
            return web.json_response({
                'success': False,
                'requires_2fa': True,
                'phone': phone
            }, status=200)
        
        if result.get('success'):
            session_str = result['session_string']
            encrypted = telegram_service.encrypt_session(session_str)
            return web.json_response({
                'success': True,
                'session_string': encrypted,
                'user': result.get('user', {})
            })
        else:
            return web.json_response({
                'success': False,
                'error': result.get('error', 'Invalid code')
            }, status=400)
            
    except Exception as e:
        logger.error(f"Sign in error: {e}")
        return web.json_response({'error': str(e)}, status=500)

async def check_2fa(request):
    """Submit 2FA password."""
    try:
        data = await request.json()
        phone = data.get('phone', '').strip().replace(' ', '')
        if not phone.startswith('+'):
            phone = '+' + phone
        password = data.get('password', '')

        logger.info(f"Checking 2FA for {phone}")
        result = await telegram_service.check_2fa(phone, password)
        
        if result.get('success'):
            session_str = result['session_string']
            encrypted = telegram_service.encrypt_session(session_str)
            return web.json_response({
                'success': True,
                'session_string': encrypted,
                'user': result.get('user', {})
            })
        else:
            return web.json_response({
                'success': False,
                'error': result.get('error', 'Wrong password')
            }, status=400)
            
    except Exception as e:
        logger.error(f"2FA error: {e}")
        return web.json_response({'error': str(e)}, status=500)

async def decrypt_session(request):
    """Decrypt session string (for debugging)."""
    try:
        data = await request.json()
        encrypted = data.get('session_string', '')
        session_str = telegram_service.decrypt_session(encrypted)
        return web.json_response({'session_string': session_str[:50] + '...'})
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def send_message(request):
    """Send message to Telegram chat."""
    try:
        data = await request.json()
        session_string = data.get('session_string')
        chat_id = data.get('chat_id')
        text = data.get('text', '')
        
        if not session_string or not chat_id:
            return web.json_response({'error': 'session_string and chat_id required'}, status=400)
        
        # Decrypt session
        decrypted = telegram_service.decrypt_session(session_string)
        
        # Create client and send message
        from telethon import TelegramClient
        from telethon.sessions import StringSession
        
        client = TelegramClient(StringSession(decrypted), API_ID, API_HASH, **TelegramService.CLIENT_PARAMS)
        await client.connect()
        
        try:
            message = await client.send_message(int(chat_id), text)
            await client.disconnect()
            return web.json_response({
                'success': True,
                'message_id': message.id,
                'date': message.date.isoformat()
            })
        except Exception as e:
            await client.disconnect()
            return web.json_response({'error': str(e)}, status=400)
            
    except Exception as e:
        logger.error(f"Send message error: {e}")
        return web.json_response({'error': str(e)}, status=500)

async def get_dialogs(request):
    """Get recent dialogs/chats for syncing."""
    try:
        data = await request.json()
        session_string = data.get('session_string')
        limit = data.get('limit', 50)
        
        if not session_string:
            return web.json_response({'error': 'session_string required'}, status=400)
        
        decrypted = telegram_service.decrypt_session(session_string)
        
        from telethon import TelegramClient
        from telethon.sessions import StringSession
        
        client = TelegramClient(StringSession(decrypted), API_ID, API_HASH, **TelegramService.CLIENT_PARAMS)
        await client.connect()
        
        try:
            dialogs = []
            async for dialog in client.iter_dialogs(limit=limit):
                dialogs.append({
                    'id': dialog.id,
                    'name': dialog.name,
                    'title': dialog.title,
                    'is_user': dialog.is_user,
                    'is_group': dialog.is_group,
                    'is_channel': dialog.is_channel,
                    'unread_count': dialog.unread_count,
                    'last_message': dialog.message.text if dialog.message else None,
                    'last_message_date': dialog.message.date.isoformat() if dialog.message else None
                })
            
            await client.disconnect()
            return web.json_response({
                'success': True,
                'dialogs': dialogs
            })
        except Exception as e:
            await client.disconnect()
            return web.json_response({'error': str(e)}, status=400)
            
    except Exception as e:
        logger.error(f"Get dialogs error: {e}")
        return web.json_response({'error': str(e)}, status=500)

async def get_messages(request):
    """Get messages from a specific chat."""
    try:
        data = await request.json()
        session_string = data.get('session_string')
        chat_id = data.get('chat_id')
        limit = data.get('limit', 50)
        offset_id = data.get('offset_id', 0)
        
        if not session_string or not chat_id:
            return web.json_response({'error': 'session_string and chat_id required'}, status=400)
        
        decrypted = telegram_service.decrypt_session(session_string)
        
        from telethon import TelegramClient
        from telethon.sessions import StringSession
        
        client = TelegramClient(StringSession(decrypted), API_ID, API_HASH, **TelegramService.CLIENT_PARAMS)
        await client.connect()
        
        try:
            messages = []
            async for msg in client.iter_messages(int(chat_id), limit=limit, offset_id=offset_id):
                messages.append({
                    'id': msg.id,
                    'text': msg.text,
                    'date': msg.date.isoformat(),
                    'out': msg.out,
                    'sender_id': msg.sender_id,
                    'reply_to_msg_id': msg.reply_to_msg_id,
                    'media_type': type(msg.media).__name__ if msg.media else None
                })
            
            await client.disconnect()
            return web.json_response({
                'success': True,
                'messages': messages
            })
        except Exception as e:
            await client.disconnect()
            return web.json_response({'error': str(e)}, status=400)
            
    except Exception as e:
        logger.error(f"Get messages error: {e}")
        return web.json_response({'error': str(e)}, status=500)

# Create app and register routes
app = web.Application()

# Health and status
app.router.add_get('/health', health)
app.router.add_get('/ping', ping)

# Auth routes
app.router.add_post('/send-code', send_code)
app.router.add_post('/sign-in', sign_in)
app.router.add_post('/check-2fa', check_2fa)
app.router.add_post('/decrypt', decrypt_session)

# Messaging routes
app.router.add_post('/send-message', send_message)
app.router.add_post('/get-dialogs', get_dialogs)
app.router.add_post('/get-messages', get_messages)

if __name__ == '__main__':
    print("Telegram Service for Nexik starting on port 8005")
    web.run_app(app, port=8005)
