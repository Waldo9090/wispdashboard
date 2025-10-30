'use client'

import { PerformanceChart } from "@/components/performance-chart"
import { useResolvedCampaignId } from "@/hooks/use-resolved-campaign-id"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ClientPerformanceChartProps {
  campaignName: string
  workspaceId: string
  dateRange: string
}

export function ClientPerformanceChart({ campaignName, workspaceId, dateRange }: ClientPerformanceChartProps) {
  const { campaignId, loading, error } = useResolvedCampaignId(campaignName, workspaceId)

  if (loading) {
    return (
      <Card className="p-8 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mb-4" />
            <p className="text-sm text-slate-600">Loading performance chart...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error || !campaignId) {
    return (
      <Card className="p-8 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm">
        <div className="text-center text-slate-600">
          <p className="text-sm font-medium">Unable to load performance chart</p>
          <p className="text-xs mt-2 text-slate-500">{error || 'Campaign not found'}</p>
        </div>
      </Card>
    )
  }

  return (
    <PerformanceChart 
      campaignId={campaignId}
      workspaceId={workspaceId}
      dateRange={dateRange}
    />
  )
}