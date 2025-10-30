'use client'

import { useState, useEffect } from 'react'
import { RogerCampaignsMetrics } from './roger-campaigns-metrics'
import { Card } from './ui/card'
import { Loader2 } from 'lucide-react'

interface RogerCampaignResolverProps {
  campaignName: string // e.g., 'roger-hospitals-chapel-hill'
  workspaceId: string
  startDate?: string
  endDate?: string
}

interface ResolvedCampaign {
  id: string
  name: string
  status: number
}

export function RogerCampaignResolver({ campaignName, workspaceId, startDate, endDate }: RogerCampaignResolverProps) {
  const [resolvedCampaign, setResolvedCampaign] = useState<ResolvedCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const resolveCampaign = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const resolveParams = new URLSearchParams({
          campaign_name: campaignName,
          workspace_id: workspaceId
        })
        
        const response = await fetch(`/api/instantly/resolve-campaign?${resolveParams}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to resolve campaign')
        }
        
        const data = await response.json()
        setResolvedCampaign(data.campaign)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
        console.error('Campaign resolution error:', err)
      } finally {
        setLoading(false)
      }
    }

    resolveCampaign()
  }, [campaignName, workspaceId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm">
            <div className="flex items-center justify-center h-20">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl">
        <Card className="p-8 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm col-span-full">
          <div className="text-center text-slate-600">
            <p className="text-sm font-medium">Unable to resolve campaign</p>
            <p className="text-xs mt-2 text-slate-500">{error}</p>
            <p className="text-xs mt-3 text-indigo-600 font-medium">
              Please contact support if this issue persists
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (!resolvedCampaign) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl">
        <Card className="p-8 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm col-span-full">
          <div className="text-center text-slate-600">
            <p className="text-sm font-medium">Campaign not found</p>
            <p className="text-xs mt-2 text-slate-500">Unable to locate campaign: {campaignName}</p>
          </div>
        </Card>
      </div>
    )
  }

  // Now that we have the resolved campaign ID, render the metrics
  return (
    <RogerCampaignsMetrics
      campaignId={resolvedCampaign.id}
      workspaceId={workspaceId}
      startDate={startDate}
      endDate={endDate}
    />
  )
}