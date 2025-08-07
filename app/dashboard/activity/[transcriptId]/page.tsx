"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, User, FileText, Calendar, MessageCircle, ChevronLeft, ChevronRight, BarChart3, Star, MessageSquare, Eye, Target, Play, Pause, SkipBack, SkipForward, RotateCcw, Volume2, Menu } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore"

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

export default function TranscriptDetailPage() {
  const [transcript, setTranscript] = useState<TimestampData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFullTranscript, setShowFullTranscript] = useState(false)
  const [comment, setComment] = useState('')
  const [highlightedText, setHighlightedText] = useState<{text: string, speaker: string, entryIndex: number, startIndex: number, endIndex: number} | null>(null)
  const [savingComment, setSavingComment] = useState(false)
  const [existingComments, setExistingComments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes' | 'ask'>('transcript')
  const [rightActiveTab, setRightActiveTab] = useState<'comments' | 'stats' | 'scoring' | 'feedback'>('comments')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  const { transcriptId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const loadTranscript = async () => {
      if (!transcriptId || !user) return

      try {
        setLoading(true)
        setError(null)

        // Search through all transcript document collections to find the transcript
        const transcriptRef = collection(db, "transcript")
        const transcriptSnap = await getDocs(transcriptRef)
        let foundTranscript: TimestampData | null = null

        for (const locationDoc of transcriptSnap.docs) {
          if (locationDoc.id !== 'name') {
            // Check timestamps subcollection
            const timestampsRef = collection(db, 'transcript', locationDoc.id, 'timestamps')
            const timestampDoc = await getDoc(doc(timestampsRef, transcriptId as string))
            
            if (timestampDoc.exists()) {
              const timestampData = timestampDoc.data()
              
              foundTranscript = {
                id: timestampDoc.id,
                audioURL: timestampData.audioURL || "",
                durationSeconds: timestampData.durationSeconds || 0,
                emoji: timestampData.emoji || "📝",
                name: timestampData.name || timestampData.transcriptName || "Untitled",
                transcriptName: timestampData.transcriptName,
                notes: timestampData.notes || "",
                speakerTranscript: timestampData.speakerTranscript || timestampData['speaker transcript'] || [],
                status: timestampData.status || "completed",
                timestamp: timestampData.timestamp,
                transcript: timestampData.transcript || "",
                transcriptDocumentId: locationDoc.id,
                locationId: locationDoc.id,
                salesPerformance: timestampData.salesPerformance
              }
              break
            }
          }
        }

        if (!foundTranscript) {
          setError("Transcript not found")
          return
        }

        setTranscript(foundTranscript)
        loadExistingComments(foundTranscript.transcriptDocumentId)
      } catch (err) {
        console.error("Error loading transcript:", err)
        setError("Failed to load transcript")
      } finally {
        setLoading(false)
      }
    }

    loadTranscript()
  }, [transcriptId, user])

  // Function to load existing comments from alerts collection
  const loadExistingComments = async (transcriptDocumentId?: string) => {
    if (!transcriptDocumentId || !user) return

    try {
      const alertsRef = collection(db, 'alerts')
      const alertsQuery = query(
        alertsRef,
        where('recordingId', '==', transcriptId),
        where('userEmail', '==', user.email)
      )
      const alertsSnap = await getDocs(alertsQuery)
      
      const comments = alertsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setExistingComments(comments)
    } catch (error) {
      console.error('Error loading existing comments:', error)
    }
  }

  // Function to save comment to alerts collection
  const saveComment = async () => {
    if (!comment.trim() || !highlightedText || !transcript || !user) {
      return
    }

    try {
      setSavingComment(true)
      
      const transcriptDocumentId = transcript.transcriptDocumentId
      if (!transcriptDocumentId) {
        console.error('❌ Could not find document ID for timestamp:', transcript.id)
        alert('Error: Could not determine transcript document ID')
        return
      }

      const alertId = `${transcriptDocumentId}_${transcript.id}_${Date.now()}`
      
      // Create alert document structure
      const alertDoc = {
        id: alertId,
        isRead: false,
        message: comment.trim(),
        recordingId: transcript.id,
        timestamp: new Date(),
        title: `Comment on ${transcript.name}`,
        transcriptReferences: [{
          context: "Speaker Comment",
          entryId: transcript.id,
          entryIndex: highlightedText.entryIndex,
          quote: highlightedText.text,
          speaker: highlightedText.speaker,
          category: "General Comment",
          highlightedPhrase: highlightedText.text,
          transcriptName: transcript.name,
          audioURL: transcript.audioURL || ''
        }],
        type: "warning",
        source: "DIRECT_SELECTION",
        userEmail: user.email || 'unknown',
        userName: user.displayName || 'Unknown User',
        transcriptDocumentId: transcriptDocumentId
      }

      // Save to alerts collection
      await addDoc(collection(db, 'alerts'), alertDoc)
      
      // Reset form
      setComment('')
      setHighlightedText(null)
      
      // Reload comments
      loadExistingComments(transcriptDocumentId)
    } catch (error) {
      console.error('❌ Error saving comment:', error)
      alert('Error saving comment. Please try again.')
    } finally {
      setSavingComment(false)
    }
  }

  // Audio player functions
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration)
    }
  }

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * duration
      audioRef.current.currentTime = newTime
    }
  }

  // Generate static waveform data 
  const generateWaveform = () => {
    // Static waveform pattern that looks realistic but doesn't change
    return [
      25, 32, 28, 45, 38, 22, 35, 42, 29, 18, 40, 36, 31, 48, 25, 33, 27, 44, 39, 21,
      37, 43, 30, 19, 41, 34, 26, 47, 32, 24, 38, 45, 28, 17, 42, 35, 29, 46, 33, 20,
      36, 44, 31, 23, 39, 48, 27, 16, 43, 34, 30, 45, 37, 25, 41, 28, 22, 47, 35, 18,
      40, 33, 32, 44, 38, 21, 36, 49, 29, 19, 42, 31, 26, 46, 34, 24, 39, 45, 30, 17,
      41, 37, 28, 48, 35, 20, 43, 32, 25, 44, 38, 22, 36, 47, 31, 18, 40, 34, 27, 45
    ]
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "No timestamp"
    
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString()
      }
      if (timestamp instanceof Date) {
        return timestamp.toLocaleString()
      }
      return new Date(timestamp).toLocaleString()
    } catch (err) {
      return "Invalid timestamp"
    }
  }

  const formatDuration = (seconds: number) => {
    const roundedSeconds = Math.floor(seconds)
    const hours = Math.floor(roundedSeconds / 3600)
    const minutes = Math.floor((roundedSeconds % 3600) / 60)
    const remainingSeconds = roundedSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Function to handle text selection in transcript
  const handleTextSelection = (text: string, speaker: string, entryIndex: number) => {
    const selection = window.getSelection()
    if (!selection || selection.toString().trim() === '') return

    const selectedText = selection.toString().trim()
    const fullText = text
    const startIndex = fullText.indexOf(selectedText)
    const endIndex = startIndex + selectedText.length

    if (startIndex !== -1) {
      setHighlightedText({
        text: selectedText,
        speaker: speaker,
        entryIndex: entryIndex,
        startIndex: startIndex,
        endIndex: endIndex
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transcript...</p>
        </div>
      </div>
    )
  }

  if (error || !transcript) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Transcript Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The requested transcript could not be found."}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{transcript.name}</h1>
                <p className="text-sm text-gray-500">{formatTimestamp(transcript.timestamp)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        {leftSidebarOpen && (
          <div className="w-[500px] bg-white border-r border-gray-200 flex flex-col">
            {/* Ask Anything Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Ask anything about this call</h3>
                <button
                  onClick={() => setLeftSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Close sidebar"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask anything about this call"
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveTab('ask')
                    }
                  }}
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-0">
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'transcript'
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Transcript
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'notes'
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Notes
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'transcript' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Conversation</h3>
                </div>

                {transcript?.speakerTranscript && transcript.speakerTranscript.length > 0 ? (
                  <div className="space-y-3">
                    {transcript.speakerTranscript.map((speaker, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-purple-600">
                              {speaker.speaker ? speaker.speaker.charAt(0).toUpperCase() : 'S'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900">{speaker.speaker || 'Speaker'}</p>
                              {speaker.timestamp && (
                                <span className="text-xs text-gray-500">{speaker.timestamp}</span>
                              )}
                            </div>
                            <p 
                              className="text-sm text-gray-600 cursor-text selection:bg-yellow-200"
                              onMouseUp={() => handleTextSelection(speaker.text, speaker.speaker, index)}
                            >
                              {highlightedText && highlightedText.entryIndex === index ? (
                                <>
                                  {speaker.text.substring(0, highlightedText.startIndex)}
                                  <span className="bg-yellow-200 text-gray-900">
                                    {highlightedText.text}
                                  </span>
                                  {speaker.text.substring(highlightedText.endIndex)}
                                </>
                              ) : (
                                speaker.text
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No transcript available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Meeting Notes</h3>
                </div>
                
                {transcript?.notes ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <div dangerouslySetInnerHTML={{
                        __html: transcript.notes
                          // Remove horizontal rules
                          .replace(/---+/g, '<hr class="my-4 border-gray-300" />')
                          // Convert headers to bold HTML (## first, then #)
                          .replace(/## ([^\n]+)/g, '<h4 class="text-base font-semibold text-gray-800 mt-3 mb-2">$1</h4>')
                          .replace(/# ([^\n]+)/g, '<h3 class="text-lg font-bold text-gray-900 mt-4 mb-2">$1</h3>')
                          // Convert bullet points
                          .replace(/^\* (.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
                          // Convert blockquotes
                          .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 my-2 italic text-gray-700">$1</blockquote>')
                          // Convert bold text
                          .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
                          // Convert line breaks and paragraphs
                          .split('\n\n')
                          .map(paragraph => {
                            if (paragraph.includes('<li')) {
                              return '<ul class="list-disc mb-3 ml-4">' + paragraph + '</ul>';
                            } else if (paragraph.includes('<h3') || paragraph.includes('<h4') || paragraph.includes('<blockquote') || paragraph.includes('<hr')) {
                              return paragraph;
                            } else if (paragraph.trim()) {
                              return '<p class="mb-2">' + paragraph.replace(/\n/g, '<br/>') + '</p>';
                            }
                            return '';
                          })
                          .join('')
                      }} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No notes available</p>
                  </div>
                )}

              </div>
            )}

            </div>
          </div>
        )}

        {/* Show Left Sidebar Button (when closed) - Just right of left sidebar */}
        {!leftSidebarOpen && (
          <button
            onClick={() => setLeftSidebarOpen(true)}
            className="fixed left-[504px] top-20 z-10 bg-white border border-gray-200 rounded-lg p-3 shadow-lg hover:shadow-xl transition-shadow"
            title="Open sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Audio Player Section */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">{transcript?.emoji || "📝"}</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{transcript?.name}</h2>
                  <p className="text-sm text-gray-500">{formatTimestamp(transcript?.timestamp)}</p>
                </div>
              </div>
              
              {transcript?.audioURL && (
                <div className="bg-gray-50 rounded-lg p-6">
                  {/* Hidden audio element */}
                  <audio 
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                  >
                    <source src={transcript.audioURL} type="audio/mpeg" />
                  </audio>
                  
                  {/* Waveform Visualization */}
                  <div className="mb-6">
                    <div 
                      className="flex items-end justify-center h-24 space-x-1 cursor-pointer bg-white rounded-lg p-4 border border-gray-200"
                      onClick={handleSeek}
                    >
                      {generateWaveform().map((height, index) => {
                        const progress = duration ? currentTime / duration : 0
                        const isPlayed = index < progress * generateWaveform().length
                        return (
                          <div
                            key={index}
                            className={`w-1 transition-colors duration-150 ${
                              isPlayed 
                                ? 'bg-purple-500' 
                                : 'bg-purple-200'
                            }`}
                            style={{ height: `${height}px` }}
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Audio Controls */}
                  <div className="flex items-center justify-center space-x-6">
                    {/* Rewind Button */}
                    <button
                      onClick={skipBackward}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      title="Rewind 15s"
                    >
                      <RotateCcw className="w-5 h-5 text-gray-600" />
                    </button>

                    {/* Skip Back Button */}
                    <button
                      onClick={skipBackward}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      title="Skip back"
                    >
                      <SkipBack className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Play/Pause Button */}
                    <button
                      onClick={togglePlay}
                      className="p-4 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-1" />
                      )}
                    </button>

                    {/* Skip Forward Button */}
                    <button
                      onClick={skipForward}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      title="Skip forward"
                    >
                      <SkipForward className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Fast Forward Button */}
                    <button
                      onClick={skipForward}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      title="Fast forward 15s"
                    >
                      <SkipForward className="w-5 h-5 text-gray-600" />
                    </button>

                    {/* Volume Button */}
                    <button
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      title="Volume"
                    >
                      <Volume2 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Time Display */}
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration || transcript.durationSeconds || 0)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Display Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Conversation Analysis</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Select content from the transcript on the left or view detailed analysis in the right panel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        {rightSidebarOpen && (
          <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col">
            {/* Right Tab Navigation */}
            <div className="border-b border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">Analysis</h3>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Close sidebar"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <nav className="flex flex-col space-y-0">
              <button
                onClick={() => setRightActiveTab('comments')}
                className={`flex items-center space-x-3 px-8 py-4 text-sm font-medium transition-colors border-r-2 ${
                  rightActiveTab === 'comments'
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Comments</span>
              </button>
              <button
                onClick={() => setRightActiveTab('stats')}
                className={`flex items-center space-x-3 px-8 py-4 text-sm font-medium transition-colors border-r-2 ${
                  rightActiveTab === 'stats'
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Stats</span>
              </button>
              <button
                onClick={() => setRightActiveTab('scoring')}
                className={`flex items-center space-x-3 px-8 py-4 text-sm font-medium transition-colors border-r-2 ${
                  rightActiveTab === 'scoring'
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Star className="w-5 h-5" />
                <span>Scoring</span>
              </button>
              <button
                onClick={() => setRightActiveTab('feedback')}
                className={`flex items-center space-x-3 px-8 py-4 text-sm font-medium transition-colors border-r-2 ${
                  rightActiveTab === 'feedback'
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Target className="w-5 h-5" />
                <span>Feedback</span>
              </button>
            </nav>
          </div>

          {/* Right Tab Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {rightActiveTab === 'comments' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                <p className="text-sm text-gray-500 mb-4">Private to your company</p>
                
                {/* Add Comment Form */}
                {highlightedText && (
                  <div className="border border-gray-200 rounded-lg p-4 mb-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Selected Text</h5>
                    <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400 mb-3">
                      "{highlightedText.text}" - {highlightedText.speaker}
                    </div>
                    
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add your thoughts..."
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      rows={3}
                    />
                    
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={saveComment}
                        disabled={!comment.trim() || !highlightedText || savingComment}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          !comment.trim() || !highlightedText || savingComment
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {savingComment ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setComment('')
                          setHighlightedText(null)
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                
                {!highlightedText && (
                  <p className="text-sm text-gray-400 italic mb-4">
                    Highlight text in the transcript to add a comment
                  </p>
                )}

                {/* Previous Comments */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-600">PREVIOUS ({existingComments.length})</h5>
                  </div>
                  
                  {existingComments.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {existingComments.map((existingComment, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg border-l-4 border-purple-400">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs text-purple-600 font-medium">
                              {existingComment.transcriptReferences?.[0]?.category || 'General Comment'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {existingComment.timestamp?.toDate ? existingComment.timestamp.toDate().toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          
                          {existingComment.transcriptReferences?.[0]?.quote && (
                            <div className="text-xs text-gray-500 bg-white p-2 rounded border-l-2 border-gray-200 mb-2">
                              "{existingComment.transcriptReferences[0].quote}"
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-700">
                            {existingComment.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No comments yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {rightActiveTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
                
                {/* Basic Stats */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Duration</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatDuration(transcript?.durationSeconds || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Speakers</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {transcript?.speakerTranscript ? new Set(transcript.speakerTranscript.map(s => s.speaker)).size : 0}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Entries</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {transcript?.speakerTranscript?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Date</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatTimestamp(transcript?.timestamp)?.split(',')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Analysis */}
                {transcript?.salesPerformance && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Performance Analysis</h4>
                    <div className="space-y-3">
                      {transcript.salesPerformance.overallGrade && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Overall Grade</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              transcript.salesPerformance.overallGrade === 'excellent' ? 'bg-green-100 text-green-800' :
                              transcript.salesPerformance.overallGrade === 'good' ? 'bg-blue-100 text-blue-800' :
                              transcript.salesPerformance.overallGrade === 'poor' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transcript.salesPerformance.overallGrade.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {transcript.salesPerformance.protocolScore !== undefined && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Protocol Score</span>
                            <span className="text-xl font-bold text-gray-900">{transcript.salesPerformance.protocolScore}</span>
                          </div>
                        </div>
                      )}

                      {transcript.salesPerformance.keyStrengths && transcript.salesPerformance.keyStrengths.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-green-800 mb-3">Key Strengths</h5>
                          <div className="flex flex-wrap gap-2">
                            {transcript.salesPerformance.keyStrengths.map((strength, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {transcript.salesPerformance.improvementAreas && transcript.salesPerformance.improvementAreas.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-red-800 mb-3">Areas for Improvement</h5>
                          <div className="flex flex-wrap gap-2">
                            {transcript.salesPerformance.improvementAreas.map((area, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {rightActiveTab === 'scoring' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Performance Scoring</h3>
                
                {transcript?.salesPerformance ? (
                  <div className="space-y-4">
                    {transcript.salesPerformance.overallGrade && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Overall Grade</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            transcript.salesPerformance.overallGrade === 'excellent' ? 'bg-green-100 text-green-800' :
                            transcript.salesPerformance.overallGrade === 'good' ? 'bg-blue-100 text-blue-800' :
                            transcript.salesPerformance.overallGrade === 'poor' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transcript.salesPerformance.overallGrade.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {transcript.salesPerformance.protocolScore !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Protocol Score</span>
                          <span className="text-2xl font-bold text-gray-900">{transcript.salesPerformance.protocolScore}</span>
                        </div>
                      </div>
                    )}

                    {transcript.salesPerformance.keyStrengths && transcript.salesPerformance.keyStrengths.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Key Strengths</h4>
                        <div className="space-y-1">
                          {transcript.salesPerformance.keyStrengths.map((strength, index) => (
                            <div key={index} className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                              {strength}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {transcript.salesPerformance.improvementAreas && transcript.salesPerformance.improvementAreas.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Areas for Improvement</h4>
                        <div className="space-y-1">
                          {transcript.salesPerformance.improvementAreas.map((area, index) => (
                            <div key={index} className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                              {area}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No scoring data available</p>
                  </div>
                )}
              </div>
            )}

            {rightActiveTab === 'feedback' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Feedback</h3>
                
                {transcript?.salesPerformance?.recommendations ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {transcript.salesPerformance.recommendations.split('•').map((rec, index) => (
                          rec.trim() && (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-blue-700">{rec.trim()}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>

                    {transcript.salesPerformance.protocolAdherence && transcript.salesPerformance.protocolAdherence.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-purple-800 mb-3">Protocol Adherence</h4>
                        <div className="space-y-2">
                          {transcript.salesPerformance.protocolAdherence.map((protocol, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-purple-700">{protocol}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No feedback available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Show Right Sidebar Button (when closed) */}
        {!rightSidebarOpen && (
          <button
            onClick={() => setRightSidebarOpen(true)}
            className="fixed right-4 top-20 z-10 bg-white border border-gray-200 rounded-lg p-3 shadow-lg hover:shadow-xl transition-shadow"
            title="Open sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  )
}