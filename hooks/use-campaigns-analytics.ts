import { useState, useEffect } from 'react'

export interface CampaignAnalyticsData {
  campaign_name: string
  campaign_id: string
  campaign_status: number
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

interface UseCampaignsAnalyticsProps {
  campaignId?: string // specific campaign ID
  workspaceId: string
  startDate?: string
  endDate?: string
  excludeTotalLeadsCount?: boolean
}

interface UseCampaignsAnalyticsReturn {
  data: CampaignAnalyticsData[] | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCampaignsAnalytics({
  campaignId,
  workspaceId,
  startDate,
  endDate,
  excludeTotalLeadsCount = false
}: UseCampaignsAnalyticsProps): UseCampaignsAnalyticsReturn {
  const [data, setData] = useState<CampaignAnalyticsData[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        exclude_total_leads_count: excludeTotalLeadsCount.toString()
      })
      
      if (campaignId) params.append('id', campaignId)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      
      const response = await fetch(`/api/instantly/campaigns-analytics?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch campaigns analytics')
      }
      
      const analyticsData = await response.json()
      setData(Array.isArray(analyticsData) ? analyticsData : [analyticsData])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Campaigns analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [campaignId, workspaceId, startDate, endDate, excludeTotalLeadsCount])

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics
  }
}