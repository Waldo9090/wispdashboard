import { NextResponse } from 'next/server'
import { syncNewTranscriptsToAnalytics, processNewTranscriptForAnalytics } from '@/lib/analytics-utils'

export async function POST(request: Request) {
  try {
    //console.log('🔄 Starting new transcript sync to analytics...')
    
    const body = await request.json().catch(() => ({}))
    
    // Check if this is a single transcript sync request
    if (body.transcriptId && body.timestampId) {
      ////console.log(`🎯 Processing single transcript: ${body.transcriptId}/${body.timestampId}`)
      
      const result = await processNewTranscriptForAnalytics(body.transcriptId, body.timestampId)
      
      if (result.success) {
        ////console.log(`✅ Successfully processed single transcript: ${body.transcriptId}/${body.timestampId}`)
      } else {
        console.error(`❌ Failed to process single transcript: ${result.message}`)
      }
      
      return NextResponse.json(result)
    }
    
    // Otherwise, sync all new transcripts
    const result = await syncNewTranscriptsToAnalytics()
    
    if (result.success) {
      ////console.log(`✅ New transcript sync completed: ${result.processedCount} processed`)
    } else {
      console.error(`❌ New transcript sync failed: ${result.message}`)
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Error in new transcript sync API:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    ////console.log('🔍 Checking for new transcripts to sync...')
    
    const result = await syncNewTranscriptsToAnalytics()
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Error checking new transcripts:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 })
  }
}