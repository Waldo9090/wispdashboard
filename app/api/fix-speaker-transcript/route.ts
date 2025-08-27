import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST() {
  try {
    ////console.log('🔧 Starting speaker transcript field fix...')
    
    // Get all analytics documents
    const analyticsRef = adminDb.collection('analytics')
    const analyticsSnap = await analyticsRef.get()
    
    let fixedCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    ////console.log(`📊 Processing ${analyticsSnap.size} analytics documents...`)
    
    for (const analyticsDoc of analyticsSnap.docs) {
      if (analyticsDoc.id === 'document_analyses') {
        skippedCount++
        continue // Skip the index document
      }
      
      try {
        const analyticsData = analyticsDoc.data()
        
        // Check if speakerTranscript is empty or missing
        const currentSpeakerTranscript = analyticsData.speakerTranscript || []
        
        if (currentSpeakerTranscript.length === 0) {
          ////console.log(`🔧 Fixing document: ${analyticsDoc.id}`)
          
          // Extract transcript and timestamp IDs from the fullPath
          const fullPath = analyticsData.fullPath
          if (!fullPath) {
            console.warn(`⚠️ No fullPath found for ${analyticsDoc.id}`)
            continue
          }
          
          // Parse fullPath: "transcript/transcriptId/timestamps/timestampId"
          const pathParts = fullPath.split('/')
          if (pathParts.length !== 4) {
            console.warn(`⚠️ Invalid fullPath format for ${analyticsDoc.id}: ${fullPath}`)
            continue
          }
          
          const transcriptId = pathParts[1]
          const timestampId = pathParts[3]
          
          //////console.log(`📋 Fetching speaker transcript from: ${transcriptId}/${timestampId}`)
          
          // Get the original transcript data
          const timestampRef = adminDb.collection('transcript').doc(transcriptId).collection('timestamps').doc(timestampId)
          const timestampSnap = await timestampRef.get()
          
          if (!timestampSnap.exists) {
            console.warn(`⚠️ Timestamp document not found: ${transcriptId}/${timestampId}`)
            continue
          }
          
          const timestampData = timestampSnap.data()
          
          // Try to get speaker transcript with correct field name
          const speakerTranscript = timestampData['speaker transcript'] || timestampData.speakerTranscript || []
          
          if (speakerTranscript.length > 0) {
            //////console.log(`✅ Found ${speakerTranscript.length} speaker entries, updating analytics document`)
            
            // Update the analytics document with the correct speaker transcript
            await analyticsRef.doc(analyticsDoc.id).update({
              speakerTranscript: speakerTranscript
            })
            
            fixedCount++
            //////console.log(`✅ Fixed document: ${analyticsDoc.id}`)
          } else {
            //////console.log(`ℹ️ No speaker transcript found in source document: ${analyticsDoc.id}`)
            skippedCount++
          }
        } else {
          //////console.log(`✓ Document ${analyticsDoc.id} already has speaker transcript (${currentSpeakerTranscript.length} entries)`)
          skippedCount++
        }
        
      } catch (error) {
        console.error(`❌ Error processing document ${analyticsDoc.id}:`, error)
        errorCount++
      }
    }
    
    //////console.log(`🎉 Speaker transcript fix completed:`)
    ////console.log(`  - Fixed: ${fixedCount} documents`)
    ////console.log(`  - Skipped: ${skippedCount} documents`)
    ////console.log(`  - Errors: ${errorCount} documents`)
    
    return NextResponse.json({
      success: true,
      fixedCount,
      skippedCount,
      errorCount,
      message: `Fixed ${fixedCount} analytics documents with missing speaker transcript data`
    })
    
  } catch (error) {
    console.error('❌ Error in speaker transcript fix:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    ////console.log('🔍 Checking analytics documents for speaker transcript issues...')
    
    // Get all analytics documents
    const analyticsRef = adminDb.collection('analytics')
    const analyticsSnap = await analyticsRef.get()
    
    let needsFixCount = 0
    let hasDataCount = 0
    let indexCount = 0
    
    for (const analyticsDoc of analyticsSnap.docs) {
      if (analyticsDoc.id === 'document_analyses') {
        indexCount++
        continue // Skip the index document
      }
      
      const analyticsData = analyticsDoc.data()
      const currentSpeakerTranscript = analyticsData.speakerTranscript || []
      
      if (currentSpeakerTranscript.length === 0) {
        needsFixCount++
      } else {
        hasDataCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      totalDocuments: analyticsSnap.size,
      needsFixCount,
      hasDataCount,
      indexCount,
      message: `Found ${needsFixCount} documents that need speaker transcript fixing`
    })
    
  } catch (error) {
    console.error('❌ Error checking speaker transcript status:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}