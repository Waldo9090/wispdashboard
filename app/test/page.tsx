"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestPage() {
  const [transcript, setTranscript] = useState('')
  const [personId, setPersonId] = useState('ICFiWTkD4YdB3xABZFlUq7Nlcz62')
  const [transcriptId, setTranscriptId] = useState('C9A982D2-C618-4A89-AB1D-3BE8028DCC98')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingTranscript, setFetchingTranscript] = useState(false)
  const [error, setError] = useState('')

  const fetchTranscript = async () => {
    if (!personId.trim() || !transcriptId.trim()) {
      setError('Please enter both Person ID and Transcript ID')
      return
    }

    setFetchingTranscript(true)
    setError('')

    try {
      const response = await fetch('/api/fetch-transcript-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: personId,
          transcriptId: transcriptId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.status}`)
      }

      const data = await response.json()
      if (data.transcript) {
        setTranscript(data.transcript)
        console.log('✅ Transcript fetched successfully')
      } else {
        throw new Error('No transcript field found in document')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch transcript')
    } finally {
      setFetchingTranscript(false)
    }
  }

  const runTest = async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript to test')
      return
    }

    if (!personId.trim() || !transcriptId.trim()) {
      setError('Please enter both Person ID and Transcript ID to save insights')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/process-transcript-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptId: transcriptId,
          personId: personId
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      setResults(data.insightsData)
      console.log('✅ Insights processed and saved to Firestore')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getTrackerColor = (tracker: string) => {
    const colors: Record<string, string> = {
      'introduction': 'bg-blue-100 text-blue-800 border-blue-200',
      'rapport-building': 'bg-green-100 text-green-800 border-green-200',
      'listening-to-concerns': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'overall-assessment': 'bg-purple-100 text-purple-800 border-purple-200',
      'treatment-plan': 'bg-pink-100 text-pink-800 border-pink-200',
      'pricing-questions': 'bg-orange-100 text-orange-800 border-orange-200',
      'follow-up-booking': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'none': 'bg-gray-100 text-gray-600 border-gray-200'
    }
    return colors[tracker] || colors['none']
  }

  const getTrackerStats = () => {
    if (!results?.trackerByPhrases) return {}
    
    const stats: Record<string, number> = {}
    results.trackerByPhrases.forEach((item: any) => {
      const tracker = item.tracker || 'none'
      stats[tracker] = (stats[tracker] || 0) + 1
    })
    
    return stats
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">TrackerByPhrases API Test</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Input Transcript</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Person ID</label>
                  <input
                    type="text"
                    value={personId}
                    onChange={(e) => setPersonId(e.target.value)}
                    placeholder="ICFiWTkD4YdB3xABZFlUq7Nlcz62"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transcript ID</label>
                  <input
                    type="text"
                    value={transcriptId}
                    onChange={(e) => setTranscriptId(e.target.value)}
                    placeholder="C9A982D2-C618-4A89-AB1D-3BE8028DCC98"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <Button
                onClick={fetchTranscript}
                disabled={fetchingTranscript || !personId.trim() || !transcriptId.trim()}
                variant="outline"
                className="w-full"
              >
                {fetchingTranscript ? 'Fetching...' : 'Fetch Transcript from Firestore'}
              </Button>
              
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Transcript will appear here after fetching, or enter manually..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              <div className="flex gap-4">
                <Button 
                  onClick={runTest}
                  disabled={loading || !transcript.trim() || !personId.trim() || !transcriptId.trim()}
                  className="flex-1"
                >
                  {loading ? 'Processing & Saving...' : 'Process & Save to Insights'}
                </Button>
                
                <Button
                  onClick={() => {
                    setTranscript('')
                    setResults(null)
                    setError('')
                  }}
                  variant="outline"
                >
                  Clear
                </Button>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Classification Results</h2>
            
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Processing sentences...</span>
              </div>
            )}
            
            {results && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Total Sentences: {results.trackerByPhrases?.length || 0}
                  </p>
                  <p className="text-xs text-green-600 mb-3">
                    ✅ Saved to: insights/{personId}/timestamps/{transcriptId}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(getTrackerStats()).map(([tracker, count]) => (
                      <div key={tracker} className={`px-2 py-1 rounded ${getTrackerColor(tracker)}`}>
                        {tracker.replace(/-/g, ' ')}: {count}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Classified Sentences */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {results.trackerByPhrases.map((item: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTrackerColor(item.tracker)}`}>
                          {item.tracker === 'none' ? 'NONE' : item.tracker.replace(/-/g, ' ').toUpperCase()}
                        </span>
                        <div className="text-xs text-gray-500">
                          {item.timestamp} | {Math.round((item.confidence || 0) * 100)}%
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-1">"{item.text}"</p>
                      
                      <p className="text-xs text-gray-500 italic">
                        {item.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!loading && !results && (
              <div className="text-center py-8 text-gray-500">
                Enter a transcript and click "Run TrackerByPhrases API" to see results
              </div>
            )}
          </div>

          {/* Firestore Format Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Firestore Structure</h2>
            
            <div className="space-y-4">
              {/* Collection Path */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Collection Path</h3>
                <code className="text-sm text-blue-800 break-all">
                  insights/kOqmWFBtBVUKKTucoES60TVVDU32/timestamps/E4F4-2E3F-4563-9548-3E8591CE72BB
                </code>
                <p className="text-xs text-blue-700 mt-2">
                  insights/&lt;personId&gt;/timestamps/&lt;transcriptId&gt;
                </p>
              </div>

              {/* Document Structure */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Document Structure</h3>
                <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`{
  "trackerAnalysis": {
    "introduction": {
      "found": true,
      "confidence": 85,
      "detectedPhrases": [...],
      "evidence": "AI extracted 3 phrases"
    },
    "rapport-building": {...},
    // ... other trackers
  },
  "trackerScoring": {
    "introduction": {
      "category": "Strong Execution",
      "confidence": 85,
      "phraseCount": 3
    },
    // ... other trackers
  },
  "trackerByPhrases": [
    {
      "confidence": 0.95,
      "end": 6000,
      "start": 0,
      "text": "Good morning!",
      "timestamp": "00:00",
      "tracker": "introduction",
      "reasoning": "Professional greeting"
    },
    {
      "confidence": 0.1,
      "end": 12000,
      "start": 6000,
      "text": "The weather is nice.",
      "timestamp": "00:06",
      "tracker": "none",
      "reasoning": "General conversation"
    }
    // ... all other sentences
  ],
  "extractionMethod": "openai-batch-processing",
  "tokensUsed": 1234,
  "costEstimate": 0.056,
  "calculatedAt": "2025-08-16T23:23:45.123Z",
  "transcriptId": "E4F4-2E3F-4563-9548...",
  "personId": "kOqmWFBtBVUKKTucoES60..."
}`}
                </pre>
              </div>

              {/* Key Fields */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Key Field: trackerByPhrases</h3>
                <p className="text-sm text-green-800 mb-2">
                  Array containing every sentence classified by tracker
                </p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• <strong>tracker</strong>: "introduction" | "rapport-building" | ... | "none"</li>
                  <li>• <strong>text</strong>: Full sentence from transcript</li>
                  <li>• <strong>confidence</strong>: AI classification confidence (0.0-1.0)</li>
                  <li>• <strong>timestamp</strong>: Approximate timing in MM:SS format</li>
                  <li>• <strong>reasoning</strong>: Why this tracker was assigned</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}