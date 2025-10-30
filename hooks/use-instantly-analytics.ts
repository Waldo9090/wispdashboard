'use client'

import { useState, useEffect } from 'react'
import { 
  getInstantlyAPI, 
  InstantlyOverviewAnalytics, 
  InstantlyDailyAnalytics, 
  InstantlyCampaignAnalytics,
  InstantlyWorkspace,
  InstantlyAPIError,
  CAMPAIGN_STATUS
} from '@/lib/instantly-api'

interface UseInstantlyAnalyticsReturn {
  overview: InstantlyOverviewAnalytics | null
  dailyData: InstantlyDailyAnalytics[]
  campaigns: InstantlyCampaignAnalytics[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useInstantlyAnalytics(
  campaignId?: string,
  startDate?: string,
  endDate?: string
): UseInstantlyAnalyticsReturn {
  const [overview, setOverview] = useState<InstantlyOverviewAnalytics | null>(null)
  const [dailyData, setDailyData] = useState<InstantlyDailyAnalytics[]>([])
  const [campaigns, setCampaigns] = useState<InstantlyCampaignAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const api = getInstantlyAPI()

      // Fetch all data in parallel
      const [overviewData, dailyAnalytics, campaignAnalytics] = await Promise.allSettled([
        api.getCampaignAnalyticsOverview({
          id: campaignId,
          start_date: startDate,
          end_date: endDate,
          campaign_status: CAMPAIGN_STATUS.ACTIVE // Focus on active campaigns
        }),
        api.getCampaignDailyAnalytics({ 
          campaign_id: campaignId, 
          start_date: startDate, 
          end_date: endDate,
          campaign_status: CAMPAIGN_STATUS.ACTIVE
        }),
        api.getAllCampaignsAnalytics({ 
          id: campaignId,
          start_date: startDate,
          end_date: endDate,
          exclude_total_leads_count: true // Faster response
        })
      ])

      // Handle overview data
      if (overviewData.status === 'fulfilled') {
        setOverview(overviewData.value)
      } else {
        console.error('Failed to fetch overview:', overviewData.reason)
      }

      // Handle daily data
      if (dailyAnalytics.status === 'fulfilled') {
        setDailyData(dailyAnalytics.value)
      } else {
        console.error('Failed to fetch daily analytics:', dailyAnalytics.reason)
      }

      // Handle campaign data
      if (campaignAnalytics.status === 'fulfilled') {
        setCampaigns(campaignAnalytics.value)
      } else {
        console.error('Failed to fetch campaign analytics:', campaignAnalytics.reason)
      }

    } catch (err) {
      const errorMessage = err instanceof InstantlyAPIError 
        ? `API Error (${err.status}): ${err.message}`
        : err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred'
      
      setError(errorMessage)
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [campaignId, startDate, endDate])

  return {
    overview,
    dailyData,
    campaigns,
    loading,
    error,
    refetch: fetchData
  }
}

// Hook for overview analytics only
export function useInstantlyOverview(campaignId?: string | null, workspaceId?: string | null, startDate?: string, endDate?: string) {
  const [data, setData] = useState<InstantlyOverviewAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true)
        setError(null)
        const api = getInstantlyAPI()
        const overview = await api.getCampaignAnalyticsOverview({
          id: campaignId || undefined, // Convert null to undefined
          start_date: startDate,
          end_date: endDate,
          campaign_status: CAMPAIGN_STATUS.ACTIVE,
          workspace_id: workspaceId || undefined
        })
        setData(overview)
      } catch (err) {
        const errorMessage = err instanceof InstantlyAPIError 
          ? `API Error (${err.status}): ${err.message}`
          : err instanceof Error 
          ? err.message 
          : 'Failed to fetch overview'
        setError(errorMessage)
        console.error('Overview fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [campaignId, workspaceId, startDate, endDate])

  return { data, loading, error }
}

// Hook for daily analytics only
export function useInstantlyDailyData(
  campaignId?: string | null,
  workspaceId?: string | null,
  startDate?: string,
  endDate?: string
) {
  const [data, setData] = useState<InstantlyDailyAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        setLoading(true)
        setError(null)
        const api = getInstantlyAPI()
        const daily = await api.getCampaignDailyAnalytics({
          campaign_id: campaignId || undefined,
          start_date: startDate,
          end_date: endDate,
          campaign_status: CAMPAIGN_STATUS.ACTIVE,
          workspace_id: workspaceId || undefined
        })
        setData(daily)
      } catch (err) {
        const errorMessage = err instanceof InstantlyAPIError 
          ? `API Error (${err.status}): ${err.message}`
          : err instanceof Error 
          ? err.message 
          : 'Failed to fetch daily data'
        setError(errorMessage)
        console.error('Daily analytics fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDaily()
  }, [campaignId, workspaceId, startDate, endDate])

  return { data, loading, error }
}

// Hook for campaign list
export function useInstantlyCampaigns() {
  const [data, setData] = useState<InstantlyCampaignAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        setError(null)
        const api = getInstantlyAPI()
        const campaigns = await api.getAllCampaignsAnalytics({
          exclude_total_leads_count: true
        })
        setData(campaigns)
      } catch (err) {
        const errorMessage = err instanceof InstantlyAPIError 
          ? `API Error (${err.status}): ${err.message}`
          : err instanceof Error 
          ? err.message 
          : 'Failed to fetch campaigns'
        setError(errorMessage)
        console.error('Campaigns fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  return { data, loading, error }
}

// Hook for workspace list
export function useInstantlyWorkspaces() {
  const [data, setData] = useState<InstantlyWorkspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true)
        setError(null)
        const api = getInstantlyAPI()
        const workspaces = await api.getWorkspaces()
        setData(workspaces)
      } catch (err) {
        const errorMessage = err instanceof InstantlyAPIError 
          ? `API Error (${err.status}): ${err.message}`
          : err instanceof Error 
          ? err.message 
          : 'Failed to fetch workspaces'
        setError(errorMessage)
        console.error('Workspaces fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [])

  return { data, loading, error }
}