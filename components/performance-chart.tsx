"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, MessageSquare, ThumbsUp, Users, Loader2 } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useInstantlyDailyData } from "@/hooks/use-instantly-analytics"

interface PerformanceChartProps {
  campaignId?: string | null
  workspaceId?: string | null
  dateRange?: string
}

type MetricType = 'sent' | 'opened' | 'replies' | 'clicks'

const metricConfig = {
  sent: {
    label: 'Emails Sent',
    icon: Mail,
    color: '#3b82f6',
    dataKey: 'sent'
  },
  opened: {
    label: 'Opens',
    icon: Mail,
    color: '#10b981',
    dataKey: 'unique_opened'
  },
  replies: {
    label: 'Replies',
    icon: MessageSquare,
    color: '#f59e0b',
    dataKey: 'unique_replies'
  },
  clicks: {
    label: 'Clicks',
    icon: Users,
    color: '#ef4444',
    dataKey: 'unique_clicks'
  }
}

export function PerformanceChart({ campaignId, workspaceId, dateRange }: PerformanceChartProps) {
  const { data: dailyData, loading, error } = useInstantlyDailyData(campaignId, workspaceId)
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('sent')

  const currentMetric = metricConfig[selectedMetric]

  // Format data for the chart
  const chartData = dailyData.map(day => {
    const formattedDate = new Date(day.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
    return {
      date: formattedDate,
      value: day[currentMetric.dataKey as keyof typeof day] || 0,
      fullDate: day.date
    }
  })

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading performance data...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Unable to load performance data</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!dailyData || dailyData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No performance data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              {campaignId ? 'No data for selected campaign' : 'No campaign data found'}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Campaign Performance Overview</h2>
          <p className="text-sm text-muted-foreground">
            {campaignId ? 'Track selected campaign metrics over time' : 'Track your email campaign metrics over time'}
          </p>
        </div>

        {/* Metric Selection Buttons */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(metricConfig).map(([key, config]) => {
            const IconComponent = config.icon
            const isSelected = selectedMetric === key
            return (
              <Button
                key={key}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`gap-2 ${!isSelected ? 'bg-transparent' : ''}`}
                onClick={() => setSelectedMetric(key as MetricType)}
              >
                <IconComponent className="w-4 h-4" />
                {config.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`color${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="text-sm font-medium mb-1">{payload[0].payload.date}</p>
                      <p className="text-sm" style={{ color: currentMetric.color }}>
                        {currentMetric.label}: <span className="font-semibold">{payload[0].value?.toLocaleString()}</span>
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={currentMetric.color}
              strokeWidth={2}
              fill={`url(#color${selectedMetric})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}