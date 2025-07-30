import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    logger.info('=== STARTED STATUS API ROUTE ===')
    
    const startedRef = adminDb.collection('started').doc('start')
    const startedSnap = await startedRef.get()
    
    if (startedSnap.exists) {
      const data = startedSnap.data()
      logger.info('Found /started/start document:', data)
      return NextResponse.json({ 
        exists: true, 
        data: data,
        done: data?.done || false
      })
    } else {
      logger.info('/started/start document does not exist')
      return NextResponse.json({ 
        exists: false, 
        data: null,
        done: false
      })
    }
  } catch (error) {
    logger.error('Error checking /started/start document:', error)
    return NextResponse.json(
      { error: 'Failed to check started status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('=== STARTED STATUS UPDATE API ROUTE ===')
    
    const body = await request.json()
    const { done, forcedAt, completedAt, createdAt, updatedAt } = body
    
    const startedRef = adminDb.collection('started').doc('start')
    
    const updateData: any = { done }
    if (forcedAt) updateData.forcedAt = forcedAt
    if (completedAt) updateData.completedAt = completedAt
    if (createdAt) updateData.createdAt = createdAt
    if (updatedAt) updateData.updatedAt = updatedAt
    
    await startedRef.set(updateData, { merge: true })
    
    logger.success(`Updated /started/start document with done: ${done}`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated /started/start document with done: ${done}` 
    })
  } catch (error) {
    logger.error('Error updating /started/start document:', error)
    return NextResponse.json(
      { error: 'Failed to update started status' },
      { status: 500 }
    )
  }
} 