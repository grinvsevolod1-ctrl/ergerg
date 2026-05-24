#!/usr/bin/env python3
import os
import json
from telethon import TelegramClient
from telethon.sessions import StringSession
from aiohttp import web

API_ID = int(os.getenv('TELEGRAM_API_ID', '20639437'))
API_HASH = os.getenv('TELEGRAM_API_HASH', '4a29124d57494a44737b0f539f449b82')
clients = {}

async def send_code(request):
    data = await request.json()
    phone = data.get('phone')
    
    client = TelegramClient(StringSession(), API_ID, API_HASH)
    await client.connect()
    
    try:
        await client.send_code_request(phone)
        clients[phone] = client
        return web.json_response({'success': True})
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def verify_code(request):
    data = await request.json()
    phone = data.get('phone')
    code = data.get('code')
    
    client = clients.get(phone)
    if not client:
        return web.json_response({'error': 'Session expired'}, status=400)
    
    try:
        await client.sign_in(phone, code)
        session_str = client.session.save()
        return web.json_response({'success': True, 'session_string': session_str})
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

app = web.Application()
app.router.add_post('/send-code', send_code)
app.router.add_post('/verify-code', verify_code)

if __name__ == '__main__':
    web.run_app(app, port=8004)
