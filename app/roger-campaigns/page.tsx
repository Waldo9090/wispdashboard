'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { isRogerCampaignsOnlyUser } from "@/lib/special-users"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { RogerCampaignResolver } from "@/components/roger-campaign-resolver"
import { RogerCampaignsMetrics } from "@/components/roger-campaigns-metrics"
import { ClientPerformanceChart } from "@/components/client-performance-chart"
import { ClientCampaignBreakdown } from "@/components/client-campaign-breakdown"
import { CampaignMessages } from "@/components/campaign-messages"
import { DateRangeFilter, type DateRange } from "@/components/date-range-filter"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ExternalLink, BarChart3, LogOut, Mail } from "lucide-react"

// Roger Campaigns Configuration
const ROGER_CAMPAIGNS = [
  {
    id: 'roger-hospital-chapel-hill',
    name: 'Roger Hospital Chapel Hill',
    campaignName: 'roger-hospitals-chapel-hill',
    workspaceId: '1',
    workspaceName: 'Wings Over Campaign',
    description: 'Healthcare campaign analytics for Chapel Hill location',
    clientUrl: '/client/roger-hospital-chapel-hill',
    status: 'Active'
  },
  {
    id: 'roger-real-estate-offices',
    name: 'Roger Real Estate Offices',
    campaignName: 'roger-real-estate-offices', 
    workspaceId: '3',
    workspaceName: 'Modu campaign',
    description: 'Real estate office outreach campaign analytics',
    clientUrl: '/client/roger-real-estate-offices',
    status: 'Active'
  },
  {
    id: 'roger-wisconsin-leads',
    name: 'Roger Wisconsin Leads',
    campaignName: 'roger-wisconsin-leads',
    workspaceId: '1',
    workspaceName: 'Wings Over Campaign',
    description: 'Wisconsin lead generation campaign analytics',
    clientUrl: '/client/roger-wisconsin-leads', 
    status: 'Active'
  },
  {
    id: 'specific-roger-campaign',
    name: 'Roger Campaign',
    campaignId: '6ffe8ad9-9695-4f4d-973f-0c20425268eb',
    workspaceId: '1', // Change this if it's in a different workspace
    workspaceName: 'Wings Over Campaign',
    description: 'Direct campaign analytics using specific campaign ID',
    clientUrl: '/client/specific-roger-campaign',
    status: 'Active'
  }
]

function getDateRangeStart(range: DateRange): string {
  const today = new Date()
  const days = parseInt(range.toString())
  const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000))
  return startDate.toISOString().split('T')[0]
}

function getDateRangeEnd(): string {
  return new Date().toISOString().split('T')[0]
}

