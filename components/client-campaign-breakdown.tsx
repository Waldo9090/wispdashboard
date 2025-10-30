'use client'

import { CampaignBreakdown } from "@/components/campaign-breakdown"
import { useResolvedCampaignId } from "@/hooks/use-resolved-campaign-id"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ClientCampaignBreakdownProps {
  campaignName: string
  workspaceId: string
  dateRange: string
}

export function ClientCampaignBreakdown({ campaignName, workspaceId, dateRange }: ClientCampaignBreakdownProps) {
  const { campaignId, loading, error } = useResolvedCampaignId(campaignName, workspaceId)

  if (loading) {
    return (
      <Card className="p-8 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mb-4" />
            <p className="text-sm text-slate-600">Loading campaign breakdown...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error || !campaignId) {
    return (
      <Card className="p-8 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm">
        <div className="text-center text-slate-600">
          <p className="text-sm font-medium">Unable to load campaign breakdown</p>
          <p className="text-xs mt-2 text-slate-500">{error || 'Campaign not found'}</p>
        </div>
      </Card>
    )
  }

  return (
    <CampaignBreakdown 
      campaignId={campaignId}
      workspaceId={workspaceId}
      dateRange={dateRange}
    />
  )
}