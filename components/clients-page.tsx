"use client"

import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Users, Search, Plus, Mail, TrendingUp, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ClientsPage() {
  const clients = [
    {
      name: "Acme Corp",
      contact: "John Smith",
      email: "john@acmecorp.com",
      status: "active",
      campaigns: 3,
      emailsSent: 45,
      replies: 8,
      replyRate: "17.8%",
      lastContact: "2 hours ago",
      value: "$50,000",
    },
    {
      name: "TechStart Inc",
      contact: "Sarah Johnson",
      email: "sarah@techstart.com",
      status: "active",
      campaigns: 2,
      emailsSent: 32,
      replies: 5,
      replyRate: "15.6%",
      lastContact: "1 day ago",
      value: "$25,000",
    },
    {
      name: "Global Solutions",
      contact: "Mike Chen",
      email: "mike@globalsolutions.com",
      status: "nurturing",
      campaigns: 4,
      emailsSent: 67,
      replies: 12,
      replyRate: "17.9%",
      lastContact: "3 days ago",
      value: "$75,000",
    },
    {
      name: "Innovation Labs",
      contact: "Emily Davis",
      email: "emily@innovationlabs.com",
      status: "active",
      campaigns: 1,
      emailsSent: 23,
      replies: 6,
      replyRate: "26.1%",
      lastContact: "5 hours ago",
      value: "$35,000",
    },
    {
      name: "Digital Ventures",
      contact: "Robert Wilson",
      email: "robert@digitalventures.com",
      status: "trial",
      campaigns: 2,
      emailsSent: 28,
      replies: 4,
      replyRate: "14.3%",
      lastContact: "1 week ago",
      value: "$15,000",
    },
    {
      name: "Future Tech",
      contact: "Lisa Anderson",
      email: "lisa@futuretech.com",
      status: "active",
      campaigns: 3,
      emailsSent: 51,
      replies: 9,
      replyRate: "17.6%",
      lastContact: "Yesterday",
      value: "$45,000",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700"
      case "nurturing":
        return "bg-blue-100 text-blue-700"
      case "trial":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
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
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5" />
                  <h1 className="text-2xl font-semibold">Clients</h1>
                </div>
                <p className="text-sm text-muted-foreground">Manage your client relationships and track engagement</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">156</div>
              <div className="text-sm text-muted-foreground">Total Clients</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">124</div>
              <div className="text-sm text-muted-foreground">Active Clients</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">$1.2M</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold mb-1">18.2%</div>
              <div className="text-sm text-muted-foreground">Avg Reply Rate</div>
            </Card>
          </div>

          {/* Search */}
          <Card className="p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search clients..." className="pl-9" />
            </div>
          </Card>

          {/* Clients Table */}
          <Card className="p-6">
            <div className="space-y-4">
              {clients.map((client, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                        <span className="text-lg font-bold text-green-600">{client.value}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{client.contact}</span>
                        <span>·</span>
                        <span>{client.email}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </div>

                  <div className="grid grid-cols-5 gap-4 pt-3 border-t">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Campaigns</div>
                      <div className="text-lg font-semibold">{client.campaigns}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Emails Sent</div>
                      <div className="text-lg font-semibold">{client.emailsSent}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Replies</div>
                      <div className="text-lg font-semibold">{client.replies}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Reply Rate</div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-semibold">{client.replyRate}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Last Contact</div>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{client.lastContact}</span>
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
