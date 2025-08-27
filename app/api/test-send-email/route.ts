import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const testEmail = 'adimstuff@gmail.com'
  
  try {
    console.log('🧪 [TEST EMAIL] Starting test email send to:', testEmail)
    
    // Check environment variables
    const BREVO_API_KEY = process.env.BREVO_API
    const FROM_EMAIL = process.env.FROM_EMAIL
    
    console.log('🔑 [TEST EMAIL] Environment check:')
    console.log('- BREVO_API exists:', !!BREVO_API_KEY)
    console.log('- FROM_EMAIL:', FROM_EMAIL || 'not set')
    
    if (!BREVO_API_KEY) {
      return NextResponse.json({
        success: false,
        message: 'BREVO_API not found in environment variables'
      }, { status: 500 })
    }

    // Email content for test
    const subject = "TEST: You have been invited"
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">🧪 TEST EMAIL - You have been invited!</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              This is a test email to verify that the Brevo integration is working correctly.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              <strong>Sign in or Create an Account using ${testEmail}</strong>
            </p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                Use the email address <strong>${testEmail}</strong> to access your account.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                ⚠️ <strong>This is a test email</strong> - The invitation system is being tested.
              </p>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
              Sent at: ${new Date().toISOString()}<br>
              Test ID: ${Date.now()}
            </p>
          </div>
        </body>
      </html>
    `

    // Prepare email payload
    const emailPayload = {
      sender: {
        name: "Candytrail Platform (TEST)",
        email: FROM_EMAIL || "noreply@candytrail.com"
      },
      to: [{
        email: testEmail,
        name: "Test User"
      }],
      subject: subject,
      htmlContent: htmlContent
    }
    
    console.log('📤 [TEST EMAIL] Sending email payload:', JSON.stringify(emailPayload, null, 2))
    
    // Send email via Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    console.log('📡 [TEST EMAIL] Brevo response status:', brevoResponse.status)
    
    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text()
      console.error('❌ [TEST EMAIL] Brevo API Error:', errorData)
      
      return NextResponse.json({
        success: false,
        message: 'Failed to send test email',
        error: errorData,
        status: brevoResponse.status,
        testEmail: testEmail
      }, { status: 500 })
    }

    const result = await brevoResponse.json()
    console.log('✅ [TEST EMAIL] Email sent successfully:', result)

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      data: {
        messageId: result.messageId,
        testEmail: testEmail,
        sentAt: new Date().toISOString(),
        subject: subject
      }
    })

  } catch (error: any) {
    console.error('❌ [TEST EMAIL] Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      testEmail: testEmail
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  const targetEmail = email || 'adimstuff@gmail.com'
  
  try {
    console.log('🧪 [TEST EMAIL POST] Starting test email send to:', targetEmail)
    
    // Use the same logic as GET but with custom email
    const BREVO_API_KEY = process.env.BREVO_API
    const FROM_EMAIL = process.env.FROM_EMAIL
    
    if (!BREVO_API_KEY) {
      return NextResponse.json({
        success: false,
        message: 'BREVO_API not found'
      }, { status: 500 })
    }

    const subject = "TEST: You have been invited"
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">🧪 TEST EMAIL - You have been invited!</h2>
            <p><strong>Sign in or Create an Account using ${targetEmail}</strong></p>
            <p>This is a test email sent at ${new Date().toISOString()}</p>
          </div>
        </body>
      </html>
    `

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: "Candytrail Platform (TEST)",
          email: FROM_EMAIL || "noreply@candytrail.com"
        },
        to: [{
          email: targetEmail,
          name: "Test User"
        }],
        subject: subject,
        htmlContent: htmlContent
      })
    })

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text()
      return NextResponse.json({
        success: false,
        message: 'Failed to send email',
        error: errorData
      }, { status: 500 })
    }

    const result = await brevoResponse.json()
    return NextResponse.json({
      success: true,
      message: `Test email sent to ${targetEmail}`,
      messageId: result.messageId
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 })
  }
}