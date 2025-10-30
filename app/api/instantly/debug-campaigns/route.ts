import { NextRequest, NextResponse } from 'next/server'

const INSTANTLY_BASE_URL = 'https://api.instantly.ai'

// Get API key based on workspace selection
function getApiKeyForWorkspace(workspaceId: string | null) {
  switch (workspaceId) {
    case '1':
      return process.env.INSTANTLY_API_KEY_1
    case '2':
      return process.env.INSTANTLY_API_KEY_2
    case '3':
      return process.env.INSTANTLY_API_KEY_3
    case '4':
      return process.env.INSTANTLY_API_KEY_4
    default:
      return process.env.INSTANTLY_API_KEY
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')
    
    console.log('=== Debug Campaigns Request ===')
    console.log('Workspace ID:', workspaceId)
    
    const apiKey = getApiKeyForWorkspace(workspaceId)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured for workspace', workspaceId },
        { status: 500 }
      )
    }
    
    // Get all campaigns for this workspace
    const response = await fetch(
      `${INSTANTLY_BASE_URL}/api/v2/campaigns?limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)
      return NextResponse.json(
        { 
          error: `Failed to fetch campaigns: HTTP ${response.status}`,
          details: errorText,
          workspaceId,
          apiKeyExists: !!apiKey,
          apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'none'
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    const campaigns = data.items || data

    return NextResponse.json({
      success: true,
      workspaceId,
      campaignsCount: campaigns.length,
      campaigns: campaigns.map((c: any) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        created_at: c.created_at
      })),
      apiKeyExists: !!apiKey,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'none'
    })
    
  } catch (error) {
    console.error('Debug campaigns error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}