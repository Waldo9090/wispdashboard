// Client Access Configuration
// Update these campaign IDs with actual values from your Instantly API

export interface ClientConfig {
  name: string
  campaignId: string
  workspaceId: string
  description?: string
}

export const CLIENT_ACCESS_MAP: Record<string, ClientConfig> = {
  'roger-hospital-chapel-hill': {
    name: 'Roger Hospital Chapel Hill',
    campaignId: 'roger-hospitals-chapel-hill', // This will be auto-detected by campaign name matching
    workspaceId: '1', // Wings Over Campaign
    description: 'Healthcare campaign analytics for Chapel Hill location'
  },
  'roger-real-estate-offices': {
    name: 'Roger Real Estate Offices', 
    campaignId: 'roger-real-estate-offices', // This will be auto-detected by campaign name matching
    workspaceId: '2', // Paramount Realty USA
    description: 'Real estate office outreach campaign analytics'
  },
  'roger-wisconsin-leads': {
    name: 'Roger Wisconsin Leads',
    campaignId: 'roger-wisconsin-leads', // This will be auto-detected by campaign name matching
    workspaceId: '1', // Wings Over Campaign  
    description: 'Wisconsin lead generation campaign analytics'
  }
}

// Helper function to get client configuration
export function getClientConfig(token: string): ClientConfig | null {
  return CLIENT_ACCESS_MAP[token] || null
}

// Helper function to validate campaign access
export function isValidClientToken(token: string): boolean {
  return token in CLIENT_ACCESS_MAP
}

// Get all available client tokens (for admin use)
export function getAvailableClientTokens(): Array<{token: string, config: ClientConfig}> {
  return Object.entries(CLIENT_ACCESS_MAP).map(([token, config]) => ({
    token,
    config
  }))
}