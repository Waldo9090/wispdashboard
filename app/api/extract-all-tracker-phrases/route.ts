import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  console.log('🚀 [EXTRACT-ALL-PHRASES] API Route Called')
  
  try {
    const { transcriptText, speakerTranscript } = await request.json()
    
    console.log('📄 Transcript length:', transcriptText?.length || 0)
    console.log('🎙️ Speaker entries:', speakerTranscript?.length || 0)

    if (!transcriptText || !speakerTranscript) {
      return NextResponse.json(
        { error: 'Missing transcript data' },
        { status: 400 }
      )
    }

    const allTrackerPhrases = await extractAllTrackerPhrasesWithOpenAI(
      transcriptText, 
      speakerTranscript
    )
    
    return NextResponse.json({
      success: true,
      trackerResults: allTrackerPhrases,
      extractionMethod: 'openai-batch-processing',
      tokensUsed: calculateTokenUsage(transcriptText, speakerTranscript),
      costEstimate: estimateCost(transcriptText, speakerTranscript)
    })
    
  } catch (error) {
    console.error('❌ Error extracting phrases:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract phrases', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function extractAllTrackerPhrasesWithOpenAI(
  transcriptText: string,
  speakerTranscript: any[]
) {
  // Build the speaker transcript section (optimized for speed)
  const speakerBreakdown = speakerTranscript
    .slice(0, 8) // Reduced to 8 entries for faster processing
    .map((entry, index) => 
      `[${entry.timestamp || `${index + 1}`}] ${entry.speaker || 'Unknown'}: "${entry.text.substring(0, 120)}"` // Reduced to 120 chars
    )
    .join('\n')

  const prompt = `You are an expert medical spa consultation analyzer. Extract SPECIFIC phrases from this conversation transcript that demonstrate each of the following consultation behaviors.

CONSULTATION TRANSCRIPT:
${transcriptText.substring(0, 1500)}...

SPEAKER-BY-SPEAKER BREAKDOWN:
${speakerBreakdown}

EXTRACT PHRASES FOR ALL 7 TRACKERS SIMULTANEOUSLY:

**1. INTRODUCTION** - Professional greeting, name introductions, welcoming patient, role clarification, setting expectations
Look for: Greetings, name introductions, welcomes, role explanations, expectation setting
Example phrases: "Hi, I'm Dr. Smith, your injector today", "Welcome to our medical spa", "Let me introduce myself", "I'll be taking care of you today", "What brings you in to see us?"

**2. RAPPORT-BUILDING** - Building personal connection, comfort checks, showing care, making patient feel at ease
Look for: Comfort inquiries, personal interest, experience questions, reassurance, casual conversation
Example phrases: "How are you feeling about this?", "Are you comfortable?", "Have you been here before?", "You look great today", "I want you to feel completely at ease", "Tell me about your experience with treatments"

**3. LISTENING-TO-CONCERNS** - Patient expressing actual concerns, objections, fears, worries that need addressing
Look for: Safety concerns, result doubts, appearance fears, trust issues, time concerns
Example phrases: "Will it hurt?", "I'm worried about looking fake", "What if it doesn't work?", "How do I know it's safe?", "I'm scared of needles", "Will I look unnatural?", "How experienced are you with this?"

**4. OVERALL-ASSESSMENT** - Comprehensive evaluation of multiple areas, holistic approach, big-picture analysis
Look for: Multiple area discussions, comprehensive evaluation, overall facial analysis, treatment prioritization
Example phrases: "Let me look at your whole face", "We need to consider all these areas together", "Your facial structure suggests", "I'm evaluating multiple zones", "Looking at the big picture", "Comprehensive facial analysis"

**5. TREATMENT-PLAN** - Specific recommendations, treatment explanations, procedure options, dosage discussions
Look for: Recommendations, treatment explanations, procedure options, planning language, approach discussions
Example phrases: "I recommend Botox for your forehead", "We'll start with 20 units", "Here's what I suggest", "The best approach would be", "I think you'd benefit from", "Let me explain the procedure", "We have several options"

**6. PRICING-QUESTIONS** - Cost discussions, budget conversations, payment options, investment explanations
Look for: Price discussions, cost mentions, budget talks, payment options, value explanations
Example phrases: "The cost for this treatment is", "We have payment plans available", "What's your budget for this?", "It's an investment in yourself", "The price includes", "We accept financing", "Let's talk about the investment"

**7. FOLLOW-UP-BOOKING** - Scheduling future appointments, next steps, continuity planning
Look for: Scheduling language, next appointment booking, follow-up planning, return instructions
Example phrases: "Let's schedule your follow-up", "I'd like to see you in two weeks", "When can you come back?", "Your next appointment should be", "Let's book your touch-up", "I'll see you again in three months"

IMPORTANT INSTRUCTIONS:
- Extract EXACT phrases as spoken (don't paraphrase)
- Look for MEANING and INTENT, not just specific keywords
- Include 1-3 best phrases per tracker (quality over quantity, speed optimized)  
- Only extract phrases that CLEARLY demonstrate each behavior
- Consider both explicit statements and implicit demonstrations

RESPONSE FORMAT (JSON):
{
  "trackerResults": {
    "introduction": {
      "detectedPhrases": [
        {
          "phrase": "exact phrase from transcript",
          "speaker": "speaker name", 
          "entryIndex": 0,
          "confidence": 0.85,
          "timestamp": "00:30"
        }
      ],
      "found": true,
      "totalPhrases": 2
    },
    "rapport-building": {
      "detectedPhrases": [...],
      "found": false,
      "totalPhrases": 0
    },
    "listening-to-concerns": {
      "detectedPhrases": [...],
      "found": true,
      "totalPhrases": 3
    },
    "overall-assessment": {
      "detectedPhrases": [...],
      "found": true,
      "totalPhrases": 1
    },
    "treatment-plan": {
      "detectedPhrases": [...],
      "found": true,
      "totalPhrases": 2
    },
    "pricing-questions": {
      "detectedPhrases": [...],
      "found": false,
      "totalPhrases": 0
    },
    "follow-up-booking": {
      "detectedPhrases": [...],
      "found": true,
      "totalPhrases": 1
    }
  },
  "summary": {
    "totalTrackersFound": 5,
    "totalPhrasesExtracted": 9,
    "extractionQuality": "high"
  }
}

Extract phrases now based on SEMANTIC MEANING and CONSULTATION CONTEXT:`

  console.log('🌐 Making OpenAI API call for all trackers...')
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Cost-effective model
    messages: [
      {
        role: "system",
        content: "You are an expert medical consultation analyzer. Extract specific phrases that demonstrate consultation behaviors with high accuracy for all trackers simultaneously. Always respond with valid JSON."
      },
      {
        role: "user", 
        content: prompt
      }
    ],
    temperature: 0.1, // Even lower temperature for faster, more consistent extraction
    max_tokens: 1500, // Reduced for speed
    response_format: { type: "json_object" }
  })

  console.log('✅ OpenAI Response received')

  const result = JSON.parse(response.choices[0].message.content)
  
  // Process and validate the extracted phrases for all trackers
  const processedResults = processAllTrackerResults(result.trackerResults || {}, speakerTranscript)
  
  console.log(`📊 Processed phrases for all 7 trackers`)
  
  return processedResults
}

