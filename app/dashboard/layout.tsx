"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, MessageSquare, Link as LinkIcon, Settings, Bot, X, GripVertical, Sparkles, FileText, CheckSquare, BarChart3, Workflow, ActivitySquare } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useAuth } from "@/context/auth-context"

const sidebarItems = [
  { icon: ActivitySquare, label: "Activity", href: "/dashboard/activity" as const },
  { icon: BarChart3, label: "Trackers", href: "/dashboard/trackers" as const },
  { icon: Sparkles, label: "Insights", href: "/dashboard/insights" as const },
  // { icon: MessageSquare, label: "Chat", href: "/dashboard/chat" as const },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Image 
              src="/logocandyprob.png"
              alt="Wisp AI Logo"
              width={32}
              height={32}
              className="rounded-lg object-contain"
            />
            <span className="text-lg font-semibold text-foreground">WISP AI</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-gray-100 text-gray-900 border border-gray-200" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div 
            className="w-full flex items-center justify-start text-muted-foreground text-sm cursor-pointer hover:text-foreground transition-colors"
            onClick={() => router.push('/')}
          >
            {user?.email || 'user@example.com'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}