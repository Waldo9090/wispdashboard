"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, MoreVertical, User, Target } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { db, functions } from "@/lib/firebase"
import { getUserDisplayName, isUserDataEncrypted } from "@/lib/decryption-utils"
import { httpsCallable } from "firebase/functions"
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  doc, 
  getDoc,
  setDoc,
  orderBy 
} from "firebase/firestore"

interface Tracker {
  id: string
  name: string
  description: string
  keywords: string[]
  createdBy: string
  createdAt: any
  isActive: boolean
}

interface Person {
  id: string
  name: string
  role: string
  transcriptCount: number
}

interface DetectedPhrase {
  phrase: string
  timestamp: string
  speaker: string
  confidence: number
  startTime: number
  endTime: number
  entryIndex: number
}

interface InsightData {
  personId: string
  trackerId: string
  transcriptId?: string
  percentage: number
  transcriptsAnalyzed: number
  trackerFound: number
  detectedPhrases?: DetectedPhrase[]
}

export default function InsightsPage() {
  const { user } = useAuth()
  const [trackers, setTrackers] = useState<Tracker[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [insights, setInsights] = useState<InsightData[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showCreateTracker, setShowCreateTracker] = useState(false)
  const [hasProcessedBefore, setHasProcessedBefore] = useState(false)
  const [newTracker, setNewTracker] = useState({
    name: '',
    description: '',
    keywords: ''
  })

  useEffect(() => {
    if (user) {
      loadData()
      initializeDefaultTrackers()
    }
  }, [user])
  
  // Check processed status and load insights after people are loaded
  useEffect(() => {
    if (user && people.length > 0) {
      checkIfProcessedBefore()
      loadExistingInsights()
    }
  }, [user, people])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load people and trackers first
      await Promise.all([
        loadPeople(),
        loadTrackers()
      ])
      
      // Then load insights after people are available
      // This will be handled by the useEffect that watches people
      
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPeople = async () => {
    try {
      // Get people from transcript document IDs (not from speaker fields)
      const transcriptRef = collection(db, "transcript")
      const transcriptSnap = await getDocs(transcriptRef)
      const peopleArray: Person[] = []

      for (const locationDoc of transcriptSnap.docs) {
        if (locationDoc.id !== 'name') {
          const transcriptData = locationDoc.data()
          const documentId = locationDoc.id
          
          let userName = 'Unknown User'
          let userRole = 'Sales Rep'
          let transcriptCount = 0

          // Count total transcripts for this person
          try {
            const timestampsRef = collection(db, 'transcript', documentId, 'timestamps')
            const timestampsSnap = await getDocs(timestampsRef)
            transcriptCount = timestampsSnap.size
          } catch (error) {
            console.warn(`Could not count transcripts for ${documentId}:`, error)
          }

          // Try to decrypt the user's name from encryptedUserData
          if (transcriptData.encryptedUserData && isUserDataEncrypted(transcriptData.encryptedUserData)) {
            try {
              const decryptedName = await getUserDisplayName(documentId, transcriptData.encryptedUserData)
              if (decryptedName && decryptedName !== documentId && decryptedName !== 'Unknown User') {
                userName = decryptedName
              }
            } catch (error) {
              console.warn(`Failed to decrypt name for ${documentId}:`, error)
            }
          } else {
            // Fallback to other fields if no encrypted data
            userName = transcriptData.name || transcriptData.displayName || transcriptData.fullName || documentId
          }

          // Determine role from available data
          if (transcriptData.role) {
            userRole = transcriptData.role
          } else if (transcriptData.createdAtLocation) {
            userRole = 'Sales Rep' // Default for location-based users
          }

          peopleArray.push({
            id: documentId,
            name: userName,
            role: userRole,
            transcriptCount: transcriptCount
          })
        }
      }

      setPeople(peopleArray)
    } catch (error) {
      console.error('Error loading people:', error)
    }
  }

  const loadTrackers = async () => {
    try {
      const trackersRef = collection(db, 'trackers')
      // Simplified query to avoid index requirement
      const trackersQuery = query(
        trackersRef,
        where('createdBy', '==', user?.email || '')
      )
      const trackersSnap = await getDocs(trackersQuery)
      
      const trackersData = trackersSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as Tracker)
        .filter(tracker => tracker.isActive) // Filter in memory instead
        .sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()) // Sort in memory
      
      setTrackers(trackersData)
    } catch (error) {
      console.error('Error loading trackers:', error)
      setTrackers([])
    }
  }

  // Check if we've processed transcripts before
  const checkIfProcessedBefore = async () => {
    try {
      let hasAnyInsights = false
      
      // Check each person's insights collection
      for (const person of people) {
        const personInsightsRef = collection(db, 'insights', person.id, 'timestamps')
        const personInsightsSnap = await getDocs(personInsightsRef)
        
        if (!personInsightsSnap.empty) {
          hasAnyInsights = true
          break
        }
      }
      
      setHasProcessedBefore(hasAnyInsights)
    } catch (error) {
      console.error('Error checking existing insights:', error)
      setHasProcessedBefore(false)
    }
  }

  // Load existing insights from insights collection
  const loadExistingInsights = async () => {
    try {
      console.log('📊 Loading existing insights from insights collection...')
      const allInsights: any[] = []
      
      // Load insights for each person
      for (const person of people) {
        const personInsightsRef = collection(db, 'insights', person.id, 'timestamps')
        const personInsightsSnap = await getDocs(personInsightsRef)
        
        personInsightsSnap.docs.forEach(doc => {
          allInsights.push({ id: doc.id, ...doc.data() })
        })
      }
      
      if (allInsights.length === 0) {
        console.log('No existing insights found')
        setInsights([])
        return
      }

      console.log(`Found ${allInsights.length} existing insights documents`)
      // Calculate summary from existing insight documents
      await calculateSummaryFromExistingInsights(allInsights)
      
    } catch (error) {
      console.error('Error loading existing insights:', error)
      setInsights([])
    }
  }

  // Calculate summary from existing insight documents
  const calculateSummaryFromExistingInsights = async (insightDocs: any[]) => {
    console.log(`📈 Calculating summary from ${insightDocs.length} existing insights...`)
    const newInsights: InsightData[] = []
    
    const trackersToUse = [
      { id: "introduction", name: "Introduction" },
      { id: "rapport-building", name: "Rapport building" }, 
      { id: "listening-to-concerns", name: "Listening to patient concerns" },
      { id: "overall-assessment", name: "Overall comprehensive assessment" },
      { id: "treatment-plan", name: "Developing a treatment plan" },
      { id: "pricing-questions", name: "Addressing pricing and questions" },
      { id: "follow-up-booking", name: "Follow-up, next steps, appointment booking" }
    ]

    try {
      // Group insights by person
      const insightsByPerson: Record<string, any[]> = {}
      insightDocs.forEach(insight => {
        if (!insightsByPerson[insight.personId]) {
          insightsByPerson[insight.personId] = []
        }
        insightsByPerson[insight.personId].push(insight)
      })

      // Calculate percentages for each person/tracker combination
      for (const person of people) {
        const personInsights = insightsByPerson[person.id] || []

        for (const tracker of trackersToUse) {
          let totalTranscripts = 0
          let trackerFound = 0

          personInsights.forEach(insight => {
            // Check for new trackerByPhrases format first, fallback to old trackerAnalysis
            if (insight.trackerByPhrases && Array.isArray(insight.trackerByPhrases)) {
              totalTranscripts++
              // Count if tracker was found in the classified sentences
              const hasTracker = insight.trackerByPhrases.some((sentence: any) => 
                sentence.tracker === tracker.id
              )
              if (hasTracker) {
                trackerFound++
              }
            } else if (insight.trackerAnalysis && insight.trackerAnalysis[tracker.id]) {
              // Fallback to old format for backwards compatibility
              totalTranscripts++
              if (insight.trackerAnalysis[tracker.id].found) {
                trackerFound++
              }
            }
          })

          const percentage = totalTranscripts > 0 ? Math.round((trackerFound / totalTranscripts) * 100) : 0

          newInsights.push({
            personId: person.id,
            trackerId: tracker.id,
            percentage,
            transcriptsAnalyzed: totalTranscripts,
            trackerFound
          })

          console.log(`📊 ${person.name} - ${tracker.name}: ${percentage}% (${trackerFound}/${totalTranscripts})`)
        }
      }

      setInsights(newInsights)
      
    } catch (error) {
      console.error('Error calculating summary from existing insights:', error)
    }
  }

  const createTracker = async () => {
    if (!newTracker.name.trim() || !user) return

    try {
      const trackerData = {
        name: newTracker.name.trim(),
        description: newTracker.description.trim(),
        keywords: newTracker.keywords.split(',').map(k => k.trim()).filter(k => k),
        createdBy: user.email,
        createdAt: new Date(),
        isActive: true
      }

      await addDoc(collection(db, 'trackers'), trackerData)
      
      // Reset form
      setNewTracker({ name: '', description: '', keywords: '' })
      setShowCreateTracker(false)
      
      // Reload trackers and recalculate insights
      await loadTrackers()
      await calculateInsights()
    } catch (error) {
      console.error('Error creating tracker:', error)
    }
  }

  // Initialize default trackers for med spa workflow
  const initializeDefaultTrackers = async () => {
    if (!user) return

    const defaultTrackers = [
      {
        id: "introduction",
        name: "Introduction",
        description: "Professional greeting, introductions, and welcoming the patient to establish initial rapport",
        keywords: [] // Keywords no longer needed - using OpenAI
      },
      {
        id: "rapport-building",
        name: "Rapport building", 
        description: "Building personal connection, asking about comfort, experience, and making the patient feel at ease",
        keywords: [] // Keywords no longer needed - using OpenAI
      },
      {
        id: "listening-to-concerns",
        name: "Listening to patient concerns",
        description: "Patient expressing actual concerns, objections, fears, worries that need addressing",
        keywords: [] // Keywords no longer needed - using OpenAI
      },
      {
        id: "overall-assessment",
        name: "Overall comprehensive assessment",
        description: "Comprehensive evaluation of multiple areas, holistic approach, big-picture analysis",
        keywords: [] // Keywords no longer needed - using OpenAI
      },
      {
        id: "treatment-plan",
        name: "Developing a treatment plan",
        description: "Developing and explaining customized treatment recommendations, procedure options, and approach",
        keywords: [] // Keywords no longer needed - using OpenAI
      },
      {
        id: "pricing-questions",
        name: "Addressing pricing and questions",
        description: "Transparent discussion of costs, pricing, payment options, and investment in treatment",
        keywords: [] // Keywords no longer needed - using OpenAI
      },
      {
        id: "follow-up-booking",
        name: "Follow-up, next steps, appointment booking",
        description: "Scheduling next appointments, explaining next steps, and ensuring care continuity",
        keywords: [] // Keywords no longer needed - using OpenAI
      }
    ]

    try {
      // Check if default trackers already exist
      const trackersRef = collection(db, 'trackers')
      const existingQuery = query(
        trackersRef,
        where('createdBy', '==', user.email || '')
      )
      const existingSnap = await getDocs(existingQuery)
      
      // Only create default trackers if none exist
      if (existingSnap.empty) {
        console.log('Creating default trackers...')
        const promises = defaultTrackers.map(tracker => 
          addDoc(collection(db, 'trackers'), {
            ...tracker,
            createdBy: user.email,
            createdAt: new Date(),
            isActive: true
          })
        )
        await Promise.all(promises)
        console.log('Default trackers created successfully')
        
        // Reload trackers
        await loadTrackers()
      }
    } catch (error) {
      console.error('Error creating default trackers:', error)
    }
  }

  // OpenAI-powered phrase extraction for all trackers
  const analyzeTranscriptWithOpenAI = async (
    speakerTranscript: any[],
    fullTranscript: string
  ): Promise<any[]> => {
    
    console.log('🤖 Starting OpenAI-powered phrase extraction for ALL trackers...')
    
    try {
      console.log('🌐 Making single API call for all 7 trackers...')
      
      const response = await fetch('/api/extract-all-tracker-phrases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptText: fullTranscript,
          speakerTranscript: speakerTranscript
        })
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Received results for all trackers')
      console.log(`💰 Estimated cost: $${result.costEstimate?.toFixed(4) || 'unknown'}`)
      
      // Convert to the expected format
      const trackerIds = [
        'introduction', 'rapport-building', 'listening-to-concerns', 
        'overall-assessment', 'treatment-plan', 'pricing-questions', 'follow-up-booking'
      ]
      
      const formattedResults = trackerIds.map(trackerId => {
        const trackerData = result.trackerResults[trackerId] || {
          detectedPhrases: [],
          found: false,
          confidence: 0
        }
        
        return {
          trackerId: trackerId,
          found: trackerData.found,
          confidence: trackerData.confidence,
          detectedPhrases: trackerData.detectedPhrases,
          evidence: trackerData.evidence || 
            (trackerData.found ? 
              `AI extracted ${trackerData.detectedPhrases.length} phrase(s)` : 
              "No relevant phrases detected by AI"),
          extractionMethod: 'openai-batch'
        }
      })
      
      console.log('✅ OpenAI phrase extraction completed for all trackers')
      return formattedResults
      
    } catch (error) {
      console.error('❌ OpenAI phrase extraction failed:', error)
      throw error
    }
  }



  // Process all transcripts using the new process-transcript-insights API
  const processAllTranscripts = async () => {
    if (!user || people.length === 0) {
      alert('Please wait for people to load first')
      return
    }

    setProcessing(true)
    console.log('🔍 Starting comprehensive transcript insights processing for ALL transcripts...')
    
    try {
      let totalProcessed = 0

      // Collect all transcripts for parallel processing
      const allTranscripts: Array<{
        personId: string,
        personName: string,
        transcriptId: string,
        transcriptData: any
      }> = []

      console.log('📋 Collecting all transcripts for parallel processing...')
      
      for (const person of people) {
        console.log(`📊 Collecting transcripts for ${person.name} (${person.id})`)
        
        const timestampsRef = collection(db, 'transcript', person.id, 'timestamps')
        const timestampsSnap = await getDocs(timestampsRef)

        // Collect transcript documents
        for (const transcriptDoc of timestampsSnap.docs) {
          const transcriptData = transcriptDoc.data()
          const transcriptId = transcriptDoc.id

          // Skip if no transcript content
          if (!transcriptData.transcript) continue

          allTranscripts.push({
            personId: person.id,
            personName: person.name,
            transcriptId: transcriptId,
            transcriptData: transcriptData
          })
        }
      }

      // Process transcripts in parallel batches of 10 (conservative for the new chunked API)
      const BATCH_SIZE = 10
      
      console.log(`🚀 Found ${allTranscripts.length} transcripts to process in parallel batches of ${BATCH_SIZE}`)
      const startTime = Date.now()
      
      for (let i = 0; i < allTranscripts.length; i += BATCH_SIZE) {
        const batch = allTranscripts.slice(i, i + BATCH_SIZE)
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1
        const totalBatches = Math.ceil(allTranscripts.length / BATCH_SIZE)
        
        console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} transcripts in parallel)`)

        // Process all transcripts in this batch in parallel using the new API
        const batchPromises = batch.map(async (item) => {
          console.log(`  🔍 Processing transcript ${item.transcriptId} for ${item.personName}`)

          try {
            const requestStartTime = Date.now()
            
            // Call the Cloud Function instead of API route
            if (!functions) {
              throw new Error('Firebase Functions not available')
            }
            const processTranscriptInsights = httpsCallable(functions, 'processTranscriptInsights')
            const result = await processTranscriptInsights({
              transcriptId: item.transcriptId,
              personId: item.personId
            })
            
            const requestDuration = Date.now() - requestStartTime
            console.log(`    ✅ Completed ${item.transcriptId} for ${item.personName} (${requestDuration}ms)`)
            
            return { 
              success: true, 
              transcriptId: item.transcriptId, 
              personName: item.personName,
              processingTime: requestDuration,
              result: result.data
            }
            
          } catch (error) {
            console.error(`    ❌ Failed to process ${item.transcriptId} for ${item.personName}:`, error)
            return { 
              success: false, 
              transcriptId: item.transcriptId, 
              personName: item.personName, 
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })

        // Wait for all transcripts in this batch to complete
        const batchResults = await Promise.allSettled(batchPromises)
        
        // Count successful completions
        const successful = batchResults.filter(result => 
          result.status === 'fulfilled' && result.value.success
        ).length
        
        totalProcessed += successful
        
        // Calculate batch metrics
        const avgProcessingTime = batchResults
          .filter(result => result.status === 'fulfilled' && result.value.success)
          .reduce((sum, result: any) => sum + (result.value.processingTime || 0), 0) / successful
        
        console.log(`✅ Batch ${batchNumber} completed: ${successful}/${batch.length} successful`)
        console.log(`⏱️ Average processing time: ${Math.round(avgProcessingTime)}ms`)
        
        // Rate limiting between batches
        if (i + BATCH_SIZE < allTranscripts.length) {
          console.log('⏳ Waiting 1000ms before next batch...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Reload insights after processing
      await loadExistingInsights()
      setHasProcessedBefore(true)
      
      // Final performance metrics
      const totalDuration = Date.now() - startTime
      const avgTimePerTranscript = totalDuration / totalProcessed
      
      console.log(`✅ Processing completed! Analyzed ${totalProcessed} transcripts`)
      console.log(`⏱️ Total processing time: ${Math.round(totalDuration / 1000)}s`)
      console.log(`⚡ Average time per transcript: ${Math.round(avgTimePerTranscript)}ms`)
      
      alert(`Processing completed! 
✅ Analyzed ${totalProcessed} transcripts with new chunked processing
⏱️ Total time: ${Math.round(totalDuration / 1000)}s
🚀 Speed: ${Math.round(avgTimePerTranscript)}ms per transcript
🎯 Features: AI-powered scoring with detailed reasoning`)
      
    } catch (error) {
      console.error('❌ Error in transcript processing:', error)
      alert('Error processing transcripts. Check console for details.')
    } finally {
      setProcessing(false)
    }
  }

  // Process only new transcripts (incremental)
  const processNewTranscripts = async () => {
    console.log('🔍 Processing only NEW transcripts...')
    // This would be called automatically when new transcripts are added
    // Implementation similar to processAllTranscripts but with better filtering
  }

  // Calculate summary insights from insights collection
  const calculateSummaryInsights = async () => {
    console.log('📊 Calculating summary insights from insights collection...')
    const newInsights: InsightData[] = []
    
    const trackersToUse = [
      { id: "introduction", name: "Introduction" },
      { id: "rapport-building", name: "Rapport building" }, 
      { id: "listening-to-concerns", name: "Listening to patient concerns" },
      { id: "overall-assessment", name: "Overall comprehensive assessment" },
      { id: "treatment-plan", name: "Developing a treatment plan" },
      { id: "pricing-questions", name: "Addressing pricing and questions" },
      { id: "follow-up-booking", name: "Follow-up, next steps, appointment booking" }
    ]

    try {
      // Calculate percentages for each person/tracker combination
      for (const person of people) {
        // Query insights collection for this person's data from correct structure
        const personInsightsRef = collection(db, 'insights', person.id, 'timestamps')
        const personInsightsSnap = await getDocs(personInsightsRef)

        for (const tracker of trackersToUse) {
          let totalTranscripts = 0
          let trackerFound = 0

          // Count insights where this tracker was found
          personInsightsSnap.docs.forEach(doc => {
            const data = doc.data()
            if (data.trackerAnalysis && data.trackerAnalysis[tracker.id]) {
              totalTranscripts++
              if (data.trackerAnalysis[tracker.id].found) {
                trackerFound++
              }
            }
          })

          const percentage = totalTranscripts > 0 ? Math.round((trackerFound / totalTranscripts) * 100) : 0

          newInsights.push({
            personId: person.id,
            trackerId: tracker.id,
            percentage,
            transcriptsAnalyzed: totalTranscripts,
            trackerFound
          })

          console.log(`📈 ${person.name} - ${tracker.name}: ${percentage}% (${trackerFound}/${totalTranscripts})`)
        }
      }

      setInsights(newInsights)
      
    } catch (error) {
      console.error('Error calculating summary insights:', error)
    }
  }

  // Updated main calculation function
  const calculateInsights = async () => {
    await analyzeAndStoreTrackers()
  }

  const getInsightForPersonAndTracker = (personId: string, trackerId: string) => {
    return insights.find(i => i.personId === personId && i.trackerId === trackerId)
  }

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800'
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800'
    if (percentage >= 40) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }


  if (loading) {
    return (
      <div className="p-10 font-sans">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Trackers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Percentage of calls in this period owned by this team in which tracker terms were mentioned, broken down by team
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={processAllTranscripts}
            disabled={processing || people.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {processing ? 'Processing...' : (hasProcessedBefore ? 'Reprocess All Transcripts' : 'Process All Transcripts')}
          </Button>
        </div>
      </div>

      {/* Create Tracker Section */}
      {showCreateTracker && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create New Tracker</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracker Name
              </label>
              <input
                type="text"
                value={newTracker.name}
                onChange={(e) => setNewTracker(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Next steps"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newTracker.description}
                onChange={(e) => setNewTracker(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What this tracker analyzes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={newTracker.keywords}
                onChange={(e) => setNewTracker(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="next steps, follow up, meeting"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4">
            <Button 
              onClick={createTracker}
              disabled={!newTracker.name.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Create Tracker
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateTracker(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header Row - Fixed 7 Columns */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid" style={{ gridTemplateColumns: `300px repeat(7, 150px) 100px` }}>
            <div className="p-4 font-medium text-gray-900">Person</div>
            
            <div className="p-4 border-l border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-900">Introduction</span>
              </div>
            </div>
            
            <div className="p-4 border-l border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-900">Rapport Building</span>
              </div>
            </div>
            
            <div className="p-4 border-l border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-900">Patient Concerns</span>
              </div>
            </div>
            
            <div className="p-4 border-l border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-900">Overall Assessment</span>
              </div>
            </div>
            
            <div className="p-4 border-l border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-900">Treatment Plan</span>
              </div>
            </div>
            
            <div className="p-4 border-l border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-900">Pricing Questions</span>
              </div>
            </div>
            
            <div className="p-4 border-l border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-900">Follow-up Booking</span>
              </div>
            </div>
            
          </div>
        </div>

        {/* Data Rows */}
        {people.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No people found in transcripts</p>
            <p className="text-sm">People will appear here once transcripts with speaker data are available</p>
          </div>
        ) : (
          people.map(person => (
            <div key={person.id} className="border-b border-gray-100 last:border-b-0">
              <div className="grid" style={{ gridTemplateColumns: `300px repeat(7, 150px) 100px` }}>
                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{person.name}</div>
                      <div className="text-sm text-gray-500">{person.role}</div>
                    </div>
                  </div>
                </div>
                
                {/* Fixed 7 tracker columns */}
                {['introduction', 'rapport-building', 'listening-to-concerns', 'overall-assessment', 'treatment-plan', 'pricing-questions', 'follow-up-booking'].map(trackerId => {
                  const insight = getInsightForPersonAndTracker(person.id, trackerId)
                  const percentage = insight?.percentage || 0
                  
                  return (
                    <div key={trackerId} className="p-4 border-l border-gray-100">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPercentageColor(percentage)}`}>
                        {percentage}%
                      </div>
                    </div>
                  )
                })}
                
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty State for Trackers */}
      {trackers.length === 0 && !showCreateTracker && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trackers yet</h3>
          <p className="text-gray-500 mb-6">Create your first tracker to start analyzing conversations</p>
          <Button 
            onClick={() => setShowCreateTracker(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Tracker
          </Button>
        </div>
      )}
    </div>
  )
} 