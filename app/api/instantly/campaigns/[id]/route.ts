import { NextRequest, NextResponse } from 'next/server'

// Get API key based on workspace selection (matching existing pattern)
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspace ID' },
        { status: 400 }
      )
    }

    const apiKey = getApiKeyForWorkspace(workspaceId)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not configured for workspace: ${workspaceId}` },
        { status: 500 }
      )
    }

    // Fetch specific campaign details from Instantly API
    const response = await fetch(`https://api.instantly.ai/api/v2/campaigns/${params.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Instantly API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        campaignId: params.id,
        workspace: config.name
      })
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: `Instantly API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Return the campaign data with full sequences
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching campaign details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}