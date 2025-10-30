'use client'

import { useState, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCampaignStatusLabel } from "@/lib/instantly-api"

interface Campaign {
  campaign_id: string
  campaign_name: string
  campaign_status: number
  emails_sent_count: number
}

interface CampaignFilterProps {
  selectedCampaignId: string | null
  onCampaignChange: (campaignId: string | null) => void
  workspaceId?: string | null
}

export function CampaignFilter({ selectedCampaignId, onCampaignChange, workspaceId }: CampaignFilterProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Build URL with workspace parameter if provided
        const params = new URLSearchParams()
        if (workspaceId) {
          params.append('workspace_id', workspaceId)
        }
        
        const url = `/api/instantly/campaigns${params.toString() ? `?${params.toString()}` : ''}`
        const response = await fetch(url)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch campaigns')
        }
        
        const campaignData = await response.json()
        setCampaigns(campaignData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns')
        console.error('Failed to fetch campaigns:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
    
    // Reset selected campaign when workspace changes
    if (selectedCampaignId) {
      onCampaignChange(null)
    }
  }, [workspaceId])

  const selectedCampaign = campaigns.find(c => c.campaign_id === selectedCampaignId)

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm">
        <span className="text-sm text-slate-600 font-medium">Loading campaigns...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl shadow-sm">
        <span className="text-sm text-red-600 font-medium">Failed to load campaigns</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[220px] bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all duration-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">
              {selectedCampaign ? selectedCampaign.campaign_name : workspaceId ? 'All Workspace Campaigns' : 'All Campaigns'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl rounded-xl">
        {/* All Campaigns Option */}
        <DropdownMenuItem
          onClick={() => onCampaignChange(null)}
          className="flex items-center justify-between p-4 hover:bg-indigo-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-slate-800">{workspaceId ? 'All Workspace Campaigns' : 'All Campaigns'}</p>
              <p className="text-xs text-slate-500 font-medium">
                {workspaceId ? 'Combined analytics from all campaigns in this workspace' : 'Combined analytics from all campaigns'}
              </p>
            </div>
          </div>
          {!selectedCampaignId && <Check className="w-4 h-4 text-indigo-600" />}
        </DropdownMenuItem>

        {/* Individual Campaigns */}
        {campaigns.map((campaign) => (
          <DropdownMenuItem
            key={campaign.campaign_id}
            onClick={() => onCampaignChange(campaign.campaign_id)}
            className="flex items-center justify-between p-4 hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shadow-sm ${
                campaign.campaign_status === 1 ? 'bg-green-500' :
                campaign.campaign_status === 2 ? 'bg-yellow-500' :
                campaign.campaign_status === 3 ? 'bg-blue-500' :
                'bg-slate-400'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 truncate">{campaign.campaign_name}</p>
                <p className="text-xs text-slate-500 font-medium">
                  {getCampaignStatusLabel(campaign.campaign_status)} • {campaign.emails_sent_count.toLocaleString()} emails sent
                </p>
              </div>
            </div>
            {selectedCampaignId === campaign.campaign_id && <Check className="w-4 h-4 text-indigo-600" />}
          </DropdownMenuItem>
        ))}

        {campaigns.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500 font-medium">
            No campaigns found
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}