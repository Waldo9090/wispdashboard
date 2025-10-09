'use client'

import { FileX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TranscriptNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-lg shadow-sm border border-border">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <FileX className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Transcript not found</h2>
          <p className="text-sm text-muted-foreground">
            The transcript you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/dashboard/activity">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Activity
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}