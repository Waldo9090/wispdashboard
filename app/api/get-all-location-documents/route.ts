import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainId = searchParams.get('chainId')

    console.log('🔍 [API] get-all-location-documents called with chainId:', chainId)

    if (!chainId) {
      console.log('❌ [API] No chainId provided')
      return NextResponse.json({ 
        success: false, 
        message: 'Chain ID is required' 
      }, { status: 400 })
    }

    // Get all locations for the chain - FIXED PATH
    console.log('📍 [API] Fetching locations for chain:', chainId)
    const locationsRef = db.collection('locations').doc(chainId)
    const locationsSnap = await locationsRef.get()
    
    if (!locationsSnap.exists) {
      console.log('⚠️ [API] Chain document not found:', chainId)
      return NextResponse.json({ 
        success: true, 
        documents: [],
        locationMap: {}
      })
    }
    
    // Get all subcollections (locations) under the chain
    const locations = await locationsRef.listCollections()
    console.log('📍 [API] Found', locations.length, 'location subcollections:', locations.map((loc: any) => loc.id))
    
    if (locations.length === 0) {
      console.log('⚠️ [API] No location subcollections found for chain:', chainId)
      return NextResponse.json({ 
        success: true, 
        documents: [],
        locationMap: {}
      })
    }

    const allDocuments: string[] = []
    const locationMap: { [docId: string]: { locationId: string, locationName: string } } = {}

    // Process each location subcollection
    for (const locationRef of locations) {
      const locationId = locationRef.id
      const locationName = locationId // Use the subcollection ID as the location name

      console.log('🏢 [API] Processing location:', locationId, '(', locationName, ')')

      try {
        // Get all documents in this location subcollection
        const documentsRef = db.collection('locations').doc(chainId).collection(locationId)
        const documentsSnap = await documentsRef.get()
        
        console.log('📄 [API] Found', documentsSnap.size, 'documents in location:', locationId)
        
        documentsSnap.docs.forEach((doc: any) => {
          const docId = doc.id
          if (docId !== 'name') { // Skip the name document
            allDocuments.push(docId)
            locationMap[docId] = {
              locationId: locationId,
              locationName: locationName
            }
            console.log('📋 [API] Added document:', docId, 'from location:', locationName)
          }
        })
      } catch (error) {
        console.error(`❌ [API] Error getting documents for location ${locationId}:`, error)
        // Continue with other locations even if one fails
      }
    }

    console.log('✅ [API] Successfully processed all locations')
    console.log('📊 [API] Total documents found:', allDocuments.length)
    console.log('🗺️ [API] Location map created with', Object.keys(locationMap).length, 'entries')
    
    return NextResponse.json({
      success: true,
      documents: allDocuments,
      locationMap: locationMap
    })

  } catch (error) {
    console.error('❌ [API] Error in get-all-location-documents:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
} 