import { useState, useEffect } from 'react'

export interface CampaignAnalytics {
  // Overview metrics from /api/v2/campaigns/analytics/overview
  open_count: number
  open_count_unique: number
  open_count_unique_by_step: number
  link_click_count: number
  link_click_count_unique: number
  reply_count: number
  reply_count_unique: number
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
  
  // Campaign details (if available)
  campaign_name?: string
  campaign_id?: string
  campaign_status?: number
  leads_count?: number
  contacted_count?: number
}

interface UseCampaignAnalyticsProps {
  campaignName: string // e.g., 'roger-hospitals-chapel-hill'
  workspaceId: string
  startDate?: string
  endDate?: string
}

interface UseCampaignAnalyticsReturn {
  data: CampaignAnalytics | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCampaignAnalytics({
  campaignName,
  workspaceId,
  startDate,
  endDate
}: UseCampaignAnalyticsProps): UseCampaignAnalyticsReturn {
  const [data, setData] = useState<CampaignAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedCampaignId, setResolvedCampaignId] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First resolve campaign name to ID
      let campaignId = resolvedCampaignId
      
      if (!campaignId) {
        const resolveParams = new URLSearchParams({
          campaign_name: campaignName,
          workspace_id: workspaceId
        })
        
        const resolveResponse = await fetch(`/api/instantly/resolve-campaign?${resolveParams}`)
        
        if (!resolveResponse.ok) {
          const resolveError = await resolveResponse.json().catch(() => ({}))
          throw new Error(resolveError.error || 'Failed to resolve campaign')
        }
        
        const resolveData = await resolveResponse.json()
        campaignId = resolveData.campaign.id
        setResolvedCampaignId(campaignId)
      }
      
      // Now fetch analytics with resolved campaign ID
      const analyticsParams = new URLSearchParams({
        campaign_id: campaignId,
        workspace_id: workspaceId
      })
      
      if (startDate) analyticsParams.append('start_date', startDate)
      if (endDate) analyticsParams.append('end_date', endDate)
      
      const analyticsResponse = await fetch(`/api/instantly/campaign-analytics?${analyticsParams}`)
      
      if (!analyticsResponse.ok) {
        const analyticsError = await analyticsResponse.json().catch(() => ({}))
        throw new Error(analyticsError.error || 'Failed to fetch analytics')
      }
      
      const analyticsData = await analyticsResponse.json()
      setData(analyticsData)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Campaign analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [campaignName, workspaceId, startDate, endDate])

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics
  }
}