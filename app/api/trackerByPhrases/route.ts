import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// In-memory job storage (in production, use database)
interface ProcessingJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: { completed: number; total: number; percentage: number }
  results: any[]
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  transcriptText?: string
}

// Global job storage (shared across routes)
declare global {
  var jobStorage: Map<string, ProcessingJob> | undefined
}

if (!global.jobStorage) {
  global.jobStorage = new Map()
}

const jobs = global.jobStorage

/**
 * Async TrackerByPhrases API - Start background processing and return job ID
 */
export async function POST(request: NextRequest) {
  
  try {
    const { transcriptText, jobId } = await request.json()
    
    if (!transcriptText) {
      return NextResponse.json(
        { error: 'Missing transcript text' },
        { status: 400 }
      )
    }

    // Create background job
    const backgroundJobId = createJob(transcriptText, jobId)

    // Return immediately with job info
    return NextResponse.json({
      success: true,
      jobId: backgroundJobId,
      status: 'processing',
      message: 'Classification started in background',
      pollUrl: `/api/trackerByPhrases/status/${backgroundJobId}`,
      estimatedTime: '2-5 minutes depending on transcript size'
    })
    
  } catch (error) {
    
    return NextResponse.json(
      { 
        error: 'Failed to start classification job', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function createJob(transcriptText: string, jobId?: string): string {
  const id = jobId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const job: ProcessingJob = {
    id,
    status: 'pending',
    progress: { completed: 0, total: 0, percentage: 0 },
    results: [],
    createdAt: new Date(),
    transcriptText
  }

  jobs.set(id, job)
  
  // Start processing immediately in background
  processInBackground(id).catch(error => {
    console.error(`❌ Background job ${id} failed:`, error)
    updateJobStatus(id, 'failed', undefined, error.message)
  })

  return id
}

function updateJobStatus(
  jobId: string, 
  status: ProcessingJob['status'], 
  progress?: Partial<ProcessingJob['progress']>,
  error?: string
): void {
  const job = jobs.get(jobId)
  if (!job) return

  job.status = status
  if (progress) {
    job.progress = { ...job.progress, ...progress }
    job.progress.percentage = Math.round((job.progress.completed / Math.max(job.progress.total, 1)) * 100)
  }
  if (error) job.error = error
  if (status === 'processing' && !job.startedAt) job.startedAt = new Date()
  if (status === 'completed' || status === 'failed') job.completedAt = new Date()

}

function addJobResults(jobId: string, results: any[]): void {
  const job = jobs.get(jobId)
  if (!job) return
  job.results.push(...results)
}

async function processInBackground(jobId: string): Promise<void> {
  const job = jobs.get(jobId)
  if (!job || !job.transcriptText) return

  try {
    updateJobStatus(jobId, 'processing')

    const sentences = splitIntoSentences(job.transcriptText)
    const chunks = createChunks(sentences, 25)
    
    updateJobStatus(jobId, 'processing', {
      total: chunks.length,
      completed: 0
    })

    console.log(`🚀 Starting parallel processing for job ${jobId}`)
    console.log(`   • Total sentences: ${sentences.length}`)
    console.log(`   • Total chunks: ${chunks.length}`)
    console.log(`   • Concurrent batches: 5`)

    const CONCURRENT_BATCHES = 5
    let completedChunks = 0

    // Process chunks in groups of 5 parallel batches
    for (let i = 0; i < chunks.length; i += CONCURRENT_BATCHES) {
      const batchGroup = chunks.slice(i, i + CONCURRENT_BATCHES)
      console.log(`📦 Processing batch group ${Math.floor(i/CONCURRENT_BATCHES) + 1}: chunks ${i + 1}-${Math.min(i + CONCURRENT_BATCHES, chunks.length)}`)
      
      // Create promises for parallel processing
      const batchPromises = batchGroup.map(async (chunk, batchIndex) => {
        const chunkIndex = i + batchIndex
        try {
          const chunkResults = await processChunk(chunk, chunkIndex * 25, sentences.length)
          return { success: true, results: chunkResults, chunkIndex }
        } catch (chunkError) {
          console.error(`❌ Job ${jobId} chunk ${chunkIndex + 1} failed:`, chunkError)
          return { success: false, error: chunkError, chunkIndex }
        }
      })

      // Wait for all batches in this group to complete
      const batchResults = await Promise.all(batchPromises)
      
      // Process results
      batchResults.forEach(result => {
        if (result.success) {
          addJobResults(jobId, result.results)
        }
        completedChunks++
      })

      // Update progress
      updateJobStatus(jobId, 'processing', {
        completed: completedChunks
      })

      // Brief pause between batch groups to respect rate limits
      if (i + CONCURRENT_BATCHES < chunks.length) {
        console.log(`⏳ Job ${jobId}: Brief pause before next batch group...`)
        await sleep(1000) // Reduced from 2000ms to 1000ms
      }
    }

    console.log(`✅ Job ${jobId} completed successfully`)
    updateJobStatus(jobId, 'completed')

  } catch (error) {
    console.error(`💥 Job ${jobId} failed completely:`, error)
    updateJobStatus(jobId, 'failed', undefined, 
      error instanceof Error ? error.message : 'Unknown error')
  }
}

async function processChunk(chunkSentences: string[], startIndex: number, totalSentences: number): Promise<any[]> {
  const prompt = `You are an expert medical spa consultation analyzer. Classify each sentence from this transcript chunk into one of the 7 tracker categories or mark as "none" if it doesn't fit any category.

TRANSCRIPT SENTENCES:
${chunkSentences.map((sentence, index) => `[${startIndex + index}] ${sentence}`).join('\n')}

TRACKER CATEGORIES:
**1. INTRODUCTION** - Professional greeting, name introductions, welcoming patient, role clarification, setting expectations
**2. RAPPORT-BUILDING** - Building personal connection, comfort checks, showing care, making patient feel at ease  
**3. LISTENING-TO-CONCERNS** - Patient expressing actual concerns, objections, fears, worries that need addressing
**4. OVERALL-ASSESSMENT** - Comprehensive evaluation of multiple areas, holistic approach, big-picture analysis
**5. TREATMENT-PLAN** - Specific recommendations, treatment explanations, procedure options, dosage discussions
**6. PRICING-QUESTIONS** - Cost discussions, budget conversations, payment options, investment explanations
**7. FOLLOW-UP-BOOKING** - Scheduling future appointments, next steps, continuity planning

INSTRUCTIONS:
1. Classify each sentence by its index number
2. Assign ONE tracker category or "none"
3. Provide confidence score (0.0-1.0)

RESPONSE FORMAT (JSON):
{
  "classifications": [
    {
      "sentenceIndex": ${startIndex},
      "sentence": "exact sentence text",
      "tracker": "introduction",
      "confidence": 0.95
    }
  ]
}

Classify all sentences now:`

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert medical consultation analyzer. Classify each sentence into tracker categories with high accuracy. Always respond with valid JSON."
      },
      {
        role: "user", 
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 2000,
    response_format: { type: "json_object" }
  })

  const rawContent = response.choices[0].message.content
  let result

  try {
    result = JSON.parse(rawContent || '{}')
  } catch (parseError) {
    console.error('❌ JSON Parse Error for chunk:', parseError)
    result = { classifications: [] }
  }

  return processClassifications(result.classifications || [], chunkSentences, startIndex, totalSentences)
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .map(s => s.endsWith('.') || s.endsWith('!') || s.endsWith('?') ? s : s + '.')
}

function createChunks<T>(array: T[], chunkSize: number): T[][] {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

function processClassifications(classifications: any[], sentences: string[], startIndex: number, totalSentences: number) {
  const processedTranscript: any[] = []
  
  classifications.forEach((classification, index) => {
    const sentence = classification.sentence || sentences[classification.sentenceIndex - startIndex] || sentences[index]
    
    if (!sentence) return
    
    const actualIndex = classification.sentenceIndex || (startIndex + index)
    const approximateStart = Math.floor((actualIndex / totalSentences) * 300)
    const approximateEnd = Math.floor(((actualIndex + 1) / totalSentences) * 300)
    
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    processedTranscript.push({
      confidence: classification.confidence || 0.8,
      end: approximateEnd * 1000,
      start: approximateStart * 1000,
      text: sentence,
      timestamp: formatTime(approximateStart),
      tracker: classification.tracker === "none" ? "none" : classification.tracker
    })
  })
  
  return processedTranscript
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Export job access for status API
export function getJob(jobId: string): ProcessingJob | null {
  return jobs.get(jobId) || null
}