import { NextRequest, NextResponse } from 'next/server'
import { adminDb, isFirebaseAdminAvailable } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [API] get-locations route called')
    
    const { searchParams } = new URL(request.url)
    const chainId = searchParams.get('chainId')
    
    console.log('🔍 [API] chainId parameter:', chainId)
    
    if (!chainId) {
      console.error('❌ [API] Missing chainId parameter')
      return NextResponse.json({ error: 'chainId parameter is required' }, { status: 400 })
    }

    console.log(`🔍 [API] Getting locations for chain: ${chainId}`)
    
    // Check if Firebase Admin is available with detailed logging
    console.log('🔍 [API] Checking Firebase Admin availability...')
    console.log('🔍 [API] isFirebaseAdminAvailable():', isFirebaseAdminAvailable())
    console.log('🔍 [API] adminDb:', adminDb ? 'Available' : 'Not Available')
    
    if (!isFirebaseAdminAvailable() || !adminDb) {
      console.error('❌ [API] Firebase Admin not available')
      console.error('❌ [API] adminDb state:', adminDb)
      console.error('❌ [API] isFirebaseAdminAvailable():', isFirebaseAdminAvailable())
      return NextResponse.json({ 
        error: 'Database connection not available',
        details: 'Firebase Admin SDK not properly initialized',
        debug: {
          adminDb: adminDb ? 'Available' : 'Not Available',
          isAvailable: isFirebaseAdminAvailable()
        }
      }, { status: 503 })
    }
    
    console.log('✅ [API] Firebase Admin is available')
    
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
    console.error('❌ [API] Critical error in get-locations:', error)
    console.error('❌ [API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ [API] Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ [API] Error type:', typeof error)
    console.error('❌ [API] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    
    // Ensure we always return valid JSON
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: '/api/get-locations'
    }
    
    console.error('❌ [API] Returning error response:', errorResponse)
    
    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
} 