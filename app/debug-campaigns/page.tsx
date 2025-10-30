'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Copy, CheckCircle } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: number
  created_at: string
}

export default function DebugCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkspace, setSelectedWorkspace] = useState('1')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchCampaigns = async (workspaceId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/instantly/debug-campaigns?workspace_id=${workspaceId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch campaigns')
      }
      
      setCampaigns(data.campaigns || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns(selectedWorkspace)
  }, [selectedWorkspace])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(text)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Draft'
      case 1: return 'Active'
      case 2: return 'Paused'
      case 3: return 'Completed'
      default: return `Status ${status}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Campaign IDs Debug</h1>
          <p className="text-slate-600">
            Find your campaign IDs to use in the Roger Campaigns configuration
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Workspace
          </label>
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="w-64 p-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="1">Workspace 1 (Wings Over Campaign)</option>
            <option value="2">Workspace 2 (Paramount Realty USA)</option>
            <option value="3">Workspace 3</option>
            <option value="4">Workspace 4</option>
          </select>
        </div>

        {loading && (
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-500" />
            <p className="text-slate-600">Loading campaigns...</p>
          </Card>
        )}

        {error && (
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="text-red-800">
              <p className="font-medium">Error loading campaigns:</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </Card>
        )}

        {!loading && !error && campaigns.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-slate-600">No campaigns found in this workspace</p>
          </Card>
        )}

        {!loading && campaigns.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              Found {campaigns.length} campaigns. Click the copy button to copy campaign IDs:
            </p>
            
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800">{campaign.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === 1 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {getStatusLabel(campaign.status)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Campaign ID:</span>
                        <code className="bg-slate-100 px-2 py-1 rounded font-mono text-xs">
                          {campaign.id}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(campaign.id)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedId === campaign.id ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p>Created: {new Date(campaign.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">How to use these Campaign IDs:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. Copy the campaign ID for the campaign you want to display</p>
            <p>2. You can use it directly in the campaigns analytics API</p>
            <p>3. Or update the Roger campaigns configuration with the correct campaign names</p>
          </div>
        </Card>
      </div>
    </div>
  )
}