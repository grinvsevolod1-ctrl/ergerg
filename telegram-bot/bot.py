#!/usr/bin/env python3
"""
NetNext Telegram Bot (@netnextadminbot)
=======================================
Relay bot: users message the bot -> owner gets forwarded message ->
owner replies -> bot sends reply back to the user.

Also handles notifications from the website (chat & contact forms).
Uses PostgreSQL for session storage (shared with website).

Requirements: python-telegram-bot>=21.0, python-dotenv, psycopg2-binary
Install: pip install python-telegram-bot python-dotenv psycopg2-binary
Run: python bot.py
"""

import os
import logging
from datetime import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    ContextTypes,
)

load_dotenv()

# --- Config ---
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
OWNER_CHAT_ID = int(os.getenv("TELEGRAM_OWNER_ID") or os.getenv("TELEGRAM_CHAT_ID") or "0")
DATABASE_URL = os.getenv("DATABASE_URL", "")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


# --- Database helpers ---
def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def create_telegram_session(chat_id: int, username: str | None, name: str | None) -> str:
    """Create or get session for Telegram user."""
    session_id = f"tg_{chat_id}"
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO chat_sessions (id, user_type, telegram_chat_id, telegram_username, telegram_name)
                VALUES (%s, 'telegram', %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET 
                    last_activity = NOW(),
                    telegram_username = COALESCE(EXCLUDED.telegram_username, chat_sessions.telegram_username),
                    telegram_name = COALESCE(EXCLUDED.telegram_name, chat_sessions.telegram_name)
                RETURNING id
            """, (session_id, chat_id, username, name))
            conn.commit()
    
    return session_id


def get_active_operator_sessions() -> list[dict]:
    """Get all sessions where operator is connected."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM chat_sessions 
                WHERE operator_connected = true 
                ORDER BY last_activity DESC
            """)
            return cur.fetchall()


def connect_operator(session_id: str) -> None:
    """Connect operator to a session."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE chat_sessions 
                SET operator_connected = true, operator_connected_at = NOW(), last_activity = NOW()
                WHERE id = %s
            """, (session_id,))
            conn.commit()


def disconnect_operator(session_id: str = None) -> int:
    """Disconnect operator from session(s). Returns count of disconnected."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            if session_id:
                cur.execute("""
                    UPDATE chat_sessions 
                    SET operator_connected = false, last_activity = NOW()
                    WHERE id = %s
                """, (session_id,))
            else:
                cur.execute("""
                    UPDATE chat_sessions 
                    SET operator_connected = false, last_activity = NOW()
                    WHERE operator_connected = true
                """)
            count = cur.rowcount
            conn.commit()
            return count


def add_message(session_id: str, sender_type: str, message: str) -> None:
    """Add a message to the database."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO chat_messages (session_id, sender_type, message)
                VALUES (%s, %s, %s)
            """, (session_id, sender_type, message))
            # Update session activity
            cur.execute("""
                UPDATE chat_sessions SET last_activity = NOW() WHERE id = %s
            """, (session_id,))
            conn.commit()


def get_undelivered_messages(session_id: str, sender_type: str = None) -> list[dict]:
    """Get undelivered messages for a session."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            if sender_type:
                cur.execute("""
                    SELECT * FROM chat_messages 
                    WHERE session_id = %s AND delivered = false AND sender_type = %s
                    ORDER BY created_at ASC
                """, (session_id, sender_type))
            else:
                cur.execute("""
                    SELECT * FROM chat_messages 
                    WHERE session_id = %s AND delivered = false
                    ORDER BY created_at ASC
                """, (session_id,))
            return cur.fetchall()


def mark_messages_delivered(message_ids: list[str]) -> None:
    """Mark messages as delivered."""
    if not message_ids:
        return
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE chat_messages SET delivered = true WHERE id = ANY(%s::uuid[])
            """, (message_ids,))
            conn.commit()


def is_owner(user_id: int) -> bool:
    return user_id == OWNER_CHAT_ID


# ═══════════════════════════════════════════════
#  USER -> BOT -> OWNER (forwarding)
# ═══════════════════════════════════════════════

async def handle_user_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """When a regular user sends a message to the bot, forward it to the owner."""
    user = update.effective_user
    chat_id = update.effective_chat.id

    # If it's the owner typing -- route to connected session
    if is_owner(chat_id):
        await handle_owner_reply(update, context)
        return

    text = update.message.text or ""
    user_name = user.full_name or "Unknown"
    username = f"@{user.username}" if user.username else "no username"

    # Create/update session in database
    session_id = create_telegram_session(chat_id, user.username, user_name)
    
    # Store message in database
    add_message(session_id, "user", text)

    # Forward to owner with user info header
    header = (
        f"*Сообщение от пользователя Telegram*\n"
        f"*Имя:* {user_name}\n"
        f"*Username:* {username}\n"
        f"*Chat ID:* `{chat_id}`\n"
        f"*Session:* `{session_id}`\n"
        f"---\n"
    )

    await context.bot.send_message(
        chat_id=OWNER_CHAT_ID,
        text=header + text,
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("Ответить", callback_data=f"reply:{chat_id}")]
        ]),
    )

    # Store active reply target
    context.bot_data["active_reply_to"] = chat_id
    context.bot_data[f"session_{chat_id}"] = session_id

    # Send confirmation to user
    await update.message.reply_text(
        "Спасибо за сообщение! Наш специалист скоро ответит вам прямо здесь.",
    )


