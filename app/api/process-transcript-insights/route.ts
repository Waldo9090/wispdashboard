import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import OpenAI from 'openai'
import { robustFetch } from '@/lib/fetch-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  console.log('\n='.repeat(80))
  console.log('🚀 [PROCESS-TRANSCRIPT-INSIGHTS] API Route Called')
  console.log('⏰ Timestamp:', new Date().toISOString())
  console.log('='.repeat(80))
  
  try {
    const { transcriptId, personId } = await request.json()
    
    if (!transcriptId || !personId) {
      return NextResponse.json(
        { error: 'Missing transcriptId or personId' },
        { status: 400 }
      )
    }

    console.log('\n📋 STEP 1: Processing insights for:')
    console.log('   • Person ID:', personId)
    console.log('   • Transcript ID:', transcriptId)

    // Fetch the transcript data using Firebase Admin SDK
    console.log('\n📥 STEP 2: Fetching transcript data from Firestore')
    console.log('   • Path: transcript/' + personId + '/timestamps/' + transcriptId)
    const transcriptRef = db.collection('transcript').doc(personId).collection('timestamps').doc(transcriptId)
    const transcriptSnap = await transcriptRef.get()
    
    if (!transcriptSnap.exists) {
      console.log('❌ STEP 2 FAILED: Transcript document not found')
      console.log('   • Checked path: transcript/' + personId + '/timestamps/' + transcriptId)
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      )
    }
    console.log('✅ STEP 2 SUCCESS: Transcript document found')

    const transcriptData = transcriptSnap.data()
    
    console.log('\n📊 STEP 3: Validating transcript data')
    console.log('   • Has transcript field:', !!transcriptData.transcript)
    console.log('   • Has speaker transcript field:', !!transcriptData['speaker transcript'])
    console.log('   • Transcript length:', transcriptData.transcript?.length || 0)
    console.log('   • Speaker entries:', transcriptData['speaker transcript']?.length || 0)
    
    if (!transcriptData.transcript || !transcriptData['speaker transcript']) {
      console.log('❌ STEP 3 FAILED: Missing transcript content')
      return NextResponse.json(
        { error: 'Missing transcript content' },
        { status: 400 }
      )
    }
    console.log('✅ STEP 3 SUCCESS: Transcript data validated')


    // Call both APIs for comprehensive analysis
    
    console.log('\n🔄 STEP 4: Calling extract-all-tracker-phrases API')
    const baseUrlExtract = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    console.log('   • Calling URL:', `${baseUrlExtract}/api/extract-all-tracker-phrases`)
    const extractResponse = await fetch(`${baseUrlExtract}/api/extract-all-tracker-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcriptText: transcriptData.transcript,
        speakerTranscript: transcriptData['speaker transcript']
      })
    })

    if (!extractResponse.ok) {
      throw new Error(`Failed to extract tracker phrases: ${extractResponse.status}`)
    }

    const extractionResult = await extractResponse.json()
    console.log('✅ STEP 4 SUCCESS: Tracker phrases extracted')
    console.log('   • Success:', extractionResult.success)
    console.log('   • Trackers found:', extractionResult.trackerResults ? Object.keys(extractionResult.trackerResults).length : 0)
    console.log('   • Method:', extractionResult.extractionMethod)
    console.log('   • Tokens used:', extractionResult.tokensUsed)
    console.log('   • Cost estimate:', extractionResult.costEstimate)

    console.log('\n🔄 STEP 5: Starting background sentence classification')
    let classificationResult = { classifiedTranscript: [] }
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`
      
      // STEP 5A: Start background job
      console.log('   • Starting background classification job...')
      const startResponse = await fetch(`${baseUrl}/api/trackerByPhrases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptText: transcriptData.transcript,
          jobId: `${personId}_${transcriptId}_${Date.now()}`
        })
      })

      if (!startResponse.ok) {
        throw new Error(`Failed to start job: ${startResponse.status}`)
      }

      const { jobId, estimatedTime } = await startResponse.json()
      console.log('✅ STEP 5A SUCCESS: Background job started')
      console.log('   • Job ID:', jobId)
      console.log('   • Estimated time:', estimatedTime)

      // STEP 5B: Poll for completion with progress updates
      console.log('\n⏳ STEP 5B: Polling for job completion...')
      const maxWaitTime = 30 * 60 * 1000 // 30 minutes max wait
      const pollInterval = 3000 // 3 seconds between polls
      const startTime = Date.now()
      
      let lastProgress = 0
      
      while (Date.now() - startTime < maxWaitTime) {
        const statusResponse = await fetch(`${baseUrl}/api/trackerByPhrases/status/${jobId}`)
        
        if (!statusResponse.ok) {
          throw new Error(`Failed to check job status: ${statusResponse.status}`)
        }
        
        const statusData = await statusResponse.json()
        
        // Show progress updates
        if (statusData.progress?.percentage !== lastProgress) {
          console.log(`   • Progress: ${statusData.progress?.completed || 0}/${statusData.progress?.total || 0} batches (${statusData.progress?.percentage || 0}%)`)
          if (statusData.estimatedTimeRemaining) {
            console.log(`   • Estimated time remaining: ${statusData.estimatedTimeRemaining}`)
          }
          lastProgress = statusData.progress?.percentage
        }
        
        if (statusData.status === 'completed') {
          classificationResult = {
            classifiedTranscript: statusData.classifiedTranscript,
            success: true,
            totalSentences: statusData.totalSentences,
            extractionMethod: statusData.extractionMethod
          }
          console.log('✅ STEP 5B SUCCESS: Classification completed')
          console.log('   • Total sentences classified:', statusData.totalSentences)
          console.log('   • Processing time:', Math.round((Date.now() - startTime) / 1000), 'seconds')
          break
        }
        
        if (statusData.status === 'failed') {
          throw new Error(`Job failed: ${statusData.error}`)
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }
      
      // Check if we timed out
      if (Date.now() - startTime >= maxWaitTime) {
        console.log('⚠️ STEP 5B TIMEOUT: Job did not complete within 30 minutes')
        console.log('   • Job may still be processing in background')
        console.log('   • Results will be empty for this request')
      }
      
    } catch (classifyError) {
      console.log('❌ STEP 5 ERROR: Background classification failed')
      console.log('   • Error:', classifyError instanceof Error ? classifyError.message : classifyError)
      console.log('   • Stack:', classifyError instanceof Error ? classifyError.stack : 'No stack')
    }

    // Generate tracker scoring based on trackerByPhrases data using OpenAI
    console.log('\n🎯 STEP 6: Generating OpenAI-powered tracker scoring analysis')
    const trackerScoring = await generateTrackerScoringWithAI(classificationResult.classifiedTranscript || [])
    console.log('   • Tracker scoring generated for:', Object.keys(trackerScoring).length, 'trackers')

    // Create insights document with both trackerByPhrases and trackerScoring
    const insightsData = {
      trackerByPhrases: classificationResult.classifiedTranscript || [],
      trackerScoring: trackerScoring,
      extractionMethod: 'openai-sentence-classification',
      totalSentences: classificationResult.totalSentences || 0,
      calculatedAt: new Date(),
      transcriptId,
      personId
    }

    // Save to insights collection using Firebase Admin SDK
    const insightRef = db.collection('insights').doc(personId).collection('timestamps').doc(transcriptId)
    await insightRef.set(insightsData)

    console.log('\n💾 STEP 6: Saving insights to Firestore')
    console.log('   • Path: insights/' + personId + '/timestamps/' + transcriptId)
    console.log('   • TrackerByPhrases count:', classificationResult.classifiedTranscript?.length || 0)
    console.log('   • TrackerScoring trackers:', Object.keys(insightsData.trackerScoring || {}).length)
    console.log('   • Total sentences processed:', classificationResult.totalSentences || 0)
    console.log('   • Data structure:')
    console.log('     - trackerByPhrases length:', insightsData.trackerByPhrases?.length || 0)
    console.log('     - trackerScoring keys:', Object.keys(insightsData.trackerScoring || {}))
    console.log('✅ STEP 7 SUCCESS: Insights saved to Firestore')

    return NextResponse.json({
      success: true,
      insightsData,
      message: 'Insights processed and saved successfully'
    })
    
  } catch (error) {
    console.log('\n❌ FATAL ERROR: Process transcript insights failed')
    console.log('   • Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.log('   • Error message:', error instanceof Error ? error.message : error)
    console.log('   • Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.log('='.repeat(80))
    return NextResponse.json(
      { 
        error: 'Failed to process insights', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
  
  console.log('='.repeat(80))
  console.log('✅ PROCESS COMPLETE: All steps finished successfully')
  console.log('='.repeat(80))
}

async function generateTrackerScoringWithAI(classifiedSentences: any[]) {
  console.log('🤖 Starting OpenAI-powered tracker scoring evaluation...')
  
  // Group sentences by tracker
  const trackerGroups: Record<string, any[]> = {}
  classifiedSentences.forEach(sentence => {
    if (sentence.tracker && sentence.tracker !== 'none') {
      if (!trackerGroups[sentence.tracker]) {
        trackerGroups[sentence.tracker] = []
      }
      trackerGroups[sentence.tracker].push(sentence)
    }
  })
  
  // Create summary of detected phrases for each tracker
  const trackerSummaries = Object.entries(trackerGroups).map(([trackerId, sentences]) => {
    return `${trackerId.toUpperCase()}: ${sentences.length} phrases detected
Examples: ${sentences.slice(0, 3).map(s => `"${s.text}"`).join(', ')}`
  }).join('\n\n')
  
  const prompt = `You are an expert medical spa consultation performance evaluator. Analyze the tracker phrase detection results from a consultation transcript and provide detailed scoring.

DETECTED TRACKER PHRASES:
${trackerSummaries}

TRACKER CATEGORIES TO EVALUATE:
1. **INTRODUCTION** - Professional greeting, name introductions, welcoming patient
2. **RAPPORT-BUILDING** - Building personal connection, comfort checks, making patient feel at ease
3. **LISTENING-TO-CONCERNS** - Patient expressing concerns, objections, fears that need addressing
4. **OVERALL-ASSESSMENT** - Comprehensive evaluation, holistic approach, big-picture analysis
5. **TREATMENT-PLAN** - Specific recommendations, treatment explanations, procedure options
6. **PRICING-QUESTIONS** - Cost discussions, budget conversations, payment options
7. **FOLLOW-UP-BOOKING** - Scheduling appointments, next steps, continuity planning

For each tracker category, evaluate the performance and assign:
- **Category**: "Great", "Needs Improvement", or "Missed"
- **Reasoning**: 2-3 sentence explanation of why this score was given and specific recommendations

EVALUATION CRITERIA:
- **Great**: Strong presence with meaningful, detailed coverage
- **Needs Improvement**: Some coverage but lacking depth or frequency
- **Missed**: No or minimal coverage of this critical area

Provide specific, actionable feedback in your reasoning.

RESPONSE FORMAT (JSON):
{
  "introduction": {
    "category": "Great",
    "phraseCount": 4,
    "reasoning": "Excellent opening with warm welcome and clear introductions. The consultant established a professional yet friendly tone from the start."
  },
  "rapport-building": {
    "category": "Needs Improvement", 
    "phraseCount": 2,
    "reasoning": "Limited rapport-building detected. Consider asking more personal questions and showing greater interest in the patient's comfort level."
  }
  // ... continue for all 7 trackers
}`

  console.log('🌐 Making OpenAI API call for tracker scoring evaluation...')
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert medical spa consultation performance evaluator. Provide detailed, actionable feedback on conversation tracking performance. Always respond with valid JSON."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })

    const rawContent = response.choices[0].message.content
    console.log('✅ OpenAI Tracker Scoring Response received')
    console.log('📝 Raw response length:', rawContent?.length)
    
    let result
    try {
      result = JSON.parse(rawContent || '{}')
      console.log('✅ Successfully parsed tracker scoring JSON')
    } catch (parseError) {
      console.error('❌ JSON Parse Error for tracker scoring:', parseError)
      // Fallback to simple scoring if OpenAI fails
      result = generateSimpleTrackerScoring(classifiedSentences)
    }
    
    return result
    
  } catch (error) {
    console.error('❌ OpenAI tracker scoring failed:', error)
    // Fallback to simple scoring
    return generateSimpleTrackerScoring(classifiedSentences)
  }
}

function generateSimpleTrackerScoring(classifiedSentences: any[]) {
  console.log('📊 Using fallback simple tracker scoring...')
  const trackerScoring: Record<string, any> = {}
  
  // Count sentences for each tracker
  const trackerCounts: Record<string, number> = {}
  classifiedSentences.forEach(sentence => {
    if (sentence.tracker && sentence.tracker !== 'none') {
      trackerCounts[sentence.tracker] = (trackerCounts[sentence.tracker] || 0) + 1
    }
  })
  
  // Define scoring criteria for each tracker
  const trackerDefinitions = [
    { id: 'introduction', name: 'Introduction', minGood: 2, minGreat: 4 },
    { id: 'rapport-building', name: 'Rapport Building', minGood: 3, minGreat: 6 },
    { id: 'listening-to-concerns', name: 'Patient Concerns', minGood: 2, minGreat: 5 },
    { id: 'overall-assessment', name: 'Overall Assessment', minGood: 2, minGreat: 4 },
    { id: 'treatment-plan', name: 'Treatment Plan', minGood: 3, minGreat: 8 },
    { id: 'pricing-questions', name: 'Pricing Questions', minGood: 1, minGreat: 3 },
    { id: 'follow-up-booking', name: 'Follow-up Booking', minGood: 1, minGreat: 3 }
  ]
  
  trackerDefinitions.forEach(tracker => {
    const phraseCount = trackerCounts[tracker.id] || 0
    let category: string
    let reasoning: string
    
    if (phraseCount === 0) {
      category = 'Missed'
      reasoning = `No ${tracker.name.toLowerCase()} phrases detected in the conversation. This is a critical area that should be addressed.`
    } else if (phraseCount < tracker.minGood) {
      category = 'Needs Improvement'
      reasoning = `Only ${phraseCount} ${tracker.name.toLowerCase()} phrase${phraseCount === 1 ? '' : 's'} detected. Consider expanding this area for better patient engagement.`
    } else if (phraseCount < tracker.minGreat) {
      category = 'Needs Improvement'
      reasoning = `${phraseCount} ${tracker.name.toLowerCase()} phrases detected. Good coverage but could be enhanced for optimal patient experience.`
    } else {
      category = 'Great'
      reasoning = `Excellent coverage with ${phraseCount} ${tracker.name.toLowerCase()} phrases detected. Strong execution in this area.`
    }
    
    trackerScoring[tracker.id] = {
      category,
      phraseCount,
      reasoning
    }
  })
  
  return trackerScoring
}