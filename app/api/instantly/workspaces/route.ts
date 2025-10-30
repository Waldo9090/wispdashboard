import { NextRequest, NextResponse } from 'next/server'

const INSTANTLY_BASE_URL = 'https://api.instantly.ai'

// Get all available API keys from environment
function getApiKeys() {
  const keys = []
  if (process.env.INSTANTLY_API_KEY_1) keys.push({ id: '1', key: process.env.INSTANTLY_API_KEY_1, name: 'Wings Over Campaign' })
  if (process.env.INSTANTLY_API_KEY_2) keys.push({ id: '2', key: process.env.INSTANTLY_API_KEY_2, name: 'Paramount Realty USA' })
  if (process.env.INSTANTLY_API_KEY_3) keys.push({ id: '3', key: process.env.INSTANTLY_API_KEY_3, name: 'Modu campaign' })
  if (process.env.INSTANTLY_API_KEY_4) keys.push({ id: '4', key: process.env.INSTANTLY_API_KEY_4, name: 'Reachify' })
  return keys
}

async function fetchAccountsForApiKey(apiKey: string) {
  const response = await fetch(
    `${INSTANTLY_BASE_URL}/api/v2/accounts`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  )
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  return response.json()
}

export async function GET(request: NextRequest) {
  try {
    const apiKeys = getApiKeys()
    
    if (apiKeys.length === 0) {
      return NextResponse.json(
        { error: 'No API keys configured' },
        { status: 500 }
      )
    }

    // Fetch accounts from each API key to create workspaces
    const workspaces: any[] = []
    
    for (const apiKeyInfo of apiKeys) {
      try {
        const accounts = await fetchAccountsForApiKey(apiKeyInfo.key)
        
        if (accounts.items && Array.isArray(accounts.items) && accounts.items.length > 0) {
          const firstAccount = accounts.items[0]
          const accountCount = accounts.items.length
          
          workspaces.push({
            workspace_id: apiKeyInfo.id,
            workspace_name: `${apiKeyInfo.name} (${accountCount} accounts)`,
            workspace_status: 1,
            created_at: firstAccount.timestamp_created || new Date().toISOString(),
            updated_at: firstAccount.timestamp_updated || new Date().toISOString(),
            account_count: accountCount,
            api_key_id: apiKeyInfo.id,
            organization_id: firstAccount.organization || apiKeyInfo.id
          })
        } else {
          // Create workspace even if no accounts found
          workspaces.push({
            workspace_id: apiKeyInfo.id,
            workspace_name: `${apiKeyInfo.name} (No accounts)`,
            workspace_status: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            account_count: 0,
            api_key_id: apiKeyInfo.id
          })
        }
      } catch (error) {
        console.error(`Failed to fetch accounts for API key ${apiKeyInfo.id}:`, error)
        // Still add the workspace but mark it as unavailable
        workspaces.push({
          workspace_id: apiKeyInfo.id,
          workspace_name: `${apiKeyInfo.name} (Unavailable)`,
          workspace_status: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          account_count: 0,
          api_key_id: apiKeyInfo.id,
          error: true
        })
      }
    }
    
    return NextResponse.json(workspaces)
    
  } catch (error) {
    console.error('Workspaces API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}