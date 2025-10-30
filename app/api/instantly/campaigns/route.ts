import { NextRequest, NextResponse } from 'next/server'

const INSTANTLY_BASE_URL = 'https://api.instantly.ai'

// Get API key based on workspace selection
function getApiKeyForWorkspace(workspaceId: string | null) {
  if (!workspaceId) {
    return process.env.INSTANTLY_API_KEY
  }
  
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
    console.log('=== Campaigns API Request ===')
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')
    
    console.log('Request params:', { workspaceId })
    
    const apiKey = getApiKeyForWorkspace(workspaceId)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured for selected workspace' },
        { status: 500 }
      )
    }
    
    // Build query parameters for campaigns list
    const params = new URLSearchParams()
    params.append('limit', '100') // Get up to 100 campaigns
    
    const response = await fetch(
      `${INSTANTLY_BASE_URL}/api/v2/campaigns?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || `HTTP ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const campaigns = data.items || data
    
    // Return simplified campaign list for dropdown
    const campaignList = campaigns.map((campaign: any) => ({
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      campaign_status: campaign.status,
      sequences: campaign.sequences || [],
      // For dropdown compatibility
      emails_sent_count: 0 // Will be filled from analytics if needed
    }))
    
    return NextResponse.json(campaignList)
    
  } catch (error) {
    console.error('Campaigns API Error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}