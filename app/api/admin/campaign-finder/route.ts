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

// Target campaign names to find
const TARGET_CAMPAIGNS = [
  'Roger Hospital Chapel Hill',
  'Roger Real Estate Offices', 
  'Roger Wisconsin leads'
]

export async function GET(request: NextRequest) {
  try {
    const foundCampaigns: Array<{
      name: string
      campaign_id: string
      workspaceId: string
      workspaceName: string
    }> = []

    // Check each workspace
    const workspaces = [
      { id: '1', name: 'Wings Over Campaign' },
      { id: '2', name: 'Paramount Realty USA' },
      { id: '3', name: 'Modu campaign' },
      { id: '4', name: 'Reachify' }
    ]

    for (const workspace of workspaces) {
      const apiKey = getApiKeyForWorkspace(workspace.id)
      
      if (!apiKey) {
        console.log(`No API key configured for workspace ${workspace.id}`)
        continue
      }

      try {
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
          console.log(`Failed to fetch campaigns for workspace ${workspace.id}`)
          continue
        }

        const data = await response.json()
        const campaigns = data.items || data

        // Look for target campaigns
        for (const campaign of campaigns) {
          const campaignName = campaign.name || ''
          
          // Check if this campaign matches any of our targets
          for (const targetName of TARGET_CAMPAIGNS) {
            if (campaignName.toLowerCase().includes(targetName.toLowerCase()) || 
                targetName.toLowerCase().includes(campaignName.toLowerCase())) {
              
              foundCampaigns.push({
                name: campaignName,
                campaign_id: campaign.id,
                workspaceId: workspace.id,
                workspaceName: workspace.name
              })
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching campaigns for workspace ${workspace.id}:`, error)
      }
    }

    return NextResponse.json({
      found: foundCampaigns,
      targets: TARGET_CAMPAIGNS,
      instructions: {
        message: "Copy the campaign IDs below and update lib/client-access-config.ts",
        configFile: "lib/client-access-config.ts",
        replaceText: "REPLACE_WITH_ACTUAL_CAMPAIGN_ID"
      }
    })

  } catch (error) {
    console.error('Campaign finder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}