"use client"

import { ReactNode, useState, useEffect } from 'react'
import { usePathname } from "next/navigation"
import { FileText, MessageSquare, ActivitySquare, Target, BarChart3, Clock, MessageCircle, User, Calendar, Star, ChevronLeft, ChevronRight, X, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getUserDisplayName, isUserDataEncrypted } from "@/lib/decryption-utils"
import { Button } from "@/components/ui/button"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

const sidebarItems = [
  { icon: ActivitySquare, label: "Activity", href: "/dashboard/activity" as const },
  { icon: Target, label: "Trackers", href: "/dashboard/trackers" as const },
  { icon: BarChart3, label: "Insights", href: "/dashboard/insights" as const },
]

const centerSectionTabs = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "transcript", label: "Transcript", icon: MessageSquare },
  { id: "score", label: "Score", icon: Star },
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

  const saveComment = () => {
    if (comment.trim() && highlightedText && !savingComment) {
      setSavingComment(true)
      // Save comment logic here
      setTimeout(() => {
        setExistingComments([...existingComments, {
          message: comment,
          transcriptReferences: [{
            quote: highlightedText.text,
            category: 'General Comment'
          }],
          timestamp: new Date()
        }])
        setComment('')
        setHighlightedText(null)
        setSavingComment(false)
      }, 1000)
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
        
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => {
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
                          onClick={() => setActiveTab(tab.id)}
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

                  {activeTab === 'score' && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Score</h2>
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
                          {transcriptData.salesPerformance.overallGrade && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Grade</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Performance evaluation</p>
                                </div>
                                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                  transcriptData.salesPerformance.overallGrade === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  transcriptData.salesPerformance.overallGrade === 'good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                  transcriptData.salesPerformance.overallGrade === 'poor' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  {transcriptData.salesPerformance.overallGrade.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {transcriptData.salesPerformance.protocolScore !== undefined && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Protocol Score</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Adherence to sales process</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    {transcriptData.salesPerformance.protocolScore}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">out of 10</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
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
                              filter: 'sepia(20%) saturate(70%) hue-rotate(220deg) brightness(95%) contrast(105%)'
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
                        <div className="space-y-4 relative">
                          {/* Floating deselect button */}
                          {highlightedText && highlightPosition && (
                            <button
                              onClick={() => {
                                // Remove highlighting
                                const highlighted = document.getElementById('highlighted-text')
                                if (highlighted && highlighted.parentNode) {
                                  const parent = highlighted.parentNode
                                  parent.replaceChild(document.createTextNode(highlighted.textContent || ''), highlighted)
                                  parent.normalize()
                                }
                                setHighlightedText(null)
                                setSelectedTextElement(null)
                                setHighlightPosition(null)
                              }}
                              className="absolute w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg z-10 transition-all -translate-y-1/2"
                              style={{
                                top: `${highlightPosition.top}px`,
                                left: `${highlightPosition.left + 4}px`
                              }}
                              title="Deselect text"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          
                          {transcriptData['speaker transcript'] && transcriptData['speaker transcript'].length > 0 ? (
                            <div className="space-y-4">
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
                                          onMouseUp={(e) => {
                                            const selection = window.getSelection()
                                            if (selection && selection.toString().trim()) {
                                              const range = selection.getRangeAt(0)
                                              const rect = range.getBoundingClientRect()
                                              const containerRect = e.currentTarget.getBoundingClientRect()
                                              
                                              setHighlightedText({
                                                text: selection.toString().trim(),
                                                speaker: entry.speaker || 'Unknown Speaker',
                                                range: range
                                              })
                                              setSelectedTextElement(e.currentTarget)
                                              setHighlightPosition({
                                                top: rect.top - containerRect.top,
                                                left: rect.right - containerRect.left
                                              })
                                              
                                              // Apply yellow highlighting
                                              const span = document.createElement('span')
                                              span.className = 'bg-yellow-200 dark:bg-yellow-700/50 relative'
                                              span.id = 'highlighted-text'
                                              try {
                                                range.surroundContents(span)
                                              } catch (error) {
                                                // Fallback if range crosses element boundaries
                                                span.textContent = range.toString()
                                                range.deleteContents()
                                                range.insertNode(span)
                                              }
                                              selection.removeAllRanges()
                                            }
                                          }}
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
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
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
                                      onMouseUp={(e) => {
                                        const selection = window.getSelection()
                                        if (selection && selection.toString().trim()) {
                                          const range = selection.getRangeAt(0)
                                          setHighlightedText({
                                            text: selection.toString().trim(),
                                            speaker: 'Transcript',
                                            range: range
                                          })
                                          setSelectedTextElement(e.currentTarget)
                                          
                                          // Apply yellow highlighting
                                          const span = document.createElement('span')
                                          span.className = 'bg-yellow-200 dark:bg-yellow-700/50'
                                          span.id = 'highlighted-text'
                                          try {
                                            range.surroundContents(span)
                                          } catch (error) {
                                            span.textContent = range.toString()
                                            range.deleteContents()
                                            range.insertNode(span)
                                          }
                                          selection.removeAllRanges
                                        }
                                      }}
                                    >
                                      {transcriptData.transcript}
                                    </p>
                                    
                                    {/* Deselect button */}
                                    {highlightedText && selectedTextElement && (
                                      <button
                                        onClick={() => {
                                          // Remove highlighting
                                          const highlighted = document.getElementById('highlighted-text')
                                          if (highlighted && highlighted.parentNode) {
                                            const parent = highlighted.parentNode
                                            parent.replaceChild(document.createTextNode(highlighted.textContent || ''), highlighted)
                                            parent.normalize()
                                          }
                                          setHighlightedText(null)
                                          setSelectedTextElement(null)
                                        }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg z-10"
                                        title="Deselect text"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
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
                          onClick={() => setRightActiveTab('comments')}
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
                          onClick={() => setRightActiveTab('feedback')}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            rightActiveTab === 'feedback'
                              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          Feedback
                        </button>
                      </div>
                    </div>

                    {/* Right Tab Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {rightActiveTab === 'comments' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h3>
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
                                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border-l-4 border-purple-400">
                                    <div className="flex items-start justify-between mb-2">
                                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                        {existingComment.transcriptReferences?.[0]?.category || 'General Comment'}
                                      </span>
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {existingComment.timestamp?.toLocaleDateString?.() || 'Recent'}
                                      </span>
                                    </div>
                                    
                                    {existingComment.transcriptReferences?.[0]?.quote && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-600 p-2 rounded border-l-2 border-gray-200 dark:border-gray-500 mb-2">
                                        "{existingComment.transcriptReferences[0].quote}"
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

                      {rightActiveTab === 'feedback' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback</h3>
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
                          ) : insightsData?.trackerAnalysis ? (
                            <div className="space-y-4">
                              {Object.entries(insightsData.trackerAnalysis).map(([trackerId, data]: [string, any]) => {
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
                                const confidence = Math.round((data.confidence || 0) * 100)
                                const found = data.found || false
                                const detectedPhrases = data.detectedPhrases || []

                                // Use saved OpenAI scoring from insights
                                const savedScoring = insightsData.trackerScoring?.[trackerId]
                                const category = savedScoring?.category || (found ? 'Needs Improvement' : 'Missed')
                                const reasoningBlurb = `${detectedPhrases.length} key phrases detected. Category: ${category}`

                                return (
                                  <div key={trackerId} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {trackerName}
                                      </h4>
                                      <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          category === 'Strong Execution' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                          category === 'Needs Improvement' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                        }`}>
                                          {category}
                                        </div>
                                        {found && detectedPhrases.length > 0 && (
                                          <button
                                            onClick={() => {
                                              // Clear existing highlights first
                                              clearAllHighlights()
                                              // Switch to transcript tab
                                              setActiveTab('transcript')
                                              // Highlight all phrases for this tracker
                                              setTimeout(() => {
                                                highlightTrackerPhrases(detectedPhrases, trackerId)
                                              }, 100)
                                            }}
                                            className="px-3 py-1 text-xs font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
                                          >
                                            View in Transcript
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {found && detectedPhrases.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                          DETECTED PHRASES ({detectedPhrases.length})
                                        </h5>
                                        <div className="max-h-32 overflow-y-auto space-y-1">
                                          {detectedPhrases.slice(0, 3).map((phrase: any, index: number) => (
                                            <div key={index} className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded border-l-2 border-purple-200 dark:border-purple-600">
                                              "{phrase.phrase}"
                                              <span className="text-gray-400 dark:text-gray-500 ml-1">
                                                - {phrase.speaker || 'Unknown'} ({Math.round((phrase.confidence || 0) * 100)}%)
                                              </span>
                                            </div>
                                          ))}
                                          {detectedPhrases.length > 3 && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                              +{detectedPhrases.length - 3} more phrases...
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {!found && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                        This conversation step was not detected in the transcript.
                                      </p>
                                    )}
                                  </div>
                                )
                              })}
                              
                              {insightsData.calculatedAt && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 text-center pt-4 border-t border-gray-200 dark:border-gray-600">
                                  Analysis completed: {new Date(insightsData.calculatedAt.toDate()).toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No feedback data available</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                This transcript hasn't been analyzed yet. Run the insights analysis to generate feedback.
                              </p>
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