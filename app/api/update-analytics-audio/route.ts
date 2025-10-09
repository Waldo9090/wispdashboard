import { NextResponse } from 'next/server'
import { updateAnalyticsWithAudioURL } from '@/lib/analytics-utils'

export async function POST() {
  try {
    console.log('🔄 Starting analytics audioURL and speakerTranscript update via API...')
    
    await updateAnalyticsWithAudioURL()
    
    console.log('✅ Analytics audioURL and speakerTranscript update completed successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Analytics audioURL and speakerTranscript update completed successfully' 
    })
    
  } catch (error) {
    console.error('❌ Error in analytics update API:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 })
  }
} 