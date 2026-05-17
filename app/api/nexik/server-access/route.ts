import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import crypto from 'crypto'
import { getWidget } from '@/lib/nexik/db/widgets'

/**
 * Server Access API
 * Allows NPM package users to give us access for auto-integration
 */

interface ServerAccessRequest {
  clientId: string
  action: 'verify' | 'sync' | 'install' | 'analyze'
  serverDetails?: {
    framework?: string
    nodeVersion?: string
    projectRoot?: string
    configFiles?: string[]
  }
}

interface ApiKeyRecord {
  id: string
  org_id: string
  name: string
  key_hash: string
  permissions: string[]
  revoked_at: string | null
}

// Verify API key against database
async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; orgId?: string; keyId?: string }> {
  if (!apiKey || !apiKey.startsWith('nxk_')) {
    return { valid: false }
  }

  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
  
  const results = await query<ApiKeyRecord>(`
    SELECT id, org_id, permissions, revoked_at
    FROM nexik_api_keys
    WHERE key_hash = $1 AND revoked_at IS NULL
    LIMIT 1
  `, [keyHash])

  if (results.length === 0) {
    return { valid: false }
  }

  // Update last_used_at
  await query(`
    UPDATE nexik_api_keys SET last_used_at = NOW() WHERE id = $1
  `, [results[0].id])

  return { 
    valid: true, 
    orgId: results[0].org_id,
    keyId: results[0].id
  }
}

// Get widget config for organization
async function getOrgWidgetConfig(orgId: string, clientId?: string) {
  // If clientId provided, get specific widget
  if (clientId) {
    const widget = await getWidget(clientId)
    if (widget && widget.org_id === orgId) {
      return {
        widgetId: widget.id,
        name: widget.name,
        color: widget.theme?.primaryColor || '#00ffff',
        greeting: widget.greeting_message,
        botName: widget.name,
        displayMode: 'modal',
        features: {
          analytics: widget.track_events,
          leadCapture: widget.require_email || widget.require_name,
          scheduling: true,
          aiEnabled: widget.ai_enabled
        }
      }
    }
  }

  // Otherwise get first active widget for org
  const widgets = await query<{ id: string; name: string; theme: string; greeting_message: string; track_events: boolean; require_email: boolean; require_name: boolean; ai_enabled: boolean }>(`
    SELECT id, name, theme, greeting_message, track_events, require_email, require_name, ai_enabled
    FROM nexik_widgets
    WHERE org_id = $1 AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1
  `, [orgId])

  if (widgets.length === 0) {
    return null
  }

  const widget = widgets[0]
  const theme = typeof widget.theme === 'string' ? JSON.parse(widget.theme) : widget.theme

  return {
    widgetId: widget.id,
    name: widget.name,
    color: theme?.primaryColor || '#00ffff',
    greeting: widget.greeting_message,
    botName: widget.name,
    displayMode: 'modal',
    features: {
      analytics: widget.track_events,
      leadCapture: widget.require_email || widget.require_name,
      scheduling: true,
      aiEnabled: widget.ai_enabled
    }
  }
}

// Verify API key and return widget config
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId')
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
  }
  
  const apiKey = authHeader.slice(7)
  const verification = await verifyApiKey(apiKey)
  
  if (!verification.valid || !verification.orgId) {
    return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })
  }
  
  const config = await getOrgWidgetConfig(verification.orgId, clientId || undefined)
  
  if (!config) {
    return NextResponse.json({ error: 'No active widget found for this organization' }, { status: 404 })
  }
  
  return NextResponse.json({
    success: true,
    clientId: config.widgetId,
    config: {
      color: config.color,
      greeting: config.greeting,
      botName: config.botName,
      displayMode: config.displayMode,
      features: config.features
    },
    serverAccess: {
      level: 'full',
      permissions: ['read', 'write', 'install'],
      autoSync: true,
    }
  })
}

