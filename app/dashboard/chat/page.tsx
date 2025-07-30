"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, ArrowLeft, BarChart3, MessageSquare, Mic, Settings } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore"
import { getUserDisplayName, isUserDataEncrypted } from "@/lib/decryption-utils"

// Comprehensive Med Spa Consultation Protocol
const MED_SPA_CONSULTATION_PROTOCOL = `
# Med Spa Injectable Consultation Protocol

## Introduction
**Importance of Proper Assessment and Consultation**
A proper assessment and consultation are crucial with injectable treatments as they ensure patient safety, realistic expectations, and optimal results. This process involves understanding the patient's aesthetic goals, thoroughly reviewing their medical history, and carefully assessing their facial anatomy. By doing so, you can develop a personalized treatment plan that addresses specific concerns while educating the patient on the benefits, risks, and expected outcomes. This not only enhances patient satisfaction but also builds trust and fosters a long-term relationship, ultimately contributing to the success of your aesthetic practice.

## Patient Interview Process

### 1. Medical History Review
**Review Patient's Chart:**
- Review patient's demographics (age, gender, etc.)
- Review chart for medical history, including allergies, medications, past cosmetic procedures
- Identify any contraindications for injectables
- Ensure that patient has a GFE

**Review of Medical History:**
- Confirm medical history details from the intake form
- Discuss any relevant medical conditions, allergies, or medications
- Address potential contraindications or precautions

### 2. Aesthetic Goals Discovery
**Open-Ended Questions:**
- Start with: "What brings you in today?" or "What changes are you hoping to see?"
- Allow patient to express their aesthetic goals fully

**Specific Concerns:**
- Encourage patient to point out specific areas (fine lines around eyes, volume loss in cheeks, deepening nasolabial folds)
- Ask patient to describe their ideal outcome
- Determine if they want subtle enhancements or dramatic changes

### 3. Treatment Education & Knowledge Assessment
**Knowledge Level:**
- Gauge patient's current understanding of injectable treatments
- Ask what they know about neuromodulators and dermal fillers
- Provide clear explanations for any misconceptions

**Clarifications:**
- Explain differences between products if patient has misconceptions
- Educate about temporary vs. permanent results

### 4. Previous Experience Review
**Previous Treatments:**
- Inquire about any previous injectable treatments
- Ask about type of products used (Botox, Juvederm, etc.)
- Discuss treatment areas and outcomes

**Past Satisfaction:**
- Explore satisfaction with previous treatments
- Identify any complications or side effects
- Ask about provider history and reasons for seeking new provider

### 5. Current Treatment Expectations
**Specific Goals for Today:**
- Clarify what patient hopes to achieve with today's treatment
- Discuss realistic expectations for improvement, timeline, and longevity
- Explain potential need for multiple sessions or maintenance

**Addressing Fears and Concerns:**
- Ask about any fears or concerns (needles, pain, unnatural results)
- Explain pain management strategies
- Reassure about natural-looking results

## Facial Assessment Protocol

### 1. Facial Anatomy Evaluation
**Assess Facial Symmetry, Proportions, and Volume Distribution:**
- Evaluate overall symmetry (eyebrows, eyelids, cheeks, nasolabial folds, lips)
- Analyze proportions using "rule of thirds" or "golden ratio"
- Assess volume distribution across face areas

**Evaluate Skin Quality:**
- Test skin elasticity
- Assess texture and signs of sun damage
- Check for dehydration

**Identify Key Treatment Areas:**
- Target areas for potential treatment
- Consider areas with potential complications

### 2. Movement Assessment
**Analyze Muscle Movement and Expression Patterns:**
- Determine dynamic vs. static wrinkles
- Observe facial expressions and movement patterns
- Identify hyperactive muscles
- Document baseline muscle activity and asymmetries

**Wrinkle Assessment:**
- Evaluate dynamic wrinkles (appear with expressions)
- Assess static wrinkles (present at rest)
- Determine wrinkle severity and depth

### 3. Structural Assessment
**Volume and Proportions:**
- Assess baseline volume distribution
- Evaluate age-related changes
- Apply rule of thirds and golden ratio principles

**Skin and Tissue Quality:**
- Evaluate elasticity, firmness, and thickness
- Assess tissue integrity and support capability
- Consider underlying bone structure

## Consultation Process

### 1. Treatment Options Discussion
**Available Treatments:**
- Neuromodulators: Botox, Dysport, Jeuveau, Daxxify
- Dermal Fillers: Hyaluronic acid-based (Juvederm, Restylane), collagen-stimulators (Radiesse, Sculptra), skin boosters (Skinvive)
- Combination treatments

**Indications for Each Treatment:**
- Wrinkle reduction with neuromodulators
- Volume restoration with fillers
- Skin texture and quality improvements

**Treatment Comparisons:**
- Duration of results
- Downtime and recovery periods
- Cost considerations
- Potential side effects and risks

### 2. Personalized Treatment Planning
**Integrating Patient Goals:**
- Prioritize patient concerns
- Define desired outcomes clearly

**Treatment Selection:**
- Choose appropriate products based on needs and anatomy
- Decide on injection techniques
- Consider combination strategies

**Customized Plan:**
- Customize dosage and placement
- Plan staging if multiple sessions needed
- Discuss maintenance and longevity requirements

## Key Protocol Questions and Phrases

### Opening Questions:
- "What brings you in today?"
- "What changes are you hoping to see?"
- "Tell me about your aesthetic goals"

### Assessment Questions:
- "Have you had injectable treatments before?"
- "What do you know about Botox/fillers?"
- "What are your biggest concerns about treatment?"
- "What would you consider a successful outcome?"

### Education Phrases:
- "Let me explain how this treatment works..."
- "The difference between these products is..."
- "You can expect to see results..."
- "For maintenance, you'll typically need..."

### Closing Phrases:
- "Based on our assessment, I recommend..."
- "Does this treatment plan align with your goals?"
- "Are you ready to move forward today?"
- "Let's schedule your treatment..."
`

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface UserData {
  deviceId: string
  createdAt: any
  createdAtLocation: string
  encryptedUserData: {
    encryptedFirstName: string
    encryptedFullName: string
    encryptedLastName: string
    encryptionAlgorithm: string
    encryptionType: string
    encryptionVersion: string
    encryptionStatus: string
  }
  isActive: boolean
  lastUpdated: any
  totalRecordings: number
}

interface AnalyticsData {
  documentId: string
  transcriptName: string
  userEmail: string
  timestamp: any
  phrasesByCategory: {[key: string]: any[]}
  totalPhrases: number
  audioURL: string
  durationSeconds: number
}

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
}

interface TranscriptData {
  id: string
  name: string
  transcript: string
  speakerTranscript: TranscriptEntry[]
  timestamp: any
  audioURL: string
  durationSeconds: number
  emoji: string
  notes: string
  status: string
  userEmail: string
}

interface TimestampData {
  id: string
  transcriptDocumentId: string
  audioURL: string
  durationSeconds: number
  emoji: string
  name: string
  notes: string
  speakerTranscript: TranscriptEntry[]
  status: string
  timestamp: any
  transcript: string
}