function processAllTrackerResults(trackerResults: any, speakerTranscript: any[]) {
  const processedResults: any = {}
  
  const trackerIds = [
    'introduction', 'rapport-building', 'listening-to-concerns', 
    'overall-assessment', 'treatment-plan', 'pricing-questions', 'follow-up-booking'
  ]
  
  trackerIds.forEach(trackerId => {
    const trackerData = trackerResults[trackerId] || { detectedPhrases: [], found: false }
    
    if (!Array.isArray(trackerData.detectedPhrases)) {
      processedResults[trackerId] = {
        detectedPhrases: [],
        found: false,
        confidence: 0,
        evidence: 'Invalid data format'
      }
      return
    }

    const processedPhrases = trackerData.detectedPhrases
      .filter((phrase: any) => phrase && phrase.phrase) // Remove invalid entries
      .map((phrase: any) => {
        // Find the corresponding transcript entry
        let matchingEntry = null
        
        if (phrase.entryIndex >= 0 && phrase.entryIndex < speakerTranscript.length) {
          matchingEntry = speakerTranscript[phrase.entryIndex]
        } else {
          // Fallback: find entry by speaker and partial text match
          const searchText = phrase.phrase.toLowerCase().substring(0, 30)
          matchingEntry = speakerTranscript.find((entry: any) => 
            entry.speaker === phrase.speaker && 
            entry.text && 
            entry.text.toLowerCase().includes(searchText)
          )
        }
        
        return {
          phrase: phrase.phrase.trim(),
          speaker: phrase.speaker || 'Unknown',
          confidence: Math.max(0.7, Math.min(0.95, phrase.confidence || 0.8)),
          timestamp: matchingEntry?.timestamp || phrase.timestamp || "00:00",
          startTime: matchingEntry?.start || 0,
          endTime: matchingEntry?.end || 0,
          entryIndex: phrase.entryIndex || 0,
          extractedBy: "openai-batch-processing"
        }
      })
      .filter((phrase: any) => 
        phrase.phrase.length >= 10 && 
        phrase.phrase.length <= 300 &&
        !phrase.phrase.includes('[System]') &&
        !/^(um|uh|well|so|and)\s*$/i.test(phrase.phrase.trim())
      )
      .slice(0, 3) // Reduced to 3 phrases per tracker for speed

    // Calculate average confidence
    const avgConfidence = processedPhrases.length > 0 
      ? processedPhrases.reduce((sum: number, p: any) => sum + p.confidence, 0) / processedPhrases.length
      : 0

    processedResults[trackerId] = {
      detectedPhrases: processedPhrases,
      found: processedPhrases.length > 0,
      confidence: Math.round(avgConfidence * 100),
      evidence: processedPhrases.length > 0 ? 
        `AI extracted ${processedPhrases.length} phrase(s) with ${Math.round(avgConfidence * 100)}% avg confidence` : 
        "No relevant phrases detected by AI"
    }
  })
  
  return processedResults
}

function calculateTokenUsage(transcriptText: string, speakerTranscript: any[]): number {
  const baseTokens = 500 // Further optimized system prompt
  const transcriptTokens = Math.ceil(transcriptText.substring(0, 1500).length / 4) // Further reduced limit
  const speakerTokens = speakerTranscript.slice(0, 8).length * 20 // Reduced entries and estimate
  
  return baseTokens + transcriptTokens + speakerTokens
}

function estimateCost(transcriptText: string, speakerTranscript: any[]): number {
  const inputTokens = calculateTokenUsage(transcriptText, speakerTranscript)
  const outputTokens = 1500 // Reduced max output tokens for speed
  
  // GPT-4o-mini pricing
  const inputCost = (inputTokens / 1000) * 0.00015
  const outputCost = (outputTokens / 1000) * 0.0006
  
  return inputCost + outputCost
}