"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { MetricCards } from "@/components/metric-cards"
import { PerformanceChart } from "@/components/performance-chart"
import { CampaignFilter } from "@/components/campaign-filter"
import { TrendingUp } from "lucide-react"

export function AnalyticsDashboard() {
  const [selectedTab, setSelectedTab] = useState("charts")
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">
        <DashboardHeader />

        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <h1 className="text-2xl font-semibold">Analytics</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedCampaignId ? 'Campaign-specific' : 'Combined campaign'} performance insights
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
              <span className="text-sm">Last 30 days</span>
            </div>

            <CampaignFilter 
              selectedCampaignId={selectedCampaignId}
              onCampaignChange={setSelectedCampaignId}
            />
          </div>

          {/* Active Filters */}
          {selectedCampaignId && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Showing data for selected campaign
              </p>
            </div>
          )}

          {/* Metric Cards */}
          <MetricCards campaignId={selectedCampaignId} />

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setSelectedTab("charts")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === "charts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Charts & Trends
            </button>
            <button
              onClick={() => setSelectedTab("client")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === "client"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Client Summary
            </button>
            <button
              onClick={() => setSelectedTab("performance")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === "performance"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setSelectedTab("breakdown")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === "breakdown"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Campaign Breakdown
            </button>
          </div>

          {/* Chart Section */}
          {selectedTab === "charts" && <PerformanceChart campaignId={selectedCampaignId} />}
        </main>
      </div>
    </div>
  )
}