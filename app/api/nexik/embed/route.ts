/**
 * Nexik Widget Embed Code Generator
 * Генерирует код для встраивания виджета
 */

import { NextRequest, NextResponse } from 'next/server'

interface EmbedConfig {
  clientId: string
  color?: string
  position?: 'bottom-right' | 'bottom-left'
  greeting?: string
  botName?: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const config: EmbedConfig = {
    clientId: searchParams.get('clientId') || 'demo',
    color: searchParams.get('color') || '#3b82f6',
    position: (searchParams.get('position') as EmbedConfig['position']) || 'bottom-right',
    greeting: searchParams.get('greeting') || 'Привет! Чем могу помочь?',
    botName: searchParams.get('botName') || 'AI Ассистент',
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nexik.org'

  // Генерируем embed код
  const embedCode = `<!-- Nexik AI Chat Widget -->
<script 
  src="${baseUrl}/nexik/widget.js"
  data-id="${config.clientId}"
  data-color="${config.color}"
  data-position="${config.position}"
  data-greeting="${config.greeting}"
  data-bot-name="${config.botName}"
  async
></script>`

  // Возвращаем в зависимости от формата
  const format = searchParams.get('format')

  if (format === 'html') {
    return new Response(embedCode, {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return NextResponse.json({
    embedCode,
    config,
    instructions: {
      step1: 'Скопируйте код выше',
      step2: 'Вставьте его перед закрывающим тегом </body> на вашем сайте',
      step3: 'Виджет появится автоматически',
    },
    jsApi: {
      open: 'Nexik.open() - открыть чат',
      close: 'Nexik.close() - закрыть чат',
      toggle: 'Nexik.toggle() - переключить состояние',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const config: EmbedConfig = await request.json()
    
    if (!config.clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nexik.org'

    const attributes = [
      `data-id="${config.clientId}"`,
      config.color && `data-color="${config.color}"`,
      config.position && `data-position="${config.position}"`,
      config.greeting && `data-greeting="${config.greeting}"`,
      config.botName && `data-bot-name="${config.botName}"`,
    ].filter(Boolean).join('\n  ')

    const embedCode = `<!-- Nexik AI Chat Widget -->
<script 
  src="${baseUrl}/nexik/widget.js"
  ${attributes}
  async
></script>`

    return NextResponse.json({
      success: true,
      embedCode,
      config,
    })
  } catch (error) {
    console.error('[Embed API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate embed code' },
      { status: 500 }
    )
  }
}
