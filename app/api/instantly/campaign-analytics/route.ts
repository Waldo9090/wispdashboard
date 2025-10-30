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
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')
    const workspaceId = searchParams.get('workspace_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    console.log('=== Campaign Analytics API Request ===')
    console.log('Request params:', { campaignId, workspaceId, startDate, endDate })
    
    const apiKey = getApiKeyForWorkspace(workspaceId)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured for selected workspace' },
        { status: 500 }
      )
    }
    
    // Build query parameters for analytics overview
    const params = new URLSearchParams()
    if (campaignId) {
      params.append('id', campaignId)
    }
    if (startDate) {
      params.append('start_date', startDate)
    }
    if (endDate) {
      params.append('end_date', endDate)
    }
    
    // Get analytics overview (this gives us the metrics we need)
    const overviewResponse = await fetch(
      `${INSTANTLY_BASE_URL}/api/v2/campaigns/analytics/overview?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!overviewResponse.ok) {
      const errorData = await overviewResponse.json().catch(() => ({}))
      console.error('Analytics API Error:', errorData)
      return NextResponse.json(
        { error: errorData.message || `HTTP ${overviewResponse.status}` },
        { status: overviewResponse.status }
      )
    }

    const overviewData = await overviewResponse.json()
    console.log('Analytics overview data:', overviewData)
    
    // Also get campaign details if specific campaign requested
    let campaignDetails = null
    if (campaignId) {
      try {
        const campaignParams = new URLSearchParams()
        campaignParams.append('id', campaignId)
        if (startDate) campaignParams.append('start_date', startDate)
        if (endDate) campaignParams.append('end_date', endDate)
        
        const campaignResponse = await fetch(
          `${INSTANTLY_BASE_URL}/api/v2/campaigns/analytics?${campaignParams.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        if (campaignResponse.ok) {
          const campaignData = await campaignResponse.json()
          if (Array.isArray(campaignData) && campaignData.length > 0) {
            campaignDetails = campaignData[0]
          }
        }
      } catch (error) {
        console.warn('Failed to fetch campaign details:', error)
      }
    }
    
    // Combine overview data with campaign details
    const result = {
      // Overview metrics (what we primarily need)
      ...overviewData,
      
      // Campaign details if available
      ...(campaignDetails && {
        campaign_name: campaignDetails.campaign_name,
        campaign_id: campaignDetails.campaign_id,
        campaign_status: campaignDetails.campaign_status,
        leads_count: campaignDetails.leads_count,
        contacted_count: campaignDetails.contacted_count,
      })
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Campaign Analytics API Error:', error)
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