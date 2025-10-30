// Instantly.ai API v2 Integration
// Documentation: https://developer.instantly.ai/api/v2

const INSTANTLY_BASE_URL = 'https://api.instantly.ai'

// API Response Types based on real API documentation
export interface InstantlyOverviewAnalytics {
  open_count: number
  open_count_unique: number
  open_count_unique_by_step: number
  link_click_count: number
  link_click_count_unique: number
  link_click_count_unique_by_step: number
  reply_count: number
  reply_count_unique: number
  reply_count_unique_by_step: number
  bounced_count: number
  unsubscribed_count: number
  completed_count: number
  emails_sent_count: number
  new_leads_contacted_count: number
  total_opportunities: number
  total_opportunity_value: number
  total_interested: number
  total_meeting_booked: number
  total_meeting_completed: number
  total_closed: number
  // Optional campaign details (when campaign ID is specified)
  leads_count?: number
  contacted_count?: number
  campaign_name?: string
  campaign_id?: string
  campaign_status?: number
}

export interface InstantlyDailyAnalytics {
  date: string // YYYY-MM-DD format
  sent: number
  opened: number
  unique_opened: number
  replies: number
  unique_replies: number
  clicks: number
  unique_clicks: number
}

export interface InstantlyCampaignAnalytics {
  campaign_name: string
  campaign_id: string
  campaign_status: number // 0=Draft, 1=Active, 2=Paused, 3=Completed, etc.
  campaign_is_evergreen: boolean
  leads_count: number
  contacted_count: number
  open_count: number
  reply_count: number
  link_click_count: number
  bounced_count: number
  unsubscribed_count: number
  completed_count: number
  emails_sent_count: number
  new_leads_contacted_count: number
  total_opportunities: number
  total_opportunity_value: number
}

export interface InstantlyStepAnalytics {
  step: string
  variant: string
  sent: number
  opened: number
  unique_opened: number
  replies: number
  unique_replies: number
  clicks: number
  unique_clicks: number
}

export interface InstantlyWorkspace {
  workspace_id: string
  workspace_name: string
  workspace_status: number
  created_at: string
  updated_at: string
}

export class InstantlyAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'InstantlyAPIError'
  }
}

