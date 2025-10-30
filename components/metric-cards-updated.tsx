'use client'

import { TrendingUp, ThumbsUp, Mail, MousePointer, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useInstantlyOverview } from "@/hooks/use-instantly-analytics"
import { calculateReplyRate, calculatePositiveReplyRate, calculateOpenRate, calculateClickRate } from "@/lib/instantly-api"

interface MetricCardsProps {
  campaignId?: string
}

export function MetricCards({ campaignId }: MetricCardsProps) {
  const { data: overview, loading, error } = useInstantlyOverview(campaignId)

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-center h-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6 col-span-2 lg:col-span-4">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Unable to load analytics data</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6 col-span-2 lg:col-span-4">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No analytics data available</p>
          </div>
        </Card>
      </div>
    )
  }

  const replyRate = calculateReplyRate(overview.unique_replies, overview.sent)
  const positiveReplyRate = calculatePositiveReplyRate(overview.positive_replies || 0, overview.unique_replies)
  const openRate = calculateOpenRate(overview.unique_opened, overview.sent)
  const clickRate = calculateClickRate(overview.unique_clicks, overview.sent)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Reply Rate Card */}
      <Card className="p-6 bg-blue-50/30 border-blue-100">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Reply Rate</h3>
          <TrendingUp className="w-4 h-4 text-blue-500" />
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-semibold">{replyRate.toFixed(1)}%</div>
          <p className="text-sm text-muted-foreground">
            {overview.unique_replies.toLocaleString()} of {overview.sent.toLocaleString()} emails
          </p>
        </div>
      </Card>

      {/* Positive Reply Rate Card */}
      <Card className="p-6 bg-pink-50/30 border-pink-100">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Positive Reply Rate</h3>
          <ThumbsUp className="w-4 h-4 text-pink-500" />
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-semibold">{positiveReplyRate.toFixed(1)}%</div>
          <p className="text-sm text-muted-foreground">
            {(overview.positive_replies || 0).toLocaleString()} positive of {overview.unique_replies.toLocaleString()} replies
          </p>
        </div>
      </Card>

      {/* Open Rate Card */}
      <Card className="p-6 bg-green-50/30 border-green-100">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Open Rate</h3>
          <Mail className="w-4 h-4 text-green-500" />
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-semibold">{openRate.toFixed(1)}%</div>
          <p className="text-sm text-muted-foreground">
            {overview.unique_opened.toLocaleString()} of {overview.sent.toLocaleString()} emails
          </p>
        </div>
      </Card>

      {/* Click Rate Card */}
      <Card className="p-6 bg-orange-50/30 border-orange-100">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Click Rate</h3>
          <MousePointer className="w-4 h-4 text-orange-500" />
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-semibold">{clickRate.toFixed(1)}%</div>
          <p className="text-sm text-muted-foreground">
            {overview.unique_clicks.toLocaleString()} of {overview.sent.toLocaleString()} emails
          </p>
        </div>
      </Card>
    </div>
  )
}