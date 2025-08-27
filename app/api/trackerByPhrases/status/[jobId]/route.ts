import { NextRequest, NextResponse } from 'next/server'

// Import the getJob function from the main route
// We'll use a global map to share job state between routes
declare global {
  var jobStorage: Map<string, any> | undefined
}

// Initialize global job storage
if (!global.jobStorage) {
  global.jobStorage = new Map()
}

/**
 * Get job status and results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  console.log(`🔍 Checking job status: ${jobId}`)
  
  try {
    const job = global.jobStorage?.get(jobId)
    
    if (!job) {
      console.log(`❌ Job not found: ${jobId}`)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    console.log(`📊 Job ${jobId}: ${job.status} (${job.progress?.percentage || 0}%)`)

    // Calculate estimated time remaining
    let estimatedTimeRemaining
    if (job.status === 'processing' && job.progress?.total > 0) {
      const elapsed = job.startedAt ? Date.now() - job.startedAt.getTime() : 0
      const avgTimePerBatch = elapsed / Math.max(job.progress.completed, 1)
      const remaining = (job.progress.total - job.progress.completed) * avgTimePerBatch
      
      const seconds = Math.floor(remaining / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      if (hours > 0) estimatedTimeRemaining = `${hours}h ${minutes % 60}m`
      else if (minutes > 0) estimatedTimeRemaining = `${minutes}m ${seconds % 60}s`
      else estimatedTimeRemaining = `${seconds}s`
    }

    // Return job status and results (if completed)
    const response = {
      jobId: job.id,
      status: job.status,
      progress: job.progress || { completed: 0, total: 0, percentage: 0 },
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      estimatedTimeRemaining,
      error: job.error,
      
      // Include results if completed, or partial results if in progress
      ...(job.status === 'completed' && {
        success: true,
        classifiedTranscript: job.results || [],
        totalSentences: job.results?.length || 0,
        extractionMethod: 'openai-sentence-classification'
      }),

      // Include partial results for progress tracking
      ...(job.status === 'processing' && job.results && job.results.length > 0 && {
        partialResults: job.results.length,
        previewResults: job.results.slice(-5) // Last 5 results for preview
      })
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error(`💥 Error checking job ${jobId}:`, error)
    return NextResponse.json(
      { 
        error: 'Failed to check job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}