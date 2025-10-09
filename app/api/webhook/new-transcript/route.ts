import { NextResponse } from 'next/server'
import { processNewTranscriptForAnalytics } from '@/lib/analytics-utils'

// Webhook endpoint to handle new transcript notifications
export async function POST(request: Request) {
  try {
    //////console.log('🔔 Webhook: New transcript notification received')
    
    const body = await request.json()
    const { transcriptId, timestampId, action } = body
    
    // Validate required fields
    if (!transcriptId || !timestampId) {
      console.error('❌ Webhook: Missing required fields (transcriptId, timestampId)')
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: transcriptId and timestampId are required' 
      }, { status: 400 })
    }
    
    // Only process 'created' actions
    if (action !== 'created') {
      //////console.log(`ℹ️ Webhook: Ignoring action '${action}' for transcript ${transcriptId}/${timestampId}`)
      return NextResponse.json({ 
        success: true, 
        message: `Action '${action}' ignored` 
      })
    }
    
    ////////console.log(`🎯 Webhook: Processing new transcript ${transcriptId}/${timestampId}`)
    
    // Process the new transcript for analytics
    const result = await processNewTranscriptForAnalytics(transcriptId, timestampId)
    
    if (result.success) {
      ////////console.log(`✅ Webhook: Successfully processed transcript ${transcriptId}/${timestampId}`)
    } else {
      console.error(`❌ Webhook: Failed to process transcript ${transcriptId}/${timestampId}: ${result.message}`)
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown webhook error' 
    }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'New transcript webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  })
}