# ═══════════════════════════════════════════════
#  OWNER -> BOT -> USER (reply relay)
# ═══════════════════════════════════════════════

async def handle_owner_reply(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """When owner sends a text, route it to the active user or connected sessions."""
    text = update.message.text or ""

    # Check if there's an active reply target (Telegram user)
    active_target = context.bot_data.get("active_reply_to")
    if active_target:
        session_id = context.bot_data.get(f"session_{active_target}")
        
        # Send to Telegram user
        await context.bot.send_message(
            chat_id=active_target,
            text=f"*NetNext:*\n{text}",
            parse_mode="Markdown",
        )
        
        # Store message in database
        if session_id:
            add_message(session_id, "operator", text)
        
        await update.message.reply_text("_Отправлено пользователю Telegram_", parse_mode="Markdown")
        return

    # Check website sessions (operator connected via website chat)
    sessions = get_active_operator_sessions()
    website_sessions = [s for s in sessions if s["user_type"] == "website"]
    
    if website_sessions:
        for session in website_sessions:
            add_message(session["id"], "operator", text)
        
        await update.message.reply_text(
            f"_Отправлено на сайт ({len(website_sessions)} сессий)_", 
            parse_mode="Markdown"
        )
        return

    await update.message.reply_text(
        "Нет активных диалогов. Дождитесь сообщения от пользователя или уведомления с сайта."
    )


# ═══════════════════════════════════════════════
#  CALLBACK: "Ответить" / "Подключиться" buttons
# ═══════════════════════════════════════════════

async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button presses."""
    query = update.callback_query
    await query.answer()

    data = query.data
    
    if data.startswith("reply:"):
        target_chat_id = int(data.replace("reply:", ""))
        context.bot_data["active_reply_to"] = target_chat_id
        await query.edit_message_reply_markup(reply_markup=None)
        await context.bot.send_message(
            chat_id=OWNER_CHAT_ID,
            text=f"*Режим ответа* пользователю `{target_chat_id}`.\n\nПросто напишите ответ, и он будет отправлен пользователю.",
            parse_mode="Markdown",
        )

    elif data.startswith("connect:"):
        session_id = data.replace("connect:", "")
        connect_operator(session_id)
        await query.edit_message_reply_markup(reply_markup=None)
        await context.bot.send_message(
            chat_id=OWNER_CHAT_ID,
            text=f"*Подключено к диалогу на сайте*\n\nSession: `{session_id}`\n\n"
                 "Всё что вы напишете — уйдёт пользователю на сайт.\n"
                 "Для отключения: /disconnect",
            parse_mode="Markdown",
        )


# ═══════════════════════════════════════════════
#  COMMANDS
# ═══════════════════════════════════════════════

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_chat.id
    if is_owner(user_id):
        await update.message.reply_text(
            "*NetNext Admin Bot*\n\n"
            "Вы -- владелец. Все сообщения от пользователей будут приходить сюда.\n"
            "Чтобы ответить -- нажмите кнопку \"Ответить\" или просто напишите.\n\n"
            "*Команды:*\n"
            "/status -- активные сессии\n"
            "/disconnect -- отключиться от чата сайта\n",
            parse_mode="Markdown",
        )
    else:
        await update.message.reply_text(
            "Привет! Это бот компании *NetNext*.\n\n"
            "Напишите ваш вопрос, и наш специалист ответит вам прямо здесь.\n\n"
            "Вы также можете связаться с нами:\n"
            "- Телефон: +375 (29) 14-14-555\n"
            "- Email: hello@netnext.site\n"
            "- Сайт: netnext.site",
            parse_mode="Markdown",
        )


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_owner(update.effective_chat.id):
        return
    
    sessions = get_active_operator_sessions()
    website_sessions = [s for s in sessions if s["user_type"] == "website"]
    telegram_sessions = [s for s in sessions if s["user_type"] == "telegram"]
    
    active_target = context.bot_data.get("active_reply_to")
    
    text = f"*Статус:*\n"
    text += f"Сессий с сайта: {len(website_sessions)}\n"
    text += f"Сессий Telegram: {len(telegram_sessions)}\n"
    
    if sessions:
        text += "\n*Активные:*\n"
        for s in sessions[:10]:  # Limit to 10
            text += f"`{s['id']}` ({s['user_type']})\n"
    
    if active_target:
        text += f"\n*Активный ответ:* `{active_target}`"
    
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_disconnect(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_owner(update.effective_chat.id):
        return
    
    count = disconnect_operator()
    context.bot_data.pop("active_reply_to", None)
    
    await update.message.reply_text(
        f"*Отключено* от {count} сессий. Режим ответа сброшен.",
        parse_mode="Markdown",
    )


# ═══════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════

def main():
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        return
    if not OWNER_CHAT_ID:
        logger.error("TELEGRAM_OWNER_ID / TELEGRAM_CHAT_ID not set!")
        return
    if not DATABASE_URL:
        logger.error("DATABASE_URL not set!")
        return

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("disconnect", cmd_disconnect))
    app.add_handler(CallbackQueryHandler(callback_handler, pattern=r"^(reply|connect):"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_user_message))

    logger.info("Bot started in polling mode... Owner ID: %s", OWNER_CHAT_ID)
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
