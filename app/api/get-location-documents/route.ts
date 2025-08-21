import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainId = searchParams.get('chainId')
    const locationId = searchParams.get('locationId')
    
    if (!chainId || !locationId) {
      return NextResponse.json({ error: 'chainId and locationId parameters are required' }, { status: 400 })
    }

    console.log(`🔍 API: Getting documents for location: ${chainId}/${locationId}`)
    
    // Get the location subcollection reference
    const locationRef = adminDb.collection('locations').doc(chainId).collection(locationId)
    
    // Get all documents in this location
    const locationSnap = await locationRef.get()
    
    const documents: string[] = []
    
    locationSnap.docs.forEach(doc => {
      documents.push(doc.id)
    })
    
    console.log(`📁 API: Found ${documents.length} documents in location ${locationId}`)
    
    return NextResponse.json({
      success: true,
      chainId,
      locationId,
      documents,
      totalDocuments: documents.length
    })
    
  } catch (error) {
    console.error('❌ API: Critical error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 