"use client"

import { getAvailableClientTokens } from "@/lib/client-access-config"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"

export default function ClientLinksPage() {
  const clientTokens = getAvailableClientTokens()

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    // You could add a toast notification here
  }

  const getFullUrl = (token: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/client/${token}`
    }
    return `/client/${token}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Client Dashboard Links</h1>
          <p className="text-slate-600">Share these links with clients for direct access to their campaign analytics</p>
        </div>

        <div className="grid gap-6">
          {clientTokens.map(({ token, config }) => (
            <Card key={token} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {config.name}
                  </h3>
                  {config.description && (
                    <p className="text-slate-600 text-sm mb-3">{config.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Workspace: {config.workspaceId === '1' ? 'Wings Over Campaign' : 
                                                config.workspaceId === '2' ? 'Paramount Realty USA' : 
                                                config.workspaceId === '3' ? 'Modu campaign' : 
                                                config.workspaceId === '4' ? 'Reachify' : 'Unknown'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getFullUrl(token))}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getFullUrl(token), '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Preview
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <code className="text-sm text-slate-700 break-all">
                  {getFullUrl(token)}
                </code>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Setup Required</h2>
          <p className="text-yellow-700 text-sm mb-4">
            Before sharing these links, you need to update the campaign IDs in the configuration:
          </p>
          <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
            <li>Go to <code>/api/instantly/campaigns</code> to find actual campaign IDs</li>
            <li>Update <code>lib/client-access-config.ts</code> with the real campaign IDs</li>
            <li>Replace "REPLACE_WITH_ACTUAL_CAMPAIGN_ID" with actual values</li>
            <li>Test each link to ensure data loads correctly</li>
          </ol>
        </div>
      </div>
    </div>
  )
}