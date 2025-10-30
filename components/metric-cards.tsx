'use client'

import { TrendingUp, ThumbsUp, Mail, MousePointer, Loader2, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useInstantlyOverview } from "@/hooks/use-instantly-analytics"
import { calculateReplyRate, calculatePositiveReplyRate, calculateOpenRate, calculateClickRate } from "@/lib/instantly-api"

interface MetricCardsProps {
  campaignId?: string | null
  workspaceId?: string | null
  dateRange?: string
}

export function MetricCards({ campaignId, workspaceId, dateRange }: MetricCardsProps) {
  const { data: overview, loading, error } = useInstantlyOverview(campaignId, workspaceId)

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
            <p className="text-sm font-medium">Unable to load analytics data</p>
            <p className="text-xs mt-2 text-slate-500">{error}</p>
            <p className="text-xs mt-3 text-indigo-600 font-medium">
              Check browser console for detailed error information
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl">
        <Card className="p-8 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm col-span-full">
          <div className="text-center text-slate-600">
            <p className="text-sm font-medium">No analytics data available</p>
            <p className="text-xs mt-2 text-slate-500">Make sure you have active campaigns</p>
          </div>
        </Card>
      </div>
    )
  }

  // Use the correct field names from the API
  const replyRate = calculateReplyRate(overview.reply_count_unique, overview.emails_sent_count)
  const positiveReplyRate = calculatePositiveReplyRate(overview.total_interested, overview.reply_count_unique)
  const openRate = calculateOpenRate(overview.open_count_unique, overview.emails_sent_count)
  const clickRate = calculateClickRate(overview.link_click_count_unique, overview.emails_sent_count)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl">
      {/* Emails Opened Card */}
      <Card className="p-6 bg-green-50/30 border-green-100 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Emails Opened</h3>
          <Mail className="w-4 h-4 text-green-500" />
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-semibold">{overview.open_count_unique.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">
            out of {overview.emails_sent_count.toLocaleString()} emails sent
          </p>
        </div>
      </Card>

      {/* Total Leads in List Card */}
      <Card className="p-6 bg-blue-50/30 border-blue-100 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Leads</h3>
          <Users className="w-4 h-4 text-blue-500" />
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-semibold">
            {overview.leads_count?.toLocaleString() || 'N/A'}
          </div>
          <p className="text-sm text-muted-foreground">
            leads in list
          </p>
        </div>
      </Card>
    </div>
  )
}