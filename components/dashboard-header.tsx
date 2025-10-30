"use client"

import { Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
      router.push('/signin')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-sm">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-500">
              <rect x="2" y="2" width="5" height="5" fill="currentColor" rx="1" />
              <rect x="9" y="2" width="5" height="5" fill="currentColor" rx="1" />
              <rect x="2" y="9" width="5" height="5" fill="currentColor" rx="1" />
              <rect x="9" y="9" width="5" height="5" fill="currentColor" rx="1" />
            </svg>
          </button>
          <span className="text-slate-500 font-medium">Dashboard</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-800">Analytics</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>Welcome, {user.displayName || user.email}</span>
            </div>
          )}

          {/* Icons */}
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900">
            <Bell className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900">
            <User className="w-5 h-5" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl hover:bg-red-100 text-slate-600 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
