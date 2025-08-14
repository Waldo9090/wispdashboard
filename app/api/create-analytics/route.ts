import { NextRequest, NextResponse } from 'next/server'
import { createAnalyticsFromTranscripts } from '@/lib/analytics-utils'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    logger.info('=== ANALYTICS CREATION API ROUTE STARTED ===')
    logger.info('Request received to create analytics collection')
    
    const result = await createAnalyticsFromTranscripts()
    
    logger.info('Analytics creation completed via API route')
    logger.info('Result:', result)
    
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error in analytics creation API route:', error)
    return NextResponse.json(
      { success: false, message: 'Server error during analytics creation', error: error },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    logger.info('=== ANALYTICS STATUS CHECK API ROUTE ===')
    
    // This could be used to check the status of analytics creation
    return NextResponse.json({ 
      success: true, 
      message: 'Analytics creation API is available',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error in analytics status check:', error)
    return NextResponse.json(
      { success: false, message: 'Server error', error: error },
      { status: 500 }
    )
  }
} 