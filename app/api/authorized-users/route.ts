import { NextRequest, NextResponse } from 'next/server'
import { doc, collection, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Check if user is authorized (for API access control)
async function isAuthorizedUser(email: string): Promise<boolean> {
  try {
    const authorizedUsersRef = collection(db, 'authorizedUsers')
    const snapshot = await getDocs(authorizedUsersRef)
    
    const authorizedEmails = snapshot.docs.map(doc => doc.data().email)
    return authorizedEmails.includes(email)
  } catch (error) {
    console.error('Error checking authorization:', error)
    return false
  }
}

// GET - Fetch all authorized users
export async function GET(request: NextRequest) {
  try {
    const authorizedUsersRef = collection(db, 'authorizedUsers')
    const snapshot = await getDocs(authorizedUsersRef)
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching authorized users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch authorized users' },
      { status: 500 }
    )
  }
}

// POST - Add new authorized user
export async function POST(request: NextRequest) {
  try {
    const { email, invitedBy, role = 'user' } = await request.json()
    
    if (!email || !invitedBy) {
      return NextResponse.json(
        { error: 'Email and invitedBy are required' },
        { status: 400 }
      )
    }

    // Verify the person making the request is authorized
    const isInviterAuthorized = await isAuthorizedUser(invitedBy)
    if (!isInviterAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized to invite users' },
        { status: 403 }
      )
    }
    
    // Check if user already exists
    const userRef = doc(db, 'authorizedUsers', email)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      return NextResponse.json(
        { error: 'User is already authorized' },
        { status: 409 }
      )
    }
    
    // Add new authorized user
    await setDoc(userRef, {
      email,
      role,
      invitedBy,
      invitedAt: new Date().toISOString(),
      status: 'active'
    })
    
    return NextResponse.json({
      message: 'User authorized successfully',
      user: { email, role, invitedBy }
    })
    
  } catch (error) {
    console.error('Error adding authorized user:', error)
    return NextResponse.json(
      { error: 'Failed to add authorized user' },
      { status: 500 }
    )
  }
}

// DELETE - Remove authorized user
export async function DELETE(request: NextRequest) {
  try {
    const { email, removedBy } = await request.json()
    
    if (!email || !removedBy) {
      return NextResponse.json(
        { error: 'Email and removedBy are required' },
        { status: 400 }
      )
    }

    // Verify the person making the request is authorized
    const isRemoverAuthorized = await isAuthorizedUser(removedBy)
    if (!isRemoverAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized to remove users' },
        { status: 403 }
      )
    }
    
    // Remove user
    const userRef = doc(db, 'authorizedUsers', email)
    await deleteDoc(userRef)
    
    return NextResponse.json({
      message: 'User removed successfully'
    })
    
  } catch (error) {
    console.error('Error removing authorized user:', error)
    return NextResponse.json(
      { error: 'Failed to remove authorized user' },
      { status: 500 }
    )
  }
}