export default function RogerCampaignsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedCampaign, setSelectedCampaign] = useState<typeof ROGER_CAMPAIGNS[0] | null>(null)
  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('30')
  const [workspaceFilter, setWorkspaceFilter] = useState<string>('all')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading Roger campaigns...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check if this is mike@delectablecap.com for special layout
  const isMikeUser = user.email === 'mike@delectablecap.com'

  // Filter campaigns by workspace
  const filteredCampaigns = workspaceFilter === 'all' 
    ? ROGER_CAMPAIGNS 
    : ROGER_CAMPAIGNS.filter(campaign => campaign.workspaceId === workspaceFilter)

  const workspaces = [
    { id: 'all', name: 'All Workspaces' },
    { id: '1', name: 'Wings Over Campaign' },
    { id: '2', name: 'Paramount Realty USA' }
  ]

  // Special layout for mike@delectablecap.com (no sidebar)
  if (isMikeUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        {/* Custom header for Mike */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <div>
                <div className="font-semibold text-xl text-slate-800 tracking-tight">Candytrail</div>
                <div className="text-xs text-slate-500 mt-1 font-medium tracking-wide">ROGER CAMPAIGNS</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>Welcome, {user.displayName || user.email}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-xl hover:bg-red-100 text-slate-600 hover:text-red-600"
                onClick={async () => {
                  try {
                    const { logout } = await import('@/contexts/AuthContext')
                    // Handle logout here if needed
                    router.push('/signin')
                  } catch (error) {
                    router.push('/signin')
                  }
                }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="mb-3">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Roger Campaigns</h1>
              <p className="text-sm text-slate-600 font-medium">
                Manage and view analytics for all Roger campaign variations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Campaign Selection */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Campaign</h2>
                  
                  {/* Workspace Filter */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Filter by Workspace</label>
                    <select 
                      value={workspaceFilter}
                      onChange={(e) => setWorkspaceFilter(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Campaign List */}
                <div className="space-y-3">
                  {filteredCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedCampaign?.id === campaign.id
                          ? 'border-indigo-300 bg-indigo-50/50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-slate-800 text-sm">{campaign.name}</h3>
                        <Badge variant={campaign.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{campaign.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{campaign.workspaceName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(campaign.clientUrl, '_blank')
                          }}
                          className="text-xs p-1 h-auto"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredCampaigns.length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-8">
                    No campaigns found for selected workspace
                  </div>
                )}
              </Card>
            </div>

            {/* Right Panel - Campaign Analytics */}
            <div className="lg:col-span-2">
              {selectedCampaign ? (
                <div className="space-y-6">
                  {/* Selected Campaign Header */}
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800">{selectedCampaign.name}</h2>
                        <p className="text-sm text-slate-600">{selectedCampaign.workspaceName}</p>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {selectedCampaign.status}
                      </Badge>
                    </div>
                    
                    {/* Date Range Filter */}
                    <DateRangeFilter 
                      selectedRange={selectedDateRange}
                      onRangeChange={setSelectedDateRange}
                    />
                  </Card>

                  {/* Metrics */}
                  {(selectedCampaign as any).campaignId ? (
                    <RogerCampaignsMetrics 
                      campaignId={(selectedCampaign as any).campaignId}
                      workspaceId={selectedCampaign.workspaceId}
                      startDate={getDateRangeStart(selectedDateRange)}
                      endDate={getDateRangeEnd()}
                    />
                  ) : (
                    <RogerCampaignResolver 
                      campaignName={selectedCampaign.campaignName}
                      workspaceId={selectedCampaign.workspaceId}
                      startDate={getDateRangeStart(selectedDateRange)}
                      endDate={getDateRangeEnd()}
                    />
                  )}

                  {/* Tabs */}
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
                    <div className="flex gap-2 p-4 border-b border-slate-200">
                      <button
                        onClick={() => setSelectedTab("overview")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          selectedTab === "overview"
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setSelectedTab("charts")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          selectedTab === "charts"
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        Charts & Trends
                      </button>
                      <button
                        onClick={() => setSelectedTab("breakdown")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          selectedTab === "breakdown"
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Campaign Breakdown
                      </button>
                      <button
                        onClick={() => setSelectedTab("messages")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          selectedTab === "messages"
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        Campaign Messages
                      </button>
                    </div>

                    <div className="p-6">
                      {selectedTab === "overview" && (
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">Campaign Overview</h3>
                          <p className="text-slate-600 text-sm mb-4">{selectedCampaign.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-left">
                              <span className="font-medium text-slate-700">Workspace:</span>
                              <p className="text-slate-600">{selectedCampaign.workspaceName}</p>
                            </div>
                            <div className="text-left">
                              <span className="font-medium text-slate-700">Client URL:</span>
                              <a 
                                href={selectedCampaign.clientUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
                              >
                                View Client Dashboard <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedTab === "charts" && (
                        <ClientPerformanceChart 
                          campaignName={selectedCampaign.campaignName}
                          workspaceId={selectedCampaign.workspaceId}
                          dateRange={selectedDateRange}
                        />
                      )}

                      {selectedTab === "breakdown" && (
                        <ClientCampaignBreakdown 
                          campaignName={selectedCampaign.campaignName}
                          workspaceId={selectedCampaign.workspaceId}
                          dateRange={selectedDateRange}
                        />
                      )}

                      {selectedTab === "messages" && (
                        <CampaignMessages 
                          campaignName={selectedCampaign.campaignName}
                          campaignId={(selectedCampaign as any).campaignId}
                          workspaceId={selectedCampaign.workspaceId}
                        />
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-12 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm text-center">
                  <div className="text-slate-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium mb-2">Select a Roger Campaign</h3>
                    <p className="text-sm">
                      Choose a campaign from the left panel to view its analytics and performance data.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Normal layout for other users (with sidebar)
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Sidebar />

      <div className="flex-1">
        <DashboardHeader />

        <main className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="mb-3">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Roger Campaigns</h1>
              <p className="text-sm text-slate-600 font-medium">
                Manage and view analytics for all Roger campaign variations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Campaign Selection */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Select Campaign</h2>
                  
                  {/* Workspace Filter */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Filter by Workspace</label>
                    <select 
                      value={workspaceFilter}
                      onChange={(e) => setWorkspaceFilter(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Campaign List */}
                <div className="space-y-3">
                  {filteredCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedCampaign?.id === campaign.id
                          ? 'border-indigo-300 bg-indigo-50/50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-slate-800 text-sm">{campaign.name}</h3>
                        <Badge variant={campaign.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{campaign.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{campaign.workspaceName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(campaign.clientUrl, '_blank')
                          }}
                          className="text-xs p-1 h-auto"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredCampaigns.length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-8">
                    No campaigns found for selected workspace
                  </div>
                )}
              </Card>
            </div>

            {/* Right Panel - Campaign Analytics */}
            <div className="lg:col-span-2">
              {selectedCampaign ? (
                <div className="space-y-6">
                  {/* Selected Campaign Header */}
                  <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800">{selectedCampaign.name}</h2>
                        <p className="text-sm text-slate-600">{selectedCampaign.workspaceName}</p>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {selectedCampaign.status}
                      </Badge>
                    </div>
                    
                    {/* Date Range Filter */}
                    <DateRangeFilter 
                      selectedRange={selectedDateRange}
                      onRangeChange={setSelectedDateRange}
                    />
                  </Card>

                  {/* Metrics */}
                  {(selectedCampaign as any).campaignId ? (
                    <RogerCampaignsMetrics 
                      campaignId={(selectedCampaign as any).campaignId}
                      workspaceId={selectedCampaign.workspaceId}
                      startDate={getDateRangeStart(selectedDateRange)}
                      endDate={getDateRangeEnd()}
                    />
                  ) : (
                    <RogerCampaignResolver 
                      campaignName={selectedCampaign.campaignName}
                      workspaceId={selectedCampaign.workspaceId}
                      startDate={getDateRangeStart(selectedDateRange)}
                      endDate={getDateRangeEnd()}
                    />
                  )}

                  {/* Tabs */}
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
                    <div className="flex gap-2 p-4 border-b border-slate-200">
                      <button
                        onClick={() => setSelectedTab("overview")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          selectedTab === "overview"
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setSelectedTab("charts")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          selectedTab === "charts"
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        Charts & Trends
                      </button>
                      <button
                        onClick={() => setSelectedTab("breakdown")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          selectedTab === "breakdown"
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Campaign Breakdown
                      </button>
                      <button
                        onClick={() => setSelectedTab("messages")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          selectedTab === "messages"
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        Campaign Messages
                      </button>
                    </div>

                    <div className="p-6">
                      {selectedTab === "overview" && (
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">Campaign Overview</h3>
                          <p className="text-slate-600 text-sm mb-4">{selectedCampaign.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-left">
                              <span className="font-medium text-slate-700">Workspace:</span>
                              <p className="text-slate-600">{selectedCampaign.workspaceName}</p>
                            </div>
                            <div className="text-left">
                              <span className="font-medium text-slate-700">Client URL:</span>
                              <a 
                                href={selectedCampaign.clientUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
                              >
                                View Client Dashboard <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedTab === "charts" && (
                        <ClientPerformanceChart 
                          campaignName={selectedCampaign.campaignName}
                          workspaceId={selectedCampaign.workspaceId}
                          dateRange={selectedDateRange}
                        />
                      )}

                      {selectedTab === "breakdown" && (
                        <ClientCampaignBreakdown 
                          campaignName={selectedCampaign.campaignName}
                          workspaceId={selectedCampaign.workspaceId}
                          dateRange={selectedDateRange}
                        />
                      )}

                      {selectedTab === "messages" && (
                        <CampaignMessages 
                          campaignName={selectedCampaign.campaignName}
                          campaignId={(selectedCampaign as any).campaignId}
                          workspaceId={selectedCampaign.workspaceId}
                        />
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-12 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm text-center">
                  <div className="text-slate-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium mb-2">Select a Roger Campaign</h3>
                    <p className="text-sm">
                      Choose a campaign from the left panel to view its analytics and performance data.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}