// Handle server access actions
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
  }
  
  const apiKey = authHeader.slice(7)
  const verification = await verifyApiKey(apiKey)
  
  if (!verification.valid || !verification.orgId) {
    return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })
  }
  
  const body: ServerAccessRequest = await request.json()
  const { clientId, action, serverDetails } = body
  
  switch (action) {
    case 'verify':
      return NextResponse.json({
        success: true,
        clientId,
        verified: true,
        message: 'Server access verified successfully',
        capabilities: ['auto-sync', 'auto-install', 'analytics']
      })
      
    case 'sync': {
      const config = await getOrgWidgetConfig(verification.orgId, clientId)
      if (!config) {
        return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        clientId: config.widgetId,
        synced: true,
        config: {
          color: config.color,
          greeting: config.greeting,
          botName: config.botName,
        }
      })
    }
      
    case 'analyze': {
      const framework = serverDetails?.framework || 'unknown'
      const recommendations = getInstallationRecommendations(framework)
      
      return NextResponse.json({
        success: true,
        clientId,
        analysis: {
          framework,
          detected: serverDetails,
          recommendations
        }
      })
    }
      
    case 'install': {
      const config = await getOrgWidgetConfig(verification.orgId, clientId)
      const widgetId = config?.widgetId || clientId
      const installInstructions = getInstallInstructions(serverDetails?.framework || 'unknown')
      
      return NextResponse.json({
        success: true,
        clientId: widgetId,
        installation: {
          method: 'auto',
          instructions: installInstructions,
          files: [
            {
              path: 'components/NexikWidget.tsx',
              content: generateWidgetComponent(widgetId || 'YOUR_WIDGET_ID')
            }
          ]
        }
      })
    }
      
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}

function getInstallationRecommendations(framework: string) {
  const recommendations: Record<string, object> = {
    'next': {
      method: 'component',
      location: 'app/layout.tsx',
      package: '@nexik/next',
      steps: [
        'npm install @nexik/next',
        'Add NexikWidget to your root layout',
        'Configure with your client ID'
      ]
    },
    'react': {
      method: 'component',
      location: 'src/App.tsx',
      package: '@nexik/react',
      steps: [
        'npm install @nexik/react',
        'Import NexikChat component',
        'Add to your app root'
      ]
    },
    'vue': {
      method: 'plugin',
      location: 'main.ts',
      package: '@nexik/vue',
      steps: [
        'npm install @nexik/vue',
        'Register Nexik plugin',
        'Use <NexikChat> component'
      ]
    },
    'unknown': {
      method: 'script',
      location: 'index.html',
      package: null,
      steps: [
        'Add script tag before </body>',
        'Configure with data attributes'
      ]
    }
  }
  
  return recommendations[framework] || recommendations['unknown']
}

function getInstallInstructions(framework: string) {
  const instructions: Record<string, string[]> = {
    'next': [
      'Creating NexikWidget component...',
      'Adding to app/layout.tsx...',
      'Configuring environment variables...',
      'Installation complete!'
    ],
    'react': [
      'Installing @nexik/react...',
      'Adding NexikChat to App component...',
      'Configuring props...',
      'Installation complete!'
    ],
    'vue': [
      'Installing @nexik/vue...',
      'Registering plugin...',
      'Adding NexikChat component...',
      'Installation complete!'
    ],
    'unknown': [
      'Generating widget script...',
      'Add the following to your HTML...',
      'Installation complete!'
    ]
  }
  
  return instructions[framework] || instructions['unknown']
}

function generateWidgetComponent(clientId: string) {
  return `"use client"

import dynamic from 'next/dynamic'

const NexikChat = dynamic(
  () => import('@nexik/react').then(mod => mod.NexikChat),
  { ssr: false }
)

export function NexikWidget() {
  return (
    <NexikChat
      clientId="${clientId}"
      serverAccess={{
        enabled: true,
        autoSync: true
      }}
    />
  )
}
`
}
