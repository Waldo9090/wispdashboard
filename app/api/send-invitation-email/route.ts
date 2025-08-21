import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [EMAIL API] Starting email send process')
    const { email, invitedBy } = await request.json()
    console.log('📧 [EMAIL API] Request data:', { email, invitedBy })

    if (!email) {
      console.error('❌ [EMAIL API] No email provided')
      return NextResponse.json({ 
        success: false, 
        message: 'Email is required' 
      }, { status: 400 })
    }

    // Brevo API configuration
    const BREVO_API_KEY = process.env.BREVO_API
    const FROM_EMAIL = process.env.FROM_EMAIL
    
    console.log('🔑 [EMAIL API] Environment check:')
    console.log('- BREVO_API exists:', !!BREVO_API_KEY)
    console.log('- FROM_EMAIL:', FROM_EMAIL || 'not set')
    
    if (!BREVO_API_KEY) {
      console.error('❌ [EMAIL API] BREVO_API not found in environment variables')
      return NextResponse.json({ 
        success: false, 
        message: 'Email service not configured - missing BREVO_API key' 
      }, { status: 500 })
    }

    // Email content
    const subject = "You have been invited to Candytrail"
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">You have been invited!</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              You have been invited to join Candytrail.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              <strong>Sign in or Create an Account using ${email} to access your account <a href="https://candytrail.ai/signin" style="color: #2563eb; text-decoration: none;">here</a></strong>
            </p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                Use the email address <strong>${email}</strong> to access your account.
              </p>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
              If you have any questions, please contact your administrator.
            </p>
          </div>
        </body>
      </html>
    `

    // Prepare email payload
    const emailPayload = {
      sender: {
        name: "Candytrail Platform",
        email: FROM_EMAIL || "noreply@candytrail.com"
      },
      to: [{
        email: email,
        name: email.split('@')[0] // Use part before @ as name
      }],
      subject: subject,
      htmlContent: htmlContent
    }
    
    console.log('📤 [EMAIL API] Sending email payload:', JSON.stringify(emailPayload, null, 2))
    
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

    console.log('📡 [EMAIL API] Brevo response status:', brevoResponse.status)
    console.log('📡 [EMAIL API] Brevo response headers:', Object.fromEntries(brevoResponse.headers.entries()))
    
    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text()
      console.error('❌ [EMAIL API] Brevo API Error:')
      console.error('- Status:', brevoResponse.status)
      console.error('- Status Text:', brevoResponse.statusText)
      console.error('- Error Data:', errorData)
      
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send invitation email',
        error: errorData,
        status: brevoResponse.status
      }, { status: 500 })
    }

    const result = await brevoResponse.json()
    console.log('✅ [EMAIL API] Email sent successfully via Brevo:', result)

    return NextResponse.json({
      success: true,
      message: 'Invitation email sent successfully',
      messageId: result.messageId
    })

  } catch (error: any) {
    console.error('❌ [EMAIL API] Error sending invitation email:')
    console.error('- Error message:', error.message)
    console.error('- Error stack:', error.stack)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    }, { status: 500 })
  }
}