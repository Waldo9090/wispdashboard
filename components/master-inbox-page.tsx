"use client"

import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Inbox, Search, Star, Archive, Trash2, MoreVertical } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function MasterInboxPage() {
  const [selectedEmail, setSelectedEmail] = useState(0)

  const emails = [
    {
      id: 1,
      from: "John Smith",
      company: "Acme Corp",
      subject: "Re: Partnership Opportunity",
      preview: "Thanks for reaching out! I'd love to discuss this further...",
      time: "10:30 AM",
      unread: true,
      starred: true,
      sentiment: "positive",
    },
    {
      id: 2,
      from: "Sarah Johnson",
      company: "TechStart Inc",
      subject: "Re: Product Demo Request",
      preview: "I'm interested in seeing a demo. When are you available?",
      time: "9:15 AM",
      unread: true,
      starred: false,
      sentiment: "positive",
    },
    {
      id: 3,
      from: "Mike Chen",
      company: "Global Solutions",
      subject: "Re: Pricing Information",
      preview: "Could you send me more details about your pricing tiers?",
      time: "Yesterday",
      unread: false,
      starred: false,
      sentiment: "neutral",
    },
    {
      id: 4,
      from: "Emily Davis",
      company: "Innovation Labs",
      subject: "Not interested",
      preview: "Please remove me from your mailing list.",
      time: "Yesterday",
      unread: false,
      starred: false,
      sentiment: "negative",
    },
    {
      id: 5,
      from: "Robert Wilson",
      company: "Digital Ventures",
      subject: "Re: Collaboration Proposal",
      preview: "This looks interesting. Let's schedule a call next week.",
      time: "2 days ago",
      unread: false,
      starred: true,
      sentiment: "positive",
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
            <div className="flex items-center gap-2 mb-2">
              <Inbox className="w-5 h-5" />
              <h1 className="text-2xl font-semibold">Master Inbox</h1>
            </div>
            <p className="text-sm text-muted-foreground">Manage all your campaign responses in one place</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Email List */}
            <Card className="lg:col-span-1 p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search emails..." className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                {emails.map((email, index) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedEmail === index ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                    } ${email.unread ? "bg-blue-50/30" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            email.sentiment === "positive"
                              ? "bg-green-500"
                              : email.sentiment === "negative"
                                ? "bg-red-500"
                                : "bg-gray-400"
                          }`}
                        />
                        <span className={`text-sm font-medium ${email.unread ? "font-semibold" : ""}`}>
                          {email.from}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {email.starred && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                        <span className="text-xs text-muted-foreground">{email.time}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{email.company}</div>
                    <div className={`text-sm mb-1 ${email.unread ? "font-medium" : ""}`}>{email.subject}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{email.preview}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Email Content */}
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-lg font-semibold mb-1">{emails[selectedEmail].subject}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{emails[selectedEmail].from}</span>
                    <span>·</span>
                    <span>{emails[selectedEmail].company}</span>
                    <span>·</span>
                    <span>{emails[selectedEmail].time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-sm leading-relaxed">
                  Hi there,
                  <br />
                  <br />
                  {emails[selectedEmail].preview}
                  <br />
                  <br />
                  I've reviewed your proposal and I think there's definitely potential for us to work together. Our team
                  has been looking for a solution like yours for quite some time now.
                  <br />
                  <br />
                  Would you be available for a call next Tuesday or Wednesday? I'd like to discuss the implementation
                  timeline and pricing in more detail.
                  <br />
                  <br />
                  Looking forward to hearing from you.
                  <br />
                  <br />
                  Best regards,
                  <br />
                  {emails[selectedEmail].from}
                  <br />
                  {emails[selectedEmail].company}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button className="w-full">Reply</Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
