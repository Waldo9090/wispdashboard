"use client"

import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Zap, Play, Pause, Edit, Trash2, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function AutoRespondersPage() {
  const responders = [
    {
      name: "Welcome Series",
      status: "active",
      emails: 5,
      triggers: "New lead signup",
      sent: 1247,
      opened: 892,
      clicked: 234,
      replied: 45,
    },
    {
      name: "Follow-up Sequence",
      status: "active",
      emails: 3,
      triggers: "No reply after 3 days",
      sent: 856,
      opened: 623,
      clicked: 178,
      replied: 67,
    },
    {
      name: "Re-engagement Campaign",
      status: "paused",
      emails: 4,
      triggers: "Inactive for 30 days",
      sent: 432,
      opened: 198,
      clicked: 45,
      replied: 12,
    },
    {
      name: "Product Demo Series",
      status: "active",
      emails: 6,
      triggers: "Demo request submitted",
      sent: 567,
      opened: 489,
      clicked: 312,
      replied: 89,
    },
    {
      name: "Pricing Inquiry Response",
      status: "active",
      emails: 2,
      triggers: "Pricing page visited",
      sent: 234,
      opened: 187,
      clicked: 98,
      replied: 34,
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1">
        <DashboardHeader />

        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5" />
                  <h1 className="text-2xl font-semibold">Auto Responders</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automated email sequences that nurture leads and drive conversions
                </p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Responder
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">5</div>
              <div className="text-sm text-muted-foreground">Active Responders</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">3,336</div>
              <div className="text-sm text-muted-foreground">Total Emails Sent</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">68.4%</div>
              <div className="text-sm text-muted-foreground">Avg Open Rate</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">7.4%</div>
              <div className="text-sm text-muted-foreground">Avg Reply Rate</div>
            </Card>
          </div>

          {/* Responders List */}
          <Card className="p-6">
            <div className="space-y-4">
              {responders.map((responder, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{responder.name}</h3>
                        <Badge variant={responder.status === "active" ? "default" : "secondary"}>
                          {responder.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{responder.emails} emails</span>
                        <span>·</span>
                        <span>Trigger: {responder.triggers}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        {responder.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-3 border-t">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Sent</div>
                      <div className="text-lg font-semibold">{responder.sent.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Opened</div>
                      <div className="text-lg font-semibold">
                        {responder.opened.toLocaleString()}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({((responder.opened / responder.sent) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Clicked</div>
                      <div className="text-lg font-semibold">
                        {responder.clicked.toLocaleString()}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({((responder.clicked / responder.sent) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Replied</div>
                      <div className="text-lg font-semibold">
                        {responder.replied.toLocaleString()}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({((responder.replied / responder.sent) * 100).toFixed(1)}%)
                        </span>
                      </div>
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
