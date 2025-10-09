"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  Users,
  Mic,
  MessageSquare,
  MessageCircle,
  Database,
  BookOpen,
  Search,
  TrendingUp,
  Clock,
  Target,
  Activity,
  Calendar,
  FileText,
  Play,
  Pause,
  Volume2,
  ChevronDown,
  History,
  Plus,
  Send,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { db, auth } from "@/lib/firebase"

import { getUserDisplayName, isUserDataEncrypted } from "@/lib/decryption-utils"
import { logger, clientLogger } from "@/lib/logger"
import { SalesPerformanceSummary, IndividualSalesPerformance } from "@/components/sales-performance-summary"
import { calculateSalesPerformanceAverages, getSalesPerformanceInsights } from "@/lib/sales-performance-utils"
import { checkUserAuthorization } from "@/lib/auth-utils"

// Category definitions for med spa consultation protocol analysis
const categories = [
  { name: "Patient Interview & History", color: "bg-purple-500", keywords: ["medical history", "allergies", "medications", "demographics", "age", "gender", "contraindications", "GFE", "intake form", "medical conditions", "precautions", "chart review", "patient chart", "review patient", "medical record"] },
  { name: "Aesthetic Goals Discovery", color: "bg-blue-500", keywords: ["what brings you", "aesthetic goals", "changes hoping", "specific concerns", "fine lines", "volume loss", "nasolabial folds", "desired outcome", "subtle enhancement", "dramatic changes", "ideal outcome", "expectations", "looking for", "want to achieve", "hoping to see"] },
  { name: "Treatment Education & Knowledge", color: "bg-green-500", keywords: ["neuromodulators", "dermal fillers", "how they work", "botox", "dysport", "juvederm", "restylane", "injectable treatments", "permanent", "temporary", "misconceptions", "clarifications", "explain", "educate", "understanding", "knowledge level", "product education"] },
  { name: "Previous Experience Review", color: "bg-yellow-500", keywords: ["previous treatments", "past experiences", "previous injectable", "type of products", "treatment areas", "outcomes", "past satisfaction", "complications", "side effects", "provider history", "another provider", "why seeking new", "previous results"] },
  { name: "Facial Assessment & Analysis", color: "bg-red-500", keywords: ["facial symmetry", "proportions", "volume distribution", "rule of thirds", "golden ratio", "skin quality", "elasticity", "texture", "sun damage", "muscle movement", "expression patterns", "dynamic wrinkles", "static wrinkles", "facial anatomy", "assessment"] },
  { name: "Treatment Planning & Options", color: "bg-orange-500", keywords: ["treatment options", "neuromodulators", "dermal fillers", "combination treatments", "wrinkle reduction", "volume restoration", "skin texture", "sculptra", "radiesse", "skinvive", "duration of results", "downtime", "recovery", "cost considerations"] },
  { name: "Objection Handling & Concerns", color: "bg-teal-500", keywords: ["expensive", "cost", "price", "afford", "budget", "scared", "nervous", "pain", "hurt", "side effects", "risks", "safe", "natural", "fears", "concerns", "anxiety", "needles", "unnatural", "pain management", "topical anesthetic"] },
  { name: "Closing & Treatment Commitment", color: "bg-gray-600", keywords: ["book", "schedule", "appointment", "proceed", "start treatment", "ready", "decision", "move forward", "commit", "deposit", "payment", "financing", "care credit", "today", "confirm", "sign up", "register", "treatment plan", "maintenance sessions"] },
]

interface TranscriptData {
  id: string
  name: string
  transcript: string
  timestamp: any
  emoji: string
  notes: string
  audioURL: string
  userEmail: string
}

interface TimestampData {
  id: string
  audioURL: string
  durationSeconds: number
  emoji: string
  name: string
  transcriptName?: string
  notes: string
  speakerTranscript: Array<{
    speaker: string
    text: string
    timestamp: string
  }>
  status: string
  timestamp: any
  transcript: string
  transcriptDocumentId?: string
  locationId?: string
  salesPerformance?: {
    confidence?: string
    improvementAreas?: string[]
    keyStrengths?: string[]
    overallGrade?: string
    protocolAdherence?: string[]
    protocolScore?: number
    recommendations?: string
  }
}

interface CategoryData {
  name: string
  color: string
  count: number
  percentage: number
  phrases: string[]
}

interface PhraseData {
  phrase: string
  count: number
  percentage: number
  category: string
  transcriptIds: string[]
}

interface TranscriptDetail {
  id: string
  name: string
  transcript: string
  timestamp: any
  emoji: string
  percentage: number
  email: string // Used internally only, never displayed
  displayName: string // Decrypted name for display
}

interface SelectedDocument {
  id: string
  name: string
  userEmail: string
  audioURL?: string
  phrases: { phrase: string; category: string; color: string; keywords: string[]; timestamp?: string; documentId?: string; documentName?: string }[]
}

interface AlertTranscriptReference {
  context: string
  entryId: string
  entryIndex: number
  quote: string
  speaker: string
  type?: string
  category?: string
  highlightedPhrase?: string
  transcriptName?: string
  audioURL?: string
}

interface AlertData {
  id: string
  isRead: boolean
  lastUpdated?: any
  message: string
  recordingId: string
  timestamp: any
  title: string
  transcriptReferences: AlertTranscriptReference[]
  type?: 'trackers_comment' | 'warning' | 'comment' | 'info' | string
  source?: 'TRACKERS_TAB' | 'DIRECT_SELECTION' | string
  userEmail?: string
  userName?: string
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("ACTIVITY")
  const [totalTranscriptCount, setTotalTranscriptCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  
  // Debug authentication state
  console.log('🔐 Dashboard component - user:', user?.uid, 'authLoading:', authLoading)
  console.log('🔐 User object full:', user)
  
  // Add immediate console log to see if component is rendering
  console.log('🚀 Dashboard component rendered at:', new Date().toISOString())
  
  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }
  const [userDisplayNames, setUserDisplayNames] = useState<{[key: string]: string}>({})
  const [selectedChain, setSelectedChain] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [locations, setLocations] = useState<{id: string, name: string, transcriptCount: number}[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [timestampData, setTimestampData] = useState<TimestampData[]>([])
  const [loadingTimestamps, setLoadingTimestamps] = useState(false)
  const [filteredTimestampData, setFilteredTimestampData] = useState<TimestampData[]>([])
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all')
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all')
  const [availableUsers, setAvailableUsers] = useState<{id: string, name: string}[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedTranscript, setSelectedTranscript] = useState<TimestampData | null>(null)
  const [showTranscriptModal, setShowTranscriptModal] = useState(false)
  const [showFullTranscript, setShowFullTranscript] = useState(false)
  const [comment, setComment] = useState('')
  const [highlightedText, setHighlightedText] = useState<{text: string, speaker: string, entryIndex: number, startIndex: number, endIndex: number} | null>(null)
  const [savingComment, setSavingComment] = useState(false)
  const [existingComments, setExistingComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // Show only 20 items initially
  const [hasMoreData, setHasMoreData] = useState(true)

  // Calculate paginated data
  const getPaginatedData = () => {
    const startIndex = 0
    const endIndex = currentPage * itemsPerPage
    return filteredTimestampData.slice(startIndex, endIndex)
  }

  // Load more data function
  const loadMoreData = () => {
    if (currentPage * itemsPerPage < filteredTimestampData.length) {
      setCurrentPage(prev => prev + 1)
    } else {
      setHasMoreData(false)
    }
  }

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
    setHasMoreData(filteredTimestampData.length > itemsPerPage)
  }, [filteredTimestampData, selectedLocationFilter, selectedUserFilter])
  
  // Load comments when transcript modal is opened
  useEffect(() => {
    console.log('🔄 useEffect triggered - showTranscriptModal:', showTranscriptModal, 'user:', user?.uid)
    console.log('🔄 User object:', user)
    console.log('🔄 Auth loading:', authLoading)
    console.log('🔄 useEffect dependencies changed at:', new Date().toISOString())
    if (showTranscriptModal && user) {
      console.log('✅ Calling loadExistingComments with user.uid:', user.uid)
      loadExistingComments(user.uid)
    } else {
      console.log('❌ Not calling loadExistingComments - showTranscriptModal:', showTranscriptModal, 'user exists:', !!user)
      console.log('❌ Detailed check - showTranscriptModal type:', typeof showTranscriptModal, 'user type:', typeof user)
    }
  }, [showTranscriptModal, user, authLoading])
  
