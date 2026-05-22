import { NextResponse } from 'next/server';

export async function GET() {
  // Проверяем наличие переменных окружения
  const envVars = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? '✅ установлен' : '❌ не установлен',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ? '✅ установлен' : '❌ не установлен',
    SMTP_HOST: process.env.SMTP_HOST || '❌ не установлен',
    SMTP_PORT: process.env.SMTP_PORT || '❌ не установлен',
    FROM_EMAIL: process.env.FROM_EMAIL || '❌ не установлен',
  };
  
  return NextResponse.json(envVars);
}
