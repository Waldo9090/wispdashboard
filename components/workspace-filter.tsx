'use client'

import { useState, useEffect } from "react"
import { ChevronDown, Check, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InstantlyWorkspace } from "@/lib/instantly-api"

interface WorkspaceFilterProps {
  selectedWorkspaceId: string | null
  onWorkspaceChange: (workspaceId: string | null) => void
}

export function WorkspaceFilter({ selectedWorkspaceId, onWorkspaceChange }: WorkspaceFilterProps) {
  const [workspaces, setWorkspaces] = useState<InstantlyWorkspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/instantly/workspaces')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch workspaces')
        }
        
        const workspaceData = await response.json()
        setWorkspaces(workspaceData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workspaces')
        console.error('Failed to fetch workspaces:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [])

  const selectedWorkspace = workspaces.find(w => w.workspace_id === selectedWorkspaceId)

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm">
        <span className="text-sm text-slate-600 font-medium">Loading workspaces...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl shadow-sm">
        <span className="text-sm text-red-600 font-medium">Failed to load workspaces</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[220px] bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all duration-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">
              {selectedWorkspace ? selectedWorkspace.workspace_name : 'All Workspaces'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl rounded-xl">
        {/* All Workspaces Option */}
        <DropdownMenuItem
          onClick={() => onWorkspaceChange(null)}
          className="flex items-center justify-between p-4 hover:bg-indigo-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-slate-600" />
            <div>
              <p className="font-medium text-slate-800">All Workspaces</p>
              <p className="text-xs text-slate-500 font-medium">
                Combined analytics from all workspaces
              </p>
            </div>
          </div>
          {!selectedWorkspaceId && <Check className="w-4 h-4 text-indigo-600" />}
        </DropdownMenuItem>

        {/* Individual Workspaces */}
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.workspace_id}
            onClick={() => onWorkspaceChange(workspace.workspace_id)}
            className="flex items-center justify-between p-4 hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shadow-sm ${
                workspace.workspace_status === 1 ? 'bg-green-500' : 'bg-slate-400'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 truncate">{workspace.workspace_name}</p>
                <p className="text-xs text-slate-500 font-medium">
                  Status: {workspace.workspace_status === 1 ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            {selectedWorkspaceId === workspace.workspace_id && <Check className="w-4 h-4 text-indigo-600" />}
          </DropdownMenuItem>
        ))}

        {workspaces.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500 font-medium">
            No workspaces found
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}