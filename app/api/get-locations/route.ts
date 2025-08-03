import { NextRequest, NextResponse } from 'next/server'
import { adminDb, isFirebaseAdminAvailable } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainId = searchParams.get('chainId')
    
    if (!chainId) {
      return NextResponse.json({ error: 'chainId parameter is required' }, { status: 400 })
    }

    console.log(`🔍 API: Getting locations for chain: ${chainId}`)
    
    // Check if Firebase Admin is available
    if (!isFirebaseAdminAvailable() || !adminDb) {
      console.error('❌ API: Firebase Admin not available')
      return NextResponse.json({ 
        error: 'Database connection not available',
        details: 'Firebase Admin SDK not properly initialized'
      }, { status: 503 })
    }
    
    // Get the chain document reference
    const chainDocRef = adminDb.collection('locations').doc(chainId)
    
    // Check if the chain document exists
    const chainDoc = await chainDocRef.get()
    if (!chainDoc.exists) {
      ////console.log(`❌ API: Chain document /locations/${chainId} does not exist`)
      return NextResponse.json({ error: `Chain '${chainId}' not found` }, { status: 404 })
    }
    
    ////console.log(`✅ API: Chain document /locations/${chainId} exists`)
    
    // List all subcollections (locations) under this chain
    const subcollections = await chainDocRef.listCollections()
    ////console.log(`📁 API: Found ${subcollections.length} subcollections`)
    
    const locations = []
    
    // For each subcollection (location), get the name from the /name document
    for (const subcollection of subcollections) {
      const locationId = subcollection.id
      ////console.log(`📋 API: Processing location: ${locationId}`)
      
      try {
        // Get the name document: /locations/{chainId}/{locationId}/name
        const nameDocRef = chainDocRef.collection(locationId).doc('name')
        const nameDoc = await nameDocRef.get()
        


        let locationName = locationId // fallback to ID if no name document
        
        if (nameDoc.exists) {
          const nameData = nameDoc.data()
          locationName = nameData?.name || locationId
          //////console.log(`✅ API: Got name for ${locationId}: "${locationName}"`)
        } else {
          //////console.log(`⚠️ API: No name document found for ${locationId}, using ID as name`)
        }
        
        // Count transcripts in this location
        const transcriptsSnap = await subcollection.get()
        const transcriptCount = transcriptsSnap.size
        
        //////console.log(`📊 API: Found ${transcriptCount} transcripts in ${locationId}`)
        
        locations.push({
          id: locationId,
          name: locationName,
          transcriptCount
        })
        
      } catch (error) {
        console.error(`❌ API: Error processing location ${locationId}:`, error)
        // Continue with other locations even if one fails
      }
    }
    
    ////console.log(`📋 API: Final locations data:`, locations)
    
    return NextResponse.json({
      success: true,
      chainId,
      locations,
      totalLocations: locations.length,
      totalTranscripts: locations.reduce((sum, loc) => sum + loc.transcriptCount, 0)
    })
    
  } catch (error) {
    console.error('❌ API: Critical error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 