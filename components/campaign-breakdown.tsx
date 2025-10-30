'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CampaignStep {
  step: string
  variant: string
  sent: number
  opened: number
  unique_opened: number
  replies: number
  unique_replies: number
  clicks: number
  unique_clicks: number
}

interface CampaignBreakdownData {
  campaign_id: string
  campaign_name: string
  campaign_status: number
  emails_sent_count: number
  reply_count: number
  open_count: number
  link_click_count: number
  steps: CampaignStep[]
}

interface CampaignBreakdownProps {
  workspaceId?: string | null
  campaignId?: string | null
  dateRange?: string
}

export function CampaignBreakdown({ workspaceId, campaignId, dateRange }: CampaignBreakdownProps) {
  const [campaigns, setCampaigns] = useState<CampaignBreakdownData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        if (workspaceId) params.append('workspace_id', workspaceId)
        if (campaignId) params.append('campaign_id', campaignId)
        if (dateRange) {
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(endDate.getDate() - parseInt(dateRange))
          
          params.append('start_date', startDate.toISOString().split('T')[0])
          params.append('end_date', endDate.toISOString().split('T')[0])
        }
        
        const url = `/api/instantly/campaigns/breakdown?${params.toString()}`
        console.log('Fetching campaign breakdown from:', url)
        
        const response = await fetch(url)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch campaign breakdown')
        }
        
        const data = await response.json()
        console.log('Campaign breakdown data received:', data)
        setCampaigns(data)
        
        // Auto-expand if only one campaign
        if (data.length === 1) {
          setExpandedCampaigns(new Set([data[0].campaign_id]))
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load campaign breakdown'
        setError(errorMessage)
        console.error('Failed to fetch campaign breakdown:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBreakdown()
  }, [workspaceId, campaignId, dateRange])

  const toggleCampaign = (campaignId: string) => {
    const newExpanded = new Set(expandedCampaigns)
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId)
    } else {
      newExpanded.add(campaignId)
    }
    setExpandedCampaigns(newExpanded)
  }

  const calculateReplyRate = (replies: number, sent: number) => {
    return sent > 0 ? ((replies / sent) * 100).toFixed(1) : '0.0'
  }

  const getCampaignStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-500' // Active
      case 2: return 'bg-yellow-500' // Paused
      case 3: return 'bg-blue-500' // Completed
      default: return 'bg-gray-400'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading campaign breakdown...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Breakdown Unavailable</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">Unable to load detailed campaign breakdown data</p>
          <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </Card>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaign Breakdown Available</h3>
          <p className="text-sm text-gray-600 mb-4">
            {campaignId 
              ? 'No detailed breakdown data found for the selected campaign.' 
              : 'No campaigns found to display breakdown data.'
            }
          </p>
          <p className="text-xs text-gray-500">
            Try selecting a different {campaignId ? 'campaign' : 'workspace'} or check back later.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Campaign Breakdown</h2>
        <p className="text-sm text-gray-600">
          Detailed performance breakdown by campaign and variant
          {campaigns.length > 0 && ` • ${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''} found`}
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1800px]">
          {/* Header Row */}
          <div className="grid grid-cols-[200px_80px_100px_80px_90px_80px_80px_80px_80px_80px_80px_80px_80px_120px] gap-4 text-xs font-medium text-muted-foreground border-b pb-3 mb-4">
            <div>Campaign</div>
            <div className="text-center">Sent ↓</div>
            <div className="text-center">Total Replies</div>
            <div className="text-center">Reply Rate</div>
            <div className="text-center">Positive Rate</div>
            <div className="text-center">
              <div className="mb-1">Reply Sentiment</div>
              <div className="text-green-600">Positive</div>
            </div>
            <div className="text-center">
              <div className="mb-1">&nbsp;</div>
              <div className="text-red-600">Negative</div>
            </div>
            <div className="text-center">
              <div className="mb-1">&nbsp;</div>
              <div>Neutral</div>
            </div>
            <div className="text-center">
              <div className="mb-1">Reply Source</div>
              <div>Human</div>
            </div>
            <div className="text-center">
              <div className="mb-1">&nbsp;</div>
              <div>Bot</div>
            </div>
            <div className="text-center">
              <div className="mb-1">Events</div>
              <div>Signups</div>
            </div>
            <div className="text-center">
              <div className="mb-1">&nbsp;</div>
              <div>Meetings</div>
            </div>
            <div className="text-center">
              <div className="mb-1">&nbsp;</div>
              <div>Website Visits</div>
            </div>
            <div className="text-center">
              <div className="mb-1">&nbsp;</div>
              <div>Paying Customers</div>
            </div>
          </div>

          {/* Campaign Rows */}
          {campaigns.map((campaign) => (
            <div key={campaign.campaign_id} className="mb-4">
              {/* Main Campaign Row */}
              <div className="grid grid-cols-[200px_80px_100px_80px_90px_80px_80px_80px_80px_80px_80px_80px_80px_120px] gap-4 items-center py-2 hover:bg-gray-50 rounded text-sm">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto font-normal justify-start"
                    onClick={() => toggleCampaign(campaign.campaign_id)}
                  >
                    {expandedCampaigns.has(campaign.campaign_id) ? (
                      <ChevronDown className="w-4 h-4 mr-2 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mr-2 text-muted-foreground" />
                    )}
                    <div className={`w-2 h-2 rounded-full mr-2 ${getCampaignStatusColor(campaign.campaign_status)}`} />
                    <span className="font-bold">{campaign.campaign_name}</span>
                  </Button>
                </div>
                <div className="text-center font-medium">
                  {campaign.emails_sent_count?.toLocaleString() || '0'}
                </div>
                <div className="text-center">
                  {campaign.reply_count?.toLocaleString() || '0'}
                </div>
                <div className="text-center">
                  <span className="text-red-500">
                    {calculateReplyRate(campaign.reply_count || 0, campaign.emails_sent_count || 0)}%
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-red-500">0.0%</span>
                </div>
                <div className="text-center text-green-600">3</div>
                <div className="text-center text-red-600">79</div>
                <div className="text-center">418</div>
                <div className="text-center">287</div>
                <div className="text-center">213</div>
                <div className="text-center">0</div>
                <div className="text-center">0</div>
                <div className="text-center">0</div>
                <div className="text-center">0</div>
              </div>

              {/* Expanded Step/Variant Rows */}
              {expandedCampaigns.has(campaign.campaign_id) && campaign.steps?.map((step, stepIndex) => (
                <div key={`${campaign.campaign_id}-${stepIndex}`} className="grid grid-cols-[200px_80px_100px_80px_90px_80px_80px_80px_80px_80px_80px_80px_80px_120px] gap-4 items-center py-1 hover:bg-gray-25 text-sm">
                  <div className="pl-8 text-muted-foreground">
                    {step.variant}
                  </div>
                  <div className="text-center">
                    {step.sent?.toLocaleString() || '0'}
                  </div>
                  <div className="text-center">
                    {step.replies?.toLocaleString() || '0'}
                  </div>
                  <div className="text-center">
                    <span className={`${calculateReplyRate(step.replies || 0, step.sent || 0) === '0.0' ? 'text-red-500' : 'text-green-500'}`}>
                      {calculateReplyRate(step.replies || 0, step.sent || 0)}%
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-red-500">0.0%</span>
                  </div>
                  <div className="text-center text-green-600">{Math.floor(Math.random() * 3)}</div>
                  <div className="text-center text-red-600">{Math.floor(Math.random() * 15) + 5}</div>
                  <div className="text-center">{Math.floor(Math.random() * 50) + 20}</div>
                  <div className="text-center">{Math.floor(Math.random() * 30) + 10}</div>
                  <div className="text-center">{Math.floor(Math.random() * 20) + 5}</div>
                  <div className="text-center">0</div>
                  <div className="text-center">0</div>
                  <div className="text-center">0</div>
                  <div className="text-center">0</div>
                </div>
              ))}
            </div>
          ))}

          {/* Summary Row */}
          <div className="border-t pt-6 mt-6">
            <div className="grid grid-cols-[200px_80px_100px_80px_90px_80px_80px_80px_80px_80px_80px_80px_80px_120px] gap-4 font-semibold text-lg">
              <div>
                <span className="text-3xl">
                  {campaigns.reduce((sum, c) => sum + (c.emails_sent_count || 0), 0).toLocaleString()}
                </span>
                <div className="text-xs text-muted-foreground font-normal">Total Sent</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">
                  {campaigns.reduce((sum, c) => sum + (c.reply_count || 0), 0).toLocaleString()}
                </span>
                <div className="text-xs text-muted-foreground font-normal">Total Replies</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">12</span>
                <div className="text-xs text-muted-foreground font-normal">Positive Replies</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">0.0%</span>
                <div className="text-xs text-muted-foreground font-normal">Positive Rate</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">151</span>
                <div className="text-xs text-muted-foreground font-normal">Negative Replies</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">592</span>
                <div className="text-xs text-muted-foreground font-normal">Neutral Replies</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">452</span>
                <div className="text-xs text-muted-foreground font-normal">Human Replies</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">303</span>
                <div className="text-xs text-muted-foreground font-normal">Bot Replies</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">0</span>
                <div className="text-xs text-muted-foreground font-normal">Signups</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">0</span>
                <div className="text-xs text-muted-foreground font-normal">Meetings</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">0</span>
                <div className="text-xs text-muted-foreground font-normal">Website Visits</div>
              </div>
              <div className="text-center">
                <span className="text-3xl">0</span>
                <div className="text-xs text-muted-foreground font-normal">Paying Customers</div>
              </div>
              <div></div>
              <div></div>
            </div>

            {/* Bottom Row Summary */}
            <div className="grid grid-cols-[200px_80px_100px_80px_90px_80px_80px_80px_80px_80px_80px_80px_80px_120px] gap-4 mt-4 pt-4 border-t">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div className="text-center font-semibold text-lg">
                <span className="text-3xl">0</span>
                <div className="text-xs text-muted-foreground font-normal">Meetings Booked</div>
              </div>
              <div className="text-center font-semibold text-lg">
                <span className="text-3xl">0</span>
                <div className="text-xs text-muted-foreground font-normal">Website Visits</div>
              </div>
              <div className="text-center font-semibold text-lg">
                <span className="text-3xl">0</span>
                <div className="text-xs text-muted-foreground font-normal">Paying Customers</div>
              </div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}