class InstantlyAPI {
  private apiKey: string
  private baseURL: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Instantly API key is required')
    }
    this.apiKey = apiKey
    this.baseURL = INSTANTLY_BASE_URL
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new InstantlyAPIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      )
    }

    return response.json()
  }

  // Get campaign analytics overview
  async getCampaignAnalyticsOverview(params?: {
    id?: string // single campaign ID
    ids?: string[] // multiple campaign IDs
    start_date?: string // YYYY-MM-DD format
    end_date?: string   // YYYY-MM-DD format
    campaign_status?: number // 0=Draft, 1=Active, 2=Paused, 3=Completed
  }): Promise<InstantlyOverviewAnalytics> {
    const searchParams = new URLSearchParams()
    
    if (params?.id) searchParams.append('id', params.id)
    if (params?.ids) params.ids.forEach(id => searchParams.append('ids', id))
    if (params?.start_date) searchParams.append('start_date', params.start_date)
    if (params?.end_date) searchParams.append('end_date', params.end_date)
    if (params?.campaign_status !== undefined) searchParams.append('campaign_status', params.campaign_status.toString())
    
    const endpoint = `/api/v2/campaigns/analytics/overview${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    
    return this.makeRequest<InstantlyOverviewAnalytics>(endpoint)
  }

  // Get daily analytics for campaigns
  async getCampaignDailyAnalytics(params?: {
    campaign_id?: string
    start_date?: string // YYYY-MM-DD format
    end_date?: string   // YYYY-MM-DD format
    campaign_status?: number
  }): Promise<InstantlyDailyAnalytics[]> {
    const searchParams = new URLSearchParams()
    
    if (params?.campaign_id) searchParams.append('campaign_id', params.campaign_id)
    if (params?.start_date) searchParams.append('start_date', params.start_date)
    if (params?.end_date) searchParams.append('end_date', params.end_date)
    if (params?.campaign_status !== undefined) searchParams.append('campaign_status', params.campaign_status.toString())
    
    const endpoint = `/api/v2/campaigns/analytics/daily${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    
    return this.makeRequest<InstantlyDailyAnalytics[]>(endpoint)
  }

  // Get analytics for all campaigns
  async getAllCampaignsAnalytics(params?: {
    id?: string
    ids?: string[]
    start_date?: string
    end_date?: string
    exclude_total_leads_count?: boolean
  }): Promise<InstantlyCampaignAnalytics[]> {
    const searchParams = new URLSearchParams()
    
    if (params?.id) searchParams.append('id', params.id)
    if (params?.ids) params.ids.forEach(id => searchParams.append('ids', id))
    if (params?.start_date) searchParams.append('start_date', params.start_date)
    if (params?.end_date) searchParams.append('end_date', params.end_date)
    if (params?.exclude_total_leads_count) searchParams.append('exclude_total_leads_count', 'true')
    
    const endpoint = `/api/v2/campaigns/analytics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    
    return this.makeRequest<InstantlyCampaignAnalytics[]>(endpoint)
  }

  // Get step analytics for campaigns
  async getCampaignStepsAnalytics(params?: {
    campaign_id?: string
    start_date?: string
    end_date?: string
  }): Promise<InstantlyStepAnalytics[]> {
    const searchParams = new URLSearchParams()
    
    if (params?.campaign_id) searchParams.append('campaign_id', params.campaign_id)
    if (params?.start_date) searchParams.append('start_date', params.start_date)
    if (params?.end_date) searchParams.append('end_date', params.end_date)
    
    const endpoint = `/api/v2/campaigns/analytics/steps${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    
    return this.makeRequest<InstantlyStepAnalytics[]>(endpoint)
  }

  // Get warmup analytics
  async getWarmupAnalytics(emails: string[]): Promise<{
    email_date_data: Record<string, Record<string, {
      sent: number
      landed_inbox: number
      landed_spam?: number
      received: number
    }>>
    aggregate_data: Record<string, {
      sent: number
      landed_inbox: number
      landed_spam?: number
      received: number
      health_score_label: string
      health_score: number
    }>
  }> {
    return this.makeRequest('/api/v2/accounts/warmup-analytics', {
      method: 'POST',
      body: JSON.stringify({ emails })
    })
  }
}

// Singleton instance
let instantlyAPI: InstantlyAPI | null = null

// Use local API routes to avoid CORS issues
class LocalInstantlyAPI {
  private baseURL = typeof window !== 'undefined' ? window.location.origin : ''

  async getCampaignAnalyticsOverview(params?: {
    id?: string
    ids?: string[]
    start_date?: string
    end_date?: string
    campaign_status?: number
    workspace_id?: string
  }): Promise<InstantlyOverviewAnalytics> {
    const searchParams = new URLSearchParams()
    if (params?.id) searchParams.append('id', params.id)
    if (params?.campaign_status !== undefined) {
      searchParams.append('campaign_status', params.campaign_status.toString())
    }
    if (params?.workspace_id) searchParams.append('workspace_id', params.workspace_id)
    
    const response = await fetch(`${this.baseURL}/api/instantly/overview?${searchParams.toString()}`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new InstantlyAPIError(errorData.error || 'Failed to fetch overview', response.status)
    }
    return response.json()
  }

  async getCampaignDailyAnalytics(params?: {
    campaign_id?: string
    start_date?: string
    end_date?: string
    campaign_status?: number
    workspace_id?: string
  }): Promise<InstantlyDailyAnalytics[]> {
    const searchParams = new URLSearchParams()
    if (params?.campaign_id) searchParams.append('campaign_id', params.campaign_id)
    if (params?.start_date) searchParams.append('start_date', params.start_date)
    if (params?.end_date) searchParams.append('end_date', params.end_date)
    if (params?.campaign_status !== undefined) {
      searchParams.append('campaign_status', params.campaign_status.toString())
    }
    if (params?.workspace_id) searchParams.append('workspace_id', params.workspace_id)
    
    const response = await fetch(`${this.baseURL}/api/instantly/daily?${searchParams.toString()}`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new InstantlyAPIError(errorData.error || 'Failed to fetch daily analytics', response.status)
    }
    return response.json()
  }

  // Placeholder methods for compatibility
  async getAllCampaignsAnalytics(): Promise<InstantlyCampaignAnalytics[]> {
    return []
  }
  
  async getCampaignStepsAnalytics(): Promise<InstantlyStepAnalytics[]> {
    return []
  }
  
  async getWarmupAnalytics(): Promise<any> {
    return {}
  }

  async getWorkspaces(): Promise<InstantlyWorkspace[]> {
    const response = await fetch(`${this.baseURL}/api/instantly/workspaces`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new InstantlyAPIError(errorData.error || 'Failed to fetch workspaces', response.status)
    }
    return response.json()
  }
}

let localInstantlyAPI: LocalInstantlyAPI | null = null

export function getInstantlyAPI(): LocalInstantlyAPI {
  if (!localInstantlyAPI) {
    localInstantlyAPI = new LocalInstantlyAPI()
  }
  return localInstantlyAPI
}

// Utility functions for calculations
export function calculateReplyRate(replies: number, sent: number): number {
  return sent > 0 ? (replies / sent) * 100 : 0
}

export function calculatePositiveReplyRate(positiveReplies: number, totalReplies: number): number {
  return totalReplies > 0 ? (positiveReplies / totalReplies) * 100 : 0
}

export function calculateOpenRate(opened: number, sent: number): number {
  return sent > 0 ? (opened / sent) * 100 : 0
}

export function calculateClickRate(clicks: number, sent: number): number {
  return sent > 0 ? (clicks / sent) * 100 : 0
}

// Campaign status helpers
export const CAMPAIGN_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  PAUSED: 2,
  COMPLETED: 3,
  RUNNING_SUBSEQUENCES: 4,
  ACCOUNT_SUSPENDED: -99,
  ACCOUNTS_UNHEALTHY: -1,
  BOUNCE_PROTECT: -2
} as const

export function getCampaignStatusLabel(status: number): string {
  switch (status) {
    case CAMPAIGN_STATUS.DRAFT: return 'Draft'
    case CAMPAIGN_STATUS.ACTIVE: return 'Active'
    case CAMPAIGN_STATUS.PAUSED: return 'Paused'
    case CAMPAIGN_STATUS.COMPLETED: return 'Completed'
    case CAMPAIGN_STATUS.RUNNING_SUBSEQUENCES: return 'Running Subsequences'
    case CAMPAIGN_STATUS.ACCOUNT_SUSPENDED: return 'Account Suspended'
    case CAMPAIGN_STATUS.ACCOUNTS_UNHEALTHY: return 'Accounts Unhealthy'
    case CAMPAIGN_STATUS.BOUNCE_PROTECT: return 'Bounce Protect'
    default: return 'Unknown'
  }
}