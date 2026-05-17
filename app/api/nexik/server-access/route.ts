import { NextRequest, NextResponse } from 'next/server'

/**
 * Server Access API
 * Allows NPM package users to give us access for auto-integration
 * 
 * Flow:
 * 1. User creates API key in dashboard
 * 2. User provides serverAccess config in NPM package
 * 3. We can auto-sync settings, auto-install widget, etc.
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

// Verify API key and return widget config
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId')
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
  }
  
  const apiKey = authHeader.slice(7)
  
  // In production, verify apiKey against database
  // For demo, accept any key that starts with 'nxk_'
  if (!apiKey.startsWith('nxk_')) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }
  
  // Return widget configuration for this client
  return NextResponse.json({
    success: true,
    clientId,
    config: {
      color: '#4fd1c5',
      greeting: 'Привет! Чем могу помочь?',
      botName: 'Nexik AI',
      displayMode: 'modal',
      features: {
        analytics: true,
        leadCapture: true,
        scheduling: true,
      }
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
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
  }
  
  const apiKey = authHeader.slice(7)
  
  if (!apiKey.startsWith('nxk_')) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }
  
  const body: ServerAccessRequest = await request.json()
  const { clientId, action, serverDetails } = body
  
  switch (action) {
    case 'verify':
      // Verify the connection and return status
      return NextResponse.json({
        success: true,
        clientId,
        verified: true,
        message: 'Server access verified successfully',
        capabilities: ['auto-sync', 'auto-install', 'analytics']
      })
      
    case 'sync':
      // Sync settings from dashboard to server
      return NextResponse.json({
        success: true,
        clientId,
        synced: true,
        config: {
          color: '#4fd1c5',
          greeting: 'Привет! Чем могу помочь?',
          botName: 'Nexik AI',
        }
      })
      
    case 'analyze':
      // Analyze server environment for best installation approach
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
      
    case 'install':
      // Auto-install widget (returns instructions for the CLI)
      const installInstructions = getInstallInstructions(serverDetails?.framework || 'unknown')
      
      return NextResponse.json({
        success: true,
        clientId,
        installation: {
          method: 'auto',
          instructions: installInstructions,
          files: [
            {
              path: 'components/NexikWidget.tsx',
              content: generateWidgetComponent(clientId)
            }
          ]
        }
      })
      
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
