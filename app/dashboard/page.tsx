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
import { db } from "@/lib/firebase"

import { analyzeSingleTranscript } from "@/lib/analytics-utils-client"
import { getUserDisplayName, isUserDataEncrypted, testDecryption } from "@/lib/decryption-utils"
import { logger, clientLogger } from "@/lib/logger"
import { SalesPerformanceSummary, IndividualSalesPerformance } from "@/components/sales-performance-summary"
import { calculateSalesPerformanceAverages, getSalesPerformanceInsights } from "@/lib/sales-performance-utils"

// Authorized email list
const AUTHORIZED_EMAILS = [
  'adimahna@gmail.com',
  'Vverma@revive.md',
  'vverma@revive.md'
];

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
  type?: 'trackers_comment' | 'speaker_comment' | 'comment' | 'info' | string
  source?: 'TRACKERS_TAB' | 'DIRECT_SELECTION' | string
  userEmail?: string
  userName?: string
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("TRACKERS")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [transcripts, setTranscripts] = useState<TranscriptData[]>([])
  const [totalTranscriptCount, setTotalTranscriptCount] = useState<number>(0)
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [phraseData, setPhraseData] = useState<PhraseData[]>([])
  const [loading, setLoading] = useState(true)
  
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
  const [selectedCategoryPhrases, setSelectedCategoryPhrases] = useState<PhraseData[]>([])
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseData | null>(null)
  const [phraseTranscripts, setPhraseTranscripts] = useState<TranscriptDetail[]>([])
  const [selectedDocument, setSelectedDocument] = useState<SelectedDocument | null>(null)
  const [processedDocuments, setProcessedDocuments] = useState<Set<string>>(new Set())
  const [analyticsCache, setAnalyticsCache] = useState<{[key: string]: any}>({})
  const [analyticsDataLoaded, setAnalyticsDataLoaded] = useState(false)
  const [userDisplayNames, setUserDisplayNames] = useState<{[key: string]: string}>({})
  const [locationTranscripts, setLocationTranscripts] = useState<TranscriptData[]>([])
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
  const [comment, setComment] = useState('')
  const [highlightedText, setHighlightedText] = useState<{text: string, speaker: string, entryIndex: number, startIndex: number, endIndex: number} | null>(null)
  const [savingComment, setSavingComment] = useState(false)
  const [existingComments, setExistingComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  

  
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

  // Search analytics data
  const searchAnalyticsData = async (query: string) => {
    const queryLower = query.toLowerCase()
    let results: any[] = []
    
    // Search through transcripts
    const transcriptMatches = transcripts.filter(t => 
      t.transcript.toLowerCase().includes(queryLower) ||
      t.name.toLowerCase().includes(queryLower)
    )
    
    // Search through categories
    const categoryMatches = categoryData.filter(c => 
      c.name.toLowerCase().includes(queryLower) ||
      c.phrases.some(p => p.toLowerCase().includes(queryLower))
    )
    
    // Search through phrases
    const phraseMatches = phraseData.filter(p => 
      p.phrase.toLowerCase().includes(queryLower) ||
      p.category.toLowerCase().includes(queryLower)
    )
    
    results = [...transcriptMatches, ...categoryMatches, ...phraseMatches]
    
    if (results.length === 0) {
      return {
        response: `I couldn't find any matches for "${query}". Try searching for different terms or ask me about general analytics.`,
        metadata: { query, results: [] }
      }
    }
    
    const responseText = `🔍 **Search Results for "${query}":**\n\nFound ${results.length} relevant items:\n\n${results.slice(0, 5).map((item, index) => 
      `${index + 1}. ${item.name || item.phrase || item.transcript?.substring(0, 100)}...`
    ).join('\n')}`
    
    return {
      response: responseText,
      metadata: { query, results: results.slice(0, 5), totalResults: results.length }
    }
  }

  // Generate analytics summary
  const generateAnalyticsSummary = async () => {
    const totalTranscripts = transcripts.length
    const topCategories = categoryData.slice(0, 3)
    const totalPhrases = phraseData.reduce((sum, p) => sum + p.count, 0)
    
    const responseText = `📈 **Analytics Summary:**\n\n• **Total Transcripts**: ${totalTranscripts}\n• **Total Phrases Tracked**: ${totalPhrases}\n• **Top Categories**:\n${topCategories.map(cat => `  - ${cat.name}: ${cat.percentage}%`).join('\n')}\n\n💡 **Key Insights**:\n• Your team is performing well in ${topCategories[0]?.name || 'key areas'}\n• Focus on improving ${categoryData[categoryData.length - 1]?.name || 'underperforming areas'}\n• Consider additional training for better results`
    
    return {
      response: responseText,
      metadata: { 
        totalTranscripts, 
        totalPhrases, 
        topCategories,
        summaryDate: new Date()
      }
    }
  }

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
      console.log('📊 Loading total transcript count by counting timestamp subcollection documents...')
      
      // Get all documents from the transcript collection
      const transcriptRef = collection(db, 'transcript')
      const transcriptSnap = await getDocs(transcriptRef)
      
      let totalCount = 0
      
      console.log(`📊 Found ${transcriptSnap.size} transcript documents, counting their timestamp subcollections...`)
      
      // Go through each transcript document and count its timestamps subcollection
      for (const transcriptDoc of transcriptSnap.docs) {
        const docId = transcriptDoc.id
        try {
          console.log(`📊 Counting timestamps for transcript document: ${docId}`)
          
          // Count documents in the timestamps subcollection for this transcript
          const timestampsRef = collection(db, 'transcript', docId, 'timestamps')
          const timestampsSnap = await getDocs(timestampsRef)
          
          const docTimestampCount = timestampsSnap.size
          totalCount += docTimestampCount
          
          console.log(`📊 Document ${docId}: ${docTimestampCount} timestamp documents`)
        } catch (timestampError) {
          console.warn(`⚠️ Could not count timestamps for transcript document ${docId}:`, timestampError)
        }
      }
      
      console.log(`📊 Found ${totalCount} total timestamp documents across all transcript documents`)
      setTotalTranscriptCount(totalCount)
      
      clientLogger.info('📊 Total transcript count loaded successfully', { 
        transcriptDocuments: transcriptSnap.size,
        totalTimestampDocuments: totalCount 
      })
    } catch (error) {
      console.error('❌ Error loading total transcript count:', error)
      clientLogger.error('❌ Failed to load total transcript count', error)
    }
  }

  // Load chat session
  const loadChatSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    // In a real implementation, you would load messages from storage
    // For now, we'll just clear messages and show welcome
    setChatMessages([])
  }

  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Check if user exists in Firestore users collection and is authorized
  useEffect(() => {
    const checkUserInFirestore = async () => {
      if (!authLoading && user) {
        // Check if user email is authorized
        const isEmailAuthorized = AUTHORIZED_EMAILS.includes(user.email);
        if (!isEmailAuthorized) {
          console.log('🚫 Unauthorized user access attempt:', user.email);
          router.push('/signin'); // Redirect to signin page
          return;
        }

        try {
          console.log('🔍 Checking if user exists in Firestore users collection...')
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          
          if (!userDoc.exists()) {
            console.log('❌ User not found in Firestore users collection, redirecting to signin')
            router.push('/signin')
          } else {
            console.log('✅ User found in Firestore users collection')
          }
        } catch (error) {
          console.error('❌ Error checking user in Firestore:', error)
          router.push('/signin')
        }
      } else if (!authLoading && !user) {
        console.log('❌ User not authenticated, redirecting to signin')
        router.push('/signin')
      }
    }

    checkUserInFirestore()
  }, [user, authLoading, router])

  // Check if user email is authorized (redundant check for immediate feedback before useEffect redirect)
  if (user) {
    const isEmailAuthorized = AUTHORIZED_EMAILS.includes(user.email);
    if (!isEmailAuthorized) {
      router.push('/signin');
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">🚫 Unauthorized User</h1>
            <p className="text-muted-foreground">Redirecting to signin page...</p>
          </div>
        </div>
      );
    }
  }

  // Chat functions


  // Function to handle transcript click and open full-screen modal
  const handleTranscriptClick = (transcript: TimestampData) => {
    setSelectedTranscript(transcript)
    setShowTranscriptModal(true)
    loadExistingComments(transcript.transcriptDocumentId)
  }

  // Function to load existing comments and alerts from alerts collection
  const loadExistingComments = async (transcriptDocumentId?: string) => {
    if (!transcriptDocumentId) return
    
    try {
      setLoadingComments(true)
      console.log(`🔍 Loading existing alerts and comments for document: ${transcriptDocumentId}`)
      
      const alertsRef = doc(db, 'alerts', transcriptDocumentId)
      const alertsSnap = await getDoc(alertsRef)
      
      if (alertsSnap.exists()) {
        const data = alertsSnap.data()
        // Handle both array format and direct alerts format
        const alerts = Array.isArray(data.alerts) ? data.alerts : 
                      Array.isArray(data) ? data : 
                      [data] // Single alert object
        
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
        console.log('📄 No alerts document found for this transcript')
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
        <span className="relative inline-block bg-yellow-200 text-slate-900 px-1 rounded group">
          {highlightedText}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setHighlightedText(null)
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 flex items-center justify-center"
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
      console.log('🧑‍💼 Loading available users from timestamp data...')
      
      const users: {id: string, name: string}[] = []
      const processedUserIds = new Set<string>()
      
      // Get unique document IDs from the provided timestamp data
      const uniqueDocumentIds = [...new Set(timestampsData.map(item => item.transcriptDocumentId).filter(Boolean))]
      
      console.log(`🔍 Loading users from ${uniqueDocumentIds.length} document IDs from timestamp data`)
      
      // Load user data from each transcript document
      for (const documentId of uniqueDocumentIds) {
        if (!documentId || processedUserIds.has(documentId)) continue
        processedUserIds.add(documentId)
        
        try {
          const transcriptDocRef = doc(db, 'transcript', documentId)
          const transcriptDoc = await getDoc(transcriptDocRef)
          
          if (transcriptDoc.exists()) {
            const transcriptData = transcriptDoc.data()
            
            console.log(`📄 Processing user data for document: ${documentId}`, {
              hasEncryptedUserData: !!transcriptData.encryptedUserData,
              encryptionStatus: transcriptData.encryptionStatus,
              fields: Object.keys(transcriptData)
            })
            
            // Use the same centralized decryption approach as TRACKERS tab
            let userName = `Unknown User (${documentId.substring(0, 8)}...)`
            
            // Create a fallback email from the document ID for centralized lookup
            const fallbackEmail = `${documentId.substring(0, 8)}@device.local`
            
            // If we have centralized decryption data, use it
            if (userDisplayNames[fallbackEmail]) {
              userName = userDisplayNames[fallbackEmail]
              console.log(`🔓 Using centralized decrypted name for ${documentId}: ${userName}`)
            } else if (transcriptData.encryptedUserData && isUserDataEncrypted(transcriptData.encryptedUserData)) {
              // If userDisplayNames is not populated yet, try to decrypt on-demand
              try {
                console.log(`🔍 userDisplayNames not available, attempting on-demand decryption for ${documentId}`)
                const decryptedName = await Promise.race([
                  getUserDisplayName(fallbackEmail, transcriptData.encryptedUserData),
                  new Promise<string>((_, reject) => 
                    setTimeout(() => reject(new Error('On-demand decryption timeout')), 3000)
                  )
                ]).catch(() => {
                  console.warn(`⚠️ On-demand decryption failed for ${documentId}, using fallback`)
                  return fallbackEmail
                })
                userName = decryptedName
                console.log(`🔓 On-demand decrypted name for ${documentId}: ${userName}`)
              } catch (error) {
                console.error(`❌ Error in on-demand decryption for ${documentId}:`, error)
                userName = fallbackEmail
              }
            } else if (transcriptData.userEmail) {
              // Fallback to userEmail if available
              userName = transcriptData.userEmail
              console.log(`📧 Using userEmail as fallback for ${documentId}: ${userName}`)
            } else {
              // Handle unencrypted data (fallback)
              userName = transcriptData.fullName || transcriptData.name || `Unknown User (${documentId.substring(0, 8)}...)`
              console.log(`📝 Using unencrypted name for ${documentId}: ${userName}`)
            }
            
            users.push({
              id: documentId,
              name: userName
            })
          } else {
            console.log(`⚠️ Document ${documentId} does not exist`)
            users.push({
              id: documentId,
              name: `Unknown User (${documentId.substring(0, 8)}...)`
            })
          }
        } catch (error) {
          console.error(`❌ Error loading user data for ${documentId}:`, error)
          users.push({
            id: documentId,
            name: `Unknown User (${documentId.substring(0, 8)}...)`
          })
        }
      }
      
      console.log(`✅ Loaded ${users.length} users:`, users)
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
      console.log('🧑‍💼 Loading available users from transcript collection...')
      
      const users: {id: string, name: string}[] = []
      const processedUserIds = new Set<string>()
      
      // Get unique document IDs from timestampData if available
      const uniqueDocumentIds = [...new Set(timestampData.map(item => item.transcriptDocumentId).filter(Boolean))]
      
      if (uniqueDocumentIds.length > 0) {
        console.log(`🔍 Loading users from ${uniqueDocumentIds.length} document IDs from timestamp data`)
        
        // Load user data from each transcript document
        for (const documentId of uniqueDocumentIds) {
          if (!documentId || processedUserIds.has(documentId)) continue
          processedUserIds.add(documentId)
          
          try {
            const transcriptDocRef = doc(db, 'transcript', documentId)
            const transcriptDoc = await getDoc(transcriptDocRef)
            
            if (transcriptDoc.exists()) {
              const transcriptData = transcriptDoc.data()
              
              console.log(`📄 Processing user data for document: ${documentId}`, {
                hasEncryptedUserData: !!transcriptData.encryptedUserData,
                encryptionStatus: transcriptData.encryptionStatus,
                fields: Object.keys(transcriptData)
              })
              
              // Use the same centralized decryption approach as TRACKERS tab
              let userName = `Unknown User (${documentId.substring(0, 8)}...)`
              
              // Create a fallback email from the document ID for centralized lookup
              const fallbackEmail = `${documentId.substring(0, 8)}@device.local`
              
              // If we have centralized decryption data, use it
              if (userDisplayNames[fallbackEmail]) {
                userName = userDisplayNames[fallbackEmail]
                console.log(`🔓 Using centralized decrypted name for ${documentId}: ${userName}`)
              } else if (transcriptData.encryptedUserData && isUserDataEncrypted(transcriptData.encryptedUserData)) {
                // If userDisplayNames is not populated yet, try to decrypt on-demand
                try {
                  console.log(`🔍 userDisplayNames not available, attempting on-demand decryption for ${documentId}`)
                  const decryptedName = await Promise.race([
                    getUserDisplayName(fallbackEmail, transcriptData.encryptedUserData),
                    new Promise<string>((_, reject) => 
                      setTimeout(() => reject(new Error('On-demand decryption timeout')), 3000)
                    )
                  ]).catch(() => {
                    console.warn(`⚠️ On-demand decryption failed for ${documentId}, using fallback`)
                    return fallbackEmail
                  })
                  userName = decryptedName
                  console.log(`🔓 On-demand decrypted name for ${documentId}: ${userName}`)
                } catch (error) {
                  console.error(`❌ Error in on-demand decryption for ${documentId}:`, error)
                  userName = fallbackEmail
                }
              } else if (transcriptData.userEmail) {
                // Fallback to userEmail if available
                userName = transcriptData.userEmail
                console.log(`📧 Using userEmail as fallback for ${documentId}: ${userName}`)
              } else {
                // Handle unencrypted data (fallback)
                userName = transcriptData.fullName || transcriptData.name || `Unknown User (${documentId.substring(0, 8)}...)`
                console.log(`📝 Using unencrypted name for ${documentId}: ${userName}`)
              }
              
              users.push({
                id: documentId,
                name: userName
              })
            } else {
              console.log(`⚠️ Document ${documentId} does not exist`)
              users.push({
                id: documentId,
                name: `Unknown User (${documentId.substring(0, 8)}...)`
              })
            }
          } catch (error) {
            console.error(`❌ Error loading user data for ${documentId}:`, error)
            users.push({
              id: documentId,
              name: `Unknown User (${documentId.substring(0, 8)}...)`
            })
          }
        }
      } else {
        console.log('🔄 No timestamp data available, falling back to root transcript collection scan')
        
        // Fallback: scan the root transcript collection
        const transcriptsRef = collection(db, 'transcript')
        const transcriptsSnap = await getDocs(transcriptsRef)
        
        for (const transcriptDoc of transcriptsSnap.docs) {
          const transcriptData = transcriptDoc.data()
          const deviceId = transcriptDoc.id
          
          // Use the same centralized decryption approach as TRACKERS tab
          let userName = `Unknown User (${deviceId.substring(0, 8)}...)`
          
          // Create a fallback email from the device ID for centralized lookup
          const fallbackEmail = `${deviceId.substring(0, 8)}@device.local`
          
          // If we have centralized decryption data, use it
          if (userDisplayNames[fallbackEmail]) {
            userName = userDisplayNames[fallbackEmail]
            console.log(`🔓 Using centralized decrypted name for ${deviceId}: ${userName}`)
          } else if (transcriptData.encryptedUserData && isUserDataEncrypted(transcriptData.encryptedUserData)) {
            // If userDisplayNames is not populated yet, try to decrypt on-demand
            try {
              console.log(`🔍 userDisplayNames not available, attempting on-demand decryption for ${deviceId}`)
              const decryptedName = await Promise.race([
                getUserDisplayName(fallbackEmail, transcriptData.encryptedUserData),
                new Promise<string>((_, reject) => 
                  setTimeout(() => reject(new Error('On-demand decryption timeout')), 3000)
                )
              ]).catch(() => {
                console.warn(`⚠️ On-demand decryption failed for ${deviceId}, using fallback`)
                return fallbackEmail
              })
              userName = decryptedName
              console.log(`🔓 On-demand decrypted name for ${deviceId}: ${userName}`)
            } catch (error) {
              console.error(`❌ Error in on-demand decryption for ${deviceId}:`, error)
              userName = fallbackEmail
            }
          } else if (transcriptData.userEmail) {
            // Fallback to userEmail if available
            userName = transcriptData.userEmail
            console.log(`📧 Using userEmail as fallback for ${deviceId}: ${userName}`)
          } else {
            // Handle unencrypted data (fallback)
            userName = transcriptData.fullName || transcriptData.name || `Unknown User (${deviceId.substring(0, 8)}...)`
            console.log(`📝 Using unencrypted name for ${deviceId}: ${userName}`)
          }
          
          users.push({
            id: deviceId,
            name: userName
          })
        }
      }
      
      console.log(`✅ Loaded ${users.length} users:`, users)
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
      console.log(`🧑‍💼 Loading users for location: ${locationId}`)
      
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
    console.log('🔍 Loading decrypted names for transcripts...')
    
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
      console.log('🔍 Fetching transcript document for decryption:', transcriptDocumentId)
      
      // Fetch the transcript document from Firestore
      const transcriptDocRef = doc(db, 'transcript', transcriptDocumentId)
      const transcriptDoc = await getDoc(transcriptDocRef)
      
      if (!transcriptDoc.exists()) {
        console.log('❌ Transcript document not found:', transcriptDocumentId)
        return 'Unknown User'
      }
      
      const transcriptData = transcriptDoc.data()
      console.log('📄 Transcript document data:', {
        hasEncryptedUserData: !!transcriptData.encryptedUserData,
        encryptionStatus: transcriptData.encryptionStatus,
        createdAtLocation: transcriptData.createdAtLocation
      })
      
      // Check if we have encrypted user data
      if (transcriptData.encryptedUserData && transcriptData.encryptionStatus === 'encrypted') {
        console.log('🔐 Found encrypted user data, attempting decryption...')
        
        // Try to decrypt using the document ID as the credential
        const decryptedName = await getUserDisplayName(transcriptDocumentId, transcriptData.encryptedUserData)
        
        if (decryptedName && decryptedName !== transcriptDocumentId && decryptedName !== 'Unknown User') {
          console.log('✅ Successfully decrypted name:', decryptedName)
          return decryptedName
        }
        
        // If that didn't work, try with the user ID from the document path
        const userId = transcriptDocumentId.split('/')[0] || transcriptDocumentId
        const decryptedNameWithUserId = await getUserDisplayName(userId, transcriptData.encryptedUserData)
        
        if (decryptedNameWithUserId && decryptedNameWithUserId !== userId && decryptedNameWithUserId !== 'Unknown User') {
          console.log('✅ Successfully decrypted name with user ID:', decryptedNameWithUserId)
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
      
      console.log('❌ No decrypted name found for transcript:', transcriptDocumentId)
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
    console.log('🎯 Auto-highlighting phrase:', targetPhrase)
    console.log('📋 Speaker transcript entries:', speakerTranscript?.length || 0)
    
    if (!speakerTranscript || speakerTranscript.length === 0) {
      console.warn('⚠️ No speaker transcript available for auto-highlighting')
      return
    }

    // Clean the target phrase for matching (remove extra quotes and clean whitespace)
    const cleanTargetPhrase = targetPhrase.replace(/^["']|["']$/g, '').trim().toLowerCase()
    console.log('🧹 Cleaned target phrase:', cleanTargetPhrase)

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
        
        console.log('✅ Found phrase in entry:', {
          entryIndex,
          speaker: entry.speaker,
          phraseIndex: actualStartIndex,
          endIndex: actualEndIndex,
          originalText: entryText
        })
        
        // Set the highlighted text
        setHighlightedText({
          text: entryText.substring(actualStartIndex, actualEndIndex),
          speaker: entry.speaker || 'Unknown Speaker',
          entryIndex: entryIndex,
          startIndex: actualStartIndex,
          endIndex: actualEndIndex
        })
        
        console.log('🎨 Auto-highlighted phrase successfully')
        return
      }
    }
    
    // If exact phrase not found, try partial matching with keywords
    console.log('🔍 Exact phrase not found, trying keyword matching...')
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
        
        console.log('✅ Found partial match in entry:', {
          entryIndex,
          speaker: entry.speaker,
          matchingKeywords,
          selectedText: entryText.substring(bestStart, bestEnd)
        })
        
        setHighlightedText({
          text: entryText.substring(bestStart, bestEnd),
          speaker: entry.speaker || 'Unknown Speaker',
          entryIndex: entryIndex,
          startIndex: bestStart,
          endIndex: bestEnd
        })
        
        console.log('🎨 Auto-highlighted partial match successfully')
        return
      }
    }
    
    console.warn('⚠️ Could not find phrase to auto-highlight:', cleanTargetPhrase)
  }

  // Function to save comment to alerts collection
  const saveComment = async () => {
    if (!comment.trim() || !highlightedText || !selectedTranscript || !user) {
      console.log('❌ Missing required data for comment saving')
      return
    }

    try {
      setSavingComment(true)
      console.log('💾 Saving comment to alerts collection...')
      console.log('🔍 Selected transcript object:', {
        id: selectedTranscript.id,
        name: selectedTranscript.name,
        transcriptDocumentId: selectedTranscript.transcriptDocumentId,
        hasTranscriptDocumentId: !!selectedTranscript.transcriptDocumentId
      })
      
      // Get the transcript document ID from the selectedTranscript
      let transcriptDocumentId = selectedTranscript.transcriptDocumentId
      
      if (!transcriptDocumentId) {
        console.log('⚠️ No stored transcript document ID, searching for it...')
        
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
                  console.log(`🎯 Found document ID via search: ${foundDocumentId}`)
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
      
      // Create alert document structure
      const alertDoc = {
        id: alertId,
        isRead: false,
        message: comment.trim(),
        recordingId: selectedTranscript.id,
        timestamp: new Date(),
        title: `${isTrackersComment ? 'TRACKERS' : 'Comment'} on ${selectedTranscript.name}`,
        transcriptReferences: [{
          context: isTrackersComment ? "TRACKERS Analysis" : "Speaker Comment",
          entryId: selectedTranscript.id,
          entryIndex: highlightedText.entryIndex,
          quote: highlightedText.text,
          speaker: highlightedText.speaker,
          category: isTrackersComment ? "Tracker Analysis" : "General Comment",
          highlightedPhrase: highlightedText.text,
          transcriptName: selectedTranscript.name,
          audioURL: selectedTranscript.audioURL || ''
        }],
        type: isTrackersComment ? "trackers_comment" : "speaker_comment",
        source: isTrackersComment ? "TRACKERS_TAB" : "DIRECT_SELECTION",
        userEmail: user.email || 'unknown',
        userName: user.displayName || 'Unknown User',
        lastUpdated: new Date()
      }

      // Save to alerts using the transcript document ID instead of user.uid
      const alertsRef = doc(db, 'alerts', transcriptDocumentId)
      const alertsSnap = await getDoc(alertsRef)
      
      let existingAlerts = []
      if (alertsSnap.exists()) {
        const data = alertsSnap.data()
        existingAlerts = data.alerts || []
      }
      
      // Add new alert to the array
      existingAlerts.push(alertDoc)
      
      // Save back to Firestore
      await setDoc(alertsRef, { alerts: existingAlerts }, { merge: true })
      
      console.log('✅ Comment saved successfully!')
      console.log(`📍 Saved to /alerts/${transcriptDocumentId}`)
      
      clientLogger.info('Comment saved to alerts collection', { 
        transcriptDocumentId,
        alertId,
        recordingId: selectedTranscript.id,
        highlightedText: highlightedText.text
      })
      
      // Clear form
      setComment('')
      setHighlightedText(null)
      
      // Reload comments to show the new one
      loadExistingComments(transcriptDocumentId)
      
    } catch (error) {
      console.error('❌ Error saving comment:', error)
      clientLogger.error('Failed to save comment', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setSavingComment(false)
    }
  }

  // Function to load locations from a chain
    const loadLocationsFromChain = async (chainId: string) => {
    try {
      console.log('🚀 ===== ACTIVITY TAB: STARTING LOCATION LOAD =====')
      console.log(`🔍 Loading locations for chain: ${chainId}`)
      console.log(`🔗 Current URL: ${window.location.href}`)
      console.log(`🔗 URL Parameters: ${window.location.search}`)
      
      // Add server-side logging
      clientLogger.info('🚀 Starting location load process', { chainId })
      
      setLoadingLocations(true)
      
      // Use the new API endpoint to get locations
      console.log(`🌐 Calling API endpoint: /api/get-locations?chainId=${chainId}`)
      
      const response = await fetch(`/api/get-locations?chainId=${encodeURIComponent(chainId)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        clientLogger.error('❌ API request failed', { 
          chainId, 
          status: response.status,
          error: errorData
        })
        
        if (response.status === 404) {
          console.log(`❌ Chain '${chainId}' not found`)
          setLocations([])
          return
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📋 API Response:', data)
      
      if (!data.success) {
        console.error('❌ API returned error:', data.error)
        clientLogger.error('❌ API returned error', { 
          chainId, 
          error: data.error 
        })
        setLocations([])
        return
      }
      
      const locationsData = data.locations || []
      
      console.log('📋 FINAL LOCATIONS DATA:', locationsData)
      clientLogger.info('📋 Final locations data', { 
        chainId, 
        locations: locationsData.map((l: any) => ({ id: l.id, name: l.name, count: l.transcriptCount })),
        totalLocations: locationsData.length,
        totalTranscripts: locationsData.reduce((sum: number, loc: any) => sum + loc.transcriptCount, 0)
      })
      
      setLocations(locationsData)
      setSelectedChain(chainId)
      console.log('✅ State updated - real locations loaded from API')
      clientLogger.info('✅ Successfully loaded real locations from API', { 
        chainId, 
        locationCount: locationsData.length 
      })
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR loading locations:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error && 'code' in error ? (error as any).code : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      
      // Add server-side logging for errors
      clientLogger.error('❌ Failed to load locations from chain', { 
        chainId, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      
      setLocations([])
    } finally {
      setLoadingLocations(false)
      console.log('🏁 ===== LOCATION LOAD COMPLETE =====')
      
      // Add server-side logging for completion
      clientLogger.info('🏁 Location load process completed', { chainId })
    }
  }

  // Function to load transcripts from locations collection
  const loadLocationTranscripts = async (chainId: string, locationId: string) => {
    try {
      console.log(`🔍 Loading transcripts for ${chainId}/${locationId}`)
      
      // Get all transcript documents from the location subcollection
      const transcriptsRef = collection(db, 'locations', chainId, locationId)
      const transcriptsSnap = await getDocs(transcriptsRef)
      
      const transcriptsData: TranscriptData[] = []
      
      for (const transcriptDoc of transcriptsSnap.docs) {
        const transcriptId = transcriptDoc.id
        const transcriptData = transcriptDoc.data()
        
        console.log(`📋 Found transcript: ${transcriptId}`, transcriptData)
        
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
      
      console.log('✅ Loaded location transcripts:', transcriptsData)
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
      console.log('🎯 ===== LOADING TIMESTAMP DATA FOR ACTIVITY TAB =====')
      console.log(`🔍 Loading timestamp data for chain: ${chainId}`)
      
      setLoadingTimestamps(true)
      clientLogger.info('🎯 Starting timestamp data load process', { chainId })
      
      // Get locations directly from API instead of relying on state
      console.log('🔍 Getting locations from API...')
      const locationsResponse = await fetch(`/api/get-locations?chainId=${encodeURIComponent(chainId)}`)
      
      if (!locationsResponse.ok) {
        console.error('❌ Failed to get locations from API')
        setTimestampData([])
        return
      }
      
      const locationsData = await locationsResponse.json()
      if (!locationsData.success || !locationsData.locations) {
        console.error('❌ Invalid locations data from API')
        setTimestampData([])
        return
      }
      
      const locationsToProcess = locationsData.locations
      console.log(`📁 Processing ${locationsToProcess.length} locations from API`)
      
      const allDocumentIds: Array<{docId: string, locationId: string, locationName: string}> = []
      
      // Collect all document IDs from all locations using the API endpoint
      for (const location of locationsToProcess) {
        const locationId = location.id
        const locationName = location.name
        console.log(`📋 Processing location: ${locationId} (${locationName})`)
        
        try {
          // Get all documents in this location using the API
          const response = await fetch(`/api/get-location-documents?chainId=${encodeURIComponent(chainId)}&locationId=${encodeURIComponent(locationId)}`)
          
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
      
      console.log(`📊 Total document IDs found: ${allDocumentIds.length}`)
      clientLogger.info('📊 Document IDs collected', { 
        chainId, 
        totalDocuments: allDocumentIds.length,
        documentIds: allDocumentIds.slice(0, 5)
      })
      
      const timestampsData: TimestampData[] = []
      
      // For each document ID, fetch its timestamps from /transcript/{documentId}/timestamps
      for (const docInfo of allDocumentIds) {
        const { docId: documentId, locationId, locationName } = docInfo
        try {
          console.log(`🔍 Fetching timestamps for document: ${documentId} from location: ${locationName}`)
          
          const timestampsRef = collection(db, 'transcript', documentId, 'timestamps')
          const timestampsSnap = await getDocs(timestampsRef)
          
          console.log(`📋 Found ${timestampsSnap.size} timestamps for document ${documentId}`)
          
          // Get the parent transcript document to access user email for name lookup
          let parentTranscriptData: any = null
          try {
            const transcriptDocRef = doc(db, 'transcript', documentId)
            const transcriptDoc = await getDoc(transcriptDocRef)
            if (transcriptDoc.exists()) {
              parentTranscriptData = transcriptDoc.data()
              console.log(`📄 Parent transcript data loaded for ${documentId}`, {
                userEmail: parentTranscriptData.userEmail,
                hasEncryptedUserData: !!parentTranscriptData.encryptedUserData
              })
            }
          } catch (error) {
            console.warn(`⚠️ Could not load parent transcript data for ${documentId}:`, error)
          }
          
          // Process timestamps sequentially
          for (const timestampDoc of timestampsSnap.docs) {
            const timestampData = timestampDoc.data()
            
            // Try different possible field names for speaker transcript
            const speakerTranscriptData = timestampData.speakerTranscript || 
                                         timestampData['speaker transcript'] || 
                                         timestampData.speakerText || 
                                         timestampData.speakers || 
                                         []

            console.log(`📄 Timestamp document:`, {
              documentId,
              timestampId: timestampDoc.id,
              name: timestampData.name,
              emoji: timestampData.emoji,
              audioURL: timestampData.audioURL,
              transcript: timestampData.transcript?.substring(0, 100) + '...',
              speakerTranscript: timestampData.speakerTranscript,
              speakerTranscriptWithSpace: timestampData['speaker transcript'],
              speakerTranscriptResolved: speakerTranscriptData,
              speakerCount: speakerTranscriptData?.length || 0,
              allFields: Object.keys(timestampData)
            })
            
            // Use the same centralized decryption approach as TRACKERS tab
            let displayName = timestampData.name || `User-${documentId.substring(0, 8)}`
            
            // Get transcript name from analytics cache if available
            let transcriptName = 'Untitled Transcript'
            if (analyticsCache[documentId] && analyticsCache[documentId].transcriptName) {
              transcriptName = analyticsCache[documentId].transcriptName
            }
            
            // Debug: log the available data
            console.log(`🔍 Debug for ${documentId}:`, {
              hasParentData: !!parentTranscriptData,
              userEmail: parentTranscriptData?.userEmail,
              hasUserDisplayNames: Object.keys(userDisplayNames).length > 0,
              userDisplayNamesKeys: Object.keys(userDisplayNames),
              timestampDataName: timestampData.name
            })
            
            // If we have parent transcript data with user email, use centralized decryption
            if (parentTranscriptData?.userEmail && userDisplayNames[parentTranscriptData.userEmail]) {
              displayName = userDisplayNames[parentTranscriptData.userEmail]
              console.log(`🔓 Using centralized decrypted name for ${documentId}: ${displayName}`)
            } else if (parentTranscriptData?.userEmail) {
              // If userDisplayNames is not populated yet, try to decrypt on-demand
              if (parentTranscriptData.encryptedUserData && isUserDataEncrypted(parentTranscriptData.encryptedUserData)) {
                try {
                  console.log(`🔍 userDisplayNames not available, attempting on-demand decryption for ${documentId}`)
                  const fallbackEmail = `${documentId.substring(0, 8)}@device.local`
                  const decryptedName = await Promise.race([
                    getUserDisplayName(fallbackEmail, parentTranscriptData.encryptedUserData),
                    new Promise<string>((_, reject) => 
                      setTimeout(() => reject(new Error('On-demand decryption timeout')), 3000)
                    )
                  ]).catch(() => {
                    console.warn(`⚠️ On-demand decryption failed for ${documentId}, using email as fallback`)
                    return parentTranscriptData.userEmail
                  })
                  displayName = decryptedName
                  console.log(`🔓 On-demand decrypted name for ${documentId}: ${displayName}`)
                } catch (error) {
                  console.error(`❌ Error in on-demand decryption for ${documentId}:`, error)
                  displayName = parentTranscriptData.userEmail
                }
              } else {
                // Fallback to email if no encrypted data available
                displayName = parentTranscriptData.userEmail
                console.log(`📧 Using email as fallback for ${documentId}: ${displayName}`)
              }
            } else if (timestampData.name && !timestampData.name.includes('Laguna Niguel') && !timestampData.name.includes('Carmel Valley') && !timestampData.name.includes('Eastlake')) {
              // Only use timestampData.name if it's not a location name
              displayName = timestampData.name
              console.log(`📝 Using original name for ${documentId}: ${displayName}`)
            } else {
              // Last resort: use document ID fragment
              displayName = `User-${documentId.substring(0, 8)}`
              console.log(`📝 No user data available for ${documentId}, using document ID fragment: ${displayName}`)
            }
            
            timestampsData.push({
              id: timestampDoc.id,
              audioURL: timestampData.audioURL || '',
              durationSeconds: timestampData.durationSeconds || 0,
              emoji: timestampData.emoji || '❓',
              name: displayName, // Use centralized decryption result
              transcriptName: transcriptName, // Add transcript name from analytics
              notes: timestampData.notes || '',
              speakerTranscript: speakerTranscriptData,
              status: timestampData.status || 'unknown',
              timestamp: timestampData.timestamp,
              transcript: timestampData.transcript || '',
              transcriptDocumentId: documentId,
              locationId: locationId,
              salesPerformance: timestampData.salesPerformance || undefined
            })
          }
          
        } catch (error) {
          console.error(`❌ Error loading timestamps for document ${documentId}:`, error)
          // Continue with other documents even if one fails
          // This prevents one permission error from stopping the entire process
        }
      }
      
      console.log(`✅ Successfully loaded ${timestampsData.length} timestamp entries`)
      console.log('🔍 Sample timestamps with document IDs:', timestampsData.slice(0, 3).map(t => ({
        id: t.id,
        name: t.name,
        transcriptDocumentId: t.transcriptDocumentId
      })))
      
      clientLogger.info('✅ Timestamp data loaded successfully', {
        chainId,
        totalTimestamps: timestampsData.length,
        sampleData: timestampsData.slice(0, 3).map(t => ({
          id: t.id,
          name: t.name,
          emoji: t.emoji,
          status: t.status,
          transcriptDocumentId: t.transcriptDocumentId
        }))
      })
      
      // Sort transcripts by timestamp (most recent first)
      const sortedTimestampsData = timestampsData.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0)
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0)
        return timeB.getTime() - timeA.getTime()
      })
      
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
      console.log('🧑‍💼 Loading users after timestamp data is loaded...')
      // We need to use the timestampsData directly since state won't be updated yet
      const tempTimestampData = timestampsData
      loadAvailableUsersFromTimestampData(tempTimestampData)
      
    } catch (error) {
      console.error('❌ Error loading timestamp data:', error)
      clientLogger.error('❌ Failed to load timestamp data', { chainId, error })
    } finally {
      setLoadingTimestamps(false)
      console.log('🏁 ===== TIMESTAMP DATA LOAD COMPLETE =====')
    }
  }

      const sidebarItems = [
      { icon: BarChart3, label: "Analytics", active: activeTab === "TRACKERS" || activeTab === "ACTIVITY" },
    ]

  // Function to load user display names (optimized to use pre-computed data from analytics)
  const loadUserDisplayNames = async (analyticsData: {[key: string]: any}) => {
    const displayNames: {[key: string]: string} = {}
    
    console.log('📋 Loading user display names from analytics collection...')
    
    for (const [docId, data] of Object.entries(analyticsData)) {
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
                setTimeout(() => reject(new Error('Display name decryption timeout')), 5000) // Reduced timeout
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
    
    console.log(`✅ Loaded ${Object.keys(displayNames).length} user display names from analytics collection`)
    setUserDisplayNames(displayNames)
  }

  // Function to load new analytics data incrementally instead of full page reload
  const loadNewAnalyticsData = async (newDocumentIds: string[]) => {
    try {
      if (!newDocumentIds || newDocumentIds.length === 0) {
        clientLogger.info('📥 No new documents to load')
        return
      }

      clientLogger.info(`📥 Loading analytics for ${newDocumentIds.length} new documents...`)
      
      const newAnalyticsData: {[key: string]: any} = {}
      const newTranscriptsData: TranscriptData[] = []
      
      // Load analytics for new documents
      await Promise.all(newDocumentIds.map(async (documentId) => {
        try {
          const analyticsRef = doc(db, 'analytics', documentId)
          const analyticsSnap = await getDoc(analyticsRef)
          
          if (analyticsSnap.exists()) {
            const data = analyticsSnap.data()
            newAnalyticsData[documentId] = data
            
            // Build transcript data from analytics
            newTranscriptsData.push({
              id: documentId,
              name: data.transcriptName || 'Untitled',
              transcript: '',
              timestamp: data.timestamp,
              emoji: '📝',
              notes: '',
              audioURL: data.audioURL || '',
              userEmail: data.userEmail || '',
            })
            
            clientLogger.info(`✅ Loaded new analytics document: ${documentId}`)
          } else {
            clientLogger.warn(`⚠️ Analytics document ${documentId} not found`)
          }
        } catch (error) {
          clientLogger.error(`❌ Error loading analytics for ${documentId}:`, error)
        }
      }))

      if (Object.keys(newAnalyticsData).length > 0) {
        // Load user display names for new documents first
        await loadUserDisplayNames(newAnalyticsData)
        
        // Update analytics cache with new data
        const updatedCache = { ...analyticsCache, ...newAnalyticsData }
        setAnalyticsCache(updatedCache)
        
        // Update processed documents set
        setProcessedDocuments(prevSet => new Set([...Array.from(prevSet), ...newDocumentIds]))
        
        // Update transcripts data
        setTranscripts(prevTranscripts => [...prevTranscripts, ...newTranscriptsData])
        
        // Rebuild display data with updated cache
        buildDisplayDataFromAnalytics(updatedCache)
        
        // Mark analytics data as loaded since we have updated the cache
        setAnalyticsDataLoaded(true)
        
        clientLogger.success(`✅ Successfully updated analytics cache with ${Object.keys(newAnalyticsData).length} new documents`)
        
        // Refresh the current tab data if needed
        if (activeTab === "ACTIVITY" && timestampData.length > 0) {
          // Reload timestamp data to include new documents
          const chainParam = new URLSearchParams(window.location.search).get('chain')
          if (chainParam) {
            await loadTimestampData(chainParam)
          }
        }
      } else {
        clientLogger.info('📭 No new analytics data was loaded')
      }
      
    } catch (error) {
      clientLogger.error('❌ Error loading new analytics data:', error)
    }
  }

  // Load analytics data and create if needed
  useEffect(() => {
    const loadAnalyticsData = async () => {
      let loadingTimeout: NodeJS.Timeout | null = null
      
      try {
        clientLogger.info('🚀 Starting analytics data load process...')
        setLoading(true)
        
        // Load total transcript count from transcript collection
        await loadTotalTranscriptCount()
        
        // Set a safety timeout to prevent infinite loading (60 seconds)
        loadingTimeout = setTimeout(() => {
          clientLogger.error('⏰ Analytics loading timed out after 60 seconds')
          setLoading(false)
        }, 60000)
        
        // Check if user is authenticated
        if (!user) {
          clientLogger.info('❌ User not authenticated, skipping analytics load')
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
              clientLogger.info('📋 Found userChain in Firestore:', userChain);
            }
          } catch (error) {
            clientLogger.error('Error fetching userChain from Firestore:', error);
          }
        }
        
        // Fallback to localStorage if not found in Firestore
        if (!userChain) {
          userChain = localStorage.getItem('userChain');
          clientLogger.info('📋 Found userChain in localStorage:', userChain);
        }
        
        if (!userChain) {
          clientLogger.info('❌ No chain selected, redirecting to choose-chain page')
          router.push('/choose-chain')
          setLoading(false)
          return
        }
        
        clientLogger.info('✅ User authenticated and chain selected, proceeding with analytics load')
        
        // STEP 1: Check the /started/start document
        clientLogger.info('Checking /started/start document...')
        const startedRef = doc(db, 'started', 'start')
        let startedSnap
        
        try {
          startedSnap = await getDoc(startedRef)
          clientLogger.info('/started/start document exists:', startedSnap.exists())
        } catch (error) {
          clientLogger.error('Error checking /started/start document:', error)
          setLoading(false)
          return
        }
        
        if (startedSnap.exists()) {
          const startedData = startedSnap.data()
          clientLogger.info('Found /started/start document:', startedData)
          clientLogger.debug('done field value:', startedData.done)
          clientLogger.debug('done field type:', typeof startedData.done)
          
          if (startedData.done === false) {
            clientLogger.warn('Analytics not done yet (done === false). Creating analytics collection from ALL transcripts...')
            
            // Create analytics collection from transcripts via server-side API
            try {
              clientLogger.info('Calling server-side analytics creation API...')
              const response = await fetch('/api/create-analytics', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              })
              
              const result = await response.json()
              clientLogger.info('Server-side analytics creation returned:', result)
              
              if (result.success) {
                clientLogger.success('Analytics collection created successfully!')
                clientLogger.info(`Created analytics for ${result.processedCount} documents`)
                clientLogger.info(`Result message: ${result.message}`)
                
                // Update the done field to true
                clientLogger.info('Updating /started/start document done field to true...')
                await setDoc(startedRef, { ...startedData, done: true, updatedAt: new Date().toISOString() }, { merge: true })
                clientLogger.success('Updated /started/start document done field to true')
              } else {
                clientLogger.error(`FAILED to create analytics collection!`)
                clientLogger.error(`Error message: ${result.message}`)
                clientLogger.error(`Full result:`, result)
                setLoading(false)
                return
              }
            } catch (createError) {
              clientLogger.error('CRITICAL ERROR during analytics creation:', createError)
              setLoading(false)
              return
            }
          } else {
            clientLogger.success('Analytics already done according to /started/start document (done !== false)')
            clientLogger.debug('Current done value:', startedData.done)
          }
        } else {
          clientLogger.warn('/started/start document does not exist. Creating analytics collection from ALL transcripts...')
          
          // Create analytics collection from transcripts via server-side API
          try {
            clientLogger.info('Calling server-side analytics creation API...')
            const response = await fetch('/api/create-analytics', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            
            const result = await response.json()
            clientLogger.info('Server-side analytics creation returned:', result)
            
            if (result.success) {
              clientLogger.success('Analytics collection created successfully!')
              clientLogger.info(`Created analytics for ${result.processedCount} documents`)
              clientLogger.info(`Result message: ${result.message}`)
              
              // Create the /started/start document with done: true
              clientLogger.info('Creating /started/start document with done: true...')
              await setDoc(startedRef, { done: true, createdAt: new Date().toISOString() })
              clientLogger.success('Created /started/start document with done: true')
            } else {
              clientLogger.error(`FAILED to create analytics collection!`)
              clientLogger.error(`Error message: ${result.message}`)
              clientLogger.error(`Full result:`, result)
              setLoading(false)
              return
            }
          } catch (createError) {
            clientLogger.error('CRITICAL ERROR during analytics creation:', createError)
            setLoading(false)
            return
          }
        }
        
        // STEP 2: Check if analytics index exists
        clientLogger.info('🔍 Checking if analytics collection exists...')
        const generalAnalyticsRef = doc(db, 'analytics', 'document_analyses')
        let generalAnalyticsSnap = await getDoc(generalAnalyticsRef)
        
        if (!generalAnalyticsSnap.exists()) {
          clientLogger.info('❌ Analytics index does not exist after creation!')
          setLoading(false)
          return
        }
        
        // STEP 3: Get document IDs from analytics index
        const analyticsIndex = generalAnalyticsSnap.data() || {}
        const documentIds = Object.keys(analyticsIndex)
        
        clientLogger.info(`📊 Analytics index contains ${documentIds.length} document IDs`)
        clientLogger.info(`🔍 Document IDs: ${documentIds.slice(0, 5).join(', ')}${documentIds.length > 5 ? '...' : ''}`)
        
        if (documentIds.length === 0) {
          clientLogger.info('❌ No processed documents found in analytics index!')
          setLoading(false)
          return
        }
        
        // STEP 4: Check if we already have analytics data loaded
        if (Object.keys(analyticsCache).length > 0 && processedDocuments.size > 0) {
          clientLogger.info('💾 Analytics data already loaded in cache, skipping full reload')
          clientLogger.info(`📊 Cache contains ${Object.keys(analyticsCache).length} documents`)
          
          // Check if we have all the documents from the index
          const missingDocuments = documentIds.filter(id => !processedDocuments.has(id))
          if (missingDocuments.length > 0) {
            clientLogger.info(`📥 Loading ${missingDocuments.length} missing documents...`)
            await loadNewAnalyticsData(missingDocuments)
          } else {
            clientLogger.info('✅ All analytics data is up to date')
          }
          
          // Clear timeout and exit early
          if (loadingTimeout) {
            clearTimeout(loadingTimeout)
          }
          // Mark analytics data as loaded since it's already in cache
          setAnalyticsDataLoaded(true)
          setLoading(false)
          return
        }

        // STEP 5: Load all analytics documents (first time load)
        clientLogger.info('📥 Loading individual analytics documents for first time...')
        const analyticsData: {[key: string]: any} = {}
        const transcriptsData: TranscriptData[] = []
        
        // Load analytics in batches to avoid overwhelming Firestore
        const batchSize = 10
        let loadedCount = 0
        
        for (let i = 0; i < documentIds.length; i += batchSize) {
          const batch = documentIds.slice(i, i + batchSize)
          clientLogger.info(`📦 Loading batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(documentIds.length/batchSize)} (${batch.length} documents)`)
          
          await Promise.all(batch.map(async (documentId) => {
            try {
              const analyticsRef = doc(db, 'analytics', documentId)
              const analyticsSnap = await getDoc(analyticsRef)
              
              if (analyticsSnap.exists()) {
                const data = analyticsSnap.data()
                analyticsData[documentId] = data
                
                // Build transcript data from analytics
                transcriptsData.push({
                  id: documentId,
                  name: data.transcriptName || 'Untitled',
                  transcript: '',
                  timestamp: data.timestamp,
                  emoji: '📝',
                  notes: '',
                  audioURL: data.audioURL || '',
                  userEmail: data.userEmail || '',
                })
                
                loadedCount++
                clientLogger.info(`✅ Loaded analytics document ${loadedCount}/${documentIds.length}: ${documentId}`)
              } else {
                clientLogger.info(`❌ Analytics document ${documentId} not found!`)
              }
            } catch (error) {
              clientLogger.error(`❌ Error loading analytics for ${documentId}:`, error)
            }
          }))
          
          // Small delay between batches
          if (i + batchSize < documentIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
        
        clientLogger.info(`✅ Successfully loaded ${Object.keys(analyticsData).length} analytics documents`)
        clientLogger.info(`📊 Built ${transcriptsData.length} transcript records`)
        
        // STEP 6: Set all data in state
        clientLogger.info('💾 Setting analytics data in application state...')
        setAnalyticsCache(analyticsData)
        setProcessedDocuments(new Set(documentIds))
        setTranscripts(transcriptsData)
        
        // STEP 7: Load user display names
        clientLogger.info('👤 Loading user display names...')
        await loadUserDisplayNames(analyticsData)
        
        // STEP 8: Build display data from analytics cache
        clientLogger.info('🧠 Building display data for dashboard...')
        buildDisplayDataFromAnalytics(analyticsData)
        
        // Mark analytics data as loaded to prevent future reloads
        setAnalyticsDataLoaded(true)
        
        clientLogger.info('🎉 Analytics loading process completed successfully!')
        
      } catch (error) {
        clientLogger.error('💥 CRITICAL ERROR in analytics loading process:', error)
        if (error instanceof Error) {
          clientLogger.error('📍 Error stack:', error.stack)
        }
      } finally {
        // Clear the timeout if loading completes normally
        if (loadingTimeout) {
          clearTimeout(loadingTimeout)
        }
        clientLogger.info('🏁 Setting loading state to false')
        setLoading(false)
      }
    }

    // Only run if user exists and analytics data hasn't been loaded yet
    if (user && !analyticsDataLoaded) {
      clientLogger.info('👤 User detected, starting analytics load...')
      loadAnalyticsData()
    } else if (user && analyticsDataLoaded) {
      clientLogger.info('💾 Analytics data already loaded, skipping reload')
      setLoading(false)
    } else {
      clientLogger.info('👤 No user detected, waiting for authentication...')
    }
  }, [user, analyticsDataLoaded])

  // Refresh timestamp data when userDisplayNames becomes available (for centralized decryption)
  useEffect(() => {
    if (Object.keys(userDisplayNames).length > 0 && timestampData.length > 0) {
      console.log('🔄 userDisplayNames populated, refreshing timestamp data for centralized decryption...')
      clientLogger.info('🔄 Refreshing timestamp data with centralized decryption', { 
        userDisplayNamesCount: Object.keys(userDisplayNames).length,
        timestampDataCount: timestampData.length
      })
      
      // Get current chain from URL or use default
      const urlParams = new URLSearchParams(window.location.search)
      const chainParam = urlParams.get('chain') || 'Revive'
      
      // Reload timestamp data to use centralized decryption
      loadTimestampData(chainParam)
    }
  }, [userDisplayNames])

  // Handle chain parameter from URL and auto-load locations
  useEffect(() => {
    console.log('🚨🚨🚨 ===== AUTO-LOADING LOCATIONS ON PAGE LOAD ===== 🚨🚨🚨')
    console.log('🔍 User authenticated:', !!user)
    console.log('🔍 Current URL:', window.location.href)
    console.log('🔍 URL search params:', window.location.search)
    console.log('🔍 Active tab:', activeTab)
    
    // Add server-side logging for auto-load process
    clientLogger.info('🚨🚨🚨 AUTO-LOADING LOCATIONS ON PAGE LOAD', { 
      userAuthenticated: !!user,
      currentURL: window.location.href,
      urlSearchParams: window.location.search,
      activeTab
    })
    
    // Force immediate execution regardless of user state
    const urlParams = new URLSearchParams(window.location.search)
    const chainParam = urlParams.get('chain')
    
    console.log('🔍 Chain parameter found:', chainParam)
    
    if (chainParam) {
      console.log('🔗 ✅ Chain parameter detected:', chainParam)
      console.log('🔗 🚀 Auto-loading locations for chain...')
      clientLogger.info('🔗 ✅ Chain parameter detected, auto-loading locations', { chainParam })
      loadLocationsFromChain(chainParam)
      loadTimestampData(chainParam)
      // Switch to ACTIVITY tab when chain is selected
      console.log('🔗 📑 Auto-switching to ACTIVITY tab')
      setActiveTab("ACTIVITY")
    } else {
      console.log('🔗 ❌ No chain parameter found in URL - checking for default chain')
      // If no chain parameter, but we want to auto-load Revive locations
      console.log('🔗 🔄 Auto-loading default chain: Revive')
      clientLogger.info('🔗 🔄 No chain parameter, auto-loading default chain: Revive')
      loadLocationsFromChain('Revive')
      loadTimestampData('Revive')
      setActiveTab("ACTIVITY")
    }
    
    console.log('🚨🚨🚨 ===== AUTO-LOAD PROCESS COMPLETED ===== 🚨🚨🚨')
    clientLogger.info('🚨🚨🚨 AUTO-LOAD PROCESS COMPLETED')
  }, []) // Run immediately on component mount

  // Automatic periodic sync for new transcripts
  useEffect(() => {
    if (!user) return

    const performPeriodicSync = async () => {
      try {
        clientLogger.info('🔄 Performing periodic sync check for new transcripts...')
        
        const response = await fetch('/api/sync-new-transcripts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const result = await response.json()
        if (result.success && result.processedCount > 0) {
          clientLogger.success(`✅ Auto-synced ${result.processedCount} new transcripts`)
          
          // Instead of reloading, update analytics data incrementally
          await loadNewAnalyticsData(result.processedDocuments || [])
        } else if (result.success) {
          clientLogger.info('ℹ️ Periodic sync: No new transcripts found')
        } else {
          clientLogger.warn(`⚠️ Periodic sync warning: ${result.message}`)
        }
      } catch (error) {
        clientLogger.error('❌ Error during periodic sync:', error)
      }
    }

    // Initial sync after 3 seconds (give time for initial load)
    const initialSyncTimer = setTimeout(performPeriodicSync, 3000)

    // Then sync every 30 seconds for the first 5 minutes, then every 2 minutes
    let syncCount = 0
    const performSyncWithInterval = () => {
      performPeriodicSync()
      syncCount++
    }

    // First 10 syncs every 30 seconds (5 minutes), then every 2 minutes
    const dynamicInterval = () => {
      if (syncCount < 10) {
        return setTimeout(performSyncWithInterval, 30000) // 30 seconds
      } else {
        return setTimeout(performSyncWithInterval, 120000) // 2 minutes
      }
    }

    // Start the dynamic interval after initial sync
    let nextTimer: NodeJS.Timeout
    const startDynamicSync = () => {
      nextTimer = dynamicInterval()
    }

    // Start dynamic sync after initial sync
    const startDynamicTimer = setTimeout(startDynamicSync, 3000)

    // Cleanup on unmount
    return () => {
      clearTimeout(initialSyncTimer)
      clearTimeout(startDynamicTimer)
      if (nextTimer) clearTimeout(nextTimer)
    }
  }, [user])

  // Auto-sync when window regains focus (user comes back to the tab)
  useEffect(() => {
    if (!user) return

    const handleFocus = async () => {
      try {
        clientLogger.info('🔄 Window focus detected - checking for new transcripts...')
        
        const response = await fetch('/api/sync-new-transcripts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const result = await response.json()
        if (result.success && result.processedCount > 0) {
          clientLogger.success(`✅ Focus sync: Found ${result.processedCount} new transcripts`)
          // Instead of reloading, update analytics data incrementally
          await loadNewAnalyticsData(result.processedDocuments || [])
        }
      } catch (error) {
        clientLogger.error('❌ Error during focus sync:', error)
      }
    }

    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  // Auto-sync when switching to TRACKERS tab
  useEffect(() => {
    if (activeTab === "TRACKERS" && user) {
      const syncOnTrackersTab = async () => {
        try {
          clientLogger.info('🎯 TRACKERS tab selected - checking for new transcripts...')
          
          const response = await fetch('/api/sync-new-transcripts', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          const result = await response.json()
          if (result.success && result.processedCount > 0) {
            clientLogger.success(`✅ TRACKERS sync: Found ${result.processedCount} new transcripts`)
            // Instead of reloading, update analytics data incrementally
            await loadNewAnalyticsData(result.processedDocuments || [])
          }
        } catch (error) {
          clientLogger.error('❌ Error during TRACKERS tab sync:', error)
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
      console.log('🎯 ===== ACTIVITY TAB SELECTED - AUTO-LOADING LOCATIONS =====')
      console.log('🔍 Current selectedChain:', selectedChain)
      console.log('🔍 Current locations count:', locations.length)
      console.log('🔍 Loading state:', loadingLocations)
      
      // Add server-side logging
      clientLogger.info('🎯 ACTIVITY TAB SELECTED - AUTO-LOADING LOCATIONS', {
        selectedChain,
        currentLocationsCount: locations.length,
        loadingState: loadingLocations
      })

      // Load available users for filtering
      if (availableUsers.length === 0 && !loadingUsers) {
        // Use the new function if timestamp data is available, otherwise fallback to legacy
        if (timestampData.length > 0) {
          loadAvailableUsersFromTimestampData(timestampData)
        } else {
          loadAvailableUsers()
        }
      }
      
      // If no chain is selected, use Revive as default
      if (!selectedChain) {
        console.log('🔗 No chain selected, using default: Revive')
        clientLogger.info('🔗 No chain selected, using default: Revive')
        loadLocationsFromChain('Revive')
        loadTimestampData('Revive')
      } else if (locations.length === 0 && !loadingLocations) {
        // If chain is selected but no locations loaded, load them
        console.log(`🔗 Chain selected (${selectedChain}) but no locations loaded, loading now...`)
        clientLogger.info('🔗 Chain selected but no locations loaded, loading now', { selectedChain })
        loadLocationsFromChain(selectedChain)
        loadTimestampData(selectedChain)
      } else {
        console.log(`🔗 Chain: ${selectedChain}, Locations: ${locations.length}, Loading: ${loadingLocations}`)
        clientLogger.info('🔗 Locations already loaded or loading', { 
          selectedChain, 
          locationCount: locations.length, 
          loading: loadingLocations 
        })
        // Load timestamp data if not already loaded
        if (timestampData.length === 0 && !loadingTimestamps) {
          console.log('🎯 Loading timestamp data for existing chain')
          loadTimestampData(selectedChain)
        }
      }
    }
  }, [activeTab, selectedChain, locations.length, loadingLocations]) // Run when activeTab changes to "ACTIVITY"



  // Build display data directly from analytics cache
  const buildDisplayDataFromAnalytics = (analyticsData: {[key: string]: any}) => {
    clientLogger.info('🧠 Building display data from analytics cache...')
    
    const categoryCounts: { [key: string]: { count: number; phrases: string[] } } = {}
    const phraseCounts: { [key: string]: number } = {}
    const phraseTranscriptIds: { [key: string]: string[] } = {}
    
    // Initialize category counts
    categories.forEach(cat => {
      categoryCounts[cat.name] = { count: 0, phrases: [] }
    })
    
    const totalDocuments = Object.keys(analyticsData).length
    clientLogger.info(`📊 Processing ${totalDocuments} documents from analytics cache`)
    
    // Process each analytics document
    Object.entries(analyticsData).forEach(([documentId, data]) => {
      clientLogger.info(`🔍 Processing analytics for document: ${documentId}`)
      
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
    
    clientLogger.info('✅ Display data built from analytics cache')
    clientLogger.info(`📊 Categories: ${formattedData.length}, Phrases: ${topPhrases.length}`)
    
    setCategoryData(formattedData)
    setPhraseData(topPhrases)
    setSelectedCategoryPhrases(topPhrases)
  }





  // Handle category selection
  const handleCategorySelect = (categoryName: string) => {
    clientLogger.info('📂 Category selected:', categoryName)
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
    clientLogger.info('🎯 Phrase selected:', phrase.phrase)
    clientLogger.info(`📊 Phrase details: ${phrase.count} occurrences, ${phrase.percentage}% of total transcripts`)
    clientLogger.info(`📁 Category: ${phrase.category}`)
    clientLogger.info(`🆔 Transcript IDs: ${phrase.transcriptIds.join(', ')}`)
    
    setSelectedPhrase(phrase)
    
    // Calculate transcript details for the selected phrase
    const phraseTranscriptDetails: TranscriptDetail[] = phrase.transcriptIds.map(id => {
      const transcript = transcripts.find(t => t.id === id)
      if (transcript) {
        clientLogger.info(`📄 Found transcript ${id} from ${transcript.userEmail}`)
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
      clientLogger.info(`❌ Transcript ${id} not found in transcripts array`)
      return null
    }).filter(Boolean) as TranscriptDetail[]
    
    clientLogger.info(`✅ Found ${phraseTranscriptDetails.length} transcript details for phrase "${phrase.phrase}"`)
    clientLogger.info('📋 Transcript details:', phraseTranscriptDetails.map(t => ({
      id: t.id,
      email: t.email,
      percentage: t.percentage
    })))
    
    setPhraseTranscripts(phraseTranscriptDetails)
  }

  // Handle document ID click to show all phrases for all documents with the same userEmail
  const handleDocumentClick = (documentId: string) => {
    clientLogger.info('📄 Document ID clicked:', documentId)
    
    // Clear selected phrase to ensure document view is shown
    setSelectedPhrase(null)
    
    // Check if document has analytics data
    if (processedDocuments.has(documentId) && analyticsCache[documentId]) {
      const clickedDocumentData = analyticsCache[documentId]
      const targetUserEmail = clickedDocumentData.userEmail
      const userDisplayName = userDisplayNames[targetUserEmail] || 'Unknown User'
      
      clientLogger.info(`📧 Finding all documents for user: ${userDisplayName}`)
      
      // Find all documents in analyticsCache with the same userEmail
      const matchingDocuments = Object.entries(analyticsCache).filter(([docId, data]) => {
        return data.userEmail === targetUserEmail
      })
      
      clientLogger.info(`📊 Found ${matchingDocuments.length} documents for user: ${userDisplayName}`)
      matchingDocuments.forEach(([docId, data]) => {
        clientLogger.info(`  - Document ${docId}: ${data.transcriptName}`)
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
      
      clientLogger.info(`📋 Combined ${allDocumentPhrases.length} phrases from ${matchingDocuments.length} documents`)
      clientLogger.info('📂 Categories found:', Object.keys(combinedPhrasesByCategory))
      
      // Set the selected document with combined data
      const documentData = {
        id: `user-${targetUserEmail}`, // Use a special ID to indicate this is a user-level view
        name: `All documents for ${userDisplayName}`,
        userEmail: targetUserEmail, // Keep email for internal use only
        audioURL: clickedDocumentData.audioURL, // Include audioURL from the clicked document
        phrases: allDocumentPhrases
      }
      
      clientLogger.info('📋 Setting selectedDocument:', documentData)
      setSelectedDocument(documentData)
    } else {
      clientLogger.info(`❌ No analytics data found for document: ${documentId}`)
      clientLogger.info('💡 Analytics data should be automatically synced on app load')
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
    console.log(`🎵 Jumping to timestamp: ${timestamp} (${seconds} seconds)`)
    
    audioRef.current.currentTime = seconds
    audioRef.current.play().catch(error => {
      console.error('❌ Error playing audio:', error)
    })
  }

  const handlePhraseClick = async (phrase: any) => {
    try {
      console.log('🎯 Phrase clicked:', phrase)
      console.log('📄 Selected document:', selectedDocument)
      
      // Get the document ID from the phrase
      let documentId = phrase.documentId
      
      if (!documentId && phrase.transcriptIds && phrase.transcriptIds.length > 0) {
        documentId = phrase.transcriptIds[0]
      }
      
      if (documentId) {
        console.log('📖 Looking for analytics document:', documentId)
        
        // Check if we have the analytics data in cache
        if (analyticsCache[documentId]) {
          const analyticsData = analyticsCache[documentId]
          console.log('📄 Analytics data found:', analyticsData)
          console.log('🎯 Analytics speakerTranscript:', analyticsData.speakerTranscript?.length || 0, 'entries')
          
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
          
          console.log('✅ Final transcriptObject speakerTranscript:', transcriptObject.speakerTranscript?.length || 0, 'entries')
          if (transcriptObject.speakerTranscript?.length > 0) {
            console.log('📝 First speaker entry:', transcriptObject.speakerTranscript[0])
          }
          
          // Open the transcript modal with comments popup
          setSelectedTranscript(transcriptObject)
          setShowTranscriptModal(true)
          loadExistingComments(documentId)
          
          // Auto-highlight the clicked phrase
          setTimeout(() => {
            autoHighlightPhrase(phrase.phrase, transcriptObject.speakerTranscript)
          }, 300) // Small delay to ensure modal is rendered
          
          // Jump to timestamp if available
          if (phrase.timestamp && phrase.timestamp !== "N/A" && phrase.timestamp !== "00:00") {
            console.log(`⏰ Phrase has timestamp: ${phrase.timestamp}`)
            // Add a longer delay to ensure audio element is loaded
            setTimeout(() => {
              jumpToTimestamp(phrase.timestamp)
            }, 500)
          } else {
            console.log('⚠️ No valid timestamp found for phrase:', phrase.timestamp)
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
      case "TRACKERS":
        return (
          <div className="grid grid-cols-2 gap-6">
            {/* Trackers */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Conversation Trackers</CardTitle>
                    <p className="text-sm text-gray-600">Percentage of conversations in which the tracker shows up</p>
                  </div>

                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search tracker..." className="pl-10" />
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                      <SelectTrigger className="flex-1">
                        <SelectValue>
                          {selectedCategory === "All Categories" ? (
                            "All Categories"
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${categories.find(cat => cat.name === selectedCategory)?.color || 'bg-gray-500'}`} />
                              <span>{selectedCategory}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Categories">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.name} value={category.name}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${category.color}`} />
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                  </div>
                </div>

                <div className="space-y-3">
                  {selectedCategory === "All Categories" ? (
                    // Show all phrases from all categories
                    phraseData.map((phrase, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50`}
                        onClick={() => handlePhraseSelect(phrase)}
                      >
                        <div className={`w-3 h-3 rounded-full ${categories.find(cat => cat.name === phrase.category)?.color || 'bg-gray-500'}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{phrase.phrase}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{phrase.percentage}%</span>
                              {phrase.transcriptIds.length > 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  🔊 Audio
                                </span>
                              )}
                            </div>
                          </div>
                          <Progress value={phrase.percentage} className="h-2" />
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">{phrase.category}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{phrase.count} occurrences</span>
                              {phrase.transcriptIds.length > 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  🔊 Audio
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Show individual phrases for selected category
                    selectedCategoryPhrases.map((phrase, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedPhrase?.phrase === phrase.phrase ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handlePhraseSelect(phrase)}
                      >
                        <div className={`w-3 h-3 rounded-full ${categories.find(cat => cat.name === phrase.category)?.color || 'bg-gray-500'}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{phrase.phrase}</span>
                            <span className="text-sm font-medium">{phrase.percentage}%</span>
                          </div>
                          <Progress value={phrase.percentage} className="h-2" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  {selectedCategory === "All Categories" ? (
                    <>
                      <span>All Categories</span>
                    </>
                  ) : (
                    <>
                      <div className={`w-4 h-4 rounded-full ${categories.find(cat => cat.name === selectedCategory)?.color || 'bg-gray-500'}`} />
                      <span>{selectedCategory} Phrases</span>
                    </>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {selectedCategory === "All Categories" 
                    ? "Overview of all conversation categories" 
                    : `Specific phrases found in ${selectedCategory} category`
                  }
                </p>
              </CardHeader>
              <CardContent>
                                 {selectedCategory === "All Categories" ? (
                   <div className="space-y-4">
                     <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                       <h4 className="font-medium text-purple-900 mb-2">All Phrases Overview</h4>
                       <p className="text-sm text-purple-700">Showing all phrases across all categories</p>
                       <p className="text-xs text-purple-600 mt-1">Total phrases: {phraseData.length}</p>
                     </div>
                     
                     <div>
                       <h5 className="text-sm font-medium text-gray-700 mb-3">
                         All phrases found across all categories
                       </h5>
                       <div className="space-y-3">
                         {phraseData.map((phrase, index) => (
                           <div 
                             key={index} 
                             className="p-3 bg-gray-50 rounded-lg border-l-4 cursor-pointer hover:bg-gray-100 transition-colors" 
                             style={{ borderLeftColor: categories.find(cat => cat.name === phrase.category)?.color || '#6B7280' }}
                             onClick={() => handlePhraseSelect(phrase)}
                           >
                             <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center space-x-2">
                                 <div className={`w-3 h-3 rounded-full ${categories.find(cat => cat.name === phrase.category)?.color || 'bg-gray-500'}`} />
                                 <span className="text-xs font-medium text-gray-600">{phrase.category}</span>
                               </div>
                               <span className="text-sm font-medium text-gray-700">{phrase.percentage}%</span>
                             </div>
                             <p className="text-sm text-gray-700 mb-1">"{phrase.phrase}"</p>
                             <div className="flex items-center justify-between">
                               <span className="text-xs text-gray-500">{phrase.count} occurrences</span>
                               <span className="text-xs text-gray-500">Click for details</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 ) : selectedPhrase ? (
                   <div className="space-y-4">
                     <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                       <h4 className="font-medium text-purple-900 mb-2">"{selectedPhrase.phrase}"</h4>
                       <p className="text-sm text-purple-700">Found in {selectedPhrase.count} transcript(s)</p>
                     </div>
                     
                     <div>
                       <h5 className="text-sm font-medium text-gray-700 mb-3">
                         Percentage of conversations in which the phrase "{selectedPhrase.phrase}" shows up for each transcript
                       </h5>
                       <div className="space-y-3">
                         {phraseTranscripts.map((transcript, index) => (
                           <div key={index} className="flex items-center justify-between">
                             <div className="flex items-center space-x-2">
                               <span 
                                 className={`text-sm font-medium truncate max-w-[200px] cursor-pointer hover:text-purple-600 hover:underline ${
                                   processedDocuments.has(transcript.id) ? 'text-green-600' : 'text-gray-600'
                                 }`}
                                 onClick={() => handleDocumentClick(transcript.id)}
                                 title={`Click to view all phrases for this user${processedDocuments.has(transcript.id) ? ' (Cached)' : ' (Not processed)'}`}
                               >
                                 {transcript.displayName}
                               </span>
                               {processedDocuments.has(transcript.id) && (
                                 <div className="w-2 h-2 bg-green-500 rounded-full" title="Already processed and cached" />
                               )}
                             </div>
                             <div className="flex items-center space-x-3 w-32">
                               <span className="text-sm font-medium w-8">{transcript.percentage}%</span>
                               <Progress value={transcript.percentage} className="h-2 flex-1" />
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 ) : selectedDocument ? (
                   <div className="space-y-4">
                     <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                       <h4 className="font-medium text-purple-900 mb-2">
                         {selectedDocument.id.startsWith('user-') ? 'User Analysis' : 'Document'}: {selectedDocument.id.startsWith('user-') ? userDisplayNames[selectedDocument.userEmail] || 'Unknown User' : selectedDocument.id}
                       </h4>
                       <p className="text-sm text-purple-700">{selectedDocument.name}</p>
                       <p className="text-xs text-purple-600 mt-1">User: {userDisplayNames[selectedDocument.userEmail] || 'Unknown User'}</p>
                       {selectedDocument.id.startsWith('user-') && (
                         <p className="text-xs text-purple-600 mt-1">
                           Combined data from all documents for this user
                         </p>
                       )}
                     </div>
                     
                     <div>
                       <h5 className="text-sm font-medium text-gray-700 mb-3">
                         phrasesByCategory
                       </h5>
                       <div className="space-y-4">
                         {selectedDocument.phrases.length > 0 ? (
                           (() => {
                             // Group phrases by category
                             const phrasesByCategory = selectedDocument.phrases.reduce((acc, phrase) => {
                               if (!acc[phrase.category]) {
                                 acc[phrase.category] = []
                               }
                               acc[phrase.category].push(phrase)
                               return acc
                             }, {} as Record<string, typeof selectedDocument.phrases>)

                             return Object.entries(phrasesByCategory).map(([categoryName, categoryPhrases]) => (
                               <div key={categoryName} className="space-y-2">
                                 <div className="flex items-center space-x-2">
                                   <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: categoryPhrases[0].color }} />
                                   <h6 className="text-sm font-semibold text-gray-800">{categoryName}</h6>
                                   <span className="text-xs text-gray-500">({categoryPhrases.length} phrases)</span>
                                 </div>
                                 <div className="ml-5 space-y-2">
                                   {categoryPhrases.map((phrase, index) => (
                                     <div 
                                       key={index} 
                                       className="p-3 bg-gray-50 rounded-lg border-l-4 cursor-pointer hover:bg-gray-100 transition-colors" 
                                       style={{ borderLeftColor: phrase.color }}
                                       onClick={() => handlePhraseClick(phrase)}
                                     >
                                       {phrase.keywords.length > 0 && (
                                         <div className="mb-2">
                                           <span className="text-xs font-medium text-gray-600">Keywords: </span>
                                           <span className="text-xs text-gray-500">
                                             {phrase.keywords.join(', ')}
                                           </span>
                                         </div>
                                       )}
                                       <p className="text-sm text-gray-700">"{phrase.phrase}"</p>
                                                                          {phrase.timestamp && phrase.timestamp !== "N/A" && (
                                     <div className="mt-1 flex items-center space-x-2">
                                       <span className="text-xs text-gray-500">
                                         Timestamp: {phrase.timestamp}
                                       </span>
                                       <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                         🔊 Click to jump to audio
                                       </span>
                                     </div>
                                   )}
                                       {phrase.documentId && phrase.documentName && (
                                         <div className="mt-2 pt-2 border-t border-gray-200">
                                           <span className="text-xs text-gray-500">
                                             From: {phrase.documentName} (ID: {phrase.documentId})
                                           </span>
                                         </div>
                                       )}
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             ))
                           })()
                         ) : (
                           <div className="text-center text-gray-500 py-4">
                             <p>No phrases found in this document</p>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {selectedCategoryPhrases.length > 0 ? (
                       selectedCategoryPhrases.map((phrase, index) => (
                         <div key={index} className="p-3 bg-gray-50 rounded-lg">
                           <p className="text-sm text-gray-700">"{phrase.phrase}"</p>
                           <p className="text-xs text-gray-500 mt-1">Found in {phrase.count} transcript(s)</p>
                         </div>
                       ))
                     ) : (
                       <div className="text-center text-gray-500 py-8">
                         <p>No phrases found for this category</p>
                       </div>
                     )}
                   </div>
                 )}
              </CardContent>
            </Card>
          </div>
        )

      case "ACTIVITY":
        return (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Select value={selectedLocationFilter} onValueChange={filterTimestampsByLocation}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedUserFilter} onValueChange={filterTimestampsByUser}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {loadingUsers ? (
                      <SelectItem value="loading" disabled>Loading users...</SelectItem>
                    ) : (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">
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
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTimestampData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recordings found</p>
                  </div>
                ) : (
                  filteredTimestampData.map((recording, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer bg-white"
                      onClick={() => handleTranscriptClick(recording)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">{recording.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">{getDecryptedNameForTranscript(recording)}</h3>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">{getLocationNameForTranscript(recording)}</p>
                                <p className="text-xs text-gray-500">
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
                                </p>
                              </div>
                            </div>
                          </div>
                          {recording.speakerTranscript && recording.speakerTranscript.length > 0 ? (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">{recording.speakerTranscript[0]?.speaker}:</span>
                              <span className="ml-1">
                                {recording.speakerTranscript[0]?.text.substring(0, 80)}
                                {recording.speakerTranscript[0]?.text.length > 80 ? '...' : ''}
                              </span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              {recording.transcript?.substring(0, 80)}
                              {recording.transcript && recording.transcript.length > 80 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )

      case "CHAT":
        return (
          <div className="flex flex-col h-[calc(100vh-12rem)] bg-background">
            {/* Header with role selector and analytics info */}
            <div className="border-b border-border p-4 bg-card">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      WISP AI Assistant
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Analytics & Insights Available
                    </p>
                  </div>
                </div>

                {/* Role selector and action buttons */}
                <div className="flex items-center gap-2 relative">
                  <button
                    onClick={() => setShowRoleSelector(!showRoleSelector)}
                    className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <span className="text-sm font-medium">{selectedRole}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showRoleSelector ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Role dropdown */}
                  {showRoleSelector && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-card rounded-lg shadow-lg border border-border overflow-hidden z-50">
                      <div className="max-h-[300px] overflow-y-auto">
                        {['Analytics Assistant', 'Performance Coach', 'Data Analyst', 'Consultation Expert'].map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              setSelectedRole(role);
                              setShowRoleSelector(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0 ${
                              selectedRole === role ? 'bg-primary/10' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {role}
                                  </span>
                                  {selectedRole === role && (
                                    <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                                      Selected
                                    </span>
                                  )}
              </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* History button */}
                  <button
                    onClick={() => setShowChatHistory(true)}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    title="Show chat history"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  
                  {/* New chat button */}
                  <button
                    onClick={createNewChatSession}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    title="New chat"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="max-w-4xl w-full mx-auto space-y-8">
                    {/* Welcome message */}
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-semibold text-foreground">Hi {user?.email?.split('@')[0] || 'there'}</h2>
                      <p className="text-lg text-muted-foreground">I'm Wisp, what can I help you with today?</p>
                    </div>

                    {/* Template cards in a row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Sales Performance Template */}
                      <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer border border-purple-200"
                           onClick={() => setChatInput("Show me my sales performance")}>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-foreground">Sales Performance</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Analyze protocol scores, grades, and team performance metrics.
                        </p>
                      </div>

                      {/* Analytics Template */}
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer border border-primary/20"
                           onClick={() => setChatInput("Show me my performance analytics")}>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-foreground">Performance Analytics</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Get insights into your conversation performance and metrics.
                        </p>
                      </div>

                      {/* Search Template */}
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer border border-blue-200"
                           onClick={() => setChatInput("Search for treatment discussions")}>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-foreground">Search Conversations</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Search through your transcripts and analytics data.
                        </p>
                      </div>

                      {/* Summary Template */}
                      <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer border border-green-200"
                           onClick={() => setChatInput("Summarize my recent conversations")}>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-foreground">Get Summary</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Get AI-powered summaries of your meetings and insights.
                        </p>
                      </div>
                    </div>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                          message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                      
                      {/* Message metadata */}
                      {message.metadata && Object.keys(message.metadata).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {message.type === 'analytics' && <BarChart3 className="h-3 w-3" />}
                            {message.type === 'search' && <Search className="h-3 w-3" />}
                            {message.type === 'sales_performance' && <Target className="h-3 w-3" />}
                            <span className="capitalize">{message.type === 'sales_performance' ? 'Sales Performance' : message.type}</span>
                            {message.metadata.totalResults && (
                              <span>• {message.metadata.totalResults} results</span>
                            )}
                            {message.metadata.salesPerformance && (
                              <span>• {message.metadata.salesPerformance.totalTranscripts} transcripts analyzed</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              
              {/* Loading indicator */}
                {chatLoading && (
                  <div className="flex justify-start">
                  <div className="bg-card border border-border text-foreground p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                      <span className="text-sm">Analyzing your data...</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            {/* Input area */}
            <div className="sticky bottom-0 left-0 right-0 bg-background p-6 border-t border-border">
              <div className="max-w-4xl mx-auto">
                {/* Sample prompts */}
                {!chatLoading && chatMessages.length > 0 && (
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                    {[
                      "Show me my protocol scores",
                      "What are my team's key strengths?",
                      "Areas for improvement analysis",
                      "Show me performance analytics",
                      "Search for treatment discussions", 
                      "Summarize recent conversations",
                      "What are the top categories?"
                    ].map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setChatInput(prompt)}
                        className="flex-none px-4 py-2 text-left bg-muted border border-border rounded-full transition-colors hover:bg-muted/80 text-sm text-foreground whitespace-nowrap"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="relative flex items-center bg-muted rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                    placeholder="Ask me about your analytics, performance, or search for insights..."
                    className="flex-1 py-4 px-4 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                    disabled={chatLoading}
                  />

                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className={`flex-shrink-0 p-2 mr-2 rounded-xl ${
                      chatInput.trim() && !chatLoading
                        ? 'text-primary hover:bg-primary/10'
                        : 'text-muted-foreground'
                    } transition-colors`}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

    if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">WISP AI</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item, index) => (
              <button
                key={index}
                                  onClick={() => {
                    if (item.label === "Analytics") {
                      setActiveTab("TRACKERS");
                    }
                  }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  item.active 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className={`w-4 h-4 ${item.active ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-start text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-2 text-sm transition-colors cursor-pointer"
          >
            {user?.email || 'user@example.com'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">Performance insights and metrics</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded-full font-medium border border-green-200">
                ✅ Auto-Sync Active
              </div>
              <button 
                onClick={() => router.push('/')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {user?.email || 'user@example.com'}
              </button>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8">
          {/* Tabs */}
          <div className="flex space-x-8 mb-8 border-b border-border">
            {["ACTIVITY", "TRACKERS", "CHAT"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 font-semibold transition-colors ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-border"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-4 gap-6 mb-8">
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
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Categories Found</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{categoryData.filter(cat => cat.count > 0).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {renderTabContent()}
          </div>
        </main>
      </div>


      {/* Full-Screen Transcript Modal */}
      {showTranscriptModal && selectedTranscript && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full h-full max-w-7xl mx-4 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-8 border-b border-slate-200">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedTranscript.name}</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedTranscript.timestamp && selectedTranscript.timestamp.toDate ? 
                    selectedTranscript.timestamp.toDate().toLocaleString() : 
                    'No timestamp'
                  }
                </p>
              </div>
              <button
                onClick={() => setShowTranscriptModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side - Transcript Content */}
              <div className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Audio Player */}
                <div className="mb-8">
                  {selectedTranscript.audioURL ? (
                    <div className="bg-slate-50 rounded-xl p-4">
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
                  <h4 className="text-xl font-bold text-slate-900 mb-6">Speaker Transcript</h4>
                  <div className="space-y-6">
                    {selectedTranscript.speakerTranscript && selectedTranscript.speakerTranscript.length > 0 ? (
                      selectedTranscript.speakerTranscript.map((speaker, index) => (
                        <div key={index} className="flex items-start space-x-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-sm font-bold text-white">
                                {speaker.speaker ? speaker.speaker.charAt(0).toUpperCase() : 'S'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <span className="text-lg font-semibold text-slate-900">
                                {speaker.speaker || 'Speaker'}
                              </span>
                              {speaker.timestamp && (
                                <span className="text-sm text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
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
                      ))
                    ) : (
                      <div className="p-8 bg-slate-100 rounded-xl text-center text-slate-500">
                        No speaker transcript available
                      </div>
                    )}
                  </div>
                </div>



                {/* Notes Section */}
                {selectedTranscript.notes && (
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-slate-900 mb-6">Meeting Summary & Notes</h4>
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div 
                        className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: selectedTranscript.notes
                            .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-slate-900 mb-4">$1</h1>')
                            .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-slate-800 mb-3 mt-6">$1</h2>')
                            .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium text-slate-800 mb-2 mt-4">$1</h3>')
                            .replace(/^\* (.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
                            .replace(/^## Overview/gm, '<h2 class="text-xl font-semibold text-slate-800 mb-3 mt-6">📋 Overview</h2>')
                            .replace(/^## Botox Appointment Experience/gm, '<h2 class="text-xl font-semibold text-slate-800 mb-3 mt-6">💉 Botox Appointment Experience</h2>')
                            .replace(/^## Key Takeaways/gm, '<h2 class="text-xl font-semibold text-slate-800 mb-3 mt-6">🎯 Key Takeaways</h2>')
                            .replace(/^## Action Items/gm, '<h2 class="text-xl font-semibold text-slate-800 mb-3 mt-6">✅ Action Items</h2>')
                            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em class="italic text-slate-700">$1</em>')
                            .replace(/\(Timestamp: (.+?)\)/g, '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">⏰ $1</span>')
                            .replace(/\n\n/g, '<br><br>')
                            .replace(/\n/g, '<br>')
                        }}
                      />
                    </div>
                  </div>
                )}


                {/* Sales Performance Section */}
                {selectedTranscript.salesPerformance && (
                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-slate-900 mb-6">Sales Performance Analysis</h4>
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="space-y-6">
                        {/* Overall Grade and Confidence */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              selectedTranscript.salesPerformance.overallGrade === 'excellent' ? 'bg-green-100 text-green-800' :
                              selectedTranscript.salesPerformance.overallGrade === 'good' ? 'bg-blue-100 text-blue-800' :
                              selectedTranscript.salesPerformance.overallGrade === 'poor' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              Grade: {selectedTranscript.salesPerformance.overallGrade?.toUpperCase() || 'N/A'}
                            </div>
                            {selectedTranscript.salesPerformance.confidence && (
                              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                selectedTranscript.salesPerformance.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                selectedTranscript.salesPerformance.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                Confidence: {selectedTranscript.salesPerformance.confidence?.toUpperCase() || 'N/A'}
                              </div>
                            )}
                          </div>
                          {selectedTranscript.salesPerformance.protocolScore !== undefined && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-900">{selectedTranscript.salesPerformance.protocolScore}</div>
                              <div className="text-sm text-slate-600">Protocol Score</div>
                            </div>
                          )}
                        </div>

                        {/* Key Strengths */}
                        {selectedTranscript.salesPerformance.keyStrengths && selectedTranscript.salesPerformance.keyStrengths.length > 0 && (
                          <div>
                            <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                              <span className="mr-2">✅</span>
                              Key Strengths
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {selectedTranscript.salesPerformance.keyStrengths.map((strength, index) => (
                                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Areas for Improvement */}
                        {selectedTranscript.salesPerformance.improvementAreas && selectedTranscript.salesPerformance.improvementAreas.length > 0 && (
                          <div>
                            <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                              <span className="mr-2">🎯</span>
                              Areas for Improvement
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {selectedTranscript.salesPerformance.improvementAreas.map((area, index) => (
                                <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Protocol Adherence */}
                        {selectedTranscript.salesPerformance.protocolAdherence && selectedTranscript.salesPerformance.protocolAdherence.length > 0 && (
                          <div>
                            <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                              <span className="mr-2">📋</span>
                              Protocol Adherence
                            </h5>
                            <div className="space-y-2">
                              {selectedTranscript.salesPerformance.protocolAdherence.map((protocol, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm text-slate-700">{protocol}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {selectedTranscript.salesPerformance.recommendations && (
                          <div>
                            <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                              <span className="mr-2">💡</span>
                              Recommendations
                            </h5>
                            <div className="p-4 bg-white rounded-lg border border-green-200">
                              <div className="prose prose-sm max-w-none text-slate-700">
                                {selectedTranscript.salesPerformance.recommendations.split('•').map((rec, index) => (
                                  rec.trim() && (
                                    <div key={index} className="flex items-start space-x-2 mb-2">
                                      <span className="text-green-600 mt-1">•</span>
                                      <span className="text-sm">{rec.trim()}</span>
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
              <div className="w-80 border-l border-slate-200 bg-slate-50 p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-slate-900 mb-3">Comments & Notes</h4>
                  <p className="text-sm text-slate-600 mb-6">
                    Only people at your company can view your comments and notes.
                  </p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Add a comment
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add your thoughts about this conversation..."
                      className="w-full p-4 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                      rows={4}
                    />
                  </div>

                  {highlightedText && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-blue-900">Selected Text:</div>
                        {activeTab === "TRACKERS" && (
                          <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                            🎯 TRACKERS Analysis
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-blue-800 italic mb-2">"{highlightedText.text}"</div>
                      <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block">
                        - {highlightedText.speaker}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={saveComment}
                      disabled={!comment.trim() || !highlightedText || savingComment}
                      className={`flex-1 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                        !comment.trim() || !highlightedText || savingComment
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {savingComment ? 'Saving...' : 'Save Comment'}
                    </button>
                    <button
                      onClick={() => {
                        setComment('')
                        setHighlightedText(null)
                      }}
                      className="px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-100 transition-all duration-200 font-medium"
                    >
                      Clear
                    </button>
                  </div>

                  {!highlightedText && (
                    <div className="mt-3 text-xs text-slate-500 bg-slate-100 p-3 rounded-lg">
                      💡 Highlight text in the transcript to add a comment about that specific part.
                    </div>
                  )}
                </div>

                {/* Real Alerts from Firestore */}
                <div className="mt-8">
                  <h5 className="text-sm font-semibold text-slate-700 mb-4">
                    Previous Comments & Alerts {existingComments.length > 0 && `(${existingComments.length})`}
                  </h5>
                  {loadingComments ? (
                    <div className="flex items-center justify-center p-8 text-slate-500">
                      <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full mr-3"></div>
                      Loading comments...
                    </div>
                  ) : existingComments.length > 0 ? (
                    <div className="space-y-4">
                      {existingComments.map((alert: AlertData, index: number) => (
                        <div key={alert.id || index} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-semibold text-slate-900">
                                  {alert.title || 'System Alert'}
                                </span>
                                {alert.type && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    alert.type === 'trackers_comment' ? 'bg-purple-100 text-purple-800' :
                                    alert.type === 'speaker_comment' ? 'bg-blue-100 text-blue-700' :
                                    alert.type === 'comment' ? 'bg-blue-100 text-blue-700' :
                                    alert.type === 'info' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {alert.type === 'trackers_comment' ? '🎯 TRACKERS' :
                                     alert.type === 'speaker_comment' ? '💬 Comment' :
                                     alert.type}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-700 mb-2">{alert.message}</p>
                              
                              {/* Transcript References */}
                              {alert.transcriptReferences && alert.transcriptReferences.length > 0 && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                  <p className="text-xs font-medium text-slate-600 mb-2">Referenced Transcript:</p>
                                  <div className="space-y-2">
                                    {alert.transcriptReferences.slice(0, 3).map((ref, refIndex) => (
                                      <div key={refIndex} className="text-xs">
                                        <span className="font-medium text-slate-700">{ref.speaker}:</span>
                                        <span className="text-slate-600 ml-1">"{ref.quote}"</span>
                                        {ref.context && (
                                          <span className="ml-2 px-2 py-1 bg-white rounded text-slate-500">
                                            {ref.context}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                    {alert.transcriptReferences.length > 3 && (
                                      <p className="text-xs text-slate-500 italic">
                                        +{alert.transcriptReferences.length - 3} more references...
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                {alert.timestamp?.toDate ? 
                                  formatTimeAgo(alert.timestamp.toDate()) : 
                                  'Recent'
                                }
                              </span>
                              {!alert.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 text-slate-500">
                      <MessageCircle className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm">No comments or alerts yet for this transcript.</p>
                      <p className="text-xs mt-1">Add a comment by highlighting text above.</p>
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

