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

// Campaign name patterns to match
const CAMPAIGN_PATTERNS: Record<string, string[]> = {
  'roger-hospitals-chapel-hill': ['Roger Hospital Chapel Hill', 'Roger Hospitals Chapel Hill'],
  'roger-real-estate-offices': ['Roger Real Estate Offices'],
  'roger-wisconsin-leads': ['Roger Wisconsin leads', 'Roger Wisconsin Leads']
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignName = searchParams.get('campaign_name') // e.g., 'roger-hospitals-chapel-hill'
    const workspaceId = searchParams.get('workspace_id')
    
    console.log('=== Campaign Resolution Request ===')
    console.log('Campaign name:', campaignName)
    console.log('Workspace ID:', workspaceId)
    
    if (!campaignName) {
      return NextResponse.json(
        { error: 'campaign_name parameter required' },
        { status: 400 }
      )
    }
    
    const apiKey = getApiKeyForWorkspace(workspaceId)
    
    if (!apiKey) {
      console.error('No API key found for workspace:', workspaceId)
      return NextResponse.json(
        { error: 'API key not configured for workspace' },
        { status: 500 }
      )
    }
    
    console.log('Using API key for workspace:', workspaceId)
    
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
      return NextResponse.json(
        { error: `Failed to fetch campaigns: HTTP ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const campaigns = data.items || data
    
    console.log('Fetched campaigns count:', campaigns.length)
    console.log('Available campaigns:', campaigns.map((c: any) => ({ id: c.id, name: c.name })))

    // Find matching campaign
    const patterns = CAMPAIGN_PATTERNS[campaignName] || []
    console.log('Searching for patterns:', patterns)
    
    let matchedCampaign = null

    for (const campaign of campaigns) {
      const name = campaign.name || ''
      console.log('Checking campaign:', name)
      
      // Check if campaign name matches any of our patterns
      for (const pattern of patterns) {
        const nameMatch = name.toLowerCase().includes(pattern.toLowerCase())
        const patternMatch = pattern.toLowerCase().includes(name.toLowerCase())
        console.log(`  Pattern: "${pattern}" vs "${name}" - nameMatch: ${nameMatch}, patternMatch: ${patternMatch}`)
        
        if (nameMatch || patternMatch) {
          matchedCampaign = {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status
          }
          console.log('Match found:', matchedCampaign)
          break
        }
      }
      
      if (matchedCampaign) break
    }

    if (!matchedCampaign) {
      console.error('No campaign match found')
      return NextResponse.json(
        { 
          error: 'Campaign not found',
          searched_patterns: patterns,
          available_campaigns: campaigns.map((c: any) => ({ id: c.id, name: c.name }))
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      resolved: true,
      campaign: matchedCampaign,
      searched_patterns: patterns
    })
    
  } catch (error) {
    console.error('Campaign resolution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}