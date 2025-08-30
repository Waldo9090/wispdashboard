import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log to terminal
    console.log('🔍 [DEBUG-LOG] Received:', JSON.stringify(body, null, 2))
    
    return NextResponse.json({ success: true, logged: true })
  } catch (error) {
    console.error('❌ [DEBUG-LOG] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
