'use client'

import { Mail, Loader2, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useCampaignsAnalytics } from "@/hooks/use-campaigns-analytics"

interface RogerCampaignsMetricsProps {
  campaignId: string
  workspaceId: string
  startDate?: string
  endDate?: string
}

export function RogerCampaignsMetrics({ campaignId, workspaceId, startDate, endDate }: RogerCampaignsMetricsProps) {
  const { data: campaigns, loading, error } = useCampaignsAnalytics({
    campaignId,
    workspaceId,
    startDate,
    endDate,
    excludeTotalLeadsCount: false // We need the leads count
  })

  const campaign = campaigns?.[0] // Since we're passing a specific campaignId, we get one campaign

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
              Please contact support if this issue persists
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl">
        <Card className="p-8 bg-white/60 backdrop-blur-sm border-slate-200 shadow-sm col-span-full">
          <div className="text-center text-slate-600">
            <p className="text-sm font-medium">No campaign data available</p>
            <p className="text-xs mt-2 text-slate-500">Campaign data may still be processing</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl">
      {/* Emails Opened Card */}
      <Card className="p-6 bg-green-50/30 border-green-100 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Emails Opened</h3>
          <Mail className="w-4 h-4 text-green-500" />
        </div>
        <div className="space-y-1">
          <div className="text-4xl font-semibold">{campaign.open_count.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">
            out of {campaign.emails_sent_count.toLocaleString()} emails sent
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
            {campaign.leads_count.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            leads in list
          </p>
        </div>
      </Card>
      
      {/* Additional stats in smaller text - span full width */}
      <div className="col-span-full text-xs text-slate-500 space-y-1">
        <p><span className="font-medium">Campaign:</span> {campaign.campaign_name}</p>
        <p><span className="font-medium">Contacted:</span> {campaign.contacted_count.toLocaleString()} leads</p>
        <p><span className="font-medium">Replies:</span> {campaign.reply_count.toLocaleString()}</p>
        {campaign.total_opportunities > 0 && (
          <p><span className="font-medium">Opportunities:</span> {campaign.total_opportunities.toLocaleString()}</p>
        )}
        <p><span className="font-medium">Status:</span> {getCampaignStatusLabel(campaign.campaign_status)}</p>
      </div>
    </div>
  )
}

function getCampaignStatusLabel(status: number): string {
  switch (status) {
    case 0: return 'Draft'
    case 1: return 'Active'
    case 2: return 'Paused'
    case 3: return 'Completed'
    case 4: return 'Running Subsequences'
    case -99: return 'Account Suspended'
    case -1: return 'Accounts Unhealthy'
    case -2: return 'Bounce Protect'
    default: return 'Unknown'
  }
}