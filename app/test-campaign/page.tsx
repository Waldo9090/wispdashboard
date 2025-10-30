'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, Users } from 'lucide-react'

export default function TestCampaignPage() {
  const [campaignId, setCampaignId] = useState('')
  const [workspaceId, setWorkspaceId] = useState('1')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testCampaign = async () => {
    if (!campaignId.trim()) {
      setError('Please enter a campaign ID')
      return
    }

    setLoading(true)
    setError(null)
    setData(null)

    try {
      const response = await fetch(`/api/instantly/campaigns-analytics?id=${campaignId}&workspace_id=${workspaceId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch campaign data')
      }
      
      setData(Array.isArray(result) ? result[0] : result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Test Campaign Data</h1>
          <p className="text-slate-600">
            Enter a campaign ID to test the analytics data
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Campaign ID
              </label>
              <input
                type="text"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="e.g., 019a311f-c676-72a8-8434-a2b25067c92a"
                className="w-full p-3 border border-slate-200 rounded-lg font-mono text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Workspace
              </label>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-64 p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="1">Workspace 1</option>
                <option value="2">Workspace 2</option>
                <option value="3">Workspace 3</option>
                <option value="4">Workspace 4</option>
              </select>
            </div>
            
            <Button onClick={testCampaign} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                'Test Campaign'
              )}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="p-6 bg-red-50 border-red-200 mb-6">
            <div className="text-red-800">
              <p className="font-medium">Error:</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </Card>
        )}

        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Emails Opened Card */}
              <Card className="p-6 bg-green-50/30 border-green-100">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Emails Opened</h3>
                  <Mail className="w-4 h-4 text-green-500" />
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-semibold">{data.open_count?.toLocaleString() || 'N/A'}</div>
                  <p className="text-sm text-muted-foreground">
                    out of {data.emails_sent_count?.toLocaleString() || 'N/A'} emails sent
                  </p>
                </div>
              </Card>

              {/* Total Leads Card */}
              <Card className="p-6 bg-blue-50/30 border-blue-100">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Leads</h3>
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-semibold">{data.leads_count?.toLocaleString() || 'N/A'}</div>
                  <p className="text-sm text-muted-foreground">leads in list</p>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Complete Campaign Data:</h3>
              <pre className="text-xs bg-slate-100 p-4 rounded overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}