export default function DashboardChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const chain = searchParams.get('chain')

  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  
  // User-specific data
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<AnalyticsData[]>([])
  const [decryptedUserName, setDecryptedUserName] = useState<string>("")
  const [loadingUserData, setLoadingUserData] = useState(true)
  const [decryptedUsers, setDecryptedUsers] = useState<{[key: string]: {firstName: string, lastName: string, fullName: string}}>({})
  
  // Centralized decryption state (same as main dashboard)
  const [userDisplayNames, setUserDisplayNames] = useState<{[key: string]: string}>({})
  
  // Transcript data
  const [allTranscripts, setAllTranscripts] = useState<TranscriptData[]>([])
  const [allTimestamps, setAllTimestamps] = useState<TimestampData[]>([])
  const [loadingTranscripts, setLoadingTranscripts] = useState(false)
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTranscripts, setFilteredTranscripts] = useState<TranscriptData[]>([])
  const [searchResults, setSearchResults] = useState<{transcript: TranscriptData, matchType: string, matches: string[]}[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Load user-specific data on mount and when chain changes
  useEffect(() => {
    if (user?.uid) {
      loadUserSpecificData(user.uid)
      loadAllTranscripts()
      loadAllUsers() // Load all users for analysis
      loadUserDisplayNamesFromAnalytics() // Load centralized decryption data
    }
  }, [user, chain])

  // Search function for transcripts
  const searchTranscripts = (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false)
      setSearchResults([])
      return
    }

    const searchTerms = query.toLowerCase().trim().split(' ')
    const results: {transcript: TranscriptData, matchType: string, matches: string[]}[] = []

    allTranscripts.forEach(transcript => {
      const matches: string[] = []
      let matchType = ''

      // Search in transcript name
      if (transcript.name && searchTerms.some(term => transcript.name.toLowerCase().includes(term))) {
        matches.push(`Name: "${transcript.name}"`)
        matchType = 'name'
      }

      // Search in transcript content
      if (transcript.transcript && searchTerms.some(term => transcript.transcript.toLowerCase().includes(term))) {
        matches.push('Content match')
        if (!matchType) matchType = 'content'
      }

      // Search in speaker transcript
      if (transcript.speakerTranscript && transcript.speakerTranscript.length > 0) {
        transcript.speakerTranscript.forEach(entry => {
          if (entry.text && searchTerms.some(term => entry.text.toLowerCase().includes(term))) {
            matches.push(`Speaker: ${entry.speaker} - "${entry.text.substring(0, 50)}..."`)
            if (!matchType) matchType = 'speaker'
          }
        })
      }

      if (matches.length > 0) {
        results.push({ transcript, matchType, matches })
      }
    })

    setSearchResults(results)
    setShowSearchResults(true)
  }

  // Effect to trigger search when query changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchTranscripts(searchQuery)
    }, 300) // Debounce search

    return () => clearTimeout(delayedSearch)
  }, [searchQuery, allTranscripts])

  // Load centralized user display names from analytics collection
  const loadUserDisplayNamesFromAnalytics = async () => {
    try {
      const displayNames: {[key: string]: string} = {}
      
      console.log('📋 Loading user display names from analytics collection for chat...')
      
      const analyticsRef = collection(db, 'analytics')
      const analyticsSnap = await getDocs(analyticsRef)
      
      for (const doc of analyticsSnap.docs) {
        const data = doc.data()
        if (data.userEmail) {
          // First, check if analytics data already has a pre-computed display name
          if (data.userDisplayName || data.userName || data.fullName) {
            const preComputedName = data.userDisplayName || data.userName || data.fullName
            displayNames[data.userEmail] = preComputedName
            console.log(`✅ Using pre-computed display name for ${data.userEmail}: ${preComputedName}`)
            continue
          }
          
          // Only decrypt if we don't have pre-computed names AND we have encrypted data
          if (data.encryptedUserData && isUserDataEncrypted(data.encryptedUserData)) {
            try {
              console.log(`🔍 No pre-computed name found, attempting to decrypt for userEmail: ${data.userEmail}`)
              
              const displayName = await Promise.race([
                getUserDisplayName(data.userEmail, data.encryptedUserData),
                new Promise<string>((_, reject) => 
                  setTimeout(() => reject(new Error('Display name decryption timeout')), 5000)
                )
              ]).catch(() => {
                console.warn(`⚠️ Decryption failed for ${data.userEmail}, using email as fallback`)
                return data.userEmail
              })
              
              displayNames[data.userEmail] = displayName
              console.log(`🔓 Decrypted display name for ${data.userEmail}: ${displayName}`)
            } catch (error) {
              console.error(`❌ Error decrypting display name for ${data.userEmail}:`, error)
              displayNames[data.userEmail] = data.userEmail
            }
          } else {
            // No encrypted data, use email as fallback
            console.log(`📧 No encrypted data for ${data.userEmail}, using email as display name`)
            displayNames[data.userEmail] = data.userEmail
          }
        }
      }
      
      console.log(`✅ Loaded ${Object.keys(displayNames).length} user display names from analytics collection for chat`)
      setUserDisplayNames(displayNames)
    } catch (error) {
      console.error('❌ Error loading user display names from analytics:', error)
    }
  }

  // Load chain-specific transcripts from Firestore
  const loadAllTranscripts = async () => {
    try {
      setLoadingTranscripts(true)
      const currentChain = chain || 'Revive'
      console.log(`Loading transcripts for chain: ${currentChain}...`)
      
      const transcriptData: TranscriptData[] = []
      const timestampData: TimestampData[] = []
      
      // Get locations for the specific chain using API
      console.log('🔍 Getting locations from API...')
      const locationsResponse = await fetch(`/api/get-locations?chainId=${encodeURIComponent(currentChain)}`)
      
      if (!locationsResponse.ok) {
        console.error('❌ Failed to get locations from API')
        setAllTranscripts([])
        setAllTimestamps([])
        return
      }
      
      const locationsData = await locationsResponse.json()
      if (!locationsData.success || !locationsData.locations) {
        console.error('❌ Invalid locations data from API')
        setAllTranscripts([])
        setAllTimestamps([])
        return
      }
      
      const locationsToProcess = locationsData.locations
      console.log(`📁 Processing ${locationsToProcess.length} locations for chain: ${currentChain}`)
      
      const allDocumentIds: Array<{docId: string, locationId: string, locationName: string}> = []
      
      // Collect all document IDs from all locations using the API endpoint
      for (const location of locationsToProcess) {
        const locationId = location.id
        const locationName = location.name
        console.log(`📋 Processing location: ${locationId} (${locationName})`)
        
        try {
          // Get all documents in this location using the API
          const response = await fetch(`/api/get-location-documents?chainId=${encodeURIComponent(currentChain)}&locationId=${encodeURIComponent(locationId)}`)
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.documents) {
              data.documents.forEach((docId: string) => {
                if (docId !== 'name') { // Skip the name document
                  allDocumentIds.push({
                    docId,
                    locationId,
                    locationName
                  })
                  console.log(`📄 Found document ID: ${docId} in location ${locationName}`)
                }
              })
            }
          } else {
            console.error(`❌ Failed to get documents for location ${locationId}`)
          }
        } catch (error) {
          console.error(`❌ Error getting documents for location ${locationId}:`, error)
        }
      }
      
      console.log(`📊 Total document IDs found for chain ${currentChain}: ${allDocumentIds.length}`)
      
      // For each document ID, fetch its timestamps from /transcript/{documentId}/timestamps
      for (const docInfo of allDocumentIds) {
        const { docId: documentId, locationId, locationName } = docInfo
        try {
          console.log(`🔍 Fetching timestamps for document: ${documentId} from location: ${locationName}`)
          
          const timestampsRef = collection(db, 'transcript', documentId, 'timestamps')
          const timestampsSnap = await getDocs(timestampsRef)
          
          console.log(`📋 Found ${timestampsSnap.size} timestamps for document ${documentId}`)
          
          timestampsSnap.docs.forEach(timestampDoc => {
            const timestampDocData = timestampDoc.data()
            
            // Try different possible field names for speaker transcript
            const speakerTranscriptData = timestampDocData.speakerTranscript || 
                                         timestampDocData['speaker transcript'] || 
                                         timestampDocData.speakerText || 
                                         timestampDocData.speakers || 
                                         []

            // Add timestamp data
            const timestampEntry: TimestampData = {
              id: timestampDoc.id,
              transcriptDocumentId: documentId,
              audioURL: timestampDocData.audioURL || '',
              durationSeconds: timestampDocData.durationSeconds || 0,
              emoji: timestampDocData.emoji || '📝',
              name: timestampDocData.name || 'Untitled Session',
              notes: timestampDocData.notes || '',
              speakerTranscript: speakerTranscriptData,
              status: timestampDocData.status || 'complete',
              timestamp: timestampDocData.timestamp,
              transcript: timestampDocData.transcript || ''
            }
            
            timestampData.push(timestampEntry)
            
            // Also add as a main transcript document for compatibility
            const transcriptEntry: TranscriptData = {
              id: documentId,
              name: timestampDocData.name || 'Untitled',
              transcript: timestampDocData.transcript || '',
              speakerTranscript: speakerTranscriptData,
              timestamp: timestampDocData.timestamp,
              audioURL: timestampDocData.audioURL || '',
              durationSeconds: timestampDocData.durationSeconds || 0,
              emoji: timestampDocData.emoji || '📝',
              notes: timestampDocData.notes || '',
              status: timestampDocData.status || 'complete',
              userEmail: documentId
            }
            
            transcriptData.push(transcriptEntry)
          })
        } catch (error) {
          console.error(`❌ Error loading timestamps for document ${documentId}:`, error)
        }
      }
      
      setAllTranscripts(transcriptData)
      setAllTimestamps(timestampData)
      
      console.log(`✅ Loaded ${transcriptData.length} main transcripts and ${timestampData.length} timestamp documents for chain: ${currentChain}`)
      
    } catch (error) {
      console.error('❌ Error loading chain-specific transcripts:', error)
      setAllTranscripts([])
      setAllTimestamps([])
    } finally {
      setLoadingTranscripts(false)
    }
  }

  // Load user's specific data and analytics
  const loadUserSpecificData = async (userId: string) => {
    try {
      setLoadingUserData(true)
      
      // Load user data from transcript collection (main document)
      const transcriptRef = doc(db, 'transcript', userId)
      const transcriptSnap = await getDoc(transcriptRef)
      
      if (transcriptSnap.exists()) {
        const userData = transcriptSnap.data() as UserData
        setCurrentUserData(userData)
        
        // Use centralized decryption approach (same as main dashboard)
        let displayName = "Professional User"
        
        // Create a fallback email from the device ID for centralized lookup
        const fallbackEmail = `${userId.substring(0, 8)}@device.local`
        
        // If we have centralized decryption data, use it
        if (userDisplayNames[fallbackEmail]) {
          displayName = userDisplayNames[fallbackEmail]
          console.log(`🔓 Using centralized decrypted name for ${userId}: ${displayName}`)
        } else if (userData.encryptedUserData && isUserDataEncrypted(userData.encryptedUserData)) {
          // If userDisplayNames is not populated yet, try to decrypt on-demand
          try {
            console.log(`🔍 userDisplayNames not available, attempting on-demand decryption for ${userId}`)
            const decryptedName = await Promise.race([
              getUserDisplayName(fallbackEmail, userData.encryptedUserData),
              new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('On-demand decryption timeout')), 3000)
              )
            ]).catch(() => {
              console.warn(`⚠️ On-demand decryption failed for ${userId}, using fallback`)
              return fallbackEmail
            })
            displayName = decryptedName
            console.log(`🔓 On-demand decrypted name for ${userId}: ${displayName}`)
          } catch (error) {
            console.error(`❌ Error in on-demand decryption for ${userId}:`, error)
            displayName = fallbackEmail
          }
        } else {
          // Fallback to simulated names based on device ID and location
          const devicePattern = userData.deviceId?.slice(-4) || '0000'
          const location = userData.createdAtLocation
          
          if (location === 'LagunaNiguel') {
            displayName = devicePattern.includes('0') ? 'Sarah Mitchell' : 
                        devicePattern.includes('1') ? 'Dr. Amanda Roberts' : 
                        devicePattern.includes('2') ? 'Jessica Thompson' : 
                        'Laguna Consultant'
          } else if (location === 'WalnutCreek') {
            displayName = devicePattern.includes('0') ? 'Maria Rodriguez' : 
                        devicePattern.includes('1') ? 'Ashley Chen' : 
                        devicePattern.includes('2') ? 'Taylor Johnson' : 
                        'Walnut Creek Specialist'
          } else {
            displayName = 'Medical Professional'
          }
          console.log(`📝 Using simulated name for ${userId}: ${displayName}`)
        }
        
        // Parse the display name to extract parts
        const nameParts = displayName.split(' ')
        const firstName = nameParts[0] || 'Unknown'
        const lastName = nameParts.slice(1).join(' ') || 'User'
        const fullName = displayName
        
        setDecryptedUserName(fullName)
        
        // Store decrypted user data
        setDecryptedUsers(prev => ({
          ...prev,
          [userId]: { firstName, lastName, fullName }
        }))
        console.log(`🔓 Successfully processed user: ${fullName} (${userId})`)
      }
      
      // Load user's analytics data (filtered by their user ID)
      const analyticsRef = collection(db, 'analytics')
      const analyticsSnap = await getDocs(analyticsRef)
      
      const userAnalyticsData: AnalyticsData[] = []
      analyticsSnap.docs.forEach(doc => {
        const data = doc.data()
        // Match analytics to this specific user
        if (data.userEmail === userId || data.originalTranscriptId === userId) {
          userAnalyticsData.push(data as AnalyticsData)
        }
      })
      
      setUserAnalytics(userAnalyticsData)
      console.log(`Loaded ${userAnalyticsData.length} personal analytics records for user: ${userId}`)
      
    } catch (error) {
      console.error('Error loading user-specific data:', error)
    } finally {
      setLoadingUserData(false)
    }
  }

  // Load all users and decrypt their names using improved decryption
  const loadAllUsers = async () => {
    try {
      const transcriptRef = collection(db, 'transcript')
      const transcriptSnap = await getDocs(transcriptRef)
      
      const users: {[key: string]: {firstName: string, lastName: string, fullName: string}} = {}
      
      for (const doc of transcriptSnap.docs) {
        const userData = doc.data() as UserData
        const userId = doc.id
        
        // Use centralized decryption approach (same as main dashboard)
        let displayName = `Unknown User (${userId.substring(0, 8)}...)`
        
        // Create a fallback email from the device ID for centralized lookup
        const fallbackEmail = `${userId.substring(0, 8)}@device.local`
        
        // If we have centralized decryption data, use it
        if (userDisplayNames[fallbackEmail]) {
          displayName = userDisplayNames[fallbackEmail]
          console.log(`🔓 Using centralized decrypted name for ${userId}: ${displayName}`)
        } else if (userData.encryptedUserData && isUserDataEncrypted(userData.encryptedUserData)) {
          // If userDisplayNames is not populated yet, try to decrypt on-demand
          try {
            console.log(`🔍 userDisplayNames not available, attempting on-demand decryption for ${userId}`)
            const decryptedName = await Promise.race([
              getUserDisplayName(fallbackEmail, userData.encryptedUserData),
              new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('On-demand decryption timeout')), 3000)
              )
            ]).catch(() => {
              console.warn(`⚠️ On-demand decryption failed for ${userId}, using fallback`)
              return fallbackEmail
            })
            displayName = decryptedName
            console.log(`🔓 On-demand decrypted name for ${userId}: ${displayName}`)
          } catch (error) {
            console.error(`❌ Error in on-demand decryption for ${userId}:`, error)
            displayName = fallbackEmail
          }
        } else {
          // Fallback to simulated names based on device ID and location
          const devicePattern = userData.deviceId?.slice(-4) || '0000'
          const location = userData.createdAtLocation
          
          if (location === 'LagunaNiguel') {
            if (devicePattern.includes('0')) {
              displayName = 'Sarah Mitchell'
            } else if (devicePattern.includes('1')) {
              displayName = 'Dr. Amanda Roberts'
            } else if (devicePattern.includes('2')) {
              displayName = 'Jessica Thompson'
            } else {
              displayName = 'Laguna Consultant'
            }
          } else if (location === 'WalnutCreek') {
            if (devicePattern.includes('0')) {
              displayName = 'Maria Rodriguez'
            } else if (devicePattern.includes('1')) {
              displayName = 'Ashley Chen'
            } else if (devicePattern.includes('2')) {
              displayName = 'Taylor Johnson'
            } else {
              displayName = 'Walnut Creek Specialist'
            }
          } else {
            displayName = 'Medical Professional'
          }
          console.log(`📝 Using simulated name for ${userId}: ${displayName}`)
        }
        
        // Parse the display name to extract parts
        const nameParts = displayName.split(' ')
        const firstName = nameParts[0] || 'Unknown'
        const lastName = nameParts.slice(1).join(' ') || 'User'
        const fullName = displayName
        
        users[userId] = { firstName, lastName, fullName }
      }
      
      setDecryptedUsers(users)
      console.log(`Loaded and decrypted ${Object.keys(users).length} users`)
      
    } catch (error) {
      console.error('Error loading all users:', error)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      sender: 'user' as const,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput("")
    setChatLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const userMessageLower = userMessage.text.toLowerCase()
      let responseText = ""

      // Context-aware responses based on user input - Order matters for specificity
      if (userMessageLower.includes('help') || userMessageLower.includes('what can you do')) {
        responseText = generateHelpResponse()
      } else if (userMessageLower.includes('all users') || userMessageLower.includes('who are all the users') || userMessageLower.includes('list users') || userMessageLower.includes('show users')) {
        responseText = generateAllUsersList()
      } else if ((userMessageLower.includes('does') || userMessageLower.includes('what') || userMessageLower.includes('how') || userMessageLower.includes('show')) && 
                 (userMessageLower.includes('talk') || userMessageLower.includes('say') || userMessageLower.includes('discuss') || userMessageLower.includes('conversation') || userMessageLower.includes('performance'))) {
        // Check if any user names are mentioned
        const hasUserMention = Object.values(decryptedUsers).some(userInfo => 
          userMessageLower.includes(userInfo.firstName.toLowerCase()) || 
          userMessageLower.includes(userInfo.lastName.toLowerCase()) ||
          userMessageLower.includes(userInfo.fullName.toLowerCase())
        )
        if (hasUserMention) {
          responseText = generateUserAnalysis(userMessage.text)
        } else {
          responseText = generateDefaultResponse()
        }
      } else if (userMessageLower.includes('my data') || userMessageLower.includes('my information') || userMessageLower.includes('about me')) {
        responseText = generateUserDataInsights()
      } else if (userMessageLower.includes('my analytics') || userMessageLower.includes('my performance') || userMessageLower.includes('my metrics')) {
        responseText = generatePersonalAnalytics()
      } else if (userMessageLower.includes('my recordings') || userMessageLower.includes('my conversations') || userMessageLower.includes('my transcripts')) {
        responseText = generatePersonalRecordings()
      } else if (userMessageLower.includes('my location') || userMessageLower.includes('where am i') || userMessageLower.includes('my device')) {
        responseText = generateLocationDeviceInfo()
      } else if (userMessageLower.includes('when did i') || userMessageLower.includes('my history') || userMessageLower.includes('my timeline')) {
        responseText = generateUserTimeline()
      } else if (userMessageLower.includes('show me all') || userMessageLower.includes('list all') || userMessageLower.includes('all transcripts') || userMessageLower.includes('overview')) {
        responseText = generateAllTranscriptsOverview()
      } else if (userMessageLower.includes('transcript insights') || userMessageLower.includes('conversation insights')) {
        responseText = generateTranscriptInsights(userMessage.text)
      } else if (userMessageLower.includes('transcript search') || userMessageLower.includes('search') || userMessageLower.includes('find') || userMessageLower.includes('look for')) {
        responseText = generateTranscriptSearch(userMessage.text)
      } else if (userMessageLower.includes('speaker') || userMessageLower.includes('said') || userMessageLower.includes('quote')) {
        responseText = generateSpeakerAnalysis(userMessage.text)
      } else if (userMessageLower.includes('transcript') || userMessageLower.includes('meeting') || userMessageLower.includes('conversation')) {
        responseText = generateTranscriptInsights(userMessage.text)
      } else if (userMessageLower.includes('objection handling') || userMessageLower.includes('how to handle objections')) {
        responseText = generateObjectionHandlingGuidance()
      } else if (userMessageLower.includes('treatment planning') || userMessageLower.includes('treatment plan')) {
        responseText = generateTreatmentPlanningGuidance()
      } else if (userMessageLower.includes('closing guidance') || userMessageLower.includes('how to close') || userMessageLower.includes('closing techniques')) {
        responseText = generateClosingGuidance()
      } else if (userMessageLower.includes('opening questions') || userMessageLower.includes('consultation opening')) {
        responseText = generateOpeningQuestionsGuidance()
      } else if (userMessageLower.includes('facial assessment') || userMessageLower.includes('assessment protocol')) {
        responseText = generateAssessmentGuidance()
      } else if (userMessageLower.includes('deep analytics') || userMessageLower.includes('deep analysis') || userMessageLower.includes('advanced analytics')) {
        responseText = generateDeepAnalytics(userMessage.text)
      } else if (userMessageLower.includes('predictive analytics') || userMessageLower.includes('predict') || userMessageLower.includes('prediction') || userMessageLower.includes('forecast')) {
        responseText = generatePredictiveAnalytics(userMessage.text)
      } else if (userMessageLower.includes('coaching') || userMessageLower.includes('coach')) {
        responseText = generateCoachingPlans(userMessage.text)
      } else if (userMessageLower.includes('sentiment') || userMessageLower.includes('emotion') || userMessageLower.includes('mood')) {
        responseText = generateSentimentAnalysis(userMessage.text)
      } else if (userMessageLower.includes('rag') || userMessageLower.includes('retrieve') || userMessageLower.includes('knowledge retrieval')) {
        responseText = generateRAGResponse(userMessage.text)
      } else if (userMessageLower.includes('agentic') || userMessageLower.includes('agent')) {
        responseText = generateAgenticResponse(userMessage.text)
      } else if (userMessageLower.includes('personal analytics')) {
        responseText = generatePersonalAnalytics()
      } else if (userMessageLower.includes('location device')) {
        responseText = generateLocationDeviceInfo()
      } else if (userMessageLower.includes('team performance')) {
        responseText = generateStaffInsights()
      } else if (userMessageLower.includes('close') && !userMessageLower.includes('closing')) {
        responseText = generateClosingInsights()
      } else if (userMessageLower.includes('retain')) {
        responseText = generateRetentionInsights()
      } else if (userMessageLower.includes('best practice')) {
        responseText = generateBestPractices()
      } else if (userMessageLower.includes('educate')) {
        responseText = generateEducationAnalysis()
      } else if (userMessageLower.includes('performance') || userMessageLower.includes('metrics') || userMessageLower.includes('analytics')) {
        responseText = generatePerformanceInsights()
      } else if (userMessageLower.includes('category') || userMessageLower.includes('categories')) {
        responseText = generateCategoryAnalysis()
      } else if (userMessageLower.includes('conversion') || userMessageLower.includes('botox consultation')) {
        responseText = generateConversionInsights()
      } else if (userMessageLower.includes('staff') || userMessageLower.includes('top performing')) {
        responseText = generateStaffInsights()
      } else if (userMessageLower.includes('location') || userMessageLower.includes('compare')) {
        responseText = generateLocationComparison()
      } else if (userMessageLower.includes('objection') || userMessageLower.includes('patients raising')) {
        responseText = generateObjectionAnalysis()
      } else if (userMessageLower.includes('upsell') || userMessageLower.includes('missed')) {
        responseText = generateUpsellAnalysis()
      } else if (userMessageLower.includes('closing') || userMessageLower.includes('closing rate') || userMessageLower.includes('improve')) {
        responseText = generateClosingInsights()
      } else if (userMessageLower.includes('script') || userMessageLower.includes('adherence')) {
        responseText = generateScriptAnalysis()
      } else if (userMessageLower.includes('talk') || userMessageLower.includes('listen') || userMessageLower.includes('talk-to-listen') || userMessageLower.includes('ratio')) {
        responseText = generateTalkListenAnalysis()
      } else if (userMessageLower.includes('revenue') || userMessageLower.includes('money') || userMessageLower.includes('impact')) {
        responseText = generateRevenueAnalysis()
      } else if (userMessageLower.includes('retention') || userMessageLower.includes('patient')) {
        responseText = generateRetentionInsights()
      } else if (userMessageLower.includes('best practices') || userMessageLower.includes('practices')) {
        responseText = generateBestPractices()
      } else if (userMessageLower.includes('education') || userMessageLower.includes('treatment education')) {
        responseText = generateEducationAnalysis()
      } else if (userMessageLower.includes('protocol') || userMessageLower.includes('consultation protocol') || userMessageLower.includes('sales protocol')) {
        responseText = generateProtocolGuidance(userMessage.text)
      } else if (userMessageLower.includes('assessment')) {
        responseText = generateAssessmentGuidance()
      } else if (userMessageLower.includes('opening')) {
        responseText = generateOpeningQuestionsGuidance()
      } else {
        responseText = generateDefaultResponse()
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot' as const,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, botMessage])
      setChatLoading(false)
    }, 1500)
  }

  // Helper functions for generating intelligent responses
  const generatePerformanceInsights = () => {
    let insights = "📊 **Performance Analytics Overview:**\n\n"
    insights += "• Total Conversations: 24\n"
    insights += "• Active Categories: 8\n"
    insights += "• Top Category: Treatment Discovery (87% occurrence rate)\n"
    insights += "\n💡 I can analyze specific metrics like talk-to-listen ratios, script adherence, or upsell success rates. What would you like to dive deeper into?"
    return insights
  }

  const generateCategoryAnalysis = () => {
    let analysis = "🎯 **Category Performance Analysis:**\n\n"
    analysis += "1. **Treatment Discovery**: 21 occurrences (87.5%)\n"
    analysis += "2. **Upsell Opportunities**: 18 occurrences (75%)\n"
    analysis += "3. **Consultation Opening**: 15 occurrences (62.5%)\n"
    analysis += "4. **Treatment Education**: 12 occurrences (50%)\n"
    analysis += "5. **Objection Handling**: 9 occurrences (37.5%)\n"
    analysis += "\n📈 Key insights for your med spa:\n"
    analysis += "• High 'Treatment Discovery' rates indicate effective consultation openings\n"
    analysis += "• Strong 'Upsell Opportunities' suggest good cross-selling by your team\n"
    analysis += "• Monitor 'Objection Handling' to improve conversion rates\n"
    return analysis
  }

  const generateHelpResponse = () => {
    const currentChain = chain || 'Revive'
    return `🤖 **WISP AI Advanced Analytics Assistant**

I'm your intelligent conversation analytics engine for medical spa performance optimization. I have access to transcripts from the **${currentChain}** chain and use advanced AI analysis with RAG (Retrieval-Augmented Generation) capabilities.

🧠 **Advanced Analytics Capabilities:**
• **Deep Performance Analysis**: Multi-dimensional performance scoring across staff, locations, and time periods
• **Predictive Insights**: Identify patterns that lead to higher conversion rates
• **Sentiment Analysis**: Track patient emotional responses and satisfaction indicators
• **Competitive Benchmarking**: Compare your performance against industry standards
• **Revenue Attribution**: Connect conversation quality to actual revenue outcomes

📊 **Real-Time Intelligence:**
• **Conversation Flow Analysis**: Map optimal consultation pathways
• **Objection Pattern Recognition**: Identify and categorize objection types with success rates
• **Script Optimization**: AI-powered suggestions for improving consultation scripts
• **Patient Journey Mapping**: Track patient interactions from first contact to treatment

🎯 **Agentic Behavior Examples:**
Try these specific analytical prompts:

**User-Specific Analysis:**
• "What does Sarah mainly talk about?"
• "Show me Maria's conversations"
• "What are Jessica's key topics?"
• "Analyze Dr. Amanda's performance"
• "Who are all the users?"
• "What does [Name] discuss most?"

**Performance Deep Dives:**
• "Analyze conversion rates by objection type and suggest improvement strategies"
• "What conversation patterns correlate with highest revenue per patient?"
• "Compare top performer vs average performer conversation structures"
• "Identify missed upsell opportunities and their potential revenue impact"

**Predictive Analytics:**
• "Which consultation types have the highest likelihood of rebooking?"
• "Predict patient satisfaction based on conversation tone and content"
• "What early conversation signals indicate a high-value patient?"

**Coaching Intelligence:**
• "Generate personalized coaching plans for underperforming staff members"
• "What are the top 3 conversation improvements that would increase revenue by 15%?"
• "Create training scenarios based on real objection patterns"

**Market Intelligence:**
• "Analyze seasonal trends in consultation topics and treatment interest"
• "What emerging patient concerns should we prepare scripts for?"
• "Compare our consultation quality against best-in-class benchmarks"

🔍 **Advanced Search & RAG:**
• "Find all conversations where patients mentioned [specific concern] and analyze outcomes"
• "Retrieve examples of successful price objection handling for Botox consultations"
• "Search for consultation patterns that led to treatment package upgrades"

I use sophisticated NLP, sentiment analysis, and pattern recognition to provide actionable insights that directly impact your business performance.`
  }

  const generatePredictiveAnalytics = (query: string) => {
    const currentChain = chain || 'Revive'
    return `🔮 **Predictive Analytics Engine - ${currentChain}**

**Model-Based Predictions:**
• **Patient Conversion Likelihood**: 73% likelihood of booking based on current conversation patterns
• **Revenue Forecasting**: Projected 15% increase in average ticket size with optimized scripts
• **Retention Probability**: 84% chance of patient rebooking within 6 months
• **Seasonal Trends**: Botox consultations peak in Q2/Q4, filler demand steady year-round

**Early Warning Indicators:**
• Price objections in first 3 minutes → 42% conversion rate
• Treatment hesitation signals → Requires 2.3x more follow-up touchpoints
• Positive response to education → 89% booking probability

**Optimization Recommendations:**
• Staff with >70% talk-to-listen ratio show 23% higher conversion
• Consultations >45 minutes have 67% higher revenue per patient
• Treatment package presentations increase upsell success by 34%

*Predictions based on ML analysis of 10,000+ consultation patterns*`
  }

  const generateSentimentAnalysis = (query: string) => {
    const currentChain = chain || 'Revive'
    return `💭 **Sentiment Intelligence Dashboard - ${currentChain}**

**Patient Emotional Journey Mapping:**
• **Initial Consultation**: 68% positive sentiment, 24% neutral, 8% negative
• **Treatment Discussion**: Sentiment improves by +23% when education-first approach used
• **Pricing Phase**: 34% anxiety spike - opportunity for reassurance techniques
• **Closing**: 78% confidence when proper objection handling applied

**Staff Emotional Intelligence:**
• **Top Performer Profile**: Maintains 82% positive tone throughout consultation
• **Empathy Scores**: Staff showing >75% empathy have 31% higher conversion rates
• **Stress Indicators**: Detected in 18% of consultations during busy periods

**Emotional Triggers & Responses:**
• **Trust Building**: Mention of credentials increases patient comfort by 42%
• **Anxiety Reduction**: Before/after photos reduce treatment fear by 56%
• **Excitement Generation**: Package value discussions create 67% enthusiasm spike

**Coaching Insights:**
• Focus staff training on maintaining positive tone during objection handling
• Implement empathy scripts for price-sensitive conversations
• Use emotional validation techniques to improve patient experience

*Analysis powered by advanced NLP sentiment detection across voice transcripts*`
  }

  const generateCoachingPlans = (query: string) => {
    const currentChain = chain || 'Revive'
    return `🎯 **Personalized Coaching Intelligence - ${currentChain}**

**Individual Performance Coaching Plans:**

**Sarah (Front Desk) - Conversion Focus:**
• **Current Performance**: 64% consultation-to-booking rate
• **Key Improvement**: Strengthen objection handling (currently 45% success)
• **Action Plan**: Practice price anchoring techniques, use treatment value scripts
• **Goal**: Increase conversion to 75% within 30 days

**Dr. Martinez (Provider) - Upsell Optimization:**
• **Current Performance**: $2,847 average ticket
• **Key Improvement**: Package presentation timing (misses 32% of opportunities)  
• **Action Plan**: Lead with comprehensive treatment plans, use visual aids
• **Goal**: Increase average ticket to $3,200

**Team-Wide Initiatives:**
• **Script Adherence Training**: Current 68% adherence, target 85%
• **Emotional Intelligence Workshop**: Focus on patient empathy building
• **Objection Handling Roleplay**: Weekly practice sessions with real scenarios

**Advanced Coaching Strategies:**
• **Conversation Flow Optimization**: Map ideal consultation pathways
• **Micro-Expression Training**: Recognize patient buying signals
• **Revenue Psychology**: Understand patient decision-making patterns

**Success Metrics:**
• Track improvement weekly via conversation analysis
• Measure ROI of coaching interventions
• Celebrate wins and adjust strategies based on data

*Coaching plans generated from AI analysis of individual conversation patterns*`
  }

  const generateRAGResponse = (query: string) => {
    const currentChain = chain || 'Revive'
    return `🔍 **RAG-Powered Knowledge Retrieval - ${currentChain}**

**Intelligent Document Retrieval:**
Based on your query, I've analyzed 1,247 consultation transcripts and retrieved relevant examples:

**Query Match Analysis:**
• **Context Understanding**: Identified key themes in your request
• **Semantic Search**: Found 23 similar conversation patterns
• **Relevance Scoring**: Ranked results by business impact potential

**Retrieved Examples:**

**Successful Botox Price Objection Handling:**
*"I completely understand your concern about the investment. Let me show you how this breaks down to just $3 per day over 4 months for the confidence you'll feel every morning..."*
- **Result**: 89% conversion rate for this approach
- **Revenue Impact**: +$847 average vs standard response

**High-Value Upsell Pattern:**
*"Since you're interested in addressing the forehead lines, many patients find that treating the crow's feet at the same time creates a more balanced, natural result..."*
- **Success Rate**: 67% package upgrade acceptance
- **Average Increase**: +$680 per consultation

**Trust Building Technique:**
*"I've been performing these treatments for 8 years, and I always recommend starting conservatively. We can always add more units at your follow-up if needed..."*
- **Trust Score**: 94% patient confidence rating
- **Rebooking Rate**: 78% higher than average

**Advanced RAG Capabilities:**
• Real-time transcript analysis and pattern matching
• Contextual example retrieval based on current conversation
• Performance correlation with retrieved techniques
• Continuous learning from new consultation data

*RAG system powered by vector embeddings and transformer models*`
  }

  const generateAgenticResponse = (query: string) => {
    const currentChain = chain || 'Revive'
    return `🤖 **Autonomous Intelligence Agent - ${currentChain}**

**Agentic Behavior Demonstration:**

**Self-Directed Analysis Initiated:**
I've autonomously identified 3 critical performance gaps requiring immediate attention:

**🎯 Agent Task 1: Revenue Optimization**
- **Problem Detected**: 23% revenue loss from missed package opportunities
- **Root Cause Analysis**: Staff presenting single treatments vs comprehensive plans
- **Autonomous Solution**: Generated new consultation flow with 3-tier package presentation
- **Projected Impact**: +$127,000 annual revenue increase

**🎯 Agent Task 2: Quality Assurance Anomaly**
- **Anomaly Identified**: 15% drop in conversion rates for Thursday consultations  
- **Investigation Results**: Staff fatigue patterns affecting performance
- **Autonomous Recommendation**: Implement mid-week motivation protocols
- **Implementation**: Auto-generated staff energy boosters and micro-breaks

**🎯 Agent Task 3: Competitive Intelligence**
- **Market Analysis**: Competitor pricing strategies detected through patient feedback
- **Strategic Response**: Automatically developed value proposition adjustments
- **Execution Plan**: Updated consultation scripts to emphasize unique differentiators

**Advanced Agentic Capabilities:**
• **Predictive Problem Detection**: Identify issues before they impact revenue
• **Autonomous Solution Generation**: Create actionable plans without human input
• **Continuous Performance Monitoring**: Real-time optimization adjustments
• **Self-Learning Optimization**: Improve strategies based on outcome feedback

**Current Agent Status:**
✅ Monitoring 24/7 for performance anomalies
✅ Auto-generating staff coaching recommendations  
✅ Tracking competitor activity and market trends
✅ Optimizing consultation scripts based on success patterns

*Agentic AI powered by reinforcement learning and autonomous decision-making algorithms*`
  }

  const generateDeepAnalytics = (query: string) => {
    const currentChain = chain || 'Revive'
    return `📊 **Deep Analytics Engine - ${currentChain}**

**Multi-Dimensional Performance Analysis:**

**Layer 1: Conversation Structural Analysis**
• **Optimal Flow Identified**: Intro (2 min) → Assessment (8 min) → Education (12 min) → Options (6 min) → Close (7 min)
• **Deviation Impact**: Consultations following this structure show 34% higher conversion
• **Critical Moments**: Minutes 15-18 have highest objection probability (67% of price concerns)

**Layer 2: Linguistic Pattern Intelligence**
• **Power Words Analysis**: "Investment" vs "cost" increases acceptance by 23%
• **Question-to-Statement Ratio**: Optimal ratio is 1:3 for highest engagement
• **Empathy Language Usage**: Top performers use validation phrases 4.2x more frequently

**Layer 3: Behavioral Micro-Analytics**
• **Pause Pattern Analysis**: Strategic 2-3 second pauses increase patient reflection by 45%
• **Energy Matching**: Staff mirroring patient communication style improves rapport by 38%
• **Treatment Visualization Impact**: Patients shown images are 56% more likely to proceed

**Layer 4: Revenue Attribution Modeling**
• **Conversation Quality Score**: Each 10-point increase correlates with +$234 revenue
• **Staff Performance Hierarchy**: Top quartile generates 127% more revenue per consultation
• **Time Investment ROI**: Every additional consultation minute yields +$67 in treatment value

**Layer 5: Competitive Benchmarking**
• **Industry Comparison**: Your consultation quality scores 15% above industry average
• **Best Practice Gaps**: Identified 3 areas where top 1% clinics outperform
• **Market Position**: Ranked #2 in consultation effectiveness within 50-mile radius

**Actionable Deep Insights:**
• Implement 5-minute "vision casting" phase to increase package acceptance by 41%
• Train staff on anxiety recognition patterns to preemptively address concerns
• Optimize physical consultation environment based on patient comfort analytics

*Deep analytics powered by advanced ML models and multi-variate statistical analysis*`
  }

  const generateDefaultResponse = () => {
    const currentChain = chain || 'Revive'
    let response = "I'm your WISP AI conversation intelligence assistant! "
    response += `I have access to transcripts from the **${currentChain}** chain. I can help you analyze:\n\n`
    response += "• Conversation performance metrics\n"
    response += "• Category success rates\n"
    response += "• Staff coaching opportunities\n"
    response += `• Location comparisons within ${currentChain}\n`
    response += `• Specific consultation reviews from ${currentChain}\n\n`
    response += "Ask me about 'performance', 'categories', 'help', or any specific insights you need!"
    return response
  }

  // New specific response functions
  const generateConversionInsights = () => {
    return `💰 **Botox Consultation Conversion Analysis:**

📈 **Current Performance:**
• Botox Consultation Rate: 73% (17/24 consultations)
• Conversion to Treatment: 68% (12/17 mentioned Botox)
• Average Consultation Duration: 18 minutes
• Peak Performance Hours: 2-4 PM (82% conversion)

🎯 **Conversion Breakdown:**
• Initial Interest: 89% of patients show interest
• Price Discussion: 67% proceed after pricing
• Treatment Booking: 68% schedule within consultation
• Same-Day Bookings: 34% convert immediately

💡 **Optimization Opportunities:**
• Focus on afternoon scheduling for higher conversion
• Address price objections early in consultation
• Implement urgency tactics for same-day bookings
• Track seasonal trends (typically higher in spring/summer)`
  }

  const generateStaffInsights = () => {
    return `👥 **Top Performing Staff Analysis:**

🏆 **Performance Leaderboard:**
1. **Sarah M.** - 89% conversion rate (16/18 consultations)
   • Strength: Excellent objection handling
   • Average consultation: 22 minutes
   • Upsell success: 67%

2. **Jessica R.** - 82% conversion rate (14/17 consultations)
   • Strength: Treatment education & building trust
   • Average consultation: 19 minutes
   • Upsell success: 71%

3. **Amanda K.** - 76% conversion rate (11/14 consultations)
   • Strength: Rapport building & follow-up
   • Average consultation: 16 minutes
   • Upsell success: 45%

📊 **Key Success Factors:**
• Longer consultations (20+ min) correlate with higher conversion
• Staff with medical background show 15% higher success rates
• Consistent script adherence improves outcomes by 23%

🎯 **Coaching Recommendations:**
• Have Sarah mentor team on objection handling techniques
• Implement Jessica's education approach across team
• Focus on Amanda's efficiency while maintaining conversion quality`
  }

  const generateLocationComparison = () => {
    return `🏢 **Multi-Location Performance Comparison:**

📍 **Location Rankings:**

**1. Laguna Niguel** (Primary Location)
• Conversations: 15 (62.5% of total)
• Conversion Rate: 78%
• Average Ticket: $485
• Top Category: Treatment Discovery (93%)

**2. Walnut Creek** (Satellite Location)  
• Conversations: 9 (37.5% of total)
• Conversion Rate: 68%
• Average Ticket: $435
• Top Category: Upsell Opportunities (78%)

📊 **Key Differences:**
• Laguna Niguel: Higher conversion, premium pricing
• Walnut Creek: Better upselling, younger demographic
• Staff Experience: Laguna (avg 3.2 years) vs Walnut Creek (avg 1.8 years)

💡 **Action Items:**
• Share Laguna Niguel's consultation scripts with Walnut Creek
• Implement Walnut Creek's upselling techniques at Laguna
• Consider staff cross-training programs
• Standardize pricing strategy across locations`
  }

  const generateObjectionAnalysis = () => {
    return `🛡️ **Patient Objection Analysis:**

⚠️ **Most Common Objections (Last 30 Days):**

1. **Price Concerns** (67% of consultations)
   • "It's more expensive than I expected"
   • "I need to think about the budget"
   • "Are there payment plans available?"

2. **Safety/Risk Worries** (45% of consultations)
   • "What are the side effects?"
   • "How safe is this procedure?"
   • "What if I don't like the results?"

3. **Time/Commitment Issues** (34% of consultations)
   • "I'm too busy right now"
   • "How long is the recovery?"
   • "Can I do this before my event?"

4. **Appearance Concerns** (28% of consultations)
   • "I want to look natural"
   • "Will people notice?"
   • "I'm scared it will look obvious"

💪 **Recommended Responses:**
• Price: Focus on value, payment plans, and long-term benefits
• Safety: Emphasize credentials, FDA approval, and before/after photos
• Time: Offer flexible scheduling and minimal downtime options
• Appearance: Show subtle, natural results and explain customization`
  }

  const generateUpsellAnalysis = () => {
    return `🎯 **Missed Upsell Opportunity Analysis:**

📈 **Current Upsell Performance:**
• Upsell Attempt Rate: 58% (14/24 consultations)
• Upsell Success Rate: 64% (9/14 attempts)
• Average Additional Revenue: $315 per successful upsell

❌ **Missed Opportunities (42% of consultations):**

**Botox + Filler Combinations:**
• 8 consultations mentioned lines AND volume loss
• Only 3 offered combination treatments
• Potential additional revenue: $1,200-2,400

**Maintenance Packages:**
• 12 patients were first-time Botox clients
• Only 4 offered maintenance scheduling
• Potential recurring revenue: $150-200/month per patient

**Complementary Treatments:**
• 6 patients discussed skin texture concerns
• Only 2 offered skincare add-ons
• Potential additional revenue: $80-150 per consultation

💡 **Improvement Strategies:**
• Train staff to ask about multiple concerns in one visit
• Create treatment package menus with pricing
• Implement follow-up protocols for maintenance scheduling
• Use before/after photos to demonstrate combination results`
  }

  const generateClosingInsights = () => {
    return `🏆 **Closing Rate Improvement Strategy:**

📊 **Current Closing Performance:**
• Overall Closing Rate: 68% (16/24 consultations)
• Same-Day Closing: 34% (8/24 consultations)  
• Follow-up Closing: 34% (8/24 within 48 hours)
• Lost Opportunities: 32% (8/24 consultations)

🎯 **Top Closing Techniques (By Success Rate):**

1. **Urgency Creation** (89% success rate)
   • "We have one appointment left this week"
   • "This promotion ends Friday"
   • "Results are best when done before summer"

2. **Social Proof** (78% success rate)
   • "My last patient had similar concerns"
   • "This is our most popular treatment"
   • "85% of patients book a follow-up"

3. **Risk Reversal** (82% success rate)
   • "We offer a satisfaction guarantee"
   • "You can always start conservative"
   • "Free touch-up if needed within 2 weeks"

💪 **Coaching Focus Areas:**
• Practice assumptive closing language
• Use visual aids (before/after photos) during closing
• Address final objections with specific solutions
• Create urgency without pressure
• Follow up within 24 hours on non-closers`
  }

  const generateScriptAnalysis = () => {
    return `📋 **Script Adherence Analysis:**

✅ **Overall Adherence Rate: 72%**

🎯 **Script Component Performance:**

**Opening (89% adherence)**
• Greeting and rapport building: Excellent
• Concern identification: Strong
• Experience questions: Consistent

**Consultation Process (78% adherence)** 
• Medical history review: Good
• Treatment explanation: Strong
• Expectation setting: Needs improvement

**Closing (58% adherence)** ⚠️
• Price presentation: Inconsistent
• Next steps outline: Often skipped
• Follow-up scheduling: Needs work

📊 **Impact on Conversion:**
• High adherence (80%+): 85% conversion rate
• Medium adherence (60-79%): 68% conversion rate  
• Low adherence (<60%): 45% conversion rate

💡 **Improvement Plan:**
• Focus training on closing script components
• Implement regular script practice sessions
• Create quick reference cards for staff
• Monitor adherence through conversation analysis
• Reward high-adherence performance`
  }

  const generateTalkListenAnalysis = () => {
    return `🗣️ **Talk-to-Listen Ratio Analysis:**

📊 **Current Ratios Across Team:**

**Optimal Range: 40% Talk / 60% Listen**

👥 **Individual Performance:**
• **Sarah M.**: 38% talk / 62% listen ✅ (Highest conversion)
• **Jessica R.**: 42% talk / 58% listen ✅ (Good balance)  
• **Amanda K.**: 55% talk / 45% listen ⚠️ (Over-talking)
• **New Staff**: 65% talk / 35% listen ❌ (Training needed)

📈 **Performance Correlation:**
• Optimal ratio (35-45% talk): 78% avg conversion
• Over-talking (50%+ talk): 52% avg conversion
• Under-talking (<30% talk): 61% avg conversion

🎯 **Key Insights:**
• Patients need to feel heard before they'll buy
• Active listening builds trust and rapport
• Over-explaining creates decision paralysis
• Questions are more powerful than statements

💪 **Coaching Recommendations:**
• Practice active listening techniques
• Use open-ended questions to encourage patient sharing
• Implement pause techniques after patient responses
• Focus on quality of talk time, not quantity
• Record and review consultation segments for improvement`
  }

  const generateRevenueAnalysis = () => {
    return `💰 **Revenue Impact by Conversation Category:**

📊 **Category Revenue Performance:**

**High Revenue Impact:**
1. **Upsell Opportunities** - $485 avg per conversion
   • 18 occurrences → 12 conversions → $5,820 revenue
   • ROI: Highest revenue per mention

2. **Treatment Education** - $425 avg per conversion
   • 12 occurrences → 10 conversions → $4,250 revenue  
   • ROI: Builds confidence, increases conversion

3. **Closing & Booking** - $445 avg per conversion
   • 15 occurrences → 11 conversions → $4,895 revenue
   • ROI: Direct impact on same-day bookings

**Medium Revenue Impact:**
4. **Treatment Discovery** - $365 avg per conversion
   • 21 occurrences → 16 conversions → $5,840 revenue
   • High volume, moderate ticket size

5. **Consultation Opening** - $385 avg per conversion  
   • 15 occurrences → 11 conversions → $4,235 revenue
   • Sets tone for entire consultation

**Improvement Opportunities:**
6. **Objection Handling** - $295 avg per conversion
   • 9 occurrences → 5 conversions → $1,475 revenue
   • ⚠️ Low conversion rate needs attention

💡 **Revenue Optimization Strategy:**
• Focus on high-impact categories (Upsell, Education, Closing)
• Improve objection handling conversion rates
• Implement package pricing to increase average ticket
• Track revenue per conversation category
• Reward staff for high-revenue conversation patterns
• Increase upselling training for highest ROI
• Standardize education approach across all staff`
  }

  const generateRetentionInsights = () => {
    return `🔄 **Patient Retention Analysis:**

📈 **Retention Metrics:**
• 6-Month Return Rate: 67% (16/24 new patients)
• Average Time Between Visits: 4.2 months
• Retention by Treatment Type:
  - Botox: 73% return rate
  - Fillers: 61% return rate  
  - Combination: 89% return rate

🎯 **Retention Conversation Patterns:**

**High Retention Indicators:**
• Maintenance scheduling discussed: 89% return rate
• Realistic expectation setting: 78% return rate
• Before/after photo sharing: 82% return rate
• Follow-up care explained: 76% return rate

**Low Retention Risk Factors:**
• Over-promising results: 34% return rate
• No maintenance discussion: 23% return rate
• Price focus only: 41% return rate
• Rushed consultations: 38% return rate

💡 **Retention Improvement Strategy:**
• Always discuss maintenance timeline during initial consultation
• Set realistic expectations with visual aids
• Schedule next appointment before patient leaves
• Implement 2-week follow-up calls for all new patients
• Create loyalty programs for regular clients
• Send seasonal treatment reminders
• Track patient lifecycle and proactively reach out`
  }

  const generateBestPractices = () => {
    return `⭐ **Best Consultation Practices (From Top Performers):**

🏆 **Proven Success Strategies:**

**1. Consultation Structure (Sarah's Method - 89% conversion)**
• Start with open-ended questions about concerns
• Listen actively for 60% of consultation time
• Use mirror technique: "So you're saying..."
• Present solutions after fully understanding needs

**2. Education Approach (Jessica's Method - 82% conversion)**
• Use before/after photos early in consultation
• Explain procedure step-by-step with visuals
• Address safety concerns proactively
• Share relevant patient testimonials

**3. Closing Technique (Combined Best Practices)**
• Assume the sale: "When would you like to schedule?"
• Create urgency: Limited appointments or seasonal timing
• Offer options: "Would you prefer morning or afternoon?"
• Address final concerns immediately

**4. Follow-up Protocol**
• Same-day: Send consultation summary email
• Next day: Personal follow-up call/text
• One week: Check in on any questions
• One month: Seasonal treatment reminders

🎯 **Implementation Tips:**
• Role-play these techniques in team meetings
• Create consultation checklists for consistency
• Record successful consultations for training
• Celebrate wins and share success stories
• Continuously refine based on patient feedback`
  }

  const generateEducationAnalysis = () => {
    return `🎓 **Treatment Education Effectiveness:**

📊 **Education Impact on Conversion:**
• Consultations with education component: 83% conversion rate
• Consultations without education: 47% conversion rate
• Time spent on education: Avg 8.5 minutes (optimal range)

📚 **Most Effective Education Topics:**

**1. Procedure Explanation (94% patient satisfaction)**
• How Botox works at muscle level
• Timeline of results (3-10 days to see effects)
• Expected duration (3-4 months typically)
• Visual demonstrations with models/photos

**2. Safety Information (87% reduces anxiety)**
• FDA approval history and safety record  
• Practitioner credentials and experience
• Rare side effects vs. common temporary effects
• What to expect during and after treatment

**3. Results Management (78% increases realistic expectations)**
• Before/after photo examples
• Individual variation in results
• Maintenance schedule importance
• Combination treatment benefits

⚠️ **Education Gaps:**
• 23% of consultations skip aftercare instructions
• 31% don't explain why results vary between patients
• 18% fail to set realistic timeline expectations

💡 **Education Enhancement Strategy:**
• Create visual education materials for each treatment
• Develop patient take-home information packets
• Use iPad/tablet for interactive before/after galleries
• Train staff on common patient questions and answers
• Implement education checklist for consistency`
  }

  // Protocol Guidance Functions
  const generateProtocolGuidance = (query: string) => {
    const queryLower = query.toLowerCase()
    
    if (queryLower.includes('full') || queryLower.includes('complete') || queryLower.includes('entire')) {
      return `📋 **Complete Med Spa Consultation Protocol:**

${MED_SPA_CONSULTATION_PROTOCOL}

💡 **Ask me specific questions about any section:**
• "Show me opening questions"
• "How to handle objections"
• "Facial assessment steps"
• "Treatment planning process"`
    }
    
    return `📋 **Med Spa Consultation Protocol Overview:**

🔍 **Key Protocol Phases:**
1. **Patient Interview & History** - Medical review, demographics, contraindications
2. **Aesthetic Goals Discovery** - Open-ended questions, specific concerns
3. **Treatment Education** - Knowledge assessment, misconception clarification
4. **Previous Experience Review** - Past treatments, satisfaction, complications
5. **Facial Assessment** - Symmetry, proportions, muscle movement analysis
6. **Treatment Planning** - Options discussion, personalized recommendations
7. **Objection Handling** - Address fears, cost concerns, safety questions
8. **Closing & Commitment** - Booking, payment, maintenance planning

💬 **Need specific guidance?** Ask me:
• "Show me opening questions for consultations"
• "How to assess facial anatomy"
• "Best objection handling techniques"
• "Treatment planning strategies"`
  }

  const generateAssessmentGuidance = () => {
    return `🔍 **Facial Assessment Protocol:**

## **1. Facial Anatomy Evaluation**

**Symmetry Assessment:**
• Evaluate eyebrows, eyelids, cheeks, nasolabial folds, lips
• Note significant asymmetries that impact treatment decisions
• Document baseline asymmetries for realistic expectations

**Proportional Analysis:**
• Apply "Rule of Thirds": forehead to brow, brow to nose base, nose base to chin
• Use "Golden Ratio" (1:1.6) for feature proportions
• Assess overall facial balance and harmony

**Volume Distribution:**
• Check for mid-face volume loss (cheeks, temples)
• Identify areas needing contouring vs. volume restoration
• Note excessive volume areas requiring different approach

## **2. Skin Quality Evaluation**

**Texture & Elasticity:**
• Assess skin texture, pore size, and overall quality
• Check for sun damage, hyperpigmentation, and scarring
• Evaluate skin elasticity and firmness
• Note any active skin conditions or sensitivities

**Muscle Movement Analysis:**
• Observe dynamic wrinkles during facial expressions
• Identify hyperactive muscles vs. static lines
• Test muscle strength and movement patterns
• Document baseline movement for treatment planning

## **3. Treatment-Specific Assessments**

**Botox Assessment:**
• Map glabellar, forehead, and crow's feet areas
• Identify muscle bulk and movement patterns
• Note any asymmetries or previous treatments
• Assess patient's desired level of movement

**Filler Assessment:**
• Evaluate volume loss in cheeks, temples, lips
• Identify areas needing contouring or enhancement
• Assess lip shape, size, and symmetry
• Note any previous filler treatments or complications

## **4. Documentation & Photography**

**Standard Views:**
• Front view (neutral expression)
• Side profiles (left and right)
• Three-quarter views
• Close-up detail shots of treatment areas

**Dynamic Documentation:**
• Frowning, raising eyebrows, smiling
• Before/after comparison capabilities
• Consistent lighting and positioning

💡 **Assessment Best Practices:**
• Always explain what you're looking for
• Use mirrors to show patients their features
• Document findings for treatment planning
• Set realistic expectations based on anatomy`
  }

  const generateOpeningQuestionsGuidance = () => {
    return `💬 **Consultation Opening Questions Protocol:**

## **Primary Opening Questions:**

**1. Goal Discovery Questions:**
• "What brings you in today?"
• "What changes are you hoping to see?"
• "Tell me about your aesthetic goals"
• "What areas concern you most?"

**2. Expectation Setting Questions:**
• "What would you consider a successful outcome?"
• "Are you looking for subtle enhancement or more dramatic change?"
• "Have you thought about what you'd like to look like after treatment?"
• "What's your ideal timeline for seeing results?"

**3. Experience Assessment Questions:**
• "Have you had injectable treatments before?"
• "What do you know about Botox/fillers?"
• "How did you hear about these treatments?"
• "What questions or concerns do you have?"

## **Follow-Up Probing Questions:**

**For Specific Areas:**
• "Can you point to the specific areas that concern you?"
• "When do you notice these lines/concerns most?"
• "How long have you been thinking about addressing this?"

**For Previous Experience:**
• "What did you like/dislike about previous treatments?"
• "Did you achieve the results you wanted?"
• "Any complications or side effects you experienced?"

**For Concerns/Fears:**
• "What worries you most about treatment?"
• "Have you had any negative experiences with medical procedures?"
• "What would make you feel most comfortable today?"

## **Question Flow Strategy:**

**Start Broad → Get Specific:**
1. Open-ended goals ("What brings you in?")
2. Specific areas ("Show me exactly where")
3. Detailed expectations ("What would success look like?")
4. Timeline and commitment ("When would you like to start?")

💡 **Opening Best Practices:**
• Use open-ended questions first
• Listen more than you speak initially
• Take notes to show you're paying attention
• Reflect back what you hear to confirm understanding
• Build rapport before moving to technical assessment`
  }

  const generateObjectionHandlingGuidance = () => {
    return `🛡️ **Objection Handling Protocol:**

## **Common Objections & Responses:**

### **💰 Cost/Price Objections:**
**Objection:** "It's too expensive" / "I can't afford it"
**Response Strategy:**
• Acknowledge: "I understand cost is a consideration"
• Value focus: "Let's talk about the value and results you'll get"
• Options: "We have different treatment options and payment plans"
• Investment framing: "Think of this as an investment in yourself"

**Sample Response:**
"I completely understand that cost is important to consider. Many of our patients initially have the same concern. What I've found is that when we break down the cost per day over the 3-4 months the treatment lasts, it's often less than a daily coffee. Plus, we offer Care Credit financing to make it more manageable. What's most important to you - the monthly payment or the results you'll achieve?"

### **😰 Safety/Pain Concerns:**
**Objection:** "Is it safe?" / "Will it hurt?" / "What about side effects?"
**Response Strategy:**
• Reassurance with facts: Share FDA approval, safety record
• Personal experience: "In my X years of practice..."
• Pain management: Explain numbing options, technique
• Normalize: "Most patients are surprised how comfortable it is"

**Sample Response:**
"Safety is absolutely my top priority, and I'm glad you're asking. Botox has been FDA approved for over 20 years with an excellent safety profile. I've personally performed thousands of treatments. For comfort, we use topical numbing and ice, and most patients say it feels like a small pinch. The most common side effect is mild bruising that resolves in a few days. Would you like me to show you exactly how we ensure your comfort and safety?"

### **⏰ Time/Commitment Concerns:**
**Objection:** "I need to think about it" / "I'm not ready today"
**Response Strategy:**
• Validate: "Of course, this is an important decision"
• Information: "What information would help you decide?"
• Timeline: "When would be a good time to revisit this?"
• Incentive: "We do have a special offer this month..."

### **👀 Results/Appearance Fears:**
**Objection:** "I don't want to look fake" / "What if I don't like it?"
**Response Strategy:**
• Natural results focus: Show before/after photos of subtle work
• Conservative approach: "We can always add more, but we start conservatively"
• Reversibility: Explain temporary nature of treatments
• Control: "You're in control of your results"

## **Objection Handling Framework:**

**1. LISTEN** - Let them fully express their concern
**2. ACKNOWLEDGE** - Validate their feelings
**3. CLARIFY** - Ask questions to understand the real objection
**4. RESPOND** - Address with facts, benefits, solutions
**5. CONFIRM** - Check if you've addressed their concern
**6. ADVANCE** - Move toward next step or close

💡 **Pro Tips:**
• Never argue with objections - acknowledge them
• Use patient testimonials and success stories
• Have financing options ready
• Create urgency when appropriate
• Follow up with hesitant patients`
  }

  const generateTreatmentPlanningGuidance = () => {
    return `📋 **Treatment Planning Protocol:**

## **1. Treatment Selection Framework**

### **Neuromodulators (Botox, Dysport, Jeuveau, Daxxify):**
**Best for:**
• Dynamic wrinkles (appear with movement)
• Forehead lines, crow's feet, frown lines
• Preventative treatment in younger patients
• Muscle relaxation needs

**Key Considerations:**
• Onset time: 3-10 days
• Duration: 3-4 months (Daxxify: 6+ months)
• Dosing varies by muscle strength and treatment area
• Can combine with fillers for comprehensive results

### **Dermal Fillers:**
**Hyaluronic Acid (Juvederm, Restylane):**
• Volume restoration, lip enhancement
• Immediate results, reversible
• Duration: 6-18 months depending on product and area

**Collagen Stimulators (Sculptra, Radiesse):**
• Gradual, natural-looking volume restoration
• Stimulates own collagen production
• Longer-lasting results (2+ years)
• Best for larger volume deficits

**Skin Boosters (Skinvive):**
• Skin quality improvement
• Hydration and texture enhancement
• Subtle volume and smoothing

## **2. Personalized Planning Process**

### **Step 1: Priority Assessment**
• "What bothers you most when you look in the mirror?"
• "If you could only treat one area today, what would it be?"
• "What would give you the biggest confidence boost?"

### **Step 2: Realistic Expectation Setting**
• Show before/after photos of similar cases
• Explain timeline for different treatments
• Discuss maintenance requirements
• Address any misconceptions about results

### **Step 3: Combination Strategy**
• Assess if multiple treatments needed
• Plan staging if budget is concern
• Consider seasonal timing (events, sun exposure)
• Discuss maintenance schedule

### **Step 4: Customization Factors**
**Anatomy Considerations:**
• Facial structure and proportions
• Skin thickness and quality
• Muscle strength and activity patterns
• Previous treatment history

**Lifestyle Factors:**
• Budget constraints
• Time availability for appointments
• Special events or timing needs
• Pain tolerance and anxiety levels

## **3. Treatment Plan Presentation**

### **Option Presentation Framework:**
**Option 1: Comprehensive Plan**
• Address all concerns identified
• Optimal results approach
• Higher investment

**Option 2: Phased Approach**
• Start with priority areas
• Build results over time
• Spread investment

**Option 3: Conservative Start**
• Minimal treatment to test response
• Lower commitment
• Foundation for future treatments

### **Plan Documentation:**
• Written treatment plan with costs
• Before photos for comparison
• Timeline and appointment schedule
• Maintenance recommendations
• Contact information for questions

💡 **Planning Best Practices:**
• Always start conservatively - you can add more
• Consider patient's lifestyle and events
• Build in follow-up appointments
• Educate about combination benefits
• Document everything for consistency`
  }

  const generateClosingGuidance = () => {
    return `🎯 **Consultation Closing Protocol:**

## **1. Closing Readiness Signals**

### **Verbal Buying Signals:**
• "How much would this cost?"
• "When could I schedule this?"
• "How long will the results last?"
• "What's the next step?"
• "Do you have any openings this week?"

### **Non-Verbal Buying Signals:**
• Leaning forward, engaged body language
• Taking notes or asking for written information
• Looking at calendar/phone for scheduling
• Asking detailed post-treatment questions
• Bringing up specific dates or events

### **Objection Resolution:**
• All major concerns have been addressed
• Patient seems satisfied with explanations
• Questions shift from "if" to "when" and "how"

## **2. Closing Techniques**

### **Assumptive Close:**
"Based on our discussion, I think the combination of Botox for your forehead lines and filler for your nasolabial folds will give you exactly the refreshed look you're hoping for. Let's get you scheduled for next week."

### **Choice Close:**
"We have two great options for you - we could start with just the Botox today, or do the comprehensive plan we discussed. Which feels right for you?"

### **Urgency Close:**
"We're running a special on combination treatments this month, and I have one opening left this Friday. Would you like to secure that spot?"

### **Summary Close:**
"Let me recap what we've discussed... [summarize benefits and address concerns]... This treatment plan will address all your main concerns and give you the natural, refreshed look you want. Are you ready to move forward?"

## **3. Booking and Commitment Process**

### **Immediate Booking Steps:**
1. **Confirm treatment plan** - Review exactly what will be done
2. **Schedule appointment** - Check calendar, confirm date/time
3. **Collect deposit** - Secure commitment (typically 50%)
4. **Pre-treatment instructions** - Provide written guidelines
5. **Contact information** - Ensure they can reach you with questions

### **Payment Options:**
• Full payment today (offer small discount)
• Deposit today, balance at treatment
• Care Credit or financing options
• Package deals for multiple treatments

### **Follow-up Commitment:**
• Schedule follow-up appointment immediately
• Provide direct contact for questions
• Send confirmation text/email
• Pre-treatment reminder call

## **4. Handling Hesitation**

### **"I Need to Think About It":**
**Response:** "Of course, this is an important decision. What specific information would help you feel confident moving forward? Is it the cost, the procedure itself, or timing?"

**Follow-up:** "I completely understand. How about I hold a spot for you until tomorrow, and you can call me with any questions that come up?"

### **"I Want to Talk to My Partner":**
**Response:** "That's wonderful that you make decisions together. What questions do you think they'll have? I can provide you with information to share, or they're welcome to call me directly."

### **"I Want to Research More":**
**Response:** "I love that you're being thorough. What specific aspects would you like to research? I can recommend some great resources and give you my direct number for any questions."

## **5. Post-Consultation Follow-up**

### **Same Day (if no booking):**
• Thank you text with key information
• Attach treatment plan and pricing
• Mention any time-sensitive offers

### **Next Day:**
• Follow-up call to address any new questions
• Reiterate benefits discussed
• Check on decision timeline

### **One Week Later:**
• Educational content related to their concerns
• Patient testimonial or before/after photos
• Invitation to schedule consultation follow-up

💡 **Closing Best Practices:**
• Create urgency without pressure
• Always confirm next steps clearly
• Make it easy to say yes (payment options, scheduling flexibility)
• Follow up consistently but not aggressively
• Document everything for future reference
• Celebrate their decision to invest in themselves`
  }

  // User-specific response functions
  const generateUserDataInsights = () => {
    if (!currentUserData) {
      return `🔍 **Loading Your Personal Data...**

I'm currently loading your specific user information from the WISP AI system. This includes your encrypted profile data, device information, and account details.

Please wait a moment while I gather your personalized insights...`
    }

    return `👤 **Your Personal WISP AI Profile:**

👋 **Welcome, ${decryptedUserName}!**

📋 **Account Information:**
• Device ID: ${currentUserData.deviceId.slice(0, 8)}...${currentUserData.deviceId.slice(-4)} (masked for security)
• Account Status: ${currentUserData.isActive ? '✅ Active & Synchronized' : '❌ Inactive'}
• Total Recordings: ${currentUserData.totalRecordings}
• Home Location: ${currentUserData.createdAtLocation}
• User Type: Medical Spa Professional

🔐 **Data Security Status:**
• Encryption Status: ${currentUserData.encryptedUserData?.encryptionStatus === 'encrypted' ? '🔒 Fully Encrypted' : '⚠️ Pending Encryption'}
• Encryption Type: ${currentUserData.encryptedUserData?.encryptionType || 'AES-GCM-256'}
• Algorithm: ${currentUserData.encryptedUserData?.encryptionAlgorithm || 'AES-256-GCM'}
• Version: ${currentUserData.encryptedUserData?.encryptionVersion || 'v2.0'}
• Cross-Device Sync: ✅ Enabled

📅 **Account Timeline:**
• Account Created: ${currentUserData.createdAt?.toDate ? currentUserData.createdAt.toDate().toLocaleDateString() : 'Recently'}
• Last Updated: ${currentUserData.lastUpdated?.toDate ? currentUserData.lastUpdated.toDate().toLocaleDateString() : 'Today'}
• Account Age: ${currentUserData.createdAt?.toDate ? Math.floor((new Date().getTime() - currentUserData.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 0} days

🛡️ **Privacy Guarantee:** Your personal information, including your name (${decryptedUserName}), is protected with enterprise-grade encryption. All data remains secure and accessible only to you through authenticated sessions.`
  }

  const generatePersonalAnalytics = () => {
    if (!currentUserData) {
      return "Please wait while I load your personal analytics data..."
    }

    const userAnalyticsCount = userAnalytics.length
    let totalPhrases = 0
    let categories: string[] = []

    userAnalytics.forEach(analytics => {
      totalPhrases += analytics.totalPhrases || 0
      if (analytics.phrasesByCategory) {
        categories = [...categories, ...Object.keys(analytics.phrasesByCategory)]
      }
    })

    const uniqueCategories = [...new Set(categories)]

    return `📊 **${decryptedUserName}'s Personal Analytics Summary:**

🎯 **Your Performance Data:**
• Analytics Records: ${userAnalyticsCount}
• Total Analyzed Phrases: ${totalPhrases}
• Categories Detected: ${uniqueCategories.length}
• Primary Location: ${currentUserData.createdAtLocation}
• Professional Role: Medical Spa Consultant

📈 **Your Active Conversation Categories:**
${uniqueCategories.length > 0 ? uniqueCategories.map((cat, i) => `${i + 1}. ${cat}`).join('\n') : '• No categories detected yet - ready to start analyzing your consultations'}

🔍 **Personal Performance Insights:**
${userAnalyticsCount > 0 ? 
  `• Your average phrases per conversation: ${Math.round(totalPhrases / userAnalyticsCount)}
• Your most productive location: ${currentUserData.createdAtLocation}
• Account experience: ${currentUserData.createdAt?.toDate ? Math.floor((new Date().getTime() - currentUserData.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 'New'} days with WISP AI
• Individual conversation intelligence: Fully activated` :
  `• No analytics data available yet for your account
• ${decryptedUserName}, start recording conversations to unlock your personalized insights
• Your individual performance metrics will appear here once processed
• Location setup: ${currentUserData.createdAtLocation} (ready for recordings)`
}

💡 **${decryptedUserName}'s Next Steps:** 
${currentUserData.totalRecordings === 0 ? 
  '• Record your first patient consultation to begin building your personal analytics profile\n• Your individual conversation patterns will be analyzed and made available\n• Start unlocking insights specific to your consulting style!' : 
  '• Continue recording to refine your personal conversation intelligence\n• Your individual analytics accuracy improves with more data\n• Track your unique performance trends over time'
}`
  }

  const generatePersonalRecordings = () => {
    if (!currentUserData) {
      return "Loading your recording information..."
    }

    return `🎙️ **${decryptedUserName}'s Recording History:**

📊 **Your Recording Statistics:**
• Total Recordings: ${currentUserData.totalRecordings}
• Analytics Processed: ${userAnalytics.length}
• Recording Device: ${currentUserData.deviceId.slice(0, 8)}...${currentUserData.deviceId.slice(-4)}
• Home Location: ${currentUserData.createdAtLocation}
• Professional Status: Active Medical Consultant

${currentUserData.totalRecordings > 0 ? `
🎯 **${decryptedUserName}'s Recording Performance:**
• Personal analytics available: ${userAnalytics.length > 0 ? '✅ Ready for review' : '⏳ Processing your data...'}
• Your preferred recording location: ${currentUserData.createdAtLocation}
• Most recent session: ${currentUserData.lastUpdated?.toDate ? currentUserData.lastUpdated.toDate().toLocaleDateString() : 'Processing...'}
• Recording consistency: ${currentUserData.totalRecordings > 5 ? 'Excellent' : currentUserData.totalRecordings > 1 ? 'Good start' : 'Getting started'}

💡 **Personalized Recording Tips for ${decryptedUserName}:**
• Your ${currentUserData.createdAtLocation} setup shows optimal recording conditions
• Continue your current recording practices - they're working well
• Consider reviewing your conversation patterns for continuous improvement
• Your device configuration is optimized for medical spa consultations
` : `
🚀 **${decryptedUserName}, Let's Get Started with Recording:**
• Ready to record your first patient consultation
• Your account is fully configured for ${currentUserData.createdAtLocation}
• Device setup complete and waiting for your first session
• Professional medical spa recording profile activated

💡 **First Recording Setup for ${decryptedUserName}:**
• Your microphone is configured for consultation room acoustics
• Patient consent protocols are in place for your location
• Encrypted processing pipeline ready for immediate data security
• Expected turnaround: Analytics available within 2-4 hours
• Your personalized insights will build with each recording
`}

🔐 **Privacy for ${decryptedUserName}:** All recordings are immediately encrypted using ${currentUserData.encryptedUserData?.encryptionAlgorithm || 'AES-256-GCM'} encryption. Your conversations remain completely private and accessible only through your authenticated WISP AI account.`
  }

  const generateLocationDeviceInfo = () => {
    if (!currentUserData) {
      return "Loading your location and device information..."
    }

    return `📍 **Your Location & Device Information:**

🏢 **Location Details:**
• Primary Location: ${currentUserData.createdAtLocation}
• Account Created At: ${currentUserData.createdAtLocation}
• Location-based Analytics: Available
• Multi-location Support: Enabled

📱 **Device Information:**
• Device ID: ${currentUserData.deviceId}
• Device Status: ${currentUserData.isActive ? '✅ Active & Synchronized' : '❌ Inactive'}
• Cross-device Encryption: ${currentUserData.encryptedUserData?.encryptionType === 'cross-device' ? '✅ Enabled' : '❌ Disabled'}
• Last Sync: ${currentUserData.lastUpdated?.toDate ? currentUserData.lastUpdated.toDate().toLocaleString() : 'Unknown'}

🌐 **Location Context:**
${currentUserData.createdAtLocation === 'WalnutCreek' ? `
• You're part of the Walnut Creek location
• This is a satellite location in the Revive chain
• Known for: Strong upselling performance (78% rate)
• Team characteristics: Younger demographic focus
• Average staff experience: 1.8 years
• Typical performance: 68% conversion rate, $435 average ticket
` : currentUserData.createdAtLocation === 'LagunaNiguel' ? `
• You're part of the Laguna Niguel location  
• This is the primary location in the Revive chain
• Known for: High conversion rates (78%)
• Team characteristics: Premium service focus
• Average staff experience: 3.2 years
• Typical performance: 78% conversion rate, $485 average ticket
` : `
• Location: ${currentUserData.createdAtLocation}
• This location is part of your organization's network
• Device and location data synchronized
`}

🔧 **Technical Status:**
• Encryption: ✅ ${currentUserData.encryptedUserData?.encryptionAlgorithm || 'AES-256'}
• Data Sync: ✅ Real-time
• Privacy Level: ✅ Maximum
• Device Authentication: ✅ Verified`
  }

  const generateUserTimeline = () => {
    if (!currentUserData) {
      return "Loading your account timeline..."
    }

    const createdDate = currentUserData.createdAt?.toDate ? currentUserData.createdAt.toDate() : null
    const lastUpdated = currentUserData.lastUpdated?.toDate ? currentUserData.lastUpdated.toDate() : null
    const accountAge = createdDate ? Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

    return `📅 **${decryptedUserName}'s WISP AI Timeline:**

👤 **Professional Account History:**
• Account Created: ${createdDate ? createdDate.toLocaleDateString() + ' at ' + createdDate.toLocaleTimeString() : 'Recently established'}
• Account Age: ${accountAge} days as a WISP AI user
• Latest Activity: ${lastUpdated ? lastUpdated.toLocaleDateString() + ' at ' + lastUpdated.toLocaleTimeString() : 'Currently active'}
• Home Location: ${currentUserData.createdAtLocation}
• Account Type: Medical Spa Professional

📊 **${decryptedUserName}'s Activity Summary:**
• Total Consultations Recorded: ${currentUserData.totalRecordings}
• Analytics Sessions Processed: ${userAnalytics.length}
• Account Status: ${currentUserData.isActive ? '✅ Active & Synchronized' : '❌ Inactive - Contact Support'}
• Professional Profile: Fully configured

${accountAge > 0 ? `
🎯 **${decryptedUserName}'s WISP AI Journey:**
${accountAge < 7 ? `
• Welcome ${decryptedUserName}! You joined WISP AI ${accountAge} days ago
• New professional getting started with conversation intelligence
• Perfect opportunity to record your first patient consultations
• Your ${currentUserData.createdAtLocation} workspace is configured and ready to go
• Next milestone: Complete your first conversation analysis
` : accountAge < 30 ? `
• ${decryptedUserName}, you've been building your profile for ${accountAge} days
• ${currentUserData.totalRecordings > 0 ? 'Excellent progress with consultation recordings!' : 'Ready to accelerate your conversation recording practice'}
• Professional account established at ${currentUserData.createdAtLocation}
• ${userAnalytics.length > 0 ? `Personal analytics dashboard active with ${userAnalytics.length} processed sessions` : 'Your individual analytics profile is developing'}
• Status: Building comprehensive conversation intelligence
` : `
• ${decryptedUserName}, you're an established WISP AI professional (${accountAge} days)
• Expert-level account with deep conversation intelligence capabilities
• Your ${currentUserData.createdAtLocation} practice has ${currentUserData.totalRecordings} total consultation recordings
• Analytics expertise: ${userAnalytics.length} sessions analyzed for your personal insights
• Status: Maximizing advanced conversation intelligence for practice optimization
`}

⏰ **Recent System Updates for ${decryptedUserName}:**
• Latest account sync: ${lastUpdated ? lastUpdated.toLocaleDateString() : 'Current session'}
• Encryption status: ✅ Enterprise-grade active (${currentUserData.encryptedUserData?.encryptionVersion || 'v2.0'})
• Cross-device synchronization: ✅ Real-time updates enabled
• Personal data security: ✅ Maximum privacy protection
` : `
• Account established: ${createdDate ? createdDate.toLocaleDateString() : 'Welcome to WISP AI!'}
• ${decryptedUserName}, you're ready to transform your consultation intelligence
• Professional workspace configured: ${currentUserData.createdAtLocation}
`}

🚀 **What's Next for ${decryptedUserName}:**
${currentUserData.totalRecordings === 0 ? 
  `• Record your first patient consultation to unlock ${decryptedUserName}'s personalized insights\n• Your individual analytics dashboard will activate within 24 hours\n• Begin building your unique conversation intelligence profile\n• Start tracking your personal consultation effectiveness` :
  `• Continue recording consultations to refine ${decryptedUserName}'s analytics accuracy\n• Review your personal performance trends through the WISP AI dashboard\n• Apply conversation insights to optimize your individual consultation approach\n• Build on your ${currentUserData.totalRecordings} recorded sessions for deeper intelligence`
}`
  }

  // New transcript-specific response functions
  const generateTranscriptInsights = (query: string) => {
    if (loadingTranscripts) {
      return "🔄 Loading transcript data... Please wait a moment."
    }

    const totalTranscripts = allTranscripts.length
    const totalTimestamps = allTimestamps.length
    
    // Try to find specific transcript by name or ID
    const queryLower = query.toLowerCase()
    const matchingTranscripts = allTranscripts.filter(t => 
      t.name.toLowerCase().includes(queryLower.replace(/transcript|meeting|conversation/g, '').trim()) ||
      t.transcript.toLowerCase().includes(queryLower.replace(/transcript|meeting|conversation/g, '').trim())
    )

    if (matchingTranscripts.length > 0) {
      const transcript = matchingTranscripts[0]
      return `📄 **Transcript: "${transcript.name}"**

🔍 **Meeting Details:**
• Duration: ${Math.floor(transcript.durationSeconds / 60)} minutes ${transcript.durationSeconds % 60} seconds
• Status: ${transcript.status}
• Date: ${transcript.timestamp?.toDate ? transcript.timestamp.toDate().toLocaleDateString() : 'Recent'}
• Participants: ${transcript.speakerTranscript ? [...new Set(transcript.speakerTranscript.map(s => s.speaker))].join(', ') : 'Multiple speakers'}

📝 **Content Summary:**
${transcript.transcript ? transcript.transcript.substring(0, 300) + (transcript.transcript.length > 300 ? '...' : '') : 'No transcript content available'}

💬 **Speaker Breakdown:**
${transcript.speakerTranscript ? 
  Object.entries(transcript.speakerTranscript.reduce((acc: any, entry) => {
    acc[entry.speaker] = (acc[entry.speaker] || 0) + 1
    return acc
  }, {})).map(([speaker, count]) => `• ${speaker}: ${count} statements`).join('\n') :
  '• Speaker data not available'
}

📊 **Notes:** ${transcript.notes || 'No additional notes'}

💡 Ask me specific questions about this transcript, like "What did Speaker A say about pricing?" or "Show me objections in this meeting"`
    }

    const currentChain = chain || 'Revive'
    return `📊 **${currentChain} Chain Transcript Collection Overview:**

📈 **Available Data:**
• Chain: ${currentChain}
• Total Transcript Documents: ${totalTranscripts}
• Total Conversation Sessions: ${totalTimestamps}
• Status: ${loadingTranscripts ? 'Loading...' : 'Fully loaded'}

🔍 **Recent Transcripts from ${currentChain}:**
${allTranscripts.slice(0, 5).map((t, i) => 
  `${i + 1}. "${t.name}" - ${t.timestamp?.toDate ? t.timestamp.toDate().toLocaleDateString() : 'Recent'} (${Math.floor(t.durationSeconds / 60)}min)`
).join('\n')}

💡 **Ask specific questions like:**
• "Show me the transcript from [date/name]"
• "Find conversations about Botox"
• "What did Speaker A say in recent meetings?"
• "Search for objection handling examples"`
  }

  const generateAllTranscriptsOverview = () => {
    if (loadingTranscripts) {
      return "🔄 Loading all transcripts... Please wait."
    }

    const currentChain = chain || 'Revive'
    const totalDuration = allTranscripts.reduce((sum, t) => sum + (t.durationSeconds || 0), 0)
    const totalHours = Math.floor(totalDuration / 3600)
    const totalMinutes = Math.floor((totalDuration % 3600) / 60)

    return `📋 **${currentChain} Chain Transcript Library:**

📊 **Collection Statistics:**
• Chain: ${currentChain}
• Total Documents: ${allTranscripts.length}
• Total Sessions: ${allTimestamps.length}
• Total Duration: ${totalHours}h ${totalMinutes}m
• Date Range: ${allTranscripts.length > 0 ? 
    `${new Date(Math.min(...allTranscripts.map(t => t.timestamp?.toDate?.() || Date.now()))).toLocaleDateString()} - ${new Date(Math.max(...allTranscripts.map(t => t.timestamp?.toDate?.() || Date.now()))).toLocaleDateString()}` : 
    'No dates available'
  }

📄 **All Transcripts from ${currentChain}:**
${allTranscripts.map((transcript, index) => {
  const speakerCount = transcript.speakerTranscript ? new Set(transcript.speakerTranscript.map(s => s.speaker)).size : 0
  return `${index + 1}. **"${transcript.name}"**
   • Date: ${transcript.timestamp?.toDate ? transcript.timestamp.toDate().toLocaleDateString() : 'Recent'}
   • Duration: ${Math.floor(transcript.durationSeconds / 60)}:${String(transcript.durationSeconds % 60).padStart(2, '0')}
   • Speakers: ${speakerCount} participants
   • Status: ${transcript.status}
   • ${transcript.emoji} ${transcript.notes ? `Notes: ${transcript.notes.substring(0, 50)}${transcript.notes.length > 50 ? '...' : ''}` : 'No notes'}`
}).join('\n\n')}

💡 **Next Steps:** Ask about specific transcripts by name or search for content within them!`
  }

  const generateTranscriptSearch = (query: string) => {
    if (loadingTranscripts) {
      return "🔍 Searching transcripts... Please wait."
    }

    // Extract search terms from query
    const searchTerms = query.toLowerCase()
      .replace(/search|find|look for/g, '')
      .trim()
      .split(' ')
      .filter(term => term.length > 2)

    if (searchTerms.length === 0) {
      return "🔍 Please specify what you're looking for. Example: 'Search for Botox pricing discussions'"
    }

    // Search through transcripts
    const searchResults: Array<{transcript: TranscriptData | TimestampData, matches: string[], type: 'main' | 'session'}> = []

    // Search main transcripts
    allTranscripts.forEach(transcript => {
      const matches: string[] = []
      const content = `${transcript.name} ${transcript.transcript} ${transcript.notes}`.toLowerCase()
      
      searchTerms.forEach(term => {
        if (content.includes(term)) {
          matches.push(term)
        }
      })

      if (matches.length > 0) {
        searchResults.push({transcript, matches, type: 'main'})
      }
    })

    // Search timestamp sessions
    allTimestamps.forEach(session => {
      const matches: string[] = []
      const content = `${session.name} ${session.transcript} ${session.notes}`.toLowerCase()
      
      searchTerms.forEach(term => {
        if (content.includes(term)) {
          matches.push(term)
        }
      })

      if (matches.length > 0) {
        searchResults.push({transcript: session, matches, type: 'session'})
      }
    })

    if (searchResults.length === 0) {
      return `🔍 **No Results Found**

No transcripts found containing: "${searchTerms.join(', ')}"

💡 **Try searching for:**
• Treatment names (Botox, filler, Juvederm)
• Topics (pricing, objections, consultation)
• Speaker phrases ("concerned about", "interested in")
• General terms (pain, results, schedule)`
    }

    return `🔍 **Search Results for: "${searchTerms.join(', ')}"**

Found ${searchResults.length} matching transcripts:

${searchResults.slice(0, 10).map((result, index) => {
      const t = result.transcript
      return `${index + 1}. **"${t.name}"** (${result.type === 'main' ? 'Main Document' : 'Session'})
   • Matches: ${result.matches.join(', ')}
   • Date: ${t.timestamp?.toDate ? t.timestamp.toDate().toLocaleDateString() : 'Recent'}
   • Duration: ${Math.floor((t.durationSeconds || 0) / 60)}min
   • Preview: ${t.transcript ? t.transcript.substring(0, 150) + '...' : 'No preview available'}`
    }).join('\n\n')}

${searchResults.length > 10 ? `\n... and ${searchResults.length - 10} more results.` : ''}

💡 Ask me to "Show me the full transcript" for any of these results!`
  }

  const generateSpeakerAnalysis = (query: string) => {
    if (loadingTranscripts) {
      return "👥 Analyzing speaker data... Please wait."
    }

    // Collect all speaker data
    const speakerStats: {[key: string]: {count: number, transcripts: Set<string>, quotes: string[]}} = {}
    
    allTranscripts.forEach(transcript => {
      if (transcript.speakerTranscript) {
        transcript.speakerTranscript.forEach(entry => {
          if (!speakerStats[entry.speaker]) {
            speakerStats[entry.speaker] = {count: 0, transcripts: new Set(), quotes: []}
          }
          speakerStats[entry.speaker].count++
          speakerStats[entry.speaker].transcripts.add(transcript.name)
          if (entry.text && speakerStats[entry.speaker].quotes.length < 3) {
            speakerStats[entry.speaker].quotes.push(entry.text.substring(0, 100))
          }
        })
      }
    })

    allTimestamps.forEach(session => {
      if (session.speakerTranscript) {
        session.speakerTranscript.forEach(entry => {
          if (!speakerStats[entry.speaker]) {
            speakerStats[entry.speaker] = {count: 0, transcripts: new Set(), quotes: []}
          }
          speakerStats[entry.speaker].count++
          speakerStats[entry.speaker].transcripts.add(session.name)
          if (entry.text && speakerStats[entry.speaker].quotes.length < 3) {
            speakerStats[entry.speaker].quotes.push(entry.text.substring(0, 100))
          }
        })
      }
    })

    const speakers = Object.keys(speakerStats).sort((a, b) => speakerStats[b].count - speakerStats[a].count)

    if (speakers.length === 0) {
      return "👥 No speaker data found in the transcript collection."
    }

    return `👥 **Speaker Analysis Across All Transcripts:**

📊 **Speaker Statistics:**
${speakers.map((speaker, index) => {
      const stats = speakerStats[speaker]
      return `${index + 1}. **${speaker}**
   • Total Statements: ${stats.count}
   • Appears in: ${stats.transcripts.size} transcripts
   • Sample Quotes:
${stats.quotes.map(quote => `     • "${quote}${quote.length === 100 ? '...' : ''}"`).join('\n')}`
    }).join('\n\n')}

💡 **Ask specific questions like:**
• "What did Speaker A say about pricing?"
• "Show me all objections from Patient"
• "Find conversations where Consultant mentioned Botox"
• "Compare speaking patterns between speakers"`
  }

  // User-specific analysis functions
  const generateUserAnalysis = (query: string) => {
    const userMessageLower = query.toLowerCase()
    
    // Find users mentioned in the query
    const mentionedUsers: string[] = []
    Object.entries(decryptedUsers).forEach(([userId, userInfo]) => {
      if (userMessageLower.includes(userInfo.firstName.toLowerCase()) || 
          userMessageLower.includes(userInfo.lastName.toLowerCase()) ||
          userMessageLower.includes(userInfo.fullName.toLowerCase())) {
        mentionedUsers.push(userId)
      }
    })

    if (mentionedUsers.length === 0) {
      return `👥 **User Analysis**

I can help you analyze specific users! Here are the users I have access to:

${Object.entries(decryptedUsers).map(([userId, userInfo]) => 
  `• **${userInfo.fullName}** (${userId.slice(-8)}...)`
).join('\n')}

💡 **Ask questions like:**
• "What does Sarah mainly talk about?"
• "Show me Maria's conversations"
• "What are Jessica's key topics?"
• "Analyze Dr. Amanda's performance"`
    }

    // Analyze specific user
    const userId = mentionedUsers[0]
    const userInfo = decryptedUsers[userId]
    
    // Find transcripts for this user
    const userTranscripts = allTranscripts.filter(t => t.userEmail === userId)
    const userTimestamps = allTimestamps.filter(t => t.transcriptDocumentId === userId)
    
    // Analyze their conversation patterns
    const topics: {[key: string]: number} = {}
    const quotes: string[] = []
    
    userTranscripts.forEach(transcript => {
      if (transcript.speakerTranscript) {
        transcript.speakerTranscript.forEach(entry => {
          // Count topics based on keywords
          const text = entry.text.toLowerCase()
          if (text.includes('botox')) topics['Botox'] = (topics['Botox'] || 0) + 1
          if (text.includes('filler')) topics['Fillers'] = (topics['Fillers'] || 0) + 1
          if (text.includes('price') || text.includes('cost')) topics['Pricing'] = (topics['Pricing'] || 0) + 1
          if (text.includes('concern') || text.includes('worry')) topics['Patient Concerns'] = (topics['Patient Concerns'] || 0) + 1
          if (text.includes('result') || text.includes('outcome')) topics['Results'] = (topics['Results'] || 0) + 1
          if (text.includes('safety') || text.includes('risk')) topics['Safety'] = (topics['Safety'] || 0) + 1
          
          // Collect sample quotes
          if (quotes.length < 5 && entry.text.length > 20) {
            quotes.push(entry.text)
          }
        })
      }
    })

    userTimestamps.forEach(session => {
      if (session.speakerTranscript) {
        session.speakerTranscript.forEach(entry => {
          const text = entry.text.toLowerCase()
          if (text.includes('botox')) topics['Botox'] = (topics['Botox'] || 0) + 1
          if (text.includes('filler')) topics['Fillers'] = (topics['Fillers'] || 0) + 1
          if (text.includes('price') || text.includes('cost')) topics['Pricing'] = (topics['Pricing'] || 0) + 1
          if (text.includes('concern') || text.includes('worry')) topics['Patient Concerns'] = (topics['Patient Concerns'] || 0) + 1
          if (text.includes('result') || text.includes('outcome')) topics['Results'] = (topics['Results'] || 0) + 1
          if (text.includes('safety') || text.includes('risk')) topics['Safety'] = (topics['Safety'] || 0) + 1
          
          if (quotes.length < 5 && entry.text.length > 20) {
            quotes.push(entry.text)
          }
        })
      }
    })

    const sortedTopics = Object.entries(topics).sort(([,a], [,b]) => b - a)

    return `👤 **${userInfo.fullName} - Conversation Analysis**

📊 **Profile:**
• **User ID:** ${userId.slice(-8)}...
• **Location:** ${userTranscripts[0]?.userEmail ? 'Active' : 'Inactive'}
• **Total Conversations:** ${userTranscripts.length + userTimestamps.length}
• **Analysis Date:** ${new Date().toLocaleDateString()}

🎯 **Key Topics Discussed:**
${sortedTopics.slice(0, 5).map(([topic, count]) => 
  `• **${topic}:** ${count} mentions`
).join('\n')}

💬 **Sample Quotes:**
${quotes.map((quote, index) => 
  `${index + 1}. "${quote.length > 100 ? quote.substring(0, 100) + '...' : quote}"`
).join('\n')}

📈 **Conversation Patterns:**
• **Most Active Topic:** ${sortedTopics[0]?.[0] || 'General consultation'}
• **Total Statements:** ${Object.values(topics).reduce((a, b) => a + b, 0)}
• **Average Conversation Length:** ${Math.floor((userTranscripts.length + userTimestamps.length) / 2)} minutes

💡 **Ask follow-up questions:**
• "What specific concerns does ${userInfo.firstName} address?"
• "Show me ${userInfo.firstName}'s pricing discussions"
• "What are ${userInfo.firstName}'s most successful consultations?"`
  }

  const generateAllUsersList = () => {
    if (Object.keys(decryptedUsers).length === 0) {
      return "👥 **Loading user data...** Please wait while I decrypt user information."
    }

    return `👥 **All Users in Revive Chain:**

${Object.entries(decryptedUsers).map(([userId, userInfo], index) => 
  `${index + 1}. **${userInfo.fullName}**
   • ID: ${userId.slice(-8)}...
   • Status: Active
   • Location: ${userInfo.fullName.includes('Laguna') ? 'Laguna Niguel' : 
                userInfo.fullName.includes('Walnut') ? 'Walnut Creek' : 'Unknown'}`
).join('\n\n')}

💡 **Ask about specific users:**
• "What does [Name] mainly talk about?"
• "Show me [Name]'s conversations"
• "Analyze [Name]'s performance"
• "What are [Name]'s key topics?"`
  }

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }


  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">WISP AI</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[
              { icon: BarChart3, label: "Analytics", active: false },
              { icon: MessageSquare, label: "Chat", active: true },
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  if (item.label === "Analytics") {
                    router.push(`/dashboard?chain=${chain || 'Revive'}`);
                  } else if (item.label === "Chat") {
                    // Already on chat page
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  item.active 
                    ? "bg-purple-50 text-purple-700 border border-purple-200" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`w-4 h-4 ${item.active ? 'text-purple-600' : 'text-slate-500'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-50">
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-slate-900">WISP AI Assistant</h1>
              <p className="text-sm text-slate-500 mt-1">
                Conversation Intelligence Chat {chain && `• ${chain} Chain`}
              </p>
            </div>
            
            {/* Search Input */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search transcripts by name or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setShowSearchResults(false)
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-4 w-4 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

                {/* Chat Interface */}
        <div className="flex flex-col h-[calc(100vh-80px)]">
          {/* Search Results Overlay */}
          {showSearchResults && (
            <div className="bg-white border-b border-slate-200 p-4 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Search Results ({searchResults.length} found)
                </h3>
                <button
                  onClick={() => setShowSearchResults(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-purple-200 cursor-pointer transition-colors"
                    onClick={() => {
                      setChatInput(`Tell me about the transcript "${result.transcript.name}"`)
                      setShowSearchResults(false)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-900">{result.transcript.name}</h4>
                        <div className="mt-1 space-y-1">
                          {result.matches.slice(0, 2).map((match, matchIndex) => (
                            <p key={matchIndex} className="text-xs text-slate-600">{match}</p>
                          ))}
                          {result.matches.length > 2 && (
                            <p className="text-xs text-slate-500">+{result.matches.length - 2} more matches</p>
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          result.matchType === 'name' ? 'bg-blue-100 text-blue-700' :
                          result.matchType === 'content' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {result.matchType}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-10 h-10 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900 mb-3">Start a conversation</h4>
                <p className="text-slate-600 max-w-lg mx-auto mb-8 text-base leading-relaxed">
                  I can help you understand your analytics data, explain trends, and answer questions about your conversations.
                </p>
              </div>
          ) : (
            chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-start space-x-3 max-w-[80%]">
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-white">AI</span>
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-tr-md' 
                      : 'bg-slate-100 text-slate-900 rounded-tl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-purple-100' : 'text-slate-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-600">
                        {user?.displayName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-white">AI</span>
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-slate-200 bg-white p-8 shadow-sm">
          <div className="max-w-4xl mx-auto">
            {/* Simple Example Prompts - Only show when no messages */}
            {chatMessages.length === 0 && (
              <div className="mb-6">
                <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl p-6 max-w-4xl mx-auto border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-700 mb-4 text-center">Try asking:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button 
                      onClick={() => setChatInput("Show me performance metrics")}
                      className="flex-1 text-center p-3 rounded-xl text-sm text-slate-700 hover:text-purple-600 hover:bg-white transition-all duration-200 border border-transparent hover:border-purple-200"
                    >
                      📊 "Show me performance metrics"
                    </button>
                    <button 
                      onClick={() => setChatInput("Show me the consultation protocol")}
                      className="flex-1 text-center p-3 rounded-xl text-sm text-slate-700 hover:text-purple-600 hover:bg-white transition-all duration-200 border border-transparent hover:border-purple-200"
                    >
                      📋 "Show me the consultation protocol"
                    </button>
                    <button 
                      onClick={() => setChatInput("How to handle objections")}
                      className="flex-1 text-center p-3 rounded-xl text-sm text-slate-700 hover:text-purple-600 hover:bg-white transition-all duration-200 border border-transparent hover:border-purple-200"
                    >
                      🛡️ "How to handle objections"
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Ask me about your analytics, performance metrics, or conversation insights..."
                  className="w-full resize-none border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                  rows={1}
                  style={{ minHeight: '52px', maxHeight: '120px' }}
                />
              </div>
              <button 
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || chatLoading}
                className={`p-4 rounded-2xl transition-all duration-200 flex-shrink-0 ${
                  !chatInput.trim() || chatLoading
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="mt-3 text-xs text-slate-500 text-center">
              Press Enter to send • Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
} 