import { useState, useEffect } from 'react'

interface UseResolvedCampaignIdReturn {
  campaignId: string | null
  loading: boolean
  error: string | null
}

export function useResolvedCampaignId(
  campaignName: string,
  workspaceId: string
): UseResolvedCampaignIdReturn {
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const resolveCampaign = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          campaign_name: campaignName,
          workspace_id: workspaceId
        })

        const response = await fetch(`/api/instantly/resolve-campaign?${params}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to resolve campaign')
        }

        const data = await response.json()
        setCampaignId(data.campaign.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Campaign ID resolution error:', err)
      } finally {
        setLoading(false)
      }
    }

    resolveCampaign()
  }, [campaignName, workspaceId])

  return {
    campaignId,
    loading,
    error
  }
}