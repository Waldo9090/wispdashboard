"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { Building2, MapPin, Users, ArrowLeft, MessageSquare, Calendar, Clock } from "lucide-react"

interface Location {
  id: string
  name: string
  address?: string
  transcriptCount: number
  lastActivity?: string
}

interface Transcript {
  id: string
  name: string
  timestamp: any
  userEmail: string
  audioURL?: string
}

export default function ChainLocations() {
  const params = useParams()
  const chainId = params.chainId as string
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTranscripts, setLoadingTranscripts] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const loadLocations = async () => {
      try {
        console.log(`🔍 Loading locations for chain: ${chainId}`)
        
        // Get all location documents from the chain subcollection
        const locationsRef = collection(db, 'locations', chainId)
        const locationsSnap = await getDocs(locationsRef)
        
        const locationsData: Location[] = []
        
        for (const locationDoc of locationsSnap.docs) {
          const locationId = locationDoc.id
          const locationData = locationDoc.data()
          
          console.log(`📋 Found location: ${locationId}`, locationData)
          
          // Get transcript count for this location
          const transcriptsRef = collection(db, 'locations', chainId, locationId)
          const transcriptsSnap = await getDocs(transcriptsRef)
          
          locationsData.push({
            id: locationId,
            name: locationData.name || locationId,
            address: locationData.address,
            transcriptCount: transcriptsSnap.size,
            lastActivity: locationData.lastActivity
          })
          
          console.log(`📄 Location ${locationId} has ${transcriptsSnap.size} transcripts`)
        }
        
        console.log('✅ Loaded locations:', locationsData)
        setLocations(locationsData)
      } catch (error) {
        console.error('❌ Error loading locations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && chainId) {
      loadLocations()
    }
  }, [user, chainId])

  const loadTranscripts = async (locationId: string) => {
    try {
      setLoadingTranscripts(true)
      console.log(`📄 Loading transcripts for location: ${locationId}`)
      
      // Get all transcript documents from the location subcollection
      const transcriptsRef = collection(db, 'locations', chainId, locationId)
      const transcriptsSnap = await getDocs(transcriptsRef)
      
      const transcriptsData: Transcript[] = []
      
      for (const transcriptDoc of transcriptsSnap.docs) {
        const transcriptId = transcriptDoc.id
        const transcriptData = transcriptDoc.data()
        
        console.log(`📋 Found transcript: ${transcriptId}`, transcriptData)
        
        transcriptsData.push({
          id: transcriptId,
          name: transcriptData.name || 'Untitled',
          timestamp: transcriptData.timestamp,
          userEmail: transcriptData.userEmail || transcriptId,
          audioURL: transcriptData.audioURL
        })
      }
      
      console.log('✅ Loaded transcripts:', transcriptsData)
      setTranscripts(transcriptsData)
      setSelectedLocation(locationId)
    } catch (error) {
      console.error('❌ Error loading transcripts:', error)
    } finally {
      setLoadingTranscripts(false)
    }
  }

  const handleLocationSelect = (locationId: string) => {
    console.log('🎯 Selected location:', locationId)
    loadTranscripts(locationId)
  }

  const handleTranscriptClick = (transcriptId: string) => {
    console.log('🎯 Selected transcript:', transcriptId)
    // Navigate to the transcript detail page or dashboard
    router.push(`/dashboard?transcript=${transcriptId}&chain=${chainId}&location=${selectedLocation}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/choose-chain')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chains
              </Button>
              <Building2 className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{chainId} Locations</h1>
                <p className="text-sm text-gray-600">View locations and conversation transcripts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{user?.displayName || user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Locations Panel */}
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Locations</h2>
              <p className="text-gray-600">Select a location to view its transcripts</p>
            </div>

            {locations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Locations Found</h3>
                  <p className="text-gray-600">No locations are currently available for this chain.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {locations.map((location) => (
                  <Card 
                    key={location.id} 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedLocation === location.id 
                        ? 'ring-2 ring-purple-500 bg-purple-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleLocationSelect(location.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {location.name}
                        </CardTitle>
                        <Badge variant="secondary">
                          {location.transcriptCount} transcript{location.transcriptCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {location.address && (
                        <p className="text-sm text-gray-600 mb-3">{location.address}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{location.transcriptCount} conversations</span>
                        </div>
                        {location.lastActivity && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Last: {new Date(location.lastActivity).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Transcripts Panel */}
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedLocation ? `${locations.find(l => l.id === selectedLocation)?.name} Transcripts` : 'Transcripts'}
              </h2>
              <p className="text-gray-600">
                {selectedLocation 
                  ? 'Select a transcript to view details' 
                  : 'Select a location to view its transcripts'
                }
              </p>
            </div>

            {!selectedLocation ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Location Selected</h3>
                  <p className="text-gray-600">Choose a location from the left panel to view transcripts.</p>
                </CardContent>
              </Card>
            ) : loadingTranscripts ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-700 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading transcripts...</p>
                </CardContent>
              </Card>
            ) : transcripts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Transcripts Found</h3>
                  <p className="text-gray-600">No transcripts are available for this location.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {transcripts.map((transcript) => (
                  <Card 
                    key={transcript.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={() => handleTranscriptClick(transcript.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">{transcript.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {transcript.id}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {transcript.timestamp?.toDate?.()?.toLocaleDateString() || 'Recent'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{transcript.userEmail}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 