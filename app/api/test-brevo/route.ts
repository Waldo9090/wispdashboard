import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 [TEST BREVO] Starting Brevo configuration test')
    
    const BREVO_API_KEY = process.env.BREVO_API
    const FROM_EMAIL = process.env.FROM_EMAIL
    
    console.log('📋 [TEST BREVO] Environment variables:')
    console.log('- BREVO_API exists:', !!BREVO_API_KEY)
    console.log('- BREVO_API length:', BREVO_API_KEY?.length || 0)
    console.log('- FROM_EMAIL:', FROM_EMAIL || 'not set')
    
    if (!BREVO_API_KEY) {
      return NextResponse.json({
        success: false,
        message: 'BREVO_API not found in environment variables',
        debug: {
          hasApiKey: false,
          fromEmail: FROM_EMAIL || null
        }
      })
    }
    
    // Test Brevo API connection
    console.log('🔗 [TEST BREVO] Testing Brevo API connection...')
    
    const testResponse = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    })
    
    console.log('📡 [TEST BREVO] Brevo API response status:', testResponse.status)
    
    if (!testResponse.ok) {
      const errorData = await testResponse.text()
      console.error('❌ [TEST BREVO] Brevo API Error:', errorData)
      
      return NextResponse.json({
        success: false,
        message: 'Brevo API connection failed',
        debug: {
          status: testResponse.status,
          statusText: testResponse.statusText,
          error: errorData,
          hasApiKey: true,
          fromEmail: FROM_EMAIL
        }
      })
    }
    
    const accountData = await testResponse.json()
    console.log('✅ [TEST BREVO] Brevo API connection successful:', accountData)
    
    return NextResponse.json({
      success: true,
      message: 'Brevo configuration is working',
      debug: {
        hasApiKey: true,
        fromEmail: FROM_EMAIL,
        accountInfo: {
          email: accountData.email,
          firstName: accountData.firstName,
          lastName: accountData.lastName,
          companyName: accountData.companyName
        }
      }
    })
    
  } catch (error: any) {
    console.error('❌ [TEST BREVO] Error testing Brevo configuration:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error testing Brevo configuration',
      debug: {
        error: error.message,
        stack: error.stack
      }
    })
  }
}