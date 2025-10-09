import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    logger.info('=== DEBUG TRANSCRIPT ANALYSIS ===')
    
    // Get a sample transcript document
    const transcriptsRef = adminDb.collection('transcript')
    const transcriptsSnap = await transcriptsRef.get()
    
    if (transcriptsSnap.size === 0) {
      return NextResponse.json({ error: 'No transcripts found' })
    }
    
    // Get the first transcript's timestamps
    const firstTranscriptId = transcriptsSnap.docs[0].id
    logger.info(`Examining transcript: ${firstTranscriptId}`)
    
    const timestampsRef = adminDb.collection('transcript').doc(firstTranscriptId).collection('timestamps')
    const timestampsSnap = await timestampsRef.get()
    
    if (timestampsSnap.size === 0) {
      return NextResponse.json({ error: 'No timestamps found' })
    }
    
    // Get the first timestamp document
    const firstTimestampDoc = timestampsSnap.docs[0]
    const timestampData = firstTimestampDoc.data()
    
    logger.info('Raw timestamp data:', timestampData)
    
    // Analyze the transcript text
    const transcriptText = timestampData.transcript || ''
    logger.info(`Transcript text length: ${transcriptText.length}`)
    logger.info(`Transcript text: "${transcriptText}"`)
    
    // Test keyword matching
    const categories = [
      { name: "Small Talk", color: "bg-teal-500", keywords: ["hello", "how are you", "nice to meet", "weather", "weekend", "family", "hobby", "interest", "what", "going", "on", "happening", "situation"] },
      { name: "Sales Procedures", color: "bg-red-500", keywords: ["process", "procedure", "step", "next", "follow", "protocol", "guideline", "method"] },
      { name: "Sales Tip", color: "bg-green-400", keywords: ["tip", "advice", "suggestion", "recommend", "best practice", "insight", "trick", "hint"] },
      { name: "Sales Process", color: "bg-orange-500", keywords: ["sales", "selling", "close", "deal", "negotiate", "pitch", "presentation", "proposal"] },
      { name: "Don'ts", color: "bg-red-700", keywords: ["don't", "avoid", "never", "wrong", "mistake", "error", "problem", "issue", "complaint"] },
      { name: "Icebreaker", color: "bg-purple-500", keywords: ["icebreaker", "break the ice", "start", "begin", "opening", "introduction", "casual", "friendly"] },
      { name: "Pitch", color: "bg-yellow-500", keywords: ["pitch", "present", "offer", "proposal", "value", "benefit", "advantage", "feature"] },
      { name: "Painpoint", color: "bg-gray-800", keywords: ["pain", "problem", "issue", "concern", "worry", "struggle", "difficulty", "challenge", "frustration"] },
      { name: "General Questions", color: "bg-blue-500", keywords: ["what", "how", "why", "when", "where", "who", "which", "going", "on", "happening", "situation", "info", "information", "clear", "unclear"] },
    ]
    
    const analysisResults = categories.map(category => {
      const matchingKeywords = category.keywords.filter(keyword => 
        transcriptText.toLowerCase().includes(keyword.toLowerCase())
      )
      
      return {
        category: category.name,
        keywords: category.keywords,
        matchingKeywords,
        hasMatches: matchingKeywords.length > 0
      }
    })
    
    // Test sentence splitting
    const sentences = transcriptText.split(/[.!?]+/).filter((s: string) => s.trim().length > 0)
    
    return NextResponse.json({
      success: true,
      transcriptId: firstTranscriptId,
      timestampId: firstTimestampDoc.id,
      transcriptData: {
        name: timestampData.name,
        transcript: transcriptText,
        transcriptLength: transcriptText.length,
        sentences: sentences,
        sentenceCount: sentences.length
      },
      analysisResults,
      categories: categories.map(cat => ({ name: cat.name, keywords: cat.keywords }))
    })
    
  } catch (error) {
    logger.error('Debug transcript analysis failed:', error)
    return NextResponse.json(
      { success: false, message: 'Debug failed', error: error },
      { status: 500 }
    )
  }
} 