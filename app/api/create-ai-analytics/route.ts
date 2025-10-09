import { NextResponse } from 'next/server'
import { createAIAnalyticsFromTranscripts } from '@/lib/ai-analytics-utils'

export async function POST() {
  try {
    ////console.log('🤖 Starting AI-powered analytics creation...')
    
    const result = await createAIAnalyticsFromTranscripts()
    
    if (result.success) {
      ////console.log('✅ AI analytics creation completed successfully')
      return NextResponse.json({ 
        success: true, 
        message: result.message 
      })
    } else {
      console.error('❌ AI analytics creation failed:', result.message)
      return NextResponse.json({ 
        success: false, 
        message: result.message 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error in AI analytics creation API:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 })
  }
} 