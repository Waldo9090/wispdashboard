import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    logger.info('=== TEST API ROUTE ===')
    logger.info('Testing Firebase Admin SDK...')
    
    // Test a simple Firestore operation
    const testRef = adminDb.collection('test').doc('test')
    await testRef.set({ 
      message: 'Firebase Admin SDK is working!',
      timestamp: new Date().toISOString()
    })
    
    logger.success('Firebase Admin SDK test successful!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firebase Admin SDK is working correctly',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Firebase Admin SDK test failed:', error)
    return NextResponse.json(
      { success: false, message: 'Firebase Admin SDK test failed', error: error },
      { status: 500 }
    )
  }
} 