import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { uids } = await request.json()

    console.log('🔍 [API] get-user-emails called with UIDs:', uids)

    if (!uids || !Array.isArray(uids)) {
      console.log('❌ [API] Invalid UIDs provided')
      return NextResponse.json({ 
        success: false, 
        message: 'UIDs array is required' 
      }, { status: 400 })
    }

    if (!auth) {
      console.log('❌ [API] Firebase Admin Auth not available')
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin Auth not available' 
      }, { status: 500 })
    }

    const emailMap: Record<string, string> = {}
    const errors: Record<string, string> = {}

    // Process UIDs in batches to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < uids.length; i += batchSize) {
      const batch = uids.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (uid: string) => {
        try {
          console.log(`🔍 [API] Looking up UID: ${uid}`)
          const userRecord = await auth.getUser(uid)
          
          if (userRecord.email) {
            emailMap[uid] = userRecord.email
            console.log(`✅ [API] Found email for ${uid}: ${userRecord.email}`)
          } else {
            errors[uid] = 'No email found'
            console.log(`⚠️ [API] No email found for UID: ${uid}`)
          }
        } catch (error: any) {
          console.error(`❌ [API] Error getting user ${uid}:`, error.message)
          errors[uid] = error.message || 'Unknown error'
        }
      }))
    }

    console.log('✅ [API] Successfully processed UIDs')
    console.log(`📊 [API] Found emails: ${Object.keys(emailMap).length}`)
    console.log(`❌ [API] Errors: ${Object.keys(errors).length}`)
    
    return NextResponse.json({
      success: true,
      emailMap,
      errors
    })

  } catch (error: any) {
    console.error('❌ [API] Error in get-user-emails:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}