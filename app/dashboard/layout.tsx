"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, MessageSquare, Link as LinkIcon, Settings, Bot, X, GripVertical, Sparkles, FileText, CheckSquare, BarChart3, Workflow, ActivitySquare, UserPlus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useAuth } from "@/context/auth-context"
import { useState, useEffect } from "react"
import { InviteUsersModal } from "@/components/InviteUsersModal"
import { Button } from "@/components/ui/button"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const sidebarItems = [
  { icon: ActivitySquare, label: "Activity", href: "/dashboard/activity" as const },
  { icon: BarChart3, label: "Word Trackers", href: "/dashboard/trackers" as const },
  { icon: Sparkles, label: "Smart Trackers", href: "/dashboard/insights" as const },
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [currentUserStatus, setCurrentUserStatus] = useState<string | null>(null)

  // Load current user status to check if they can see the Add button
  useEffect(() => {
    const loadCurrentUserStatus = async () => {
      if (!user?.email) return
      
      try {
        const userDocRef = doc(db, 'authorizedUsers', user.email.toLowerCase())
        const userSnap = await getDoc(userDocRef)
        
        if (userSnap.exists()) {
          setCurrentUserStatus(userSnap.data().status || null)
        }
      } catch (error) {
        console.error('Error loading current user status:', error)
      }
    }

    loadCurrentUserStatus()
  }, [user])

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Image
              src="/logocandyprob.png"
              alt="candytrail"
              width={32}
              height={32}
              className="w-auto h-8"
              priority
            />
            <span className="text-lg font-semibold text-foreground">candytrail</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems
              .filter(item => {
                // Hide Word Trackers and Smart Trackers for nurses
                if (currentUserStatus === 'nurse') {
                  return item.label !== 'Word Trackers' && item.label !== 'Smart Trackers'
                }
                return true
              })
              .map((item, index) => {
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

        {/* Only show Add button if user is not a nurse */}
        {currentUserStatus !== 'nurse' && (
          <div className="p-4 space-y-3">
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              variant="outline"
              size="sm"
              className="w-full flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
        )}
        
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

      {/* Invite Users Modal */}
      <InviteUsersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  )
}