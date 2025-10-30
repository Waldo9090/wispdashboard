"use client"

import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Zap, Mail, MousePointerClick, UserPlus, DollarSign, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

export function AttributionFeedPage() {
  const events = [
    {
      type: "conversion",
      icon: DollarSign,
      title: "Deal Closed",
      description: "Acme Corp signed a $50,000 annual contract",
      client: "Acme Corp",
      campaign: "Enterprise Outreach Q4",
      time: "5 minutes ago",
      value: "$50,000",
      color: "green",
    },
    {
      type: "meeting",
      icon: CheckCircle,
      title: "Meeting Scheduled",
      description: "Demo call booked with TechStart Inc",
      client: "TechStart Inc",
      campaign: "Product Demo Series",
      time: "1 hour ago",
      color: "blue",
    },
    {
      type: "click",
      icon: MousePointerClick,
      title: "Link Clicked",
      description: "Clicked on pricing page link",
      client: "Global Solutions",
      campaign: "Pricing Campaign",
      time: "2 hours ago",
      color: "purple",
    },
    {
      type: "reply",
      icon: Mail,
      title: "Positive Reply",
      description: "Interested in learning more about features",
      client: "Innovation Labs",
      campaign: "Feature Announcement",
      time: "3 hours ago",
      color: "blue",
    },
    {
      type: "signup",
      icon: UserPlus,
      title: "Trial Started",
      description: "Digital Ventures signed up for 14-day trial",
      client: "Digital Ventures",
      campaign: "Free Trial Offer",
      time: "5 hours ago",
      color: "green",
    },
    {
      type: "click",
      icon: MousePointerClick,
      title: "Link Clicked",
      description: "Clicked on case study link",
      client: "Future Tech",
      campaign: "Case Study Campaign",
      time: "6 hours ago",
      color: "purple",
    },
    {
      type: "reply",
      icon: Mail,
      title: "Reply Received",
      description: "Requested more information about implementation",
      client: "Smart Systems",
      campaign: "Implementation Guide",
      time: "Yesterday",
      color: "blue",
    },
    {
      type: "meeting",
      icon: CheckCircle,
      title: "Meeting Completed",
      description: "Discovery call with Cloud Innovations",
      client: "Cloud Innovations",
      campaign: "Discovery Calls",
      time: "Yesterday",
      color: "blue",
    },
  ]

  const getIconColor = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-100 text-green-600"
      case "blue":
        return "bg-blue-100 text-blue-600"
      case "purple":
        return "bg-purple-100 text-purple-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">
        <DashboardHeader />

        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5" />
              <h1 className="text-2xl font-semibold">Attribution Feed</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Track every interaction and conversion across your campaigns
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">$127K</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">23</div>
              <div className="text-sm text-muted-foreground">Conversions</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">156</div>
              <div className="text-sm text-muted-foreground">Meetings Booked</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">1,247</div>
              <div className="text-sm text-muted-foreground">Link Clicks</div>
            </Card>
          </div>

          {/* Event Feed */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className={`p-2 rounded-lg ${getIconColor(event.color)}`}>
                    <event.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      {event.value && <div className="text-lg font-bold text-green-600">{event.value}</div>}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">{event.client}</span>
                      <span>·</span>
                      <span>{event.campaign}</span>
                      <span>·</span>
                      <span>{event.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
