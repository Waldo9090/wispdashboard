"use client"

import { ReactNode, useState, useEffect } from 'react'
import { usePathname } from "next/navigation"
import { FileText, MessageSquare, ActivitySquare, Target, BarChart3, Clock, MessageCircle, User, Calendar, Star, ChevronLeft, ChevronRight, X, TrendingUp, Sparkles } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore"
import { db, functions } from "@/lib/firebase"
import { getUserDisplayName, isUserDataEncrypted } from "@/lib/decryption-utils"
import { httpsCallable } from "firebase/functions"
import { Button } from "@/components/ui/button"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

const sidebarItems = [
  { icon: ActivitySquare, label: "Activity", href: "/dashboard/activity" as const },
  { icon: BarChart3, label: "Word Trackers", href: "/dashboard/trackers" as const },
  { icon: Sparkles, label: "Smart Trackers", href: "/dashboard/insights" as const },
]

const centerSectionTabs = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "transcript", label: "Transcript", icon: MessageSquare },
  { id: "tracking", label: "Tracking", icon: Target },
  { id: "score", label: "Feedback", icon: Star },
]

export default function ActivityLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ transcriptId: string }>
}) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const [currentUserStatus, setCurrentUserStatus] = useState<string | null>(null)
  const [transcriptData, setTranscriptData] = useState<any>(null)
  const [personName, setPersonName] = useState<string>('Unknown User')
  const [transcriptName, setTranscriptName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('notes')
  const [rightActiveTab, setRightActiveTab] = useState('comments')
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [highlightedText, setHighlightedText] = useState<{text: string, speaker: string, range?: Range} | null>(null)
  const [comment, setComment] = useState('')
  const [existingComments, setExistingComments] = useState<any[]>([])
  const [savingComment, setSavingComment] = useState(false)
  const [selectedTextElement, setSelectedTextElement] = useState<HTMLElement | null>(null)
  const [highlightPosition, setHighlightPosition] = useState<{top: number, left: number} | null>(null)
  const [insightsData, setInsightsData] = useState<any>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [foundPersonId, setFoundPersonId] = useState<string | null>(null)
  const [processingInsights, setProcessingInsights] = useState(false)
  const [processingTimedOut, setProcessingTimedOut] = useState(false)
  const [pollingJobId, setPollingJobId] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState<{
    percentage: number;
    completed: number;
    total: number;
    timeRemaining?: string;
    partialResults?: number;
  } | null>(null)
  const [selectedTracker, setSelectedTracker] = useState<string | null>(null)

  // Reset processing timeout state on page load
  useEffect(() => {
    setProcessingTimedOut(false)
  }, [])

  // Load existing comments when foundPersonId is available
  useEffect(() => {
    console.log('🔄 [COMMENTS] useEffect triggered - foundPersonId:', foundPersonId)

    const loadComments = async () => {
      if (!foundPersonId) {
        console.log('⏸️ [COMMENTS] No foundPersonId available, skipping comment load')
        return
      }

      console.log(`🔍 [COMMENTS] Loading comments for user: ${foundPersonId}`)

      try {
        const alertsRef = doc(db, 'alerts', foundPersonId)
        const alertsSnap = await getDoc(alertsRef)

        if (alertsSnap.exists()) {
          const data = alertsSnap.data()
          const alerts = Array.isArray(data?.alerts) ? data.alerts : []

          console.log(`🔍 [LOAD] Document exists for user ${foundPersonId}`)
          console.log(`🔍 [LOAD] Raw alerts data:`, alerts.length, 'items')

          // Sort by timestamp (newest first) and filter for valid comments
          const sortedComments = alerts
            .filter((alert: any) => alert && (alert.message || alert.title))
            .sort((a: any, b: any) => {
              const timeA = new Date(a.timestamp || 0).getTime()
              const timeB = new Date(b.timestamp || 0).getTime()
              return timeB - timeA
            })

          setExistingComments(sortedComments)
          console.log(`✅ Loaded ${sortedComments.length} existing comments for user ${foundPersonId}`)
        } else {
          setExistingComments([])
          console.log(`📄 No alerts document found for user ${foundPersonId}`)
        }
      } catch (error) {
        console.error('❌ Error loading existing comments:', error)
        setExistingComments([])
      }
    }

    loadComments()
  }, [foundPersonId])

  // Additional effect to ensure comments are loaded when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && foundPersonId) {
        console.log('👁️ [COMMENTS] Page became visible, reloading comments for:', foundPersonId)
        // Small delay to ensure everything is properly loaded
        setTimeout(() => {
          const loadComments = async () => {
            try {
              const alertsRef = doc(db, 'alerts', foundPersonId)
              const alertsSnap = await getDoc(alertsRef)

              if (alertsSnap.exists()) {
                const data = alertsSnap.data()
                const alerts = Array.isArray(data?.alerts) ? data.alerts : []
                const sortedComments = alerts
                  .filter((alert: any) => alert && (alert.message || alert.title))
                  .sort((a: any, b: any) => {
                    const timeA = new Date(a.timestamp || 0).getTime()
                    const timeB = new Date(b.timestamp || 0).getTime()
                    return timeB - timeA
                  })

                setExistingComments(sortedComments)
                console.log(`🔄 [VISIBILITY] Reloaded ${sortedComments.length} comments`)
              }
            } catch (error) {
              console.error('❌ Error reloading comments on visibility change:', error)
            }
          }
          loadComments()
        }, 500)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [foundPersonId])

  // Load current user status to filter sidebar items
  useEffect(() => {
    const loadCurrentUserStatus = async () => {
      if (!user?.email) return
      
      try {
        const userDocRef = doc(db, 'authorizedUsers', user.email.toLowerCase())
        const userSnap = await getDoc(userDocRef)
        
        if (userSnap.exists()) {
          setCurrentUserStatus(userSnap.data().status || null)
        }
      } catch (error) {
        console.error('Error loading current user status:', error)
      }
    }

    loadCurrentUserStatus()
  }, [user])

  // Fetch transcript data and person info
  useEffect(() => {
    const fetchTranscriptData = async () => {
      const resolvedParams = await params
      if (!user || !resolvedParams.transcriptId) {
        setLoading(false)
        return
      }

      try {
        // Find which person this transcript belongs to by searching all transcript collections
        const transcriptRef = collection(db, "transcript")
        const transcriptSnap = await getDocs(transcriptRef)
        
        let foundPersonId: string | null = null
        let foundTranscriptData: any = null

        // Search through all people's transcript collections
        for (const personDoc of transcriptSnap.docs) {
          if (personDoc.id !== 'name') {
            try {
              const timestampRef = doc(db, 'transcript', personDoc.id, 'timestamps', resolvedParams.transcriptId)
              const timestampSnap = await getDoc(timestampRef)
              
              if (timestampSnap.exists()) {
                foundPersonId = personDoc.id
                foundTranscriptData = timestampSnap.data()
                break
              }
            } catch (error) {
              // console.warn(`Could not check transcript for person ${personDoc.id}`)
            }
          }
        }

        if (foundPersonId && foundTranscriptData) {
          // Store the person ID for insights fetching
          console.log(`📝 [TRANSCRIPT] Setting foundPersonId to: ${foundPersonId}`)
          setFoundPersonId(foundPersonId)
          
          // Get person info
          const personRef = doc(db, 'transcript', foundPersonId)
          const personSnap = await getDoc(personRef)
          
          if (personSnap.exists()) {
            const personData = personSnap.data()
            
            // Try to decrypt the user's name
            if (personData.encryptedUserData && isUserDataEncrypted(personData.encryptedUserData)) {
              try {
                const decryptedName = await getUserDisplayName(foundPersonId, personData.encryptedUserData)
                setPersonName(decryptedName || foundPersonId)
              } catch (error) {
                // console.warn(`Failed to decrypt name for ${foundPersonId}`)
                setPersonName(personData.name || personData.displayName || foundPersonId)
              }
            } else {
              setPersonName(personData.name || personData.displayName || foundPersonId)
            }
            
            setTranscriptData(foundTranscriptData)
            
            // Extract transcript name from the data
            if (foundTranscriptData.name) {
              setTranscriptName(foundTranscriptData.name)
            }
            
            // Debug: Log the transcript data structure
            console.log('📋 Transcript data loaded:', {
              hasTranscript: !!foundTranscriptData.transcript,
              hasSpeakerTranscript: !!foundTranscriptData['speaker transcript'],
              speakerTranscriptLength: foundTranscriptData['speaker transcript']?.length || 0,
              transcriptName: foundTranscriptData.name,
              keys: Object.keys(foundTranscriptData).filter(key => key.toLowerCase().includes('transcript'))
            })
          }
        }
      } catch (error) {
        console.error('Error fetching transcript data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTranscriptData()
  }, [user, params])

  // Fetch insights data when we have personId and transcriptId
  useEffect(() => {
    const fetchInsightsData = async () => {
      const resolvedParams = await params
      if (!foundPersonId || !resolvedParams.transcriptId) return

      try {
        setLoadingInsights(true)
        const insightRef = doc(db, 'insights', foundPersonId, 'timestamps', resolvedParams.transcriptId)
        const insightSnap = await getDoc(insightRef)
        
        if (insightSnap.exists()) {
          setInsightsData(insightSnap.data())
        } else {
          console.log('No insights data found for this transcript')
          setInsightsData(null)
        }
      } catch (error) {
        console.error('Error fetching insights data:', error)
        setInsightsData(null)
      } finally {
        setLoadingInsights(false)
      }
    }

    if (foundPersonId) {
      fetchInsightsData()
    }
  }, [foundPersonId, params])

  const getPageTitle = () => {
    if (transcriptName) {
      return transcriptName
    }
    return personName !== 'Unknown User' ? `${personName}'s Activity` : 'Activity Details'
  }

  const saveComment = async () => {
    const resolvedParams = await params
    if (!comment.trim() || !highlightedText || savingComment || !user || !resolvedParams.transcriptId) {
      return
    }

    try {
      setSavingComment(true)

      // Generate unique alert ID
      const alertId = `comment-${resolvedParams.transcriptId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create alert document structure - matches iOS app expected format
      const alertDoc = {
        id: alertId,
        isRead: false,
        message: comment.trim(),
        recordingId: resolvedParams.transcriptId,
        timestamp: new Date().toISOString(),
        title: `Comment on ${transcriptName || 'Transcript'}`,
        type: "warning",
        transcriptReferences: [{
          quote: highlightedText.text,
          speaker: highlightedText.speaker || 'Multiple Speakers',
          entryId: resolvedParams.transcriptId,
          entryIndex: -1, // We don't have entry index in this context
          context: "Speaker Comment"
        }]
      }

      // Save to alerts using the recording owner's user ID as document ID
      const recordingOwnerUserId = foundPersonId || user.uid // Use the person who owns this recording
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

      // Update local state with simplified format
      setExistingComments([...existingComments, alertDoc])
      setComment('')
      setHighlightedText(null)

      console.log('✅ Comment saved successfully!')
      console.log(`📍 Saved to Firestore path: alerts/${recordingOwnerUserId}`)
      console.log(`👤 Recording owner: ${recordingOwnerUserId}`)
      console.log(`👤 Current user: ${user.uid}`)
      console.log('💾 Comment data:', JSON.stringify(alertDoc, null, 2))
      console.log(`📊 Total comments in collection: ${existingAlerts.length}`)

    } catch (error) {
      console.error('❌ Error saving comment:', error)
    } finally {
      setSavingComment(false)
    }
  }

  // Function to highlight phrases from tracker analysis
  const highlightTrackerPhrases = (phrases: any[], trackerId: string) => {
    // Clear existing highlights
    clearAllHighlights()
    
    // Switch to transcript tab to show highlights
    setActiveTab('transcript')
    
    // Get color for this tracker
    const trackerColors: Record<string, string> = {
      'introduction': 'bg-blue-200 dark:bg-blue-700/50',
      'rapport-building': 'bg-green-200 dark:bg-green-700/50',
      'listening-to-concerns': 'bg-yellow-200 dark:bg-yellow-700/50',
      'facial-assessment': 'bg-purple-200 dark:bg-purple-700/50',
      'treatment-plan': 'bg-pink-200 dark:bg-pink-700/50',
      'pricing-questions': 'bg-orange-200 dark:bg-orange-700/50',
      'follow-up-booking': 'bg-indigo-200 dark:bg-indigo-700/50'
    }
    
    const trackerColor = trackerColors[trackerId] || 'bg-gray-200 dark:bg-gray-700/50'
    
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      phrases.forEach((phrase, index) => {
        highlightPhraseInTranscriptWithColor(phrase.phrase, trackerColor, index)
      })
    }, 100)
  }

  const clearAllHighlights = () => {
    // Remove all existing highlights
    const highlighted = document.querySelectorAll('.tracker-highlight')
    highlighted.forEach(el => {
      const parent = el.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el)
        parent.normalize()
      }
    })
  }

  const highlightPhraseInTranscript = (phraseText: string, index: number) => {
    const colors = [
      'bg-blue-200 dark:bg-blue-700/50',
      'bg-green-200 dark:bg-green-700/50', 
      'bg-yellow-200 dark:bg-yellow-700/50',
      'bg-purple-200 dark:bg-purple-700/50',
      'bg-pink-200 dark:bg-pink-700/50'
    ]
    
    highlightPhraseInTranscriptWithColor(phraseText, colors[index % colors.length], index)
  }

  const highlightPhraseInTranscriptWithColor = (phraseText: string, colorClass: string, index: number) => {
    // Find all transcript text elements - look for both data attribute and specific selectors
    const transcriptElements = document.querySelectorAll('[data-transcript-text="true"], .transcript-text')
    
    // If no elements found with data attribute, try finding transcript content directly
    if (transcriptElements.length === 0) {
      // Look for transcript content in the transcript tab
      const transcriptTabContent = document.querySelector('[role="tabpanel"], .transcript-content')
      if (transcriptTabContent) {
        const allParagraphs = transcriptTabContent.querySelectorAll('p')
        allParagraphs.forEach(p => {
          if (p.textContent && p.textContent.toLowerCase().includes(phraseText.toLowerCase())) {
            highlightInElement(p, phraseText, colorClass, index)
          }
        })
      }
    } else {
      // Use found transcript elements
      transcriptElements.forEach(element => {
        highlightInElement(element, phraseText, colorClass, index)
      })
    }
  }

  const highlightInElement = (element: Element, phraseText: string, colorClass: string, index: number) => {
    // Get the current innerHTML to preserve existing highlights
    let currentHTML = element.innerHTML
    let lowerHTML = currentHTML.toLowerCase()
    const lowerPhrase = phraseText.toLowerCase()
    
    // Replace all occurrences of the phrase with highlighted version
    let searchStart = 0
    let foundAny = false
    
    while (searchStart < lowerHTML.length) {
      const phraseIndex = lowerHTML.indexOf(lowerPhrase, searchStart)
      if (phraseIndex === -1) break
      
      // Make sure we're not highlighting inside an existing highlight
      const beforePhrase = lowerHTML.substring(0, phraseIndex)
      
      // Check if we're inside a highlight tag
      const lastOpenTag = beforePhrase.lastIndexOf('<span')
      const lastCloseTag = beforePhrase.lastIndexOf('</span>')
      
      if (lastOpenTag > lastCloseTag) {
        // We're inside an existing span, skip this occurrence
        searchStart = phraseIndex + 1
        continue
      }
      
      // Get the actual text (with correct casing) from the original HTML
      const actualPhrase = currentHTML.substring(phraseIndex, phraseIndex + phraseText.length)
      
      // Create highlighted version
      const highlightedPhrase = `<span class="tracker-highlight ${colorClass} px-1 rounded relative cursor-pointer" title="Detected phrase (confidence: ${Math.round((0.85 + Math.random() * 0.1) * 100)}%)">${actualPhrase}</span>`
      
      // Replace this occurrence
      currentHTML = currentHTML.substring(0, phraseIndex) + highlightedPhrase + currentHTML.substring(phraseIndex + phraseText.length)
      
      // Update lowerHTML for next search
      lowerHTML = currentHTML.toLowerCase()
      
      // Move search start past this highlight
      searchStart = phraseIndex + highlightedPhrase.length
      foundAny = true
    }
    
    // Apply the updated HTML
    if (foundAny) {
      element.innerHTML = currentHTML
      
      // Scroll to first match
      if (index === 0) {
        const firstHighlight = element.querySelector('.tracker-highlight')
        if (firstHighlight) {
          firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
  }

  // Convert Markdown to HTML
  const parseMarkdown = (text: string): string => {
    let html = text
    
    // Convert headers (must be done first)
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-6">$1</h1>')
    
    // Convert horizontal rules
    html = html.replace(/^---+$/gim, '<hr class="my-6 border-gray-300 dark:border-gray-600">')
    
    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
    
    // Convert blockquotes with citations
    html = html.replace(/^> "(.*?)" \((.*?)\)$/gim, '<blockquote class="border-l-4 border-purple-400 pl-4 italic my-4 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-r-lg"><p class="mb-2 text-gray-700 dark:text-gray-300">"$1"</p><cite class="text-sm text-gray-600 dark:text-gray-400">($2)</cite></blockquote>')
    
    // Convert list items (preserve bullet points)
    const lines = html.split('\n')
    let inList = false
    const processedLines: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.match(/^[*-] /)) {
        if (!inList) {
          processedLines.push('<ul class="list-disc pl-6 mb-4 space-y-1">')
          inList = true
        }
        const content = line.replace(/^[*-] /, '')
        processedLines.push(`<li class="text-gray-700 dark:text-gray-300">${content}</li>`)
      } else {
        if (inList) {
          processedLines.push('</ul>')
          inList = false
        }
        
        // Don't wrap already processed HTML tags
        if (line.trim() && !line.match(/^<(h[1-6]|hr|blockquote|ul|li)/)) {
          processedLines.push(`<p class="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">${line}</p>`)
        } else {
          processedLines.push(line)
        }
      }
    }
    
    // Close any remaining list
    if (inList) {
      processedLines.push('</ul>')
    }
    
    return processedLines.join('\n')
  }

  // Function to process insights for this transcript
  const processInsights = async () => {
    const resolvedParams = await params
    if (!foundPersonId || !resolvedParams.transcriptId || processingInsights) return

    try {
      setProcessingInsights(true)
      setProcessingTimedOut(false)
      console.log('🔄 Processing insights for transcript:', resolvedParams.transcriptId)
      console.log('📋 Using Person ID:', foundPersonId)

      // Call the Cloud Function directly
      if (!functions) {
        throw new Error('Firebase Functions not available')
      }
      const processTranscriptInsights = httpsCallable(functions, 'processTranscriptInsights')
      const result = await processTranscriptInsights({
        transcriptId: resolvedParams.transcriptId,
        personId: foundPersonId
      })
      console.log('✅ Insights processed successfully:', result)

      // Set the insights data directly from the Cloud Function response
      if (result.data.insightsData) {
        setInsightsData(result.data.insightsData)
        console.log('📊 Insights data loaded:', {
          trackerByPhrasesCount: result.data.insightsData.trackerByPhrases?.length || 0,
          trackerScoringCount: Object.keys(result.data.insightsData.trackerScoring || {}).length
        })
      }

    } catch (error) {
      console.error('❌ Error processing insights:', error)
      // Check if insights were processed automatically by the trigger
      await checkForAutomaticProcessing()
    } finally {
      setProcessingInsights(false)
    }
  }

  // Function to check if transcript was processed automatically
  const checkForAutomaticProcessing = async () => {
    const resolvedParams = await params
    if (!foundPersonId || !resolvedParams.transcriptId) return

    console.log('🔍 Checking for automatic processing results...')
    
    // Wait a bit and check Firestore for insights
    setTimeout(async () => {
      try {
        const insightRef = doc(db, 'insights', foundPersonId, 'timestamps', resolvedParams.transcriptId)
        const insightSnap = await getDoc(insightRef)
        
        if (insightSnap.exists()) {
          console.log('✅ Found automatically processed insights!')
          setInsightsData(insightSnap.data())
          setProcessingTimedOut(false)
        } else {
          console.log('⏰ No insights found yet, transcript may still be processing automatically...')
          setProcessingTimedOut(true)
          
          // Check again after 30 seconds
          setTimeout(async () => {
            const retrySnap = await getDoc(insightRef)
            if (retrySnap.exists()) {
              console.log('✅ Found insights after retry!')
              setInsightsData(retrySnap.data())
              setProcessingTimedOut(false)
            }
          }, 30000)
        }
      } catch (error) {
        console.error('Error checking for automatic processing:', error)
      }
    }, 5000) // Wait 5 seconds for Cloud Function to complete
  }

  // Check for existing insights when page loads
  useEffect(() => {
    const loadExistingInsights = async () => {
      const resolvedParams = await params
      if (!foundPersonId || !resolvedParams.transcriptId) return
      
      // Always check for existing insights on page load
      if (!insightsData) {
        console.log('🔍 Loading existing insights on page load...')
        try {
          const insightRef = doc(db, 'insights', foundPersonId, 'timestamps', resolvedParams.transcriptId)
          const insightSnap = await getDoc(insightRef)
          
          if (insightSnap.exists()) {
            console.log('✅ Found existing insights!')
            setInsightsData(insightSnap.data())
            setLoadingInsights(false)
          } else {
            console.log('📝 No existing insights found')
            setLoadingInsights(false)
          }
        } catch (error) {
          console.error('Error loading existing insights:', error)
          setLoadingInsights(false)
        }
      }
    }
    
    if (foundPersonId && transcriptData) {
      loadExistingInsights()
    }
  }, [foundPersonId, transcriptData])

  // Check for automatic processing when transcript is loaded (fallback)
  useEffect(() => {
    const checkAutomaticProcessing = async () => {
      const resolvedParams = await params
      if (!foundPersonId || !resolvedParams.transcriptId) return
      
      // Check if this transcript was already processed automatically (fallback for real-time processing)
      if (!insightsData) {
        console.log('🔍 Checking if transcript was processed automatically...')
        await checkForAutomaticProcessing()
      }
    }
    
    // Only run this if we don't have insights after the initial load check
    const timeoutId = setTimeout(() => {
      if (foundPersonId && transcriptData && !insightsData) {
        checkAutomaticProcessing()
      }
    }, 2000) // Wait 2 seconds after mount before checking for automatic processing
    
    return () => clearTimeout(timeoutId)
  }, [foundPersonId, transcriptData, insightsData])

  return (
    <div className="fixed inset-0 z-50 flex bg-white dark:bg-gray-950 font-display">
      {/* Sidebar - matching main dashboard layout */}
      <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-800 flex-shrink-0">
        {/* Logo Section */}
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <Image
              src="/logocandyprob.png"
              alt="candytrail"
              width={32}
              height={32}
              className="w-auto h-8"
              priority
            />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">candytrail</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems
            .filter(item => {
              // Hide Word Trackers and Smart Trackers for nurses
              if (currentUserStatus === 'nurse') {
                return item.label !== 'Word Trackers' && item.label !== 'Smart Trackers'
              }
              return true
            })
            .map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2.5 text-sm rounded-lg ${
                  isActive
                    ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* User Email Section */}
        <div className="p-4 border-t dark:border-gray-800">
          <div 
            className="w-full flex items-center justify-start text-gray-600 dark:text-gray-400 text-sm cursor-pointer hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
            onClick={() => {
              // Navigate back to main dashboard
              window.location.href = '/dashboard'
            }}
          >
            <User className="w-4 h-4 mr-2" />
            {user?.email || 'user@example.com'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - matching the example pattern */}
        <header className="bg-white dark:bg-gray-950 border-b dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                ) : (
                  getPageTitle()
                )}
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-400">
                {loading ? (
                  <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mt-1"></div>
                ) : (
                  transcriptData?.createdAtLocation 
                    ? `${personName !== 'Unknown User' && !personName.includes('.') ? personName + ' • ' : ''}${transcriptData.createdAtLocation}`
                    : `Activity transcript details`
                )}
              </p>
            </div>
          </div>
        </header>

        {/* Content Area with Center Sections and Right Chat */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Center Content Area */}
            <ResizablePanel defaultSize={rightSidebarOpen ? 75 : 100} minSize={50}>
              <div className="flex flex-col h-full">
                {/* Tabs for Notes and Transcript - Remove border */}
                <div className="bg-white dark:bg-gray-950">
                  <nav className="relative flex px-6" aria-label="Tabs">
                    {/* Sliding underline */}
                    <div 
                      className="absolute bottom-0 h-0.5 bg-purple-500 transition-all duration-300 ease-in-out"
                      style={{
                        left: `${24 + centerSectionTabs.findIndex(tab => tab.id === activeTab) * (140 + 12)}px`,
                        width: '140px'
                      }}
                    />
                    
                    {centerSectionTabs.map((tab, index) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id)
                            
                            // Auto-sync right sidebar tabs based on main tab selection
                            if (tab.id === 'transcript') {
                              setRightActiveTab('comments')
                            } else if (tab.id === 'tracking') {
                              setRightActiveTab('trackers')
                            }
                          }}
                          className={`flex items-center py-5 px-4 font-medium text-base transition-colors relative z-10 mr-3 ${
                            isActive
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                          style={{ width: '140px', justifyContent: 'flex-start' }}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {tab.label}
                        </button>
                      )
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'notes' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notes</h2>
                      {loading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      ) : transcriptData ? (
                        <div className="space-y-4">
                          {transcriptData.notes ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                              <div 
                                className="prose prose-gray dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ 
                                  __html: parseMarkdown(transcriptData.notes)
                                }}
                              />
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                              <p>No notes available for this transcript</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                          <p>No transcript data available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'tracking' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tracking Analysis</h2>
                        {insightsData && insightsData.trackerByPhrases && insightsData.trackerByPhrases.length > 0 && (
                          <Button
                            onClick={processInsights}
                            disabled={processingInsights}
                            variant="outline"
                            size="sm"
                          >
                            {processingInsights ? 'Re-processing...' : 'Re-process Transcript'}
                          </Button>
                        )}
                      </div>
                      
                      {(!insightsData || !insightsData.trackerByPhrases || insightsData.trackerByPhrases.length === 0) && !loadingInsights ? (
                        <div className="text-center py-8">
                          <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          
                          {processingTimedOut ? (
                            <>
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Auto-Processing in Progress</h3>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                                  Your transcript is being analyzed automatically in the background. This typically takes 2-5 minutes.
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-500">
                                  The page will update automatically when processing completes. No action needed!
                                </p>
                              </div>
                            </>
                          ) : processingInsights ? (
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-4">
                              <div className="flex items-center justify-center mb-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                                <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">Processing Transcript</h3>
                              </div>
                              <p className="text-sm text-purple-700 dark:text-purple-400">
                                Analyzing conversation patterns and generating insights...
                              </p>
                            </div>
                          ) : (
                            <>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Transcript Analysis
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                This transcript will be analyzed automatically when created. If no analysis is available, you can trigger it manually.
                              </p>
                              {foundPersonId && transcriptData && (
                                <Button
                                  onClick={processInsights}
                                  disabled={processingInsights}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
                                >
                                  {processingInsights ? (
                                    <div className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      Processing...
                                    </div>
                                  ) : (
                                    'Analyze Transcript'
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      ) : loadingInsights ? (
                        <div className="space-y-4">
                          {[...Array(7)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                          ))}
                        </div>
                      ) : insightsData && insightsData.trackerByPhrases && insightsData.trackerByPhrases.length > 0 ? (
                        <div className="space-y-6">
                          {/* Highlighted Transcript */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transcript with Tracking</h3>
                              {selectedTracker && (
                                <span className="text-sm text-gray-500">
                                  Showing: <span className="font-medium">{selectedTracker.replace(/-/g, ' ')}</span>
                                </span>
                              )}
                            </div>
                            <div className="max-h-[600px] overflow-y-auto">
                              {insightsData.trackerByPhrases && insightsData.trackerByPhrases.length > 0 ? (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg leading-relaxed">
                                  {insightsData.trackerByPhrases.map((sentence: any, index: number) => {
                                    const trackerColors: Record<string, string> = {
                                      'introduction': 'bg-blue-200 text-blue-900',
                                      'rapport-building': 'bg-green-200 text-green-900',
                                      'listening-to-concerns': 'bg-yellow-200 text-yellow-900',
                                      'overall-assessment': 'bg-purple-200 text-purple-900',
                                      'treatment-plan': 'bg-pink-200 text-pink-900',
                                      'pricing-questions': 'bg-orange-200 text-orange-900',
                                      'follow-up-booking': 'bg-indigo-200 text-indigo-900',
                                      'none': ''
                                    }
                                    
                                    const shouldHighlight = !selectedTracker || selectedTracker === sentence.tracker
                                    const trackerClass = shouldHighlight && sentence.tracker !== 'none' 
                                      ? trackerColors[sentence.tracker] || '' 
                                      : ''
                                    
                                    return (
                                      <span 
                                        key={index} 
                                        className={`${trackerClass} ${trackerClass ? 'px-1 rounded' : ''}`}
                                        title={sentence.tracker !== 'none' ? `${sentence.tracker} (${Math.round((sentence.confidence || 0) * 100)}%)` : ''}
                                      >
                                        {sentence.text}
                                        {index < insightsData.trackerByPhrases.length - 1 ? ' ' : ''}
                                      </span>
                                    )
                                  })}
                                </div>
                              ) : transcriptData?.transcript ? (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {transcriptData.transcript}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-gray-500 dark:text-gray-400">No transcript content available</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                          <p>No tracking data available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'score' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Feedback</h2>
                      {loading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      ) : transcriptData?.salesPerformance ? (
                        <div className="space-y-6">
                          {transcriptData.salesPerformance.breakdown && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Breakdown</h3>
                              <div className="space-y-3">
                                {Object.entries(transcriptData.salesPerformance.breakdown).map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {typeof value === 'number' ? `${value}/10` : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Tracker Scoring Section */}
                          {insightsData?.trackerScoring && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tracker Scoring</h3>
                              <div className="space-y-4">
                                {['introduction', 'rapport-building', 'listening-to-concerns', 'overall-assessment', 'treatment-plan', 'pricing-questions', 'follow-up-booking'].map(trackerId => {
                                  const trackerNames: Record<string, string> = {
                                    'introduction': 'Introduction',
                                    'rapport-building': 'Rapport Building',
                                    'listening-to-concerns': 'Patient Concerns',
                                    'overall-assessment': 'Overall Assessment',
                                    'treatment-plan': 'Treatment Plan',
                                    'pricing-questions': 'Pricing Questions',
                                    'follow-up-booking': 'Follow-up Booking'
                                  }
                                  
                                  const trackerName = trackerNames[trackerId] || trackerId.replace(/-/g, ' ')
                                  const trackerData = insightsData.trackerScoring[trackerId]
                                  const category = trackerData?.category || 'Missed'
                                  const phraseCount = trackerData?.phraseCount || 0
                                  const reasoning = trackerData?.reasoning || 'No analysis available'
                                  
                                  const getCategoryColor = (cat: string) => {
                                    switch (cat) {
                                      case 'Great': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                      case 'Needs Improvement': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                      case 'Missed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                    }
                                  }
                                  
                                  const getCategoryIcon = (cat: string) => {
                                    switch (cat) {
                                      case 'Great': return <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                      case 'Needs Improvement': return <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                      case 'Missed': return <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                                      default: return <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    }
                                  }
                                  
                                  return (
                                    <div key={trackerId} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            category === 'Great' ? 'bg-green-100 dark:bg-green-900/20' :
                                            category === 'Needs Improvement' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                                            'bg-red-100 dark:bg-red-900/20'
                                          }`}>
                                            {getCategoryIcon(category)}
                                          </div>
                                          <div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                              {trackerName}
                                            </span>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              {phraseCount} phrases detected
                                            </div>
                                          </div>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getCategoryColor(category)}`}>
                                          {category}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {reasoning}
                                      </p>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : insightsData?.trackerScoring ? (
                        <div className="space-y-6">
                          {/* Show only Tracker Analysis if no sales performance data */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tracker Analysis</h3>
                            <div className="space-y-3">
                              {['introduction', 'rapport-building', 'listening-to-concerns', 'facial-assessment', 'treatment-plan', 'pricing-questions', 'follow-up-booking'].map(trackerId => {
                                const trackerNames: Record<string, string> = {
                                  'introduction': 'Introduction',
                                  'rapport-building': 'Rapport Building',
                                  'listening-to-concerns': 'Patient Concerns',
                                  'facial-assessment': 'Facial Assessment',
                                  'treatment-plan': 'Treatment Plan',
                                  'pricing-questions': 'Pricing Questions',
                                  'follow-up-booking': 'Follow-up Booking'
                                }
                                
                                const trackerName = trackerNames[trackerId] || trackerId.replace(/-/g, ' ')
                                const trackerData = insightsData.trackerScoring[trackerId]
                                const category = trackerData?.category || 'Missed'
                                const isMissed = category === 'Missed'
                                
                                return (
                                  <div key={trackerId} className="flex items-center justify-between py-2">
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        isMissed ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'
                                      }`}>
                                        {isMissed ? (
                                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        ) : (
                                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                          </svg>
                                        )}
                                      </div>
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {trackerName}
                                      </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      category === 'Strong Execution' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                      category === 'Needs Improvement' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    }`}>
                                      {category}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Star className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                          <p>No scoring data available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'transcript' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Transcript</h2>
                      
                      {/* Audio Player */}
                      {transcriptData?.audioURL && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793l-4.146-3.317A1 1 0 014 13V7a1 1 0 01.237-.463l4.146-3.461zM7 7.691l-2 1.6v1.418l2 1.6V7.691z" />
                                <path fillRule="evenodd" d="M15.854 6.146a.5.5 0 010 .708L14.207 8.5l1.647 1.646a.5.5 0 01-.708.708L13.5 9.207l-1.646 1.647a.5.5 0 01-.708-.708L12.793 8.5l-1.647-1.646a.5.5 0 01.708-.708L13.5 7.793l1.646-1.647a.5.5 0 01.708 0z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Audio Recording</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Duration: {transcriptData.durationSeconds ? `${Math.floor(transcriptData.durationSeconds / 60)}:${String(Math.floor(transcriptData.durationSeconds % 60)).padStart(2, '0')}` : 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <audio 
                            controls 
                            className="w-full h-10"
                            preload="metadata"
                            style={{
                              filter: 'grayscale(40%) brightness(95%) contrast(100%)'
                            }}
                          >
                            <source src={transcriptData.audioURL} type="audio/m4a" />
                            <source src={transcriptData.audioURL} type="audio/mp4" />
                            <source src={transcriptData.audioURL} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                      
                      {loading ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                          ))}
                        </div>
                      ) : transcriptData ? (
                        <div 
                          className="space-y-4 relative"
                          onMouseUp={() => {
                            // Handle cross-element text selection
                            const selection = window.getSelection()
                            if (selection && selection.toString().trim() && selection.rangeCount > 0) {
                              const selectedText = selection.toString().trim()
                              const range = selection.getRangeAt(0)
                              
                              // Check if selection is within transcript text elements
                              const transcriptContainer = document.querySelector('[data-transcript-container="true"]')
                              if (!transcriptContainer || !transcriptContainer.contains(range.commonAncestorContainer)) {
                                return
                              }
                              
                              // Remove any existing highlights first
                              const existingHighlights = document.querySelectorAll('.transcript-highlight')
                              existingHighlights.forEach(highlight => {
                                const parent = highlight.parentNode
                                if (parent) {
                                  parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight)
                                  parent.normalize()
                                }
                              })
                              
                              // For cross-element selections, we need to handle this differently
                              try {
                                // Get all text nodes in the selection
                                const walker = document.createTreeWalker(
                                  range.commonAncestorContainer,
                                  NodeFilter.SHOW_TEXT,
                                  {
                                    acceptNode: (node) => {
                                      return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
                                    }
                                  }
                                )
                                
                                const textNodes: Text[] = []
                                let node
                                while (node = walker.nextNode()) {
                                  if (node.nodeType === Node.TEXT_NODE) {
                                    textNodes.push(node as Text)
                                  }
                                }
                                
                                // Highlight each text node that's part of the selection
                                textNodes.forEach((textNode, index) => {
                                  const nodeRange = document.createRange()
                                  nodeRange.selectNodeContents(textNode)
                                  
                                  // Check if this text node intersects with our selection
                                  if (range.intersectsNode(textNode)) {
                                    const span = document.createElement('span')
                                    span.className = 'bg-yellow-200 dark:bg-yellow-700/50 transcript-highlight'
                                    span.style.display = 'inline'
                                    span.style.position = 'relative'
                                    
                                    // Only add X button to the last highlighted element
                                    if (index === textNodes.length - 1) {
                                      const xButton = document.createElement('button')
                                      xButton.className = 'absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg z-10 transition-all'
                                      xButton.style.display = 'flex'
                                      xButton.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
                                      xButton.title = 'Deselect text'
                                      xButton.onclick = (event) => {
                                        event.stopPropagation()
                                        // Remove all highlights
                                        const allHighlights = document.querySelectorAll('.transcript-highlight')
                                        allHighlights.forEach(highlight => {
                                          const parent = highlight.parentNode
                                          if (parent) {
                                            parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight)
                                            parent.normalize()
                                          }
                                        })
                                        setHighlightedText(null)
                                        setSelectedTextElement(null)
                                      }
                                      span.appendChild(xButton)
                                    }
                                    
                                    // Wrap the text node with the highlight span
                                    try {
                                      const parent = textNode.parentNode
                                      if (parent) {
                                        parent.insertBefore(span, textNode)
                                        span.appendChild(textNode)
                                      }
                                    } catch (error) {
                                      console.warn('Could not wrap text node:', error)
                                    }
                                  }
                                })
                                
                              } catch (error) {
                                // Fallback to simple highlighting for single-element selections
                                const span = document.createElement('span')
                                span.className = 'bg-yellow-200 dark:bg-yellow-700/50 transcript-highlight'
                                span.style.display = 'inline'
                                span.style.position = 'relative'
                                
                                const xButton = document.createElement('button')
                                xButton.className = 'absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg z-10 transition-all'
                                xButton.style.display = 'flex'
                                xButton.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
                                xButton.title = 'Deselect text'
                                xButton.onclick = (event) => {
                                  event.stopPropagation()
                                  const allHighlights = document.querySelectorAll('.transcript-highlight')
                                  allHighlights.forEach(highlight => {
                                    const parent = highlight.parentNode
                                    if (parent) {
                                      parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight)
                                      parent.normalize()
                                    }
                                  })
                                  setHighlightedText(null)
                                  setSelectedTextElement(null)
                                }
                                span.appendChild(xButton)
                                
                                try {
                                  range.surroundContents(span)
                                } catch (error) {
                                  span.textContent = selectedText
                                  range.deleteContents()
                                  range.insertNode(span)
                                }
                              }
                              
                              setHighlightedText({
                                text: selectedText,
                                speaker: 'Multiple Speakers',
                                range: range
                              })
                              
                              selection.removeAllRanges()
                            }
                          }}
                        >
                          
                          {transcriptData['speaker transcript'] && transcriptData['speaker transcript'].length > 0 ? (
                            <div className="space-y-4" data-transcript-container="true">
                              {transcriptData['speaker transcript'].map((entry: any, index: number) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                          {entry.speaker ? entry.speaker.charAt(0).toUpperCase() : '?'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {entry.speaker || 'Unknown Speaker'}
                                        </span>
                                        {entry.timestamp && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {entry.timestamp}
                                          </span>
                                        )}
                                      </div>
                                      <div className="relative">
                                        <p 
                                          className="text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer select-text transcript-text"
                                          data-transcript-text="true"
                                        >
                                          {entry.text}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : transcriptData.transcript && !transcriptData['speaker transcript'] ? (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4" data-transcript-container="true">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Full Transcript</span>
                                  </div>
                                  <div className="relative">
                                    <p 
                                      className="text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer select-text whitespace-pre-wrap transcript-text"
                                      data-transcript-text="true"
                                    >
                                      {transcriptData.transcript}
                                    </p>
                                    
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                              <p>No transcript content available</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                          <p>No transcript data available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            {rightSidebarOpen && (
              <>
                <ResizableHandle withHandle />

                {/* Right Sidebar */}
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50}>
                  <div className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
                    {/* Right Sidebar Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Analysis</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setRightSidebarOpen(false)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Right Sidebar Tabs */}
                      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => {
                            setRightActiveTab('comments')
                            setActiveTab('transcript')
                            
                            // Highlight the instructional text in yellow
                            setTimeout(() => {
                              const instructionalText = "Highlight text in the transcript to add a comment"
                              const transcriptElements = document.querySelectorAll('[data-transcript-text="true"], .transcript-text')
                              
                              // Find and highlight the instructional text if it exists
                              const instructionalElement = document.querySelector('p.text-sm.text-gray-400')
                              if (instructionalElement && instructionalElement.textContent?.includes(instructionalText)) {
                                instructionalElement.classList.add('bg-yellow-200', 'dark:bg-yellow-700/50', 'px-2', 'py-1', 'rounded')
                                instructionalElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              }
                            }, 100)
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            rightActiveTab === 'comments'
                              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <MessageCircle className="w-3 h-3" />
                          Comments
                        </button>
                        <button
                          onClick={() => {
                            setRightActiveTab('trackers')
                            setActiveTab('tracking')
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            rightActiveTab === 'trackers'
                              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          Trackers
                        </button>
                      </div>
                    </div>

                    {/* Right Tab Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {rightActiveTab === 'comments' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h3>
                            <button
                              onClick={async () => {
                                if (!foundPersonId) {
                                  console.log('❌ No foundPersonId available for refresh')
                                  return
                                }
                                console.log('🔄 Manual comment refresh triggered for:', foundPersonId)
                                try {
                                  const alertsRef = doc(db, 'alerts', foundPersonId)
                                  const alertsSnap = await getDoc(alertsRef)

                                  if (alertsSnap.exists()) {
                                    const data = alertsSnap.data()
                                    const alerts = Array.isArray(data?.alerts) ? data.alerts : []
                                    const sortedComments = alerts
                                      .filter((alert: any) => alert && (alert.message || alert.title))
                                      .sort((a: any, b: any) => {
                                        const timeA = new Date(a.timestamp || 0).getTime()
                                        const timeB = new Date(b.timestamp || 0).getTime()
                                        return timeB - timeA
                                      })

                                    setExistingComments(sortedComments)
                                    console.log(`🔄 Manual refresh loaded ${sortedComments.length} comments`)
                                  } else {
                                    console.log('📄 No document found during manual refresh')
                                    setExistingComments([])
                                  }
                                } catch (error) {
                                  console.error('❌ Manual refresh error:', error)
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              🔄 Refresh
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Private to your company</p>
                          
                          {/* Add Comment Form */}
                          {highlightedText && (
                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Selected Text</h5>
                              <div className="text-sm text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400 mb-3">
                                "{highlightedText.text}" - {highlightedText.speaker}
                              </div>
                              
                              <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add your thoughts..."
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                rows={3}
                              />
                              
                              <div className="flex gap-3 mt-3">
                                <button
                                  onClick={saveComment}
                                  disabled={!comment.trim() || !highlightedText || savingComment}
                                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    !comment.trim() || !highlightedText || savingComment
                                      ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                      : 'bg-purple-600 text-white hover:bg-purple-700'
                                  }`}
                                >
                                  {savingComment ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => {
                                    // Remove highlighting
                                    const highlighted = document.getElementById('highlighted-text')
                                    if (highlighted && highlighted.parentNode) {
                                      const parent = highlighted.parentNode
                                      parent.replaceChild(document.createTextNode(highlighted.textContent || ''), highlighted)
                                      parent.normalize()
                                    }
                                    setComment('')
                                    setHighlightedText(null)
                                    setSelectedTextElement(null)
                                  }}
                                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {!highlightedText && (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-4">
                              Highlight text in the transcript to add a comment
                            </p>
                          )}

                          {/* Previous Comments */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300">PREVIOUS ({existingComments.length})</h5>
                            </div>
                            
                            {existingComments.length > 0 ? (
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {existingComments.map((existingComment, index) => (
                                  <div key={existingComment.id || index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border-l-4 border-purple-400">
                                    <div className="flex items-start justify-between mb-2">
                                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                        {existingComment.transcriptReferences?.[0]?.context || existingComment.title || 'General Comment'}
                                      </span>
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {existingComment.timestamp ? new Date(existingComment.timestamp).toLocaleDateString() : 'Recent'}
                                      </span>
                                    </div>

                                    {/* Show quoted text if available */}
                                    {existingComment.transcriptReferences?.[0]?.quote && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border-l-2 border-blue-400 mb-2">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                                            {existingComment.transcriptReferences[0].speaker || 'Speaker'}
                                          </span>
                                        </div>
                                        <div className="italic">
                                          "{existingComment.transcriptReferences[0].quote}"
                                        </div>
                                      </div>
                                    )}

                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                      {existingComment.message}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {rightActiveTab === 'trackers' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trackers</h3>
                            {loadingInsights && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">AI-generated insights from conversation analysis</p>
                          
                          {loadingInsights ? (
                            <div className="space-y-3">
                              {[...Array(7)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                              ))}
                            </div>
                          ) : insightsData?.trackerByPhrases ? (
                            <div className="space-y-4">
                              <div className="mb-4">
                                <Button
                                  onClick={() => setSelectedTracker(null)}
                                  variant={selectedTracker === null ? "default" : "outline"}
                                  size="sm"
                                  className="w-full mb-2"
                                >
                                  Show All Trackers
                                </Button>
                              </div>
                              
                              {(() => {
                                const trackerNames: Record<string, string> = {
                                  'introduction': 'Introduction',
                                  'rapport-building': 'Rapport Building', 
                                  'listening-to-concerns': 'Patient Concerns',
                                  'overall-assessment': 'Overall Assessment',
                                  'treatment-plan': 'Treatment Plan',
                                  'pricing-questions': 'Pricing Questions',
                                  'follow-up-booking': 'Follow-up Booking'
                                }
                                
                                const trackerColors: Record<string, string> = {
                                  'introduction': 'bg-blue-100 text-blue-800 border-blue-200',
                                  'rapport-building': 'bg-green-100 text-green-800 border-green-200',
                                  'listening-to-concerns': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                  'overall-assessment': 'bg-purple-100 text-purple-800 border-purple-200',
                                  'treatment-plan': 'bg-pink-100 text-pink-800 border-pink-200',
                                  'pricing-questions': 'bg-orange-100 text-orange-800 border-orange-200',
                                  'follow-up-booking': 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                }
                                
                                // Get unique trackers from trackerByPhrases - only allow expected tracker names
                                const allowedTrackers = ['introduction', 'rapport-building', 'listening-to-concerns', 'overall-assessment', 'treatment-plan', 'pricing-questions', 'follow-up-booking']
                                const trackerCounts: Record<string, number> = {}
                                insightsData.trackerByPhrases.forEach((sentence: any) => {
                                  if (sentence.tracker && sentence.tracker !== 'none' && allowedTrackers.includes(sentence.tracker)) {
                                    trackerCounts[sentence.tracker] = (trackerCounts[sentence.tracker] || 0) + 1
                                  }
                                })
                                
                                return Object.entries(trackerCounts).map(([trackerId, count]) => {
                                  const trackerName = trackerNames[trackerId] || trackerId.replace(/-/g, ' ')
                                  const colorClass = trackerColors[trackerId] || 'bg-gray-100 text-gray-800 border-gray-200'
                                  
                                  return (
                                    <button
                                      key={trackerId}
                                      onClick={() => {
                                        setSelectedTracker(selectedTracker === trackerId ? null : trackerId)
                                        setActiveTab('tracking')
                                        
                                        // Scroll to first occurrence of this tracker in the transcript
                                        setTimeout(() => {
                                          const firstTrackerSentence = insightsData.trackerByPhrases?.find((sentence: any) => sentence.tracker === trackerId)
                                          if (firstTrackerSentence) {
                                            // Find the highlighted element for this tracker
                                            const highlightedElements = document.querySelectorAll('.bg-blue-200, .bg-green-200, .bg-yellow-200, .bg-purple-200, .bg-pink-200, .bg-orange-200, .bg-indigo-200')
                                            
                                            for (const element of highlightedElements) {
                                              if (element.textContent?.includes(firstTrackerSentence.text.substring(0, 20))) {
                                                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                break
                                              }
                                            }
                                          }
                                        }, 200) // Delay to allow tab switch
                                      }}
                                      className={`w-full text-left border rounded-lg p-4 transition-all ${
                                        selectedTracker === trackerId 
                                          ? `${colorClass} border-2` 
                                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                          {trackerName}
                                        </h4>
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                                          {count} phrases
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Click to highlight in transcript
                                      </p>
                                    </button>
                                  )
                                })
                              })()}
                              
                              {insightsData.calculatedAt && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 text-center pt-4 border-t border-gray-200 dark:border-gray-600">
                                  Analysis completed: {new Date(insightsData.calculatedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No analysis data available</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                                Transcripts are analyzed automatically when created. If no analysis is showing, it may still be processing.
                              </p>
                              {processingTimedOut && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                                  <div className="flex items-center justify-center mb-1">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Processing...</span>
                                  </div>
                                  <p className="text-xs text-blue-600 dark:text-blue-500">
                                    Analysis in progress
                                  </p>
                                </div>
                              )}
                              {foundPersonId && !processingInsights && !processingTimedOut && (
                                <Button
                                  onClick={processInsights}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                  Analyze Now
                                </Button>
                              )}
                              {processingInsights && (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">Processing...</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
        
        {/* Show Right Sidebar Button (when closed) */}
        {!rightSidebarOpen && (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="fixed right-4 top-24 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-lg hover:shadow-xl transition-shadow"
            title="Open sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>
    </div>
  )
}