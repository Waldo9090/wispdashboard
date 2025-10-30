"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { MetricCards } from "@/components/metric-cards"
import { PerformanceChart } from "@/components/performance-chart"
import { CampaignFilter } from "@/components/campaign-filter"
import { WorkspaceFilter } from "@/components/workspace-filter"
import { CampaignBreakdown } from "@/components/campaign-breakdown"
import { DateRangeFilter, type DateRange } from "@/components/date-range-filter"
import { TrendingUp } from "lucide-react"

export function AnalyticsDashboard() {
  const [selectedTab, setSelectedTab] = useState("charts")
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('30')

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Sidebar />

      <div className="flex-1">
        <DashboardHeader />

        <main className="p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="mb-3">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Analytics</h1>
              <p className="text-sm text-slate-600 font-medium">
                {selectedCampaignId || selectedWorkspaceId 
                  ? `${selectedCampaignId ? 'Campaign' : ''}${selectedCampaignId && selectedWorkspaceId ? ' & ' : ''}${selectedWorkspaceId ? 'Workspace' : ''}-specific insights` 
                  : 'Comprehensive performance insights'}
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-4 mb-8 flex-wrap">
            <DateRangeFilter 
              selectedRange={selectedDateRange}
              onRangeChange={setSelectedDateRange}
            />

            <CampaignFilter 
              selectedCampaignId={selectedCampaignId}
              onCampaignChange={setSelectedCampaignId}
              workspaceId={selectedWorkspaceId}
            />

            <WorkspaceFilter 
              selectedWorkspaceId={selectedWorkspaceId}
              onWorkspaceChange={setSelectedWorkspaceId}
            />
          </div>

          {/* Active Filters */}
          {(selectedCampaignId || selectedWorkspaceId) && (
            <div className="mb-8">
              <p className="text-sm text-slate-600 font-medium bg-indigo-50/50 px-4 py-3 rounded-xl border border-indigo-100">
                Showing data for {selectedCampaignId && 'selected campaign'}{selectedCampaignId && selectedWorkspaceId && ' and '}{selectedWorkspaceId && 'selected workspace'}
              </p>
            </div>
          )}

          {/* Metric Cards */}
          <MetricCards campaignId={selectedCampaignId} workspaceId={selectedWorkspaceId} dateRange={selectedDateRange} />

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setSelectedTab("charts")}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                selectedTab === "charts"
                  ? "bg-white shadow-md border border-slate-200 text-slate-800"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              Charts & Trends
            </button>
            <button
              onClick={() => setSelectedTab("breakdown")}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                selectedTab === "breakdown"
                  ? "bg-white shadow-md border border-slate-200 text-slate-800"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              Campaign Breakdown
            </button>
          </div>

          {/* Content Sections */}
          {selectedTab === "charts" && <PerformanceChart campaignId={selectedCampaignId} workspaceId={selectedWorkspaceId} dateRange={selectedDateRange} />}
          {selectedTab === "breakdown" && <CampaignBreakdown campaignId={selectedCampaignId} workspaceId={selectedWorkspaceId} dateRange={selectedDateRange} />}
        </main>
      </div>
    </div>
  )
}