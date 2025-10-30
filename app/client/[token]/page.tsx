"use client"

import { useState, useEffect } from "react"
import { ClientMetricCards } from "@/components/client-metric-cards"
import { ClientPerformanceChart } from "@/components/client-performance-chart"
import { ClientCampaignBreakdown } from "@/components/client-campaign-breakdown"
import { DateRangeFilter, type DateRange } from "@/components/date-range-filter"
import { getClientConfig, type ClientConfig } from "@/lib/client-access-config"

// Helper functions for date ranges
function getDateRangeStart(range: DateRange): string {
  const today = new Date()
  const days = parseInt(range.toString())
  const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000))
  return startDate.toISOString().split('T')[0]
}

function getDateRangeEnd(): string {
  return new Date().toISOString().split('T')[0]
}

interface ClientDashboardProps {
  params: {
    token: string
  }
}

export default function ClientDashboard({ params }: ClientDashboardProps) {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('30')
  const [campaignConfig, setCampaignConfig] = useState<ClientConfig | null>(null)
  const [selectedTab, setSelectedTab] = useState("overview")

  useEffect(() => {
    const config = getClientConfig(params.token)
    if (config) {
      setCampaignConfig(config)
    }
  }, [params.token])

  if (!campaignConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Access Not Found</h1>
          <p className="text-slate-600">The dashboard link you're looking for doesn't exist or has been disabled.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
            {campaignConfig.name} Dashboard
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            Real-time email campaign analytics and performance insights
          </p>
        </div>

        {/* Date Filter */}
        <div className="mb-8">
          <DateRangeFilter 
            selectedRange={selectedDateRange}
            onRangeChange={setSelectedDateRange}
          />
        </div>

        {/* Metrics */}
        <div className="mb-8">
          <ClientMetricCards 
            campaignName={campaignConfig.campaignId}
            workspaceId={campaignConfig.workspaceId}
            startDate={getDateRangeStart(selectedDateRange)}
            endDate={getDateRangeEnd()}
          />
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setSelectedTab("overview")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              selectedTab === "overview"
                ? "bg-white shadow-md border border-slate-200 text-slate-800"
                : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            Overview
          </button>
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
        {selectedTab === "overview" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Campaign Analytics Overview</h2>
            <p className="text-slate-600 text-sm">
              Real-time analytics for your email campaign performance. 
              Data is updated regularly throughout the day.
            </p>
            {campaignConfig.description && (
              <p className="text-slate-500 text-xs mt-4 italic">
                {campaignConfig.description}
              </p>
            )}
          </div>
        )}

        {selectedTab === "charts" && (
          <div className="space-y-6">
            <ClientPerformanceChart 
              campaignName={campaignConfig.campaignId}
              workspaceId={campaignConfig.workspaceId}
              dateRange={selectedDateRange}
            />
          </div>
        )}

        {selectedTab === "breakdown" && (
          <div className="space-y-6">
            <ClientCampaignBreakdown 
              campaignName={campaignConfig.campaignId}
              workspaceId={campaignConfig.workspaceId}
              dateRange={selectedDateRange}
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>Dashboard powered by Analytics Platform</p>
        </div>
      </div>
    </div>
  )
}