  // Sign out function
  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  
  // Add audio ref for timestamp jumping
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'bot', timestamp: Date, type?: 'general' | 'analytics' | 'search', metadata?: any}>>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<Array<{id: string, title: string, timestamp: Date, lastMessageContent: string, messageCount: number}>>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('Analytics Assistant')
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({})
  const [decryptedNames, setDecryptedNames] = useState<Record<string, string>>({})

  // Function to check if message is sales performance related
  const isSalesPerformanceQuery = (message: string): boolean => {
    const salesKeywords = [
      'sales performance', 'protocol score', 'grade', 'confidence', 'improvement areas',
      'key strengths', 'protocol adherence', 'recommendations', 'sales grade',
      'overall grade', 'performance grade', 'consultation grade', 'sales metrics',
      'protocol', 'adherence', 'consultation performance', 'team performance',
      'average score', 'performance summary', 'sales analysis', 'coaching',
      'improvement', 'strengths', 'weaknesses', 'consultation skills'
    ];
    const msg = message.toLowerCase();
    return salesKeywords.some(keyword => msg.includes(keyword.toLowerCase()));
  };

  // Chat function using the existing API
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMessage = {
      id: Date.now().toString(),
      content: chatInput.trim(),
      isFromUser: true,
      timestamp: new Date(),
      referencedRecordings: [],
      referencedSources: [],
      shouldShowSettingsAlert: false,
      isEdit: false,
      type: 'general' as const
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput("")
    setChatLoading(true)

    try {
      // Check if this is a sales performance query
      if (isSalesPerformanceQuery(userMessage.content)) {
        // Handle sales performance queries locally with existing data
        const salesResults = await processSalesPerformanceQuery(userMessage.content)
        
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: salesResults.response,
          sender: 'bot' as const,
          timestamp: new Date(),
          type: 'sales_performance' as const,
          metadata: salesResults.metadata
        }

        setChatMessages(prev => [...prev, botMessage])
        saveChatSession(userMessage, botMessage)
      } else {
        // Use the existing global chat API for other queries
        const response = await fetch('/api/chat/global', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': user?.email || '',
          },
          body: JSON.stringify({
            messages: [...chatMessages, userMessage].map(msg => ({
              id: msg.id,
              content: msg.content || msg.text,
              isFromUser: msg.isFromUser || msg.sender === 'user',
              timestamp: msg.timestamp,
              referencedRecordings: msg.referencedRecordings || [],
              referencedSources: msg.referencedSources || [],
              shouldShowSettingsAlert: msg.shouldShowSettingsAlert || false,
              isEdit: msg.isEdit || false
            })),
            role: {
              name: selectedRole,
              description: `${selectedRole} for WISP med spa analytics`,
              systemPrompt: `You are a ${selectedRole} specialized in med spa consultation analytics. You help analyze conversation transcripts, sales performance data, and provide insights for improving consultation outcomes.`
            },
            sessionId: currentSessionId,
            includeAllMeetings: true,
            includeCalendar: false,
            includeActionItems: false,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get response from API')
        }

        const data = await response.json()

      const botMessage = {
        id: (Date.now() + 1).toString(),
          text: data.response,
        sender: 'bot' as const,
          timestamp: new Date(),
          type: 'general' as const,
          metadata: {
            referencedSources: data.referencedSources || [],
            contextUsed: data.contextUsed
          }
      }

      setChatMessages(prev => [...prev, botMessage])
        saveChatSession(userMessage, botMessage)
      }
      
    } catch (error) {
      console.error('Error in chat:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I encountered an error while processing your request. Please try again.",
        sender: 'bot' as const,
        timestamp: new Date(),
        type: 'general' as const
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }

  // Process sales performance queries
  const processSalesPerformanceQuery = async (query: string) => {
    const queryLower = query.toLowerCase()
    
    // Get transcripts with sales performance data
    const transcriptsWithSales = filteredTimestampData.filter(t => 
      t.salesPerformance && typeof t.salesPerformance.protocolScore === 'number'
    )
    
    if (transcriptsWithSales.length === 0) {
      return {
        response: "📊 No sales performance data found in the current filtered transcripts. Try adjusting your filters or ensure that transcripts have been analyzed for sales performance metrics.",
        metadata: { totalTranscripts: 0, hasData: false }
      }
    }
    
    const salesAverages = calculateSalesPerformanceAverages(transcriptsWithSales)
    const insights = getSalesPerformanceInsights(salesAverages)
    
    let response = ""
    let metadata: any = { salesPerformance: salesAverages, hasData: true }
    
    // Handle specific sales performance queries
    if (queryLower.includes('protocol score') || queryLower.includes('average score')) {
      response = `🎯 **Protocol Score Analysis:**\n\n• **Average Protocol Score**: ${salesAverages.averageProtocolScore}/10\n• **Transcripts Analyzed**: ${salesAverages.totalTranscripts}\n\n📊 **Score Distribution:**\n• Excellent (8-10): ${salesAverages.gradeDistribution.excellent} transcripts\n• Good (6-7): ${salesAverages.gradeDistribution.good} transcripts\n• Fair (4-5): ${salesAverages.gradeDistribution.fair} transcripts\n• Poor (0-3): ${salesAverages.gradeDistribution.poor} transcripts\n\n💡 **Key Insight**: ${insights[0] || 'Focus on protocol adherence training to improve scores.'}`
    } 
    else if (queryLower.includes('improvement') || queryLower.includes('areas for improvement')) {
      const topAreas = salesAverages.commonImprovementAreas.slice(0, 5)
      const areasList = topAreas.map((area, index) => `${index + 1}. **${area.area}** - ${area.count} mentions (${area.percentage}%)`).join('\n')
      
      response = `🎯 **Top Areas for Improvement:**\n\n${areasList}\n\n📈 **Recommendations:**\n• Focus training on the most common improvement areas\n• Create targeted coaching sessions for ${topAreas[0]?.area || 'key skills'}\n• Monitor progress through follow-up assessments\n\n💡 These patterns show where your team can grow the most effectively.`
    }
    else if (queryLower.includes('strengths') || queryLower.includes('key strengths')) {
      const topStrengths = salesAverages.commonKeyStrengths.slice(0, 5)
      const strengthsList = topStrengths.map((strength, index) => `${index + 1}. **${strength.strength}** - ${strength.count} mentions (${strength.percentage}%)`).join('\n')
      
      response = `💪 **Team Key Strengths:**\n\n${strengthsList}\n\n🌟 **Analysis:**\n• Your team excels at ${topStrengths[0]?.strength || 'customer interaction'}\n• Leverage these strengths in training new team members\n• Build upon existing strengths to improve weaker areas\n\n💡 These are your team's superpowers - use them to your advantage!`
    }
    else if (queryLower.includes('grade') || queryLower.includes('overall grade')) {
      const grades = salesAverages.gradeDistribution
      const total = salesAverages.totalTranscripts
      
      response = `📊 **Overall Grade Distribution:**\n\n• **Excellent**: ${grades.excellent} (${Math.round(grades.excellent / total * 100)}%)\n• **Good**: ${grades.good} (${Math.round(grades.good / total * 100)}%)\n• **Fair**: ${grades.fair} (${Math.round(grades.fair / total * 100)}%)\n• **Poor**: ${grades.poor} (${Math.round(grades.poor / total * 100)}%)\n\n🎯 **Performance Overview:**\n• Success Rate (Good+Excellent): ${Math.round((grades.excellent + grades.good) / total * 100)}%\n• Needs Improvement (Fair+Poor): ${Math.round((grades.fair + grades.poor) / total * 100)}%\n\n💡 ${insights[1] || 'Focus on moving fair and poor consultations to good or excellent levels.'}`
    }
    else if (queryLower.includes('confidence')) {
      const confidence = salesAverages.confidenceDistribution
      const total = salesAverages.totalTranscripts
      
      response = `🎯 **Confidence Level Analysis:**\n\n• **High Confidence**: ${confidence.high} (${Math.round(confidence.high / total * 100)}%)\n• **Medium Confidence**: ${confidence.medium} (${Math.round(confidence.medium / total * 100)}%)\n• **Low Confidence**: ${confidence.low} (${Math.round(confidence.low / total * 100)}%)\n\n📈 **Insights:**\n• Team members with high confidence typically perform better\n• Low confidence may indicate need for additional training\n• Focus on building confidence through practice and feedback\n\n💡 Confidence correlates strongly with consultation success rates.`
    }
    else if (queryLower.includes('protocol adherence') || queryLower.includes('adherence')) {
      const protocols = salesAverages.topProtocolAdherence.slice(0, 5)
      const protocolsList = protocols.map((protocol, index) => `${index + 1}. **${protocol.protocol}** - ${protocol.count} mentions (${protocol.percentage}%)`).join('\n')
      
      response = `📋 **Protocol Adherence Analysis:**\n\n${protocolsList}\n\n🎯 **Key Findings:**\n• Most followed protocol: ${protocols[0]?.protocol || 'N/A'}\n• Team shows ${protocols.length > 3 ? 'strong' : 'moderate'} protocol compliance\n• Focus on reinforcing less-followed protocols\n\n💡 Protocol adherence directly impacts consultation quality and outcomes.`
    }
    else if (queryLower.includes('team performance') || queryLower.includes('summary')) {
      response = `📊 **Sales Performance Summary:**\n\n🎯 **Overall Metrics:**\n• Average Protocol Score: ${salesAverages.averageProtocolScore}/10\n• Transcripts Analyzed: ${salesAverages.totalTranscripts}\n• Success Rate: ${Math.round((salesAverages.gradeDistribution.excellent + salesAverages.gradeDistribution.good) / salesAverages.totalTranscripts * 100)}%\n\n💪 **Top Strength**: ${salesAverages.commonKeyStrengths[0]?.strength || 'N/A'}\n🎯 **Top Improvement Area**: ${salesAverages.commonImprovementAreas[0]?.area || 'N/A'}\n📋 **Most Followed Protocol**: ${salesAverages.topProtocolAdherence[0]?.protocol || 'N/A'}\n\n💡 **Key Insights:**\n${insights.slice(0, 3).map(insight => `• ${insight}`).join('\n')}`
    }
    else {
      // Default comprehensive sales performance response
      response = `📊 **Sales Performance Overview:**\n\n🎯 **Key Metrics:**\n• Average Protocol Score: ${salesAverages.averageProtocolScore}/10\n• Transcripts with Sales Data: ${salesAverages.totalTranscripts}\n• Success Rate: ${Math.round((salesAverages.gradeDistribution.excellent + salesAverages.gradeDistribution.good) / salesAverages.totalTranscripts * 100)}%\n\n💪 **Top Strength**: ${salesAverages.commonKeyStrengths[0]?.strength || 'N/A'} (${salesAverages.commonKeyStrengths[0]?.percentage || 0}%)\n🎯 **Main Improvement Area**: ${salesAverages.commonImprovementAreas[0]?.area || 'N/A'} (${salesAverages.commonImprovementAreas[0]?.percentage || 0}%)\n\n💡 Ask me about specific aspects: "protocol scores", "improvement areas", "team strengths", "grades", or "confidence levels"`
    }
    
    return { response, metadata }
  }

  // Analytics functions removed - analytics processing disabled

  // Save chat session
  const saveChatSession = (userMessage: any, botMessage: any) => {
    if (!currentSessionId) {
      const newSessionId = Date.now().toString()
      setCurrentSessionId(newSessionId)
      const newSession = {
        id: newSessionId,
        title: userMessage.text.substring(0, 50) + (userMessage.text.length > 50 ? '...' : ''),
        timestamp: new Date(),
        lastMessageContent: botMessage.text.substring(0, 100) + (botMessage.text.length > 100 ? '...' : ''),
        messageCount: 2
      }
      setChatSessions(prev => [newSession, ...prev])
    } else {
      // Update existing session
      setChatSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, lastMessageContent: botMessage.text.substring(0, 100) + (botMessage.text.length > 100 ? '...' : ''), messageCount: session.messageCount + 2 }
          : session
      ))
    }
  }

  // Create new chat session
  const createNewChatSession = () => {
    const newSessionId = Date.now().toString()
    setCurrentSessionId(newSessionId)
    setChatMessages([])
    const newSession = {
      id: newSessionId,
      title: 'New Chat',
      timestamp: new Date(),
      lastMessageContent: '',
      messageCount: 0
    }
    setChatSessions(prev => [newSession, ...prev])
  }

  // Function to get total transcript count by counting timestamp documents
  const loadTotalTranscriptCount = async () => {
    try {
      //console.log('📊 Loading total transcript count by counting timestamp subcollection documents...')
      
      // Get all documents from the transcript collection
      const transcriptRef = collection(db, 'transcript')
      const transcriptSnap = await getDocs(transcriptRef)
      
      let totalCount = 0
      
      ////console.log(`📊 Found ${transcriptSnap.size} transcript documents, counting their timestamp subcollections...`)
      
      // Go through each transcript document and count its timestamps subcollection
      for (const transcriptDoc of transcriptSnap.docs) {
        const docId = transcriptDoc.id
        try {
          //console.log(`📊 Counting timestamps for transcript document: ${docId}`)
          
          // Count documents in the timestamps subcollection for this transcript
          const timestampsRef = collection(db, 'transcript', docId, 'timestamps')
          const timestampsSnap = await getDocs(timestampsRef)
          
          const docTimestampCount = timestampsSnap.size
          totalCount += docTimestampCount
          
          //console.log(`📊 Document ${docId}: ${docTimestampCount} timestamp documents`)
        } catch (timestampError) {
          console.warn(`⚠️ Could not count timestamps for transcript document ${docId}:`, timestampError)
        }
      }
      
      //console.log(`📊 Found ${totalCount} total timestamp documents across all transcript documents`)
      setTotalTranscriptCount(totalCount)

    } catch (error) {
      console.error('❌ Error loading total transcript count:', error)
    }
  }

  // Load chat session
  const loadChatSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    // In a real implementation, you would load messages from storage
    // For now, we'll just clear messages and show welcome
    setChatMessages([])
  }

  const searchParams = useSearchParams()
  const router = useRouter()
  const [currentUserStatus, setCurrentUserStatus] = useState<string | null>(null)

  // Load current user status from authorizedUsers collection
  useEffect(() => {
    const loadCurrentUserStatus = async () => {
      if (!user?.email) return
      
      try {
        const userDocRef = doc(db, 'authorizedUsers', user.email.toLowerCase())
        const userSnap = await getDoc(userDocRef)
        
        if (userSnap.exists()) {
          const status = userSnap.data().status || 'nurse'
          setCurrentUserStatus(status)
          console.log('👤 [CLIENT] Current user status:', status)
          console.log('👤 [CLIENT] User data:', userSnap.data())
        } else {
          setCurrentUserStatus('nurse') // Default to nurse if not found
          console.log('👤 [CLIENT] User not found in authorizedUsers, defaulting to nurse status')
          console.log('👤 [CLIENT] Checked document path:', `authorizedUsers/${user.email?.toLowerCase()}`)
        }
      } catch (error) {
        console.error('❌ [CLIENT] Error loading current user status:', error)
        setCurrentUserStatus('nurse') // Default to nurse on error
      }
    }

    loadCurrentUserStatus()
  }, [user])

  // Check if user exists in Firestore users collection and is authorized
  useEffect(() => {
    const checkUserInFirestore = async () => {
      if (!authLoading && user) {
        // Check if user email is authorized
        const isEmailAuthorized = await checkUserAuthorization(user.email);
        if (!isEmailAuthorized) {
          //console.log('🚫 Unauthorized user access attempt:', user.email);
          router.push('/'); // Redirect to main page
          return;
        }

        try {
          //console.log('🔍 Checking if user exists in Firestore users collection...')
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          
          if (!userDoc.exists()) {
            //console.log('❌ User not found in Firestore users collection, redirecting to main page')
            router.push('/')
          } else {
            //console.log('✅ User found in Firestore users collection')
          }
        } catch (error) {
          console.error('❌ Error checking user in Firestore:', error)
          router.push('/')
        }
      } else if (!authLoading && !user) {
        //console.log('❌ User not authenticated, redirecting to main page')
        router.push('/')
      }
    }

    checkUserInFirestore()
  }, [user, authLoading, router])

  // Check if user email is authorized (redundant check for immediate feedback before useEffect redirect)
  if (user) {
    // Note: This check is now handled in the useEffect above
    // We'll let the useEffect handle the authorization check and redirect
  }

  // Chat functions


  // Function to handle transcript click and navigate to transcript detail page
  const handleTranscriptClick = (transcript: TimestampData) => {
    router.push(`/dashboard/activity/${transcript.id}`)
  }

  // Function to load existing comments and alerts from alerts collection
  const loadExistingComments = async (deviceId?: string) => {
    console.log('🔍 loadExistingComments called with deviceId:', deviceId)
    if (!deviceId) {
      console.log('❌ No deviceId provided, returning early')
      return
    }
    
    try {
      setLoadingComments(true)
      console.log(`🔍 Loading existing alerts and comments for device ID: ${deviceId}`)
      
      const alertsRef = doc(db, 'alerts', deviceId)
      console.log('📄 Firestore reference:', alertsRef.path)
      const alertsSnap = await getDoc(alertsRef)
      
      console.log('📄 Document exists:', alertsSnap.exists())
      if (alertsSnap.exists()) {
        const data = alertsSnap.data()
        console.log('📄 Document data:', data)
        // Handle both array format and direct alerts format
        const alerts = Array.isArray(data.alerts) ? data.alerts : 
                      Array.isArray(data) ? data : 
                      [data] // Single alert object
        
        console.log('📄 Processed alerts:', alerts)
        
        // Include all alerts (comments, info, analysis results, etc.) and sort by timestamp (newest first)
        const allAlerts = alerts
          .filter((alert: any) => alert && (alert.message || alert.title)) // Basic validation
          .sort((a: any, b: any) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || Date.now())
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || Date.now())
            return timeB.getTime() - timeA.getTime()
          })
        
        console.log(`✅ Found ${allAlerts.length} existing alerts and comments`)
        console.log('Alert types:', allAlerts.map((a: any) => a.type || 'untyped'))
        setExistingComments(allAlerts)
      } else {
        console.log('📄 No alerts document found for this device ID')
        setExistingComments([])
      }
    } catch (error) {
      console.error('❌ Error loading existing alerts:', error)
      setExistingComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  // Function to handle text selection for commenting
  const handleTextSelection = (text: string, speaker: string, entryIndex: number, startIndex: number, endIndex: number) => {
    setHighlightedText({ text, speaker, entryIndex, startIndex, endIndex })
  }

  const renderHighlightedText = (text: string, startIndex: number, endIndex: number, entryIndex: number) => {
    const beforeText = text.substring(0, startIndex)
    const highlightedText = text.substring(startIndex, endIndex)
    const afterText = text.substring(endIndex)
    
    return (
      <>
        {beforeText}
        <span className="bg-yellow-200 text-slate-900 px-1 rounded">
          {highlightedText}
        </span>
        <span className="relative inline-block group">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setHighlightedText(null)
            }}
            className="ml-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 flex items-center justify-center align-top"
            title="Remove highlight"
          >
            ×
          </button>
        </span>
        {afterText}
      </>
    )
  }



  // Function to load available users from timestamp data
  const loadAvailableUsersFromTimestampData = async (timestampsData: TimestampData[]) => {
    try {
      setLoadingUsers(true)
      //console.log('🧑‍💼 Loading available users from timestamp data...')
      
      const users: {id: string, name: string}[] = []
      const processedUserIds = new Set<string>()
      
      // Get unique document IDs from the provided timestamp data
      const uniqueDocumentIds = [...new Set(timestampsData.map(item => item.transcriptDocumentId).filter(Boolean))]
      
      //console.log(`🔍 Loading users from ${uniqueDocumentIds.length} document IDs from timestamp data`)
      
      // Load user data from each transcript document
      for (const documentId of uniqueDocumentIds) {
        if (!documentId || processedUserIds.has(documentId)) continue
        processedUserIds.add(documentId)
        
        try {
          const transcriptDocRef = doc(db, 'transcript', documentId)
          const transcriptDoc = await getDoc(transcriptDocRef)
          
          if (transcriptDoc.exists()) {
            const transcriptData = transcriptDoc.data()
            
            //console.log(`📄 Processing user data for document: ${documentId}`, {

            
            // Use the same centralized decryption approach as TRACKERS tab
            let userName = `Unknown User (${documentId.substring(0, 8)}...)`
            
            // Create a fallback email from the document ID for centralized lookup
            const fallbackEmail = `${documentId.substring(0, 8)}@device.local`
            
            // If we have centralized decryption data, use it
            if (userDisplayNames[fallbackEmail]) {
              userName = userDisplayNames[fallbackEmail]
              console.log(`✅ [USER-FILTER] Using centralized decrypted name for ${documentId}: ${userName}`)
              
              // Only add to users list if successfully decrypted
              users.push({
                id: documentId,
                name: userName
              })
            } else if (transcriptData.encryptedUserData && isUserDataEncrypted(transcriptData.encryptedUserData)) {
              // Try decryption with multiple credential approaches
              try {
                console.log(`🔍 [USER-FILTER] Attempting on-demand decryption for ${documentId}`)
                
                // Try multiple credential formats to find the right one
                const credentialsToTry = [
                  fallbackEmail, // Original approach (device.local format)
                  documentId, // Full document ID
                  documentId.substring(0, 8), // First 8 chars of document ID
                  documentId.substring(0, 12), // First 12 chars of document ID
                ]
                
                let decryptedName = null
                
                for (const credential of credentialsToTry) {
                  try {
                    const result = await Promise.race([
                      getUserDisplayName(credential, transcriptData.encryptedUserData),
                      new Promise<string>((_, reject) => 
                        setTimeout(() => reject(new Error('Decryption timeout')), 2000) // Shorter timeout per attempt
                      )
                    ])
                    
                    if (result && result !== credential && result !== 'Unknown User' && result.trim() !== '' && !result.includes('@device.local')) {
                      decryptedName = result
                      console.log(`✅ [USER-FILTER] Decryption succeeded with credential: ${credential} → ${result}`)
                      break // Stop trying once we find a working credential
                    }
                  } catch (credentialError) {
                    // Continue to next credential
                    continue
                  }
                }
                
                if (decryptedName) {
                  userName = decryptedName
                  console.log(`✅ [USER-FILTER] On-demand decrypted name for ${documentId}: ${userName}`)
                  
                  users.push({
                    id: documentId,
                    name: userName
                  })
                } else {
                  console.log(`❌ [USER-FILTER] Failed to decrypt ${documentId} with any credential, EXCLUDING from user filter`)
                }
              } catch (error) {
                console.error(`❌ [USER-FILTER] Error in on-demand decryption for ${documentId}:`, error)
              }
            } else if (transcriptData.userEmail && !transcriptData.userEmail.includes('@device.local')) {
              // Only use real email addresses, not device.local fallbacks
              userName = transcriptData.userEmail
              console.log(`📧 [USER-FILTER] Using real userEmail for ${documentId}: ${userName}`)
              
              users.push({
                id: documentId,
                name: userName
              })
            } else if (transcriptData.fullName || transcriptData.name) {
              // Handle unencrypted data (only if it's a real name, not generated)
              const realName = transcriptData.fullName || transcriptData.name
              if (realName && !realName.includes('Unknown User') && !realName.includes('@device.local')) {
                userName = realName
                console.log(`📝 [USER-FILTER] Using unencrypted name for ${documentId}: ${userName}`)
                
                users.push({
                  id: documentId,
                  name: userName
                })
              } else {
                console.log(`❌ [USER-FILTER] No valid name found for ${documentId}, EXCLUDING from user filter`)
              }
            } else {
              console.log(`❌ [USER-FILTER] No decryptable data for ${documentId}, EXCLUDING from user filter`)
            }
          } else {
            console.log(`⚠️ [USER-FILTER] Document ${documentId} does not exist, EXCLUDING from user filter`)
          }
        } catch (error) {
          console.error(`❌ [USER-FILTER] Error loading user data for ${documentId}:`, error)
          console.log(`❌ [USER-FILTER] EXCLUDING ${documentId} from user filter due to error`)
        }
      }
      
      //console.log(`✅ Loaded ${users.length} users:`, users)
      setAvailableUsers(users)
      
    } catch (error) {
      console.error('❌ Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Function to load available users from transcript collection (legacy fallback)
  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true)
      //console.log('🧑‍💼 Loading available users from transcript collection...')
      
      const users: {id: string, name: string}[] = []
      const processedUserIds = new Set<string>()
      
      // Get unique document IDs from timestampData if available
      const uniqueDocumentIds = [...new Set(timestampData.map(item => item.transcriptDocumentId).filter(Boolean))]
      
      if (uniqueDocumentIds.length > 0) {
        //console.log(`🔍 Loading users from ${uniqueDocumentIds.length} document IDs from timestamp data`)
        
        // Load user data from each transcript document
        for (const documentId of uniqueDocumentIds) {
          if (!documentId || processedUserIds.has(documentId)) continue
          processedUserIds.add(documentId)
          
          try {
            const transcriptDocRef = doc(db, 'transcript', documentId)
            const transcriptDoc = await getDoc(transcriptDocRef)
            
            if (transcriptDoc.exists()) {
              const transcriptData = transcriptDoc.data()
              
 
              
              // Use the same centralized decryption approach as TRACKERS tab with filtering
              let userName = `Unknown User (${documentId.substring(0, 8)}...)`
              
              // Create a fallback email from the document ID for centralized lookup
              const fallbackEmail = `${documentId.substring(0, 8)}@device.local`
              
              // If we have centralized decryption data, use it
              if (userDisplayNames[fallbackEmail]) {
                userName = userDisplayNames[fallbackEmail]
                console.log(`✅ [USER-FILTER-LEGACY] Using centralized decrypted name for ${documentId}: ${userName}`)
                
                // Only add if successfully decrypted
                users.push({
                  id: documentId,
                  name: userName
                })
              } else if (transcriptData.encryptedUserData && isUserDataEncrypted(transcriptData.encryptedUserData)) {
                // Try decryption with multiple credential approaches
                try {
                  console.log(`🔍 [USER-FILTER-LEGACY] Attempting on-demand decryption for ${documentId}`)
                  
                  const credentialsToTry = [
                    fallbackEmail, // Original approach (device.local format)
                    documentId, // Full document ID
                    documentId.substring(0, 8), // First 8 chars of document ID
                    documentId.substring(0, 12), // First 12 chars of document ID
                  ]
                  
                  let decryptedName = null
                  
                  for (const credential of credentialsToTry) {
                    try {
                      const result = await Promise.race([
                        getUserDisplayName(credential, transcriptData.encryptedUserData),
                        new Promise<string>((_, reject) => 
                          setTimeout(() => reject(new Error('Decryption timeout')), 2000)
                        )
                      ])
                      
                      if (result && result !== credential && result !== 'Unknown User' && result.trim() !== '' && !result.includes('@device.local')) {
                        decryptedName = result
                        console.log(`✅ [USER-FILTER-LEGACY] Decryption succeeded with credential: ${credential} → ${result}`)
                        break
                      }
                    } catch (credentialError) {
                      continue
                    }
                  }
                  
                  if (decryptedName) {
                    userName = decryptedName
                    console.log(`✅ [USER-FILTER-LEGACY] On-demand decrypted name for ${documentId}: ${userName}`)
                    
                    users.push({
                      id: documentId,
                      name: userName
                    })
                  } else {
                    console.log(`❌ [USER-FILTER-LEGACY] Failed to decrypt ${documentId} with any credential, EXCLUDING from user filter`)
                  }
                } catch (error) {
                  console.error(`❌ [USER-FILTER-LEGACY] Error in on-demand decryption for ${documentId}:`, error)
                }
              } else if (transcriptData.userEmail && !transcriptData.userEmail.includes('@device.local')) {
                // Only use real email addresses, not device.local fallbacks
                userName = transcriptData.userEmail
                console.log(`📧 [USER-FILTER-LEGACY] Using real userEmail for ${documentId}: ${userName}`)
                
                users.push({
                  id: documentId,
                  name: userName
                })
              } else if (transcriptData.fullName || transcriptData.name) {
                // Handle unencrypted data (only if it's a real name)
                const realName = transcriptData.fullName || transcriptData.name
                if (realName && !realName.includes('Unknown User') && !realName.includes('@device.local')) {
                  userName = realName
                  console.log(`📝 [USER-FILTER-LEGACY] Using unencrypted name for ${documentId}: ${userName}`)
                  
                  users.push({
                    id: documentId,
                    name: userName
                  })
                } else {
                  console.log(`❌ [USER-FILTER-LEGACY] No valid name found for ${documentId}, EXCLUDING from user filter`)
                }
              } else {
                console.log(`❌ [USER-FILTER-LEGACY] No decryptable data for ${documentId}, EXCLUDING from user filter`)
              }
            } else {
              console.log(`⚠️ [USER-FILTER-LEGACY] Document ${documentId} does not exist, EXCLUDING from user filter`)
            }
          } catch (error) {
            console.error(`❌ [USER-FILTER-LEGACY] Error loading user data for ${documentId}:`, error)
            console.log(`❌ [USER-FILTER-LEGACY] EXCLUDING ${documentId} from user filter due to error`)
          }
        }
      } else {
        //console.log('🔄 No timestamp data available, falling back to root transcript collection scan')
        
        // Fallback: scan the root transcript collection
        const transcriptsRef = collection(db, 'transcript')
        const transcriptsSnap = await getDocs(transcriptsRef)
        
        for (const transcriptDoc of transcriptsSnap.docs) {
          const transcriptData = transcriptDoc.data()
          const deviceId = transcriptDoc.id
          
          // Use the same centralized decryption approach as TRACKERS tab with filtering
          let userName = `Unknown User (${deviceId.substring(0, 8)}...)`
          
          // Create a fallback email from the device ID for centralized lookup
          const fallbackEmail = `${deviceId.substring(0, 8)}@device.local`
          
          // If we have centralized decryption data, use it
          if (userDisplayNames[fallbackEmail]) {
            userName = userDisplayNames[fallbackEmail]
            console.log(`✅ [USER-FILTER-ROOT] Using centralized decrypted name for ${deviceId}: ${userName}`)
            
            // Only add if successfully decrypted
            users.push({
              id: deviceId,
              name: userName
            })
          } else if (transcriptData.encryptedUserData && isUserDataEncrypted(transcriptData.encryptedUserData)) {
            // Try decryption with multiple credential approaches
            try {
              console.log(`🔍 [USER-FILTER-ROOT] Attempting on-demand decryption for ${deviceId}`)
              
              const credentialsToTry = [
                fallbackEmail, // Original approach (device.local format)
                deviceId, // Full device ID
                deviceId.substring(0, 8), // First 8 chars of device ID
                deviceId.substring(0, 12), // First 12 chars of device ID
              ]
              
              let decryptedName = null
              
              for (const credential of credentialsToTry) {
                try {
                  const result = await Promise.race([
                    getUserDisplayName(credential, transcriptData.encryptedUserData),
                    new Promise<string>((_, reject) => 
                      setTimeout(() => reject(new Error('Decryption timeout')), 2000)
                    )
                  ])
                  
                  if (result && result !== credential && result !== 'Unknown User' && result.trim() !== '' && !result.includes('@device.local')) {
                    decryptedName = result
                    console.log(`✅ [USER-FILTER-ROOT] Decryption succeeded with credential: ${credential} → ${result}`)
                    break
                  }
                } catch (credentialError) {
                  continue
                }
              }
              
              if (decryptedName) {
                userName = decryptedName
                console.log(`✅ [USER-FILTER-ROOT] On-demand decrypted name for ${deviceId}: ${userName}`)
                
                users.push({
                  id: deviceId,
                  name: userName
                })
              } else {
                console.log(`❌ [USER-FILTER-ROOT] Failed to decrypt ${deviceId} with any credential, EXCLUDING from user filter`)
              }
            } catch (error) {
              console.error(`❌ [USER-FILTER-ROOT] Error in on-demand decryption for ${deviceId}:`, error)
            }
          } else if (transcriptData.userEmail && !transcriptData.userEmail.includes('@device.local')) {
            // Only use real email addresses, not device.local fallbacks
            userName = transcriptData.userEmail
            console.log(`📧 [USER-FILTER-ROOT] Using real userEmail for ${deviceId}: ${userName}`)
            
            users.push({
              id: deviceId,
              name: userName
            })
          } else if (transcriptData.fullName || transcriptData.name) {
            // Handle unencrypted data (only if it's a real name)
            const realName = transcriptData.fullName || transcriptData.name
            if (realName && !realName.includes('Unknown User') && !realName.includes('@device.local')) {
              userName = realName
              console.log(`📝 [USER-FILTER-ROOT] Using unencrypted name for ${deviceId}: ${userName}`)
              
              users.push({
                id: deviceId,
                name: userName
              })
            } else {
              console.log(`❌ [USER-FILTER-ROOT] No valid name found for ${deviceId}, EXCLUDING from user filter`)
            }
          } else {
            console.log(`❌ [USER-FILTER-ROOT] No decryptable data for ${deviceId}, EXCLUDING from user filter`)
          }
        }
      }
      
      //console.log(`✅ Loaded ${users.length} users:`, users)
      setAvailableUsers(users)
      
    } catch (error) {
      console.error('❌ Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Function to filter timestamps by location
  const filterTimestampsByLocation = async (locationId: string) => {
    setSelectedLocationFilter(locationId)
    
    // If a specific location is selected, filter users for that location
    if (locationId !== 'all') {
      await loadAvailableUsersForLocation(locationId)
    } else {
      // If "All Locations" is selected, load all users
      await loadAvailableUsersFromTimestampData(timestampData)
    }
    
    applyFilters(locationId, selectedUserFilter)
  }

  // Function to filter timestamps by user
  const filterTimestampsByUser = (userId: string) => {
    setSelectedUserFilter(userId)
    applyFilters(selectedLocationFilter, userId)
  }

  // Function to load users for a specific location
  const loadAvailableUsersForLocation = async (locationId: string) => {
    try {
      setLoadingUsers(true)
      //console.log(`🧑‍💼 Loading users for location: ${locationId}`)
      
      // Filter timestamp data for the specific location
      const locationTimestampData = timestampData.filter(t => t.locationId === locationId)
      
      // Load users from the filtered timestamp data
      await loadAvailableUsersFromTimestampData(locationTimestampData)
      
    } catch (error) {
      console.error('❌ Error loading users for location:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Function to get decrypted name for a transcript (synchronous version using cached data)
  const getDecryptedNameForTranscript = (transcript: TimestampData): string => {
    // First, try to get the decrypted name using the user email if available
    if (transcript.userEmail && userDisplayNames[transcript.userEmail]) {
      return userDisplayNames[transcript.userEmail]
    }
    
    // If no user email, try using the document ID for centralized lookup
    if (transcript.transcriptDocumentId) {
      const fallbackEmail = `${transcript.transcriptDocumentId.substring(0, 8)}@device.local`
      if (userDisplayNames[fallbackEmail]) {
        return userDisplayNames[fallbackEmail]
      }
      
      // Check if we have a cached decrypted name
      if (decryptedNames[transcript.transcriptDocumentId]) {
        return decryptedNames[transcript.transcriptDocumentId]
      }
    }
    
    // Fallback to the original name or construct a name from available data
    return transcript.name || transcript.userEmail || 'Unknown User'
  }

  // Function to load decrypted names for all transcripts
  const loadDecryptedNamesForTranscripts = async (transcripts: TimestampData[]) => {
    //console.log('🔍 Loading decrypted names for transcripts...')
    
    for (const transcript of transcripts) {
      if (transcript.transcriptDocumentId && !decryptedNames[transcript.transcriptDocumentId]) {
        try {
          const decryptedName = await fetchAndDecryptTranscriptUserData(transcript.transcriptDocumentId)
          if (decryptedName && decryptedName !== 'Unknown User') {
            setDecryptedNames(prev => ({
              ...prev,
              [transcript.transcriptDocumentId!]: decryptedName
            }))
          }
        } catch (error) {
          console.error('Error loading decrypted name for transcript:', transcript.transcriptDocumentId, error)
        }
      }
    }
  }

  // Function to fetch and decrypt user data from transcript document
  const fetchAndDecryptTranscriptUserData = async (transcriptDocumentId: string): Promise<string> => {
    try {
      //console.log('🔍 Fetching transcript document for decryption:', transcriptDocumentId)
      
      // Fetch the transcript document from Firestore
      const transcriptDocRef = doc(db, 'transcript', transcriptDocumentId)
      const transcriptDoc = await getDoc(transcriptDocRef)
      
      if (!transcriptDoc.exists()) {
        //console.log('❌ Transcript document not found:', transcriptDocumentId)
        return 'Unknown User'
      }
      
      const transcriptData = transcriptDoc.data()
      //console.log('📄 Transcript document data:', {

      
      // Check if we have encrypted user data
      if (transcriptData.encryptedUserData && transcriptData.encryptionStatus === 'encrypted') {
        //console.log('🔐 Found encrypted user data, attempting decryption...')
        
        // Try to decrypt using the document ID as the credential
        const decryptedName = await getUserDisplayName(transcriptDocumentId, transcriptData.encryptedUserData)
        
        if (decryptedName && decryptedName !== transcriptDocumentId && decryptedName !== 'Unknown User') {
          //console.log('✅ Successfully decrypted name:', decryptedName)
          return decryptedName
        }
        
        // If that didn't work, try with the user ID from the document path
        const userId = transcriptDocumentId.split('/')[0] || transcriptDocumentId
        const decryptedNameWithUserId = await getUserDisplayName(userId, transcriptData.encryptedUserData)
        
        if (decryptedNameWithUserId && decryptedNameWithUserId !== userId && decryptedNameWithUserId !== 'Unknown User') {
          //console.log('✅ Successfully decrypted name with user ID:', decryptedNameWithUserId)
          return decryptedNameWithUserId
        }
      }
      
      // If no encrypted data or decryption failed, try other fields
      if (transcriptData.userEmail) {
        return transcriptData.userEmail
      }
      
      if (transcriptData.fullName) {
        return transcriptData.fullName
      }
      
      if (transcriptData.name) {
        return transcriptData.name
      }
      
      //console.log('❌ No decrypted name found for transcript:', transcriptDocumentId)
      return 'Unknown User'
      
    } catch (error) {
      console.error('❌ Error in fetchAndDecryptTranscriptUserData:', error)
      return 'Unknown User'
    }
  }

  // Function to get location name for a transcript
  const getLocationNameForTranscript = (transcript: TimestampData): string => {
    if (!transcript.locationId) {
      return 'Unknown Location'
    }

    const location = locations.find(loc => loc.id === transcript.locationId)
    return location ? location.name : 'Unknown Location'
  }

  // Function to apply both location and user filters
  const applyFilters = (locationId: string, userId: string) => {
    let filtered = timestampData

    // Apply location filter
    if (locationId !== 'all') {
      filtered = filtered.filter(t => t.locationId === locationId)
    }

    // Apply user filter by matching transcriptDocumentId with user deviceId
    if (userId !== 'all') {
      filtered = filtered.filter(t => t.transcriptDocumentId === userId)
    }

    setFilteredTimestampData(filtered)
  }

  // Load decrypted names when filtered timestamp data changes
  useEffect(() => {
    if (filteredTimestampData.length > 0) {
      loadDecryptedNamesForTranscripts(filteredTimestampData)
    }
  }, [filteredTimestampData])

  // Function to automatically highlight a phrase when clicked from TRACKERS
  const autoHighlightPhrase = (targetPhrase: string, speakerTranscript: any[]) => {
    //console.log('🎯 Auto-highlighting phrase:', targetPhrase)
    //console.log('📋 Speaker transcript entries:', speakerTranscript?.length || 0)
    
    if (!speakerTranscript || speakerTranscript.length === 0) {
      console.warn('⚠️ No speaker transcript available for auto-highlighting')
      return
    }

    // Clean the target phrase for matching (remove extra quotes and clean whitespace)
    const cleanTargetPhrase = targetPhrase.replace(/^["']|["']$/g, '').trim().toLowerCase()
    //console.log('🧹 Cleaned target phrase:', cleanTargetPhrase)

    // Search through speaker transcript entries to find the phrase
    for (let entryIndex = 0; entryIndex < speakerTranscript.length; entryIndex++) {
      const entry: { text?: string; speaker?: string } = speakerTranscript[entryIndex]
      const entryText = entry.text || ''
      const cleanEntryText = entryText.toLowerCase()
      
      // Try to find the phrase in this entry
      const phraseIndex = cleanEntryText.indexOf(cleanTargetPhrase)
      
      if (phraseIndex !== -1) {
        // Found the phrase! Calculate actual indices in original text
        const actualStartIndex = entryText.toLowerCase().indexOf(cleanTargetPhrase)
        const actualEndIndex = actualStartIndex + targetPhrase.length
        

        
        // Set the highlighted text
        setHighlightedText({
          text: entryText.substring(actualStartIndex, actualEndIndex),
          speaker: entry.speaker || 'Unknown Speaker',
          entryIndex: entryIndex,
          startIndex: actualStartIndex,
          endIndex: actualEndIndex
        })
        
        //console.log('🎨 Auto-highlighted phrase successfully')
        return
      }
    }
    
    // If exact phrase not found, try partial matching with keywords
    //console.log('🔍 Exact phrase not found, trying keyword matching...')
    const keywords = cleanTargetPhrase.split(' ').filter(word => word.length > 2) // Words longer than 2 chars
    
    for (let entryIndex = 0; entryIndex < speakerTranscript.length; entryIndex++) {
      const entry = speakerTranscript[entryIndex]
      const entryText = entry.text || ''
      const cleanEntryText = entryText.toLowerCase()
      
      // Check if entry contains multiple keywords from the phrase
      const matchingKeywords = keywords.filter(keyword => cleanEntryText.includes(keyword))
      
      if (matchingKeywords.length >= Math.min(2, keywords.length)) {
        // Find the best matching section in the text
        let bestStart = 0
        let bestEnd = entryText.length
        
        // Try to find a more specific match
        for (const keyword of matchingKeywords) {
          const keywordIndex = cleanEntryText.indexOf(keyword)
          if (keywordIndex !== -1) {
            // Expand selection around the keyword
            const start = Math.max(0, keywordIndex - 20)
            const end = Math.min(entryText.length, keywordIndex + keyword.length + 20)
            
            // Find word boundaries
            while (start > 0 && entryText[start] !== ' ') bestStart = start - 1
            while (end < entryText.length && entryText[end] !== ' ') bestEnd = end + 1
            
            break
          }
        }
        
        //console.log('✅ Found partial match in entry:', {

        
        setHighlightedText({
          text: entryText.substring(bestStart, bestEnd),
          speaker: entry.speaker || 'Unknown Speaker',
          entryIndex: entryIndex,
          startIndex: bestStart,
          endIndex: bestEnd
        })
        
        //console.log('🎨 Auto-highlighted partial match successfully')
        return
      }
    }
    
    console.warn('⚠️ Could not find phrase to auto-highlight:', cleanTargetPhrase)
  }

  // Function to save comment to alerts collection
  const saveComment = async () => {
    const debugData = {
      hasComment: !!comment.trim(),
      hasHighlightedText: !!highlightedText,
      hasSelectedTranscript: !!selectedTranscript,
      hasUser: !!user,
      comment: comment.trim(),
      highlightedText,
      selectedTranscript: selectedTranscript?.id,
      user: user?.email,
      timestamp: new Date().toISOString()
    }
    
    console.log('🔍 saveComment called with:', debugData)
    
    // Send debug data to terminal via API
    try {
      await fetch('/api/debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debugData)
      })
    } catch (error) {
      console.error('❌ Failed to send debug log:', error)
    }
    
    if (!comment.trim() || !highlightedText || !selectedTranscript || !user) {
      console.log('❌ Missing required data for comment saving')
      return
    }

    try {
      setSavingComment(true)
      console.log('💾 Starting to save comment to alerts collection...')
      //console.log('🔍 Selected transcript object:', {

      
      // Get the transcript document ID from the selectedTranscript
      let transcriptDocumentId = selectedTranscript.transcriptDocumentId
      
      if (!transcriptDocumentId) {
        //console.log('⚠️ No stored transcript document ID, searching for it...')
        
        // Fallback: Search for the document ID that contains this timestamp
        let foundDocumentId = null
        
        try {
          // Get all documents from the locations and find which one has this timestamp
          for (const location of locations) {
            const locationRef = collection(db, 'locations', selectedChain || 'Revive', location.id)
            const locationDocs = await getDocs(locationRef)
            
            for (const locationDoc of locationDocs.docs) {
              if (locationDoc.id !== 'name') {
                // Check if this document has our timestamp
                const timestampsRef = collection(db, 'transcript', locationDoc.id, 'timestamps')
                const timestampsSnap = await getDocs(timestampsRef)
                
                const hasOurTimestamp = timestampsSnap.docs.some(doc => doc.id === selectedTranscript.id)
                if (hasOurTimestamp) {
                  foundDocumentId = locationDoc.id
                  //console.log(`🎯 Found document ID via search: ${foundDocumentId}`)
                  break
                }
              }
            }
            if (foundDocumentId) break
          }
        } catch (searchError) {
          console.error('❌ Error searching for document ID:', searchError)
        }
        
        if (!foundDocumentId) {
          console.error('❌ Could not find document ID for timestamp:', selectedTranscript.id)
          alert('Error: Could not determine transcript document ID')
          return
        }
        
        // Use the found document ID
        transcriptDocumentId = foundDocumentId
      }
      
      console.log(`🎯 Using transcript document ID: ${transcriptDocumentId}`)
      
      // Generate unique alert ID
      const alertId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Determine if this is a TRACKERS comment (from clicking a tracker phrase)
      const isTrackersComment = activeTab === "TRACKERS"
      
      // Create alert document structure - matches iOS app expected format
      const alertDoc = {
        id: alertId,
        isRead: false,
        message: comment.trim(),
        recordingId: selectedTranscript.id,
        timestamp: new Date().toISOString(),
        title: `${isTrackersComment ? 'TRACKERS' : 'Comment'} on ${selectedTranscript.name}`,
        type: "warning",
        transcriptReferences: [{
          quote: highlightedText.text,
          speaker: highlightedText.speaker || 'Multiple Speakers',
          entryId: selectedTranscript.id,
          entryIndex: highlightedText.entryIndex || -1,
          context: isTrackersComment ? "TRACKERS Analysis" : "Speaker Comment"
        }]
      }

      // Save to alerts using the recording owner's user ID as document ID
      const recordingOwnerUserId = transcriptDocumentId || user.uid // Use the person who owns this recording
      const alertsRef = doc(db, 'alerts', recordingOwnerUserId)
      const alertsSnap = await getDoc(alertsRef)
      
      let existingAlerts = []
      if (alertsSnap.exists()) {
        const data = alertsSnap.data()
        existingAlerts = Array.isArray(data?.alerts) ? data.alerts : []
      }

      // Add new alert to the array
      existingAlerts.push(alertDoc)

      console.log(`💾 [SAVE] About to save ${existingAlerts.length} alerts to alerts/${recordingOwnerUserId}`)
      console.log(`💾 [SAVE] Document exists: ${alertsSnap.exists()}`)
      console.log(`💾 [SAVE] Existing alerts before save:`, existingAlerts.length)

      // Save back to Firestore - ensure we create the document structure properly
      await setDoc(alertsRef, {
        alerts: existingAlerts,
        lastUpdated: new Date().toISOString(),
        userId: recordingOwnerUserId
      }, { merge: true })

      // Verify the save was successful
      const verificationSnap = await getDoc(alertsRef)
      if (verificationSnap.exists()) {
        const verificationData = verificationSnap.data()
        const savedAlerts = verificationData?.alerts || []
        console.log(`✅ [VERIFY] Save successful - document now has ${savedAlerts.length} alerts`)
      } else {
        console.error('❌ [VERIFY] Document does not exist after save attempt!')
      }

      console.log('✅ Comment saved successfully!')
      console.log(`📍 Saved to Firestore path: alerts/${recordingOwnerUserId}`)
      console.log(`👤 Recording owner: ${recordingOwnerUserId}`)
      console.log(`👤 Current user: ${user.uid}`)
      console.log('💾 Comment data:', JSON.stringify(alertDoc, null, 2))
      console.log(`📊 Total comments in collection: ${existingAlerts.length}`)

      // Clear form
      setComment('')
      setHighlightedText(null)
      
      // Reload comments to show the new one
      loadExistingComments(recordingOwnerUserId)
      
    } catch (error) {
      console.error('❌ Error saving comment:', error)

    } finally {
      setSavingComment(false)
    }
  }

  // Function to load locations from a chain
    const loadLocationsFromChain = async (chainId: string) => {
    try {
      //console.log('🚀 ===== ACTIVITY TAB: STARTING LOCATION LOAD =====')
      //console.log(`🔍 Loading locations for chain: ${chainId}`)
      //console.log(`🔗 Current URL: ${window.location.href}`)
      //console.log(`🔗 URL Parameters: ${window.location.search}`)
      
      // Add server-side logging
      //clientLogger.info('🚀 Starting location load process', { chainId })
      
      setLoadingLocations(true)
      
      // Use the new API endpoint to get locations
      //console.log(`🌐 Calling API endpoint: /api/get-locations?chainId=${chainId}`)
      
      const response = await fetch(`/api/get-locations?chainId=${encodeURIComponent(chainId)}`)
      
      console.log('🔍 [CLIENT] Response status:', response.status)
      console.log('🔍 [CLIENT] Response headers:', Object.fromEntries(response.headers.entries()))
      
      // Get the response text first to check if it's valid JSON
      const responseText = await response.text()
      console.log('🔍 [CLIENT] Raw response text:', responseText.substring(0, 500))
      
      if (!response.ok) {
        console.error('❌ [CLIENT] API Error - Response not OK')
        console.error('❌ [CLIENT] Status:', response.status)
        console.error('❌ [CLIENT] Status Text:', response.statusText)
        console.error('❌ [CLIENT] Response Text:', responseText)
        
        // Try to parse as JSON for error details
        let errorData = null
        try {
          errorData = JSON.parse(responseText)
          console.error('❌ [CLIENT] Parsed error data:', errorData)
        } catch (jsonError) {
          console.error('❌ [CLIENT] Response is not valid JSON:', jsonError)
          console.error('❌ [CLIENT] HTML/Text response received instead of JSON')
        }
        
        if (response.status === 404) {
          setLocations([])
          return
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText} - Response: ${responseText.substring(0, 200)}`)
      }
      
      // Parse the JSON response
      let data
      try {
        data = JSON.parse(responseText)
        console.log('✅ [CLIENT] Successfully parsed JSON response')
      } catch (jsonError) {
        console.error('❌ [CLIENT] JSON parsing failed:', jsonError)
        console.error('❌ [CLIENT] Response text that failed to parse:', responseText.substring(0, 1000))
        throw new Error(`Invalid JSON response from server: ${jsonError}`)
      }
      //console.log('📋 API Response:', data)
      
      if (!data.success) {
        console.error('❌ API returned error:', data.error)

        setLocations([])
        return
      }
      
      const locationsData = data.locations || []
      
      //console.log('📋 FINAL LOCATIONS DATA:', locationsData)

      
      setLocations(locationsData)
      setSelectedChain(chainId)
      //console.log('✅ State updated - real locations loaded from API')

      
    } catch (error) {
      console.error('❌ CRITICAL ERROR loading locations:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error && 'code' in error ? (error as any).code : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      
      // Add server-side logging for errors

      
      setLocations([])
    } finally {
      setLoadingLocations(false)
      //console.log('🏁 ===== LOCATION LOAD COMPLETE =====')
      
      // Add server-side logging for completion
    }
  }

  // Function to load transcripts from locations collection
  const loadLocationTranscripts = async (chainId: string, locationId: string) => {
    try {
      //console.log(`🔍 Loading transcripts for ${chainId}/${locationId}`)
      
      // Get all transcript documents from the location subcollection
      const transcriptsRef = collection(db, 'locations', chainId, locationId)
      const transcriptsSnap = await getDocs(transcriptsRef)
      
      const transcriptsData: TranscriptData[] = []
      
      for (const transcriptDoc of transcriptsSnap.docs) {
        const transcriptId = transcriptDoc.id
        const transcriptData = transcriptDoc.data()
        
        //console.log(`📋 Found transcript: ${transcriptId}`, transcriptData)
        
        transcriptsData.push({
          id: transcriptId,
          name: transcriptData.name || 'Untitled',
          transcript: transcriptData.transcript || '',
          timestamp: transcriptData.timestamp,
          emoji: transcriptData.emoji || '📝',
          notes: transcriptData.notes || '',
          audioURL: transcriptData.audioURL || '',
          userEmail: transcriptData.userEmail || transcriptId
        })
      }
      
      //console.log('✅ Loaded location transcripts:', transcriptsData)
      setLocationTranscripts(transcriptsData)
      setSelectedChain(chainId)
      setSelectedLocation(locationId)
    } catch (error) {
      console.error('❌ Error loading location transcripts:', error)
    }
  }

  // Function to load timestamp data for all document IDs in locations
  const loadTimestampData = async (chainId: string) => {
    try {
      console.log('🚀 [CLIENT] Starting loadTimestampData for chainId:', chainId)
      setLoadingTimestamps(true)
      
      // Get locations directly from API instead of relying on state
      console.log('📍 [CLIENT] Fetching locations from API...')
      const locationsResponse = await fetch(`/api/get-locations?chainId=${encodeURIComponent(chainId)}`)
      
      if (!locationsResponse.ok) {
        console.error('❌ [CLIENT] Failed to get locations from API:', locationsResponse.status, locationsResponse.statusText)
        setTimestampData([])
        return
      }
      
      const locationsData = await locationsResponse.json()
      console.log('📍 [CLIENT] Locations API response:', locationsData)
      
      if (!locationsData.success || !locationsData.locations) {
        console.error('❌ [CLIENT] Invalid locations data from API:', locationsData)
        setTimestampData([])
        return
      }
      
      const locationsToProcess = locationsData.locations
      console.log('🏢 [CLIENT] Processing', locationsToProcess.length, 'locations:', locationsToProcess.map(l => l.name || l.id))
      
      // OPTIMIZATION: Use a single API call to get all documents across all locations
      console.log('📋 [CLIENT] Fetching all documents from API...')
      const allDocumentsResponse = await fetch(`/api/get-all-location-documents?chainId=${encodeURIComponent(chainId)}`)
      
      if (!allDocumentsResponse.ok) {
        console.error('❌ [CLIENT] Failed to get all documents from API:', allDocumentsResponse.status, allDocumentsResponse.statusText)
        setTimestampData([])
        return
      }
      
      const allDocumentsData = await allDocumentsResponse.json()
      console.log('📊 [CLIENT] All documents API response:', allDocumentsData)
      
      if (!allDocumentsData.success || !allDocumentsData.documents) {
        console.error('❌ [CLIENT] Invalid documents data from API:', allDocumentsData)
        setTimestampData([])
        return
      }
      
      let allDocumentIds = allDocumentsData.documents
      console.log('📄 [CLIENT] Found', allDocumentIds.length, 'document IDs:', allDocumentIds.slice(0, 5))
      console.log('🗺️ [CLIENT] Location map:', allDocumentsData.locationMap)
      
      // Filter documents for nurse users - they can only see their own transcripts
      console.log(`🔍 [NURSE-FILTER] Starting nurse filter check:`)
      console.log(`🔍 [NURSE-FILTER] - currentUserStatus: "${currentUserStatus}"`)
      console.log(`🔍 [NURSE-FILTER] - user?.uid: "${user?.uid}"`)
      console.log(`🔍 [NURSE-FILTER] - user?.email: "${user?.email}"`)
      
      // Make sure currentUserStatus is loaded before filtering
      if (currentUserStatus === null) {
        console.log(`⚠️ [NURSE-FILTER] User status not loaded yet, skipping filter for now`)
        setTimestampData([]) // Don't show any data until we know the user's role
        return
      }
      
      if (currentUserStatus === 'nurse' && user?.uid) {
        const originalCount = allDocumentIds.length
        console.log(`🔍 [NURSE-FILTER] NURSE STATUS CONFIRMED - applying filter`)
        console.log(`🔍 [NURSE-FILTER] Original document count: ${originalCount}`)
        console.log(`🔍 [NURSE-FILTER] Looking for documents matching UID: ${user.uid}`)
        console.log(`🔍 [NURSE-FILTER] First 10 document IDs:`, allDocumentIds.slice(0, 10))
        
        allDocumentIds = allDocumentIds.filter(docId => {
          const matches = docId === user.uid
          if (matches) {
            console.log(`✅ [NURSE-FILTER] Found matching document: ${docId}`)
          }
          return matches
        })
        
        console.log(`👩‍⚕️ [NURSE-FILTER] FILTER COMPLETE - showing ${allDocumentIds.length} documents (filtered from ${originalCount})`)
        
        if (allDocumentIds.length === 0) {
          console.log(`⚠️ [NURSE-FILTER] No documents found for nurse UID ${user.uid}. This means either:`)
          console.log(`⚠️ [NURSE-FILTER] 1. No transcript documents exist with this UID as document ID`)
          console.log(`⚠️ [NURSE-FILTER] 2. The user hasn't created any recordings yet`)
          console.log(`⚠️ [NURSE-FILTER] 3. Document IDs don't match the Firebase Auth UID`)
        }
      } else {
        console.log('👨‍💼 [CLIENT] Admin/Founder access - showing all documents')
      }
      
      // OPTIMIZATION: Batch fetch all transcript documents at once
      console.log('📄 [CLIENT] Batch fetching transcript documents...')
      const transcriptRefs = allDocumentIds.map(docId => doc(db, 'transcript', docId))
      const transcriptSnaps = await Promise.all(transcriptRefs.map(ref => getDoc(ref)))
      
      // Create a map of document ID to transcript data for quick lookup
      const transcriptDataMap = new Map()
      transcriptSnaps.forEach((snap, index) => {
        if (snap.exists()) {
          transcriptDataMap.set(allDocumentIds[index], snap.data())
        }
      })
      
      console.log('📄 [CLIENT] Transcript documents found:', transcriptDataMap.size, 'out of', allDocumentIds.length)
      console.log('📄 [CLIENT] Transcript document IDs:', Array.from(transcriptDataMap.keys()))
      
      // OPTIMIZATION: Batch fetch all timestamps collections at once
      console.log('⏰ [CLIENT] Batch fetching timestamps collections...')
      const timestampsPromises = allDocumentIds.map(async (documentId) => {
        try {
          const timestampsRef = collection(db, 'transcript', documentId, 'timestamps')
          const timestampsSnap = await getDocs(timestampsRef)
          console.log('⏰ [CLIENT] Found', timestampsSnap.size, 'timestamps for document:', documentId)
          return { documentId, timestamps: timestampsSnap.docs }
        } catch (error) {
          console.error(`❌ [CLIENT] Error loading timestamps for document ${documentId}:`, error)
          return { documentId, timestamps: [] }
        }
      })
      
      const timestampsResults = await Promise.all(timestampsPromises)
      
      console.log('⏰ [CLIENT] Timestamps results:', timestampsResults.length, 'documents processed')
      console.log('⏰ [CLIENT] Total timestamps found:', timestampsResults.reduce((sum, result) => sum + result.timestamps.length, 0))
      
      const timestampsData: TimestampData[] = []
      const processedTimestampIds = new Set<string>()

      // Process all timestamps with pre-loaded transcript data
      console.log('🔄 [CLIENT] Processing timestamps data...')
      timestampsResults.forEach(({ documentId, timestamps }) => {
        const parentTranscriptData = transcriptDataMap.get(documentId)
        console.log('📝 [CLIENT] Processing', timestamps.length, 'timestamps for document:', documentId)

        timestamps.forEach(timestampDoc => {
            // Skip if we've already processed this timestamp ID
            if (processedTimestampIds.has(timestampDoc.id)) {
              console.log('⚠️ [CLIENT] Skipping duplicate timestamp:', timestampDoc.id)
              return
            }
            processedTimestampIds.add(timestampDoc.id)
            const timestampData = timestampDoc.data()
            
          const speakerTranscriptData = timestampData['speaker transcript'] || 
                                       timestampData.speakerTranscript || 
                                         timestampData.speakerText || 
                                         timestampData.speakers || 
                                         []

          console.log('🎤 [CLIENT] Timestamp', timestampDoc.id, 'has', speakerTranscriptData.length, 'speaker transcript entries')
            
            let displayName = timestampData.name || `User-${documentId.substring(0, 8)}`
            
            let transcriptName = 'Untitled Transcript'
          // Analytics cache removed - use simple fallback
          
          // Use centralized decryption if available
            if (parentTranscriptData?.userEmail && userDisplayNames[parentTranscriptData.userEmail]) {
              displayName = userDisplayNames[parentTranscriptData.userEmail]
            } else if (parentTranscriptData?.userEmail) {
            // Fallback to email if no decrypted name available
                  displayName = parentTranscriptData.userEmail
            } else if (timestampData.name && !timestampData.name.includes('Laguna Niguel') && !timestampData.name.includes('Carmel Valley') && !timestampData.name.includes('Eastlake')) {
              displayName = timestampData.name
            } else {
              displayName = `User-${documentId.substring(0, 8)}`
            }
          
          // Find location for this document
          const locationInfo = allDocumentsData.locationMap?.[documentId] || { locationId: '', locationName: 'Unknown' }
            
            timestampsData.push({
              id: timestampDoc.id,
              audioURL: timestampData.audioURL || '',
              durationSeconds: timestampData.durationSeconds || 0,
              emoji: timestampData.emoji || '❓',
            name: displayName,
            transcriptName: transcriptName,
              notes: timestampData.notes || '',
              speakerTranscript: speakerTranscriptData,
              status: timestampData.status || 'unknown',
              timestamp: timestampData.timestamp,
              transcript: timestampData.transcript || '',
              transcriptDocumentId: documentId,
            locationId: locationInfo.locationId,
              salesPerformance: timestampData.salesPerformance || undefined
            })
        })
      })
      
      // Sort transcripts by timestamp (most recent first)
      const sortedTimestampsData = timestampsData.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0)
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0)
        return timeB.getTime() - timeA.getTime()
      })
      
      console.log('✅ [CLIENT] Successfully loaded', sortedTimestampsData.length, 'recordings')
      console.log('📊 [CLIENT] Final recordings data:', sortedTimestampsData.map(r => ({
        id: r.id,
        name: r.name,
        locationId: r.locationId,
        speakerTranscriptLength: r.speakerTranscript?.length || 0,
        status: r.status
      })))
      setTimestampData(sortedTimestampsData)
      
      // Apply current filters to the new data
      let filtered = sortedTimestampsData
      if (selectedLocationFilter !== 'all') {
        filtered = filtered.filter(t => t.locationId === selectedLocationFilter)
      }
      if (selectedUserFilter !== 'all') {
        filtered = filtered.filter(t => t.transcriptDocumentId === selectedUserFilter)
      }
      setFilteredTimestampData(filtered)
      
      // Load users after timestamp data is available
      loadAvailableUsersFromTimestampData(timestampsData)
      
    } catch (error) {
      console.error('❌ [CLIENT] Error loading timestamp data:', error)
    } finally {
      console.log('🏁 [CLIENT] loadTimestampData completed')
      setLoadingTimestamps(false)
    }
  }

      const sidebarItems = [
      { icon: BarChart3, label: "Analytics", active: activeTab === "TRACKERS" || activeTab === "ACTIVITY" },
    ]

  // Simplified user display names loading
  const loadUserDisplayNames = async (timestampData: TimestampData[]) => {
    try {
    const displayNames: {[key: string]: string} = {}
    
      // Extract unique user emails from timestamp data
      const userEmails = new Set<string>()
      timestampData.forEach((data) => {
        if (data.transcriptDocumentId) {
          // We'll get user emails from the transcript documents when needed
          userEmails.add(data.transcriptDocumentId)
        }
      })
      
    setUserDisplayNames(displayNames)
        } catch (error) {
      console.error('Error loading user display names:', error)
    }
  }

  // Simplified initialization - no analytics processing
  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true)
        
        // Load total transcript count from transcript collection
        await loadTotalTranscriptCount()
        
        // Check if user is authenticated
        if (!user) {
          setLoading(false)
          return
        }
        
        // Check if user has selected a chain (check Firestore first, then localStorage as fallback)
        let userChain = null;
        
        // Try to get from Firestore first
        if (user?.uid) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              userChain = userDoc.data()?.userChain;
            }
          } catch (error) {
            console.error('Error fetching userChain from Firestore:', error);
          }
        }
        
        // Fallback to localStorage if not found in Firestore
        if (!userChain) {
          userChain = localStorage.getItem('userChain');
        }
        
        if (!userChain) {
          router.push('/choose-chain')
          setLoading(false)
          return
        }
        
        // Mark as loaded - no analytics processing needed
          setLoading(false)
        
            } catch (error) {
        console.error('Error in initializePage:', error)
        setLoading(false)
      }
    }

    // Only run if user exists
    if (user) {
      //clientLogger.info('👤 User detected, initializing page...')
      initializePage()
    } else {
      //clientLogger.info('👤 No user detected, waiting for authentication...')
    }
  }, [user])

  // Refresh timestamp data when userDisplayNames becomes available (for centralized decryption)
  useEffect(() => {
    if (Object.keys(userDisplayNames).length > 0 && timestampData.length > 0) {
      console.log('🔄 [CENTRALIZED] userDisplayNames populated, refreshing timestamp data for centralized decryption...')

      
      // Get current chain from URL or use default
      const urlParams = new URLSearchParams(window.location.search)
      const chainParam = urlParams.get('chain') || 'Revive'
      
      // Reload timestamp data to use centralized decryption
      loadTimestampData(chainParam)
    }
  }, [userDisplayNames])

  // Load user filter options when centralized decryption becomes available
  useEffect(() => {
    if (Object.keys(userDisplayNames).length > 0 && timestampData.length > 0 && availableUsers.length === 0 && !loadingUsers && activeTab === "ACTIVITY") {
      console.log('👥 [USER-FILTER] Centralized decryption now available, loading user filter options...')
      loadAvailableUsersFromTimestampData(timestampData)
    }
  }, [userDisplayNames, timestampData.length, availableUsers.length, loadingUsers, activeTab])

  // Handle chain parameter from URL and auto-load locations
  useEffect(() => {
    //console.log('🚨🚨🚨 ===== AUTO-LOADING LOCATIONS ON PAGE LOAD ===== 🚨🚨🚨')
    //console.log('🔍 User authenticated:', !!user)
    //console.log('🔍 Current URL:', window.location.href)
    //console.log('🔍 URL search params:', window.location.search)
    //console.log('🔍 Active tab:', activeTab)
    
    // Add server-side logging for auto-load process
    //clientLogger.info('🚨🚨🚨 AUTO-LOADING LOCATIONS ON PAGE LOAD', { 

    
    // Force immediate execution regardless of user state
    const urlParams = new URLSearchParams(window.location.search)
    const chainParam = urlParams.get('chain')
    // console.log('🔍 Chain parameter found:', chainParam)
    
    if (chainParam) {
      // Switch to ACTIVITY tab when chain is selected
      // console.log('🔗 📑 Auto-switching to ACTIVITY tab')
      setActiveTab("ACTIVITY")
    }
  }, []) // Run immediately on component mount

  // No periodic sync needed - analytics processing removed

  // No focus sync needed - analytics processing removed

  // Auto-sync when switching to TRACKERS tab
  useEffect(() => {
    if (activeTab === "TRACKERS" && user) {
      const syncOnTrackersTab = async () => {
        try {
          //clientLogger.info('🎯 TRACKERS tab selected - checking for new transcripts...')
          
          const response = await fetch('/api/sync-new-transcripts', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          const result = await response.json()
          if (result.success && result.processedCount > 0) {
            //clientLogger.success(`✅ TRACKERS sync: Found ${result.processedCount} new transcripts`)
            // Instead of reloading, update analytics data incrementally
            await loadNewAnalyticsData(result.processedDocuments || [])
          }
        } catch (error) {
          //clientLogger.error('❌ Error during TRACKERS tab sync:', error)
        }
      }

      // Small delay to avoid immediate sync when page loads
      const tabSyncTimer = setTimeout(syncOnTrackersTab, 1000)
      
      return () => {
        clearTimeout(tabSyncTimer)
      }
    }
  }, [activeTab, user])

  // Auto-load locations when ACTIVITY tab is selected
  useEffect(() => {
    if (activeTab === "ACTIVITY") {
      //console.log('🎯 ===== ACTIVITY TAB SELECTED - AUTO-LOADING LOCATIONS =====')
      //console.log('🔍 Current selectedChain:', selectedChain)
      //console.log('🔍 Current locations count:', locations.length)
      //console.log('🔍 Loading state:', loadingLocations)
      


      // Load available users for filtering - but only after centralized decryption is ready
      if (availableUsers.length === 0 && !loadingUsers) {
        // Use the new function if timestamp data is available, otherwise fallback to legacy
        if (timestampData.length > 0) {
          // Only load if we have centralized decryption data, or if we're still trying to get it
          console.log('🔍 [USER-FILTER] Checking if centralized decryption is ready...')
          console.log('🔍 [USER-FILTER] userDisplayNames keys:', Object.keys(userDisplayNames).length)
          
          if (Object.keys(userDisplayNames).length > 0) {
            console.log('✅ [USER-FILTER] Centralized decryption ready, loading users')
            loadAvailableUsersFromTimestampData(timestampData)
          } else {
            console.log('⏳ [USER-FILTER] Centralized decryption not ready yet, waiting...')
          }
        } else {
          loadAvailableUsers()
        }
      }
      
      // If no chain is selected, use Revive as default
      if (!selectedChain) {
        //console.log('🔗 No chain selected, using default: Revive')
        //clientLogger.info('🔗 No chain selected, using default: Revive')
        loadLocationsFromChain('Revive')
        loadTimestampData('Revive')
      } else if (locations.length === 0 && !loadingLocations) {
        // If chain is selected but no locations loaded, load them
        //console.log(`🔗 Chain selected (${selectedChain}) but no locations loaded, loading now...`)
        //clientLogger.info('🔗 Chain selected but no locations loaded, loading now', { selectedChain })
        loadLocationsFromChain(selectedChain)
        loadTimestampData(selectedChain)
      } else {
        //console.log(`🔗 Chain: ${selectedChain}, Locations: ${locations.length}, Loading: ${loadingLocations}`)

        // Load timestamp data if not already loaded
        if (timestampData.length === 0 && !loadingTimestamps) {
          //console.log('🎯 Loading timestamp data for existing chain')
          loadTimestampData(selectedChain)
        }
      }
    }
  }, [activeTab, selectedChain, locations.length, loadingLocations, currentUserStatus, timestampData.length, userDisplayNames, loadingUsers]) // Run when activeTab changes to "ACTIVITY" or user status is loaded



  // Build display data directly from analytics cache
  const buildDisplayDataFromAnalytics = (analyticsData: {[key: string]: any}) => {
    ////clientLogger.info('🧠 Building display data from analytics cache...')
    
    const categoryCounts: { [key: string]: { count: number; phrases: string[] } } = {}
    const phraseCounts: { [key: string]: number } = {}
    const phraseTranscriptIds: { [key: string]: string[] } = {}
    
    // Initialize category counts
    categories.forEach(cat => {
      categoryCounts[cat.name] = { count: 0, phrases: [] }
    })
    
    const totalDocuments = Object.keys(analyticsData).length
    //clientLogger.info(`📊 Processing ${totalDocuments} documents from analytics cache`)
    
    // Process each analytics document
    Object.entries(analyticsData).forEach(([documentId, data]) => {
      //clientLogger.info(`🔍 Processing analytics for document: ${documentId}`)
      
      // Count categories and phrases
      Object.keys(data.phrasesByCategory).forEach(categoryName => {
        categoryCounts[categoryName].count++
        
        // Add phrases from this category
        data.phrasesByCategory[categoryName].forEach((phraseData: any) => {
          const phrase = phraseData.phrase
          categoryCounts[categoryName].phrases.push(phrase)
          
          // Count individual phrases
          const phraseKey = `${categoryName}:${phrase}`
          phraseCounts[phraseKey] = (phraseCounts[phraseKey] || 0) + 1
          
          // Track transcript IDs for this phrase
          if (!phraseTranscriptIds[phraseKey]) {
            phraseTranscriptIds[phraseKey] = []
          }
          if (!phraseTranscriptIds[phraseKey].includes(documentId)) {
            phraseTranscriptIds[phraseKey].push(documentId)
          }
        })
      })
    })
    
    // Calculate percentages and format data
    const formattedData: CategoryData[] = categories.map(category => ({
      name: category.name,
      color: category.color,
      count: categoryCounts[category.name].count,
      percentage: totalDocuments > 0 ? Math.round((categoryCounts[category.name].count / totalDocuments) * 100) : 0,
      phrases: [...new Set(categoryCounts[category.name].phrases)].slice(0, 5)
    }))
    
    // Create phrase data
    const phraseDataArray: PhraseData[] = []
    Object.keys(phraseCounts).forEach(phraseKey => {
      const [categoryName, phrase] = phraseKey.split(':', 2)
      const count = phraseCounts[phraseKey]
      const percentage = totalDocuments > 0 ? Math.round((count / totalDocuments) * 100) : 0
      
      phraseDataArray.push({
        phrase: phrase.length > 50 ? phrase.substring(0, 50) + '...' : phrase,
        count,
        percentage,
        category: categoryName,
        transcriptIds: phraseTranscriptIds[phraseKey] || []
      })
    })
    
    // Sort by percentage and limit to top phrases
    phraseDataArray.sort((a, b) => b.percentage - a.percentage)
    const topPhrases = phraseDataArray.slice(0, 20)
    
    //clientLogger.info('✅ Display data built from analytics cache')
    //clientLogger.info(`📊 Categories: ${formattedData.length}, Phrases: ${topPhrases.length}`)
    
    setCategoryData(formattedData)
    setPhraseData(topPhrases)
    setSelectedCategoryPhrases(topPhrases)
  }





  // Handle category selection
  const handleCategorySelect = (categoryName: string) => {
    //clientLogger.info('📂 Category selected:', categoryName)
    setSelectedCategory(categoryName)
    setSelectedPhrase(null) // Reset selected phrase
    setSelectedDocument(null) // Clear selected document when switching categories
    
    if (categoryName === "All Categories") {
      setSelectedCategoryPhrases(phraseData)
    } else {
      const categoryPhrases = phraseData.filter(phrase => phrase.category === categoryName)
      setSelectedCategoryPhrases(categoryPhrases)
    }
  }

  // Handle phrase selection
  const handlePhraseSelect = (phrase: PhraseData) => {
    //clientLogger.info('🎯 Phrase selected:', phrase.phrase)
    //clientLogger.info(`📊 Phrase details: ${phrase.count} occurrences, ${phrase.percentage}% of total transcripts`)
    //clientLogger.info(`📁 Category: ${phrase.category}`)
    //clientLogger.info(`🆔 Transcript IDs: ${phrase.transcriptIds.join(', ')}`)
    
    setSelectedPhrase(phrase)
    
    // Calculate transcript details for the selected phrase
    const phraseTranscriptDetails: TranscriptDetail[] = phrase.transcriptIds.map(id => {
      const transcript = transcripts.find(t => t.id === id)
      if (transcript) {
        //clientLogger.info(`📄 Found transcript ${id} from ${transcript.userEmail}`)
        return {
          id: transcript.id,
          name: transcript.name,
          transcript: transcript.transcript,
          timestamp: transcript.timestamp,
          emoji: transcript.emoji,
          percentage: Math.round((1 / transcripts.length) * 100), // Simple percentage calculation
          email: transcript.userEmail, // Used internally only
          displayName: userDisplayNames[transcript.userEmail] || 'Unknown User' // Use decrypted name
        }
      }
      //clientLogger.info(`❌ Transcript ${id} not found in transcripts array`)
      return null
    }).filter(Boolean) as TranscriptDetail[]
    
    //clientLogger.info(`✅ Found ${phraseTranscriptDetails.length} transcript details for phrase "${phrase.phrase}"`)
    //clientLogger.info('📋 Transcript details:', phraseTranscriptDetails.map(t => ({

    
    setPhraseTranscripts(phraseTranscriptDetails)
  }

  // Handle document ID click to show all phrases for all documents with the same userEmail
  const handleDocumentClick = (documentId: string) => {
    //clientLogger.info('📄 Document ID clicked:', documentId)
    
    // Clear selected phrase to ensure document view is shown
    setSelectedPhrase(null)
    
    // Check if document has analytics data
    if (processedDocuments.has(documentId) && analyticsCache[documentId]) {
      const clickedDocumentData = analyticsCache[documentId]
      const targetUserEmail = clickedDocumentData.userEmail
      const userDisplayName = userDisplayNames[targetUserEmail] || 'Unknown User'
      
      //clientLogger.info(`📧 Finding all documents for user: ${userDisplayName}`)
      
      // Find all documents in analyticsCache with the same userEmail
      const matchingDocuments = Object.entries(analyticsCache).filter(([docId, data]) => {
        return data.userEmail === targetUserEmail
      })
      
      //clientLogger.info(`📊 Found ${matchingDocuments.length} documents for user: ${userDisplayName}`)
      matchingDocuments.forEach(([docId, data]) => {
        //clientLogger.info(`  - Document ${docId}: ${data.transcriptName}`)
      })
      
      // Combine phrasesByCategory from all matching documents
      const combinedPhrasesByCategory: { [categoryName: string]: any[] } = {}
      const allDocumentPhrases: { phrase: string; category: string; color: string; keywords: string[]; documentId: string; documentName: string }[] = []
      
      matchingDocuments.forEach(([docId, data]) => {
        // Process each document's phrasesByCategory
        Object.keys(data.phrasesByCategory).forEach(categoryName => {
          if (!combinedPhrasesByCategory[categoryName]) {
            combinedPhrasesByCategory[categoryName] = []
          }
          
          // Add all phrases from this category and document
          data.phrasesByCategory[categoryName].forEach((phraseData: any) => {
            combinedPhrasesByCategory[categoryName].push({
              ...phraseData,
              documentId: docId,
              documentName: data.transcriptName
            })
            
            // Also add to flat array for display
            const category = categories.find(cat => cat.name === categoryName)
            const color = category ? category.color : '#6B7280'
            
            allDocumentPhrases.push({
              phrase: phraseData.phrase,
              category: categoryName,
              color: color,
              keywords: phraseData.keywords || [],
              documentId: docId,
              documentName: data.transcriptName || 'Untitled'
            })
          })
        })
      })
      
      //clientLogger.info(`📋 Combined ${allDocumentPhrases.length} phrases from ${matchingDocuments.length} documents`)
      //clientLogger.info('📂 Categories found:', Object.keys(combinedPhrasesByCategory))
      
      // Set the selected document with combined data
      const documentData = {
        id: `user-${targetUserEmail}`, // Use a special ID to indicate this is a user-level view
        name: `All documents for ${userDisplayName}`,
        userEmail: targetUserEmail, // Keep email for internal use only
        audioURL: clickedDocumentData.audioURL, // Include audioURL from the clicked document
        phrases: allDocumentPhrases
      }
      
      //clientLogger.info('📋 Setting selectedDocument:', documentData)
      setSelectedDocument(documentData)
    } else {
      //clientLogger.info(`❌ No analytics data found for document: ${documentId}`)
      //clientLogger.info('💡 Analytics data should be automatically synced on app load')
    }
  }

  // Function to convert timestamp string to seconds
  const timestampToSeconds = (timestamp: string): number => {
    if (!timestamp || timestamp === "N/A" || timestamp === "00:00") {
      return 0
    }
    
    // Handle different timestamp formats
    const parts = timestamp.split(':')
    if (parts.length === 2) {
      // Format: "MM:SS"
      const minutes = parseInt(parts[0], 10)
      const seconds = parseInt(parts[1], 10)
      return minutes * 60 + seconds
    } else if (parts.length === 3) {
      // Format: "HH:MM:SS"
      const hours = parseInt(parts[0], 10)
      const minutes = parseInt(parts[1], 10)
      const seconds = parseInt(parts[2], 10)
      return hours * 3600 + minutes * 60 + seconds
    }
    
    return 0
  }

  // Function to jump to specific timestamp in audio
  const jumpToTimestamp = (timestamp: string) => {
    if (!audioRef.current) {
      console.warn('⚠️ Audio element not found')
      return
    }
    
    const seconds = timestampToSeconds(timestamp)
    //console.log(`🎵 Jumping to timestamp: ${timestamp} (${seconds} seconds)`)
    
    audioRef.current.currentTime = seconds
    audioRef.current.play().catch(error => {
      console.error('❌ Error playing audio:', error)
    })
  }

  const handlePhraseClick = async (phrase: any) => {
    try {
      //console.log('🎯 Phrase clicked:', phrase)
      //console.log('📄 Selected document:', selectedDocument)
      
      // Get the document ID from the phrase
      let documentId = phrase.documentId
      
      if (!documentId && phrase.transcriptIds && phrase.transcriptIds.length > 0) {
        documentId = phrase.transcriptIds[0]
      }
      
      if (documentId) {
        //console.log('📖 Looking for analytics document:', documentId)
        
        // Check if we have the analytics data in cache
        if (analyticsCache[documentId]) {
          const analyticsData = analyticsCache[documentId]
          //console.log('📄 Analytics data found:', analyticsData)
          //console.log('🎯 Analytics speakerTranscript:', analyticsData.speakerTranscript?.length || 0, 'entries')
          
          // Generate transcript text from speakerTranscript if transcript field is missing
          let transcriptText = analyticsData.transcript || ''
          if (!transcriptText && analyticsData.speakerTranscript?.length > 0) {
            transcriptText = analyticsData.speakerTranscript
              .map((entry: { speaker?: string; text?: string }) => `${entry.speaker}: ${entry.text}`)
              .join(' ')
          }
          
          // Create transcript object directly from analytics data - no need to fetch from transcript collection!
          const transcriptObject: TimestampData = {
            id: documentId,
            name: analyticsData.transcriptName || 'Transcript',
            transcript: transcriptText,  // Use analytics transcript or generate from speakerTranscript
            audioURL: analyticsData.audioURL || '',
            timestamp: analyticsData.timestamp,
            transcriptDocumentId: documentId,
            speakerTranscript: analyticsData.speakerTranscript || [],  // Analytics has this!
            durationSeconds: analyticsData.durationSeconds || 0,
            emoji: analyticsData.emoji || '📝',
            notes: analyticsData.notes || '',
            status: analyticsData.status || 'completed',
            locationId: analyticsData.createdAtLocation || ''
          }
          
          //console.log('✅ Final transcriptObject speakerTranscript:', transcriptObject.speakerTranscript?.length || 0, 'entries')
          if (transcriptObject.speakerTranscript?.length > 0) {
            //console.log('📝 First speaker entry:', transcriptObject.speakerTranscript[0])
          }
          
          // Open the transcript modal with comments popup
          setSelectedTranscript(transcriptObject)
          setShowTranscriptModal(true)
          if (user) {
            loadExistingComments(user.uid)
          }
          
          // Auto-highlight the clicked phrase
          setTimeout(() => {
            autoHighlightPhrase(phrase.phrase, transcriptObject.speakerTranscript)
          }, 300) // Small delay to ensure modal is rendered
          
          // Jump to timestamp if available
          if (phrase.timestamp && phrase.timestamp !== "N/A" && phrase.timestamp !== "00:00") {
            //console.log(`⏰ Phrase has timestamp: ${phrase.timestamp}`)
            // Add a longer delay to ensure audio element is loaded
            setTimeout(() => {
              jumpToTimestamp(phrase.timestamp)
            }, 500)
          } else {
            //console.log('⚠️ No valid timestamp found for phrase:', phrase.timestamp)
          }
        } else {
          console.error('Analytics data not found in cache for:', documentId)
        }
      } else {
        console.error('No document ID found for phrase:', phrase)
      }
    } catch (error) {
      console.error('Error fetching transcript data:', error)
    }
  }

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "ACTIVITY":
        return (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between py-6 border-b border-gray-100">
              {/* Hide location and user filters for nurses */}
              {currentUserStatus !== 'nurse' && (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Location</label>
                    <Select value={selectedLocationFilter} onValueChange={filterTimestampsByLocation}>
                      <SelectTrigger className="w-44 h-9 border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:border-gray-400 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Choose location" />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200 shadow-lg">
                        <SelectItem value="all" className="text-sm font-medium">All Locations</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id} className="text-sm">
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">User</label>
                    <Select value={selectedUserFilter} onValueChange={filterTimestampsByUser}>
                      <SelectTrigger className="w-44 h-9 border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:border-gray-400 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Choose user" />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200 shadow-lg">
                        <SelectItem value="all" className="text-sm font-medium">All Users</SelectItem>
                        {loadingUsers ? (
                          <SelectItem value="loading" disabled className="text-sm text-gray-400">Loading users...</SelectItem>
                        ) : (
                          availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id} className="text-sm">
                              {user.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 font-medium">
                  {filteredTimestampData.length} recordings
                </span>
              </div>
            </div>

            {/* Sales Performance Summary */}
            {filteredTimestampData.length > 0 && (() => {
              const transcriptsWithSalesData = filteredTimestampData.filter(recording => 
                recording.salesPerformance && 
                typeof recording.salesPerformance.protocolScore === 'number'
              )
              
              if (transcriptsWithSalesData.length > 0) {
                const salesPerformanceAverages = calculateSalesPerformanceAverages(transcriptsWithSalesData)
                return (
                  <div className="mb-6">
                    <SalesPerformanceSummary 
                      averages={salesPerformanceAverages}
                      showDetailedBreakdown={true}
                    />
                  </div>
                )
              }
              return null
            })()}

            {/* Recordings List */}
            {loadingTimestamps ? (
              <LoadingSkeleton />
            ) : (
              <div className="space-y-0">
                {filteredTimestampData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p>No recordings found</p>
                  </div>
                ) : (
                  <>
                    {/* Show paginated data */}
                    {getPaginatedData().map((recording, index) => (
                    <div 
                        key={`${recording.id}-${index}`} 
                      className="group border-b border-gray-50 py-8 px-1 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer"
                      onClick={() => handleTranscriptClick(recording)}
                    >
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg group-hover:bg-gray-200 transition-colors">
                            {recording.emoji}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0 pr-4">
                              <h3 className="text-lg font-medium text-gray-900 truncate leading-tight">{getDecryptedNameForTranscript(recording)}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                  {getLocationNameForTranscript(recording)}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">
                                  {recording.timestamp?.toDate ? 
                                    recording.timestamp.toDate().toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    }) : 
                                    new Date(recording.timestamp || Date.now()).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          {recording.speakerTranscript && recording.speakerTranscript.length > 0 ? (
                            <div className="text-sm leading-relaxed text-gray-600 mt-4">
                              <span className="font-semibold text-gray-800">{recording.speakerTranscript[0]?.speaker}</span>
                              <span className="mx-2 text-gray-400">—</span>
                              <span>
                                {recording.speakerTranscript[0]?.text.substring(0, 120)}
                                {recording.speakerTranscript[0]?.text.length > 120 ? '...' : ''}
                              </span>
                            </div>
                          ) : (
                            <div className="text-sm leading-relaxed text-gray-600 mt-4">
                              {recording.transcript?.substring(0, 120)}
                              {recording.transcript && recording.transcript.length > 120 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    ))}
                    
                    {/* Load More Button */}
                    {hasMoreData && (
                      <div className="flex justify-center pt-8">
                        <Button 
                          onClick={loadMoreData}
                          variant="outline"
                          className="text-gray-600 border-gray-200 hover:bg-gray-50 font-medium"
                        >
                          Load More ({getPaginatedData().length} of {filteredTimestampData.length})
                        </Button>
                      </div>
                    )}
                    
                    {/* Show when all data is loaded */}
                    {!hasMoreData && filteredTimestampData.length > itemsPerPage && (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Showing all {filteredTimestampData.length} recordings
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Sign Out
            </button>
            <div className="h-7 w-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>
      {/* Content */}
      <main className="flex-1 px-12 py-6">
        {/* Performance Metrics */}
        {/* Hide Total Documents card for nurse users */}
        {currentUserStatus !== 'nurse' && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Total Documents</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{totalTranscriptCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8">
            {renderTabContent()}
          </div>
        </div>
      </main>
      
      {/* Full-Screen Transcript Modal */}
      {showTranscriptModal && selectedTranscript && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full h-full max-w-7xl mx-4 flex flex-col shadow-lg">
            {/* Header */}
            <div className="flex justify-between items-center p-8 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedTranscript.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedTranscript.timestamp && selectedTranscript.timestamp.toDate ? 
                    selectedTranscript.timestamp.toDate().toLocaleString() : 
                    'No timestamp'
                  }
                </p>
              </div>
              <button
                onClick={() => setShowTranscriptModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side - Transcript Content */}
              <div className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Audio Player */}
                <div className="mb-12">
                  {selectedTranscript.audioURL ? (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-slate-900">Audio Player</h4>
      
                      </div>
                      <audio controls className="w-full" ref={audioRef}>
                        <source src={selectedTranscript.audioURL} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-100 rounded-xl text-center text-slate-500">
                      No audio available
                    </div>
                  )}
                </div>

                {/* Speaker Transcript */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">Speaker Transcript</h4>
                    </div>
                    {selectedTranscript.speakerTranscript && selectedTranscript.speakerTranscript.length > 0 && !showFullTranscript && (
                      <button
                        onClick={() => setShowFullTranscript(true)}
                        className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span>Show Full Transcript</span>
                      </button>
                    )}
                  </div>
                  
                  {selectedTranscript.speakerTranscript && selectedTranscript.speakerTranscript.length > 0 ? (
                    showFullTranscript ? (
                      <div className="space-y-4">
                        {/* Hide Transcript Button at Top Right */}
                        <div className="flex justify-end pb-4">
                          <button
                            onClick={() => setShowFullTranscript(false)}
                            className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span>Hide Transcript</span>
                          </button>
                        </div>
                        
                        {selectedTranscript.speakerTranscript.map((speaker, index) => (
                          <div key={index} className="group relative flex items-start space-x-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                                <span className="text-sm font-bold text-white">
                                  {speaker.speaker ? speaker.speaker.charAt(0).toUpperCase() : 'S'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-3">
                                <span className="text-lg font-semibold text-slate-900 truncate">
                                  {speaker.speaker || 'Speaker'}
                                </span>
                                {speaker.timestamp && (
                                  <span className="flex-shrink-0 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium">
                                    {speaker.timestamp}
                                  </span>
                                )}
                              </div>
                              <p 
                                className="text-slate-700 leading-relaxed select-text cursor-text text-base"
                                onMouseUp={() => {
                                  const selection = window.getSelection()
                                  if (selection && selection.toString().trim()) {
                                    const selectedText = selection.toString().trim()
                                    const range = selection.getRangeAt(0)
                                    const startIndex = range.startOffset
                                    const endIndex = range.endOffset
                                    handleTextSelection(selectedText, speaker.speaker, index, startIndex, endIndex)
                                    selection.removeAllRanges()
                                  }
                                }}
                              >
                                {highlightedText && highlightedText.entryIndex === index ? 
                                  renderHighlightedText(speaker.text, highlightedText.startIndex, highlightedText.endIndex, index) :
                                  speaker.text
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Hide Transcript Button at Bottom Right */}
                        <div className="flex justify-end pt-4">
                          <button
                            onClick={() => setShowFullTranscript(false)}
                            className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span>Hide Transcript</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-purple-200 transition-all duration-200 cursor-pointer" onClick={() => setShowFullTranscript(true)}>
                        <div className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </div>
                              <div>
                                <h5 className="text-lg font-semibold text-slate-900 mb-1">
                                  Transcript Available
                                </h5>
                                <p className="text-sm text-slate-600">
                                  {selectedTranscript.speakerTranscript.length} conversation entries
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-500">
                              <span className="text-sm font-medium">Click to expand</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h5 className="text-lg font-semibold text-slate-700 mb-2">No Transcript Available</h5>
                      <p className="text-slate-500">This recording doesn't have a speaker transcript.</p>
                    </div>
                  )}
                </div>



                {/* Notes Section */}
                {selectedTranscript.notes && (
                  <div className="mb-12">
                    <h4 className="text-base font-medium text-gray-900 mb-6">Meeting Summary & Notes</h4>
                    <div className="border border-gray-100 rounded-lg p-8 bg-white">
                      <div 
                        className="prose prose-base max-w-none text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: selectedTranscript.notes
                            .replace(/^# (.+)$/gm, '<h1 class="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-100">$1</h1>')
                            .replace(/^## (.+)$/gm, '<h2 class="text-lg font-medium text-gray-800 mb-4 mt-8">$1</h2>')
                            .replace(/^### (.+)$/gm, '<h3 class="text-base font-medium text-gray-800 mb-3 mt-6">$1</h3>')
                            .replace(/^\* (.+)$/gm, '<li class="ml-6 mb-2 pl-2 relative"><span class="absolute left-0 top-2 w-1 h-1 bg-gray-400 rounded-full"></span>$1</li>')
                            .replace(/^## Overview/gm, '<h2 class="text-lg font-medium text-gray-800 mb-4 mt-8 flex items-center gap-2"><span class="text-gray-400">📋</span>Overview</h2>')
                            .replace(/^## Botox Appointment Experience/gm, '<h2 class="text-lg font-medium text-gray-800 mb-4 mt-8 flex items-center gap-2"><span class="text-gray-400">💉</span>Botox Appointment Experience</h2>')
                            .replace(/^## Key Takeaways/gm, '<h2 class="text-lg font-medium text-gray-800 mb-4 mt-8 flex items-center gap-2"><span class="text-gray-400">🎯</span>Key Takeaways</h2>')
                            .replace(/^## Action Items/gm, '<h2 class="text-lg font-medium text-gray-800 mb-4 mt-8 flex items-center gap-2"><span class="text-gray-400">✅</span>Action Items</h2>')
                            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-gray-900">$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em class="italic text-gray-600">$1</em>')
                            .replace(/\(Timestamp: (.+?)\)/g, '<span class="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-3 font-medium">$1</span>')
                            .replace(/\n\n/g, '<br><br>')
                            .replace(/\n/g, '<br>')
                        }}
                      />
                    </div>
                  </div>
                )}


                {/* Sales Performance Section */}
                {selectedTranscript.salesPerformance && (
                  <div className="mb-12">
                    <h4 className="text-base font-medium text-gray-900 mb-6">Sales Performance</h4>
                    <div className="border border-gray-100 rounded-lg p-8">
                      <div className="space-y-8">
                        {/* Overall Grade and Confidence */}
                        <div className="flex items-center justify-between pb-6 border-b border-gray-50">
                          <div className="flex items-center gap-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              selectedTranscript.salesPerformance.overallGrade === 'excellent' ? 'bg-gray-100 text-gray-800' :
                              selectedTranscript.salesPerformance.overallGrade === 'good' ? 'bg-gray-100 text-gray-800' :
                              selectedTranscript.salesPerformance.overallGrade === 'poor' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedTranscript.salesPerformance.overallGrade?.toUpperCase() || 'N/A'}
                            </div>
                            {selectedTranscript.salesPerformance.confidence && (
                              <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {selectedTranscript.salesPerformance.confidence?.toUpperCase() || 'N/A'}
                              </div>
                            )}
                          </div>
                          {selectedTranscript.salesPerformance.protocolScore !== undefined && (
                            <div className="text-right">
                              <div className="text-2xl font-light text-gray-900">{selectedTranscript.salesPerformance.protocolScore}</div>
                              <div className="text-xs text-gray-400 uppercase tracking-wide">Score</div>
                            </div>
                          )}
                        </div>

                        {/* Key Strengths */}
                        {selectedTranscript.salesPerformance.keyStrengths && selectedTranscript.salesPerformance.keyStrengths.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Strengths</h5>
                            <div className="flex flex-wrap gap-2">
                              {selectedTranscript.salesPerformance.keyStrengths.map((strength, index) => (
                                <span key={index} className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm">
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Areas for Improvement */}
                        {selectedTranscript.salesPerformance.improvementAreas && selectedTranscript.salesPerformance.improvementAreas.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Areas for Improvement</h5>
                            <div className="flex flex-wrap gap-2">
                              {selectedTranscript.salesPerformance.improvementAreas.map((area, index) => (
                                <span key={index} className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm">
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Protocol Adherence */}
                        {selectedTranscript.salesPerformance.protocolAdherence && selectedTranscript.salesPerformance.protocolAdherence.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Protocol Adherence</h5>
                            <div className="space-y-2">
                              {selectedTranscript.salesPerformance.protocolAdherence.map((protocol, index) => (
                                <div key={index} className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                  <span className="text-sm text-gray-600">{protocol}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {selectedTranscript.salesPerformance.recommendations && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Recommendations</h5>
                            <div className="bg-gray-25 p-4">
                              <div className="text-sm text-gray-600 space-y-2">
                                {selectedTranscript.salesPerformance.recommendations.split('•').map((rec, index) => (
                                  rec.trim() && (
                                    <div key={index} className="flex items-start gap-3">
                                      <span className="text-gray-300 mt-1">•</span>
                                      <span>{rec.trim()}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar - Comments */}
              <div className="w-80 border-l border-gray-100 bg-white p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
                <div className="mb-8">
                  <h4 className="text-base font-medium text-gray-900 mb-1">Comments</h4>
                  <p className="text-xs text-gray-400">
                    Private to your company
                  </p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Add comment
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add your thoughts..."
                      className="w-full p-4 border border-gray-100 rounded-lg resize-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-colors bg-white text-sm"
                      rows={4}
                    />
                  </div>

                  {highlightedText && (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Selected</div>
                        {activeTab === "TRACKERS" && (
                          <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium uppercase tracking-wide">
                            TRACKERS
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 mb-3">"{highlightedText.text}"</div>
                      <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        {highlightedText.speaker}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        alert('🔘 Save button clicked!')
                        console.log('🔘 Save button clicked!')
                        console.log('🔍 Button state:', {
                          hasComment: !!comment.trim(),
                          hasHighlightedText: !!highlightedText,
                          isSaving: savingComment,
                          comment: comment.trim(),
                          highlightedText
                        })
                        saveComment()
                      }}
                      disabled={!comment.trim() || !highlightedText || savingComment}
                      onMouseEnter={() => {
                        console.log('🔍 Save button hover - State:', {
                          hasComment: !!comment.trim(),
                          hasHighlightedText: !!highlightedText,
                          isSaving: savingComment,
                          comment: comment.trim(),
                          highlightedText: highlightedText
                        })
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !comment.trim() || !highlightedText || savingComment
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {savingComment ? 'Saving...' : `Save (${!comment.trim() ? 'no-comment' : 'has-comment'}-${!highlightedText ? 'no-highlight' : 'has-highlight'})`}
                    </button>
                    <button
                      onClick={() => {
                        setComment('')
                        setHighlightedText(null)
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600"
                    >
                      Clear
                    </button>
                  </div>

                  {!highlightedText && (
                    <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-lg">
                      Highlight text to add a comment
                    </div>
                  )}
                </div>

                {/* Previous Comments */}
                <div className="mt-12">
                  <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-6">
                    Previous {existingComments.length > 0 && `(${existingComments.length})`}
                  </h5>
                  {loadingComments ? (
                    <div className="flex items-center justify-center p-8 text-gray-400">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full mr-3"></div>
                      Loading...
                    </div>
                  ) : existingComments.length > 0 ? (
                    <div className="space-y-6">
                      {existingComments.map((alert: AlertData, index: number) => (
                        <div key={alert.id || index} className="p-6 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {alert.title || 'System Alert'}
                                </span>
                                {alert.type && (
                                  <span className="text-xs px-2 py-1 rounded font-medium bg-gray-100 text-gray-600 uppercase tracking-wide">
                                    {alert.type === 'trackers_comment' ? 'TRACKERS' :
                                     alert.type === 'warning' ? 'Warning' :
                                     alert.type}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 mb-4">{alert.message}</p>
                              
                              {/* Transcript References */}
                              {alert.transcriptReferences && alert.transcriptReferences.length > 0 && (
                                <div className="mt-4 p-4 bg-white rounded border border-gray-100">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Referenced:</p>
                                  <div className="space-y-2">
                                    {alert.transcriptReferences.slice(0, 2).map((ref, refIndex) => (
                                      <div key={refIndex} className="text-sm">
                                        <span className="font-medium text-gray-900">{ref.speaker}:</span>
                                        <span className="text-gray-600 ml-2">"{ref.quote}"</span>
                                      </div>
                                    ))}
                                    {alert.transcriptReferences.length > 2 && (
                                      <p className="text-xs text-gray-400">
                                        +{alert.transcriptReferences.length - 2} more...
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded">
                                {alert.timestamp?.toDate ? 
                                  formatTimeAgo(alert.timestamp.toDate()) : 
                                  'Recent'
                                }
                              </span>
                              {!alert.isRead && (
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-12 text-gray-400">
                      <MessageCircle className="w-8 h-8 mx-auto mb-4 text-gray-200" />
                      <p className="text-sm">No comments yet</p>
                      <p className="text-xs mt-1">Highlight text to add one</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-0">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="border-b border-gray-50 py-8 px-1 animate-pulse">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          </div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-6 bg-gray-100 rounded-md w-20"></div>
              <div className="h-4 bg-gray-100 rounded w-24"></div>
            </div>
            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
)