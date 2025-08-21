"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestEmailPage() {
  const [email, setEmail] = useState('adimstuff@gmail.com')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const sendTestEmail = async () => {
    setLoading(true)
    setResult(null)
    
    console.log('🧪 [TEST PAGE] Starting test email send to:', email)
    
    try {
      const response = await fetch('/api/test-send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })
      
      console.log('🧪 [TEST PAGE] Response status:', response.status)
      console.log('🧪 [TEST PAGE] Response headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('🧪 [TEST PAGE] Response data:', data)
      setResult(data)
      
      if (data.success) {
        alert(`✅ Test email sent successfully to ${email}!\n\nMessage ID: ${data.messageId}\n\nCheck your inbox (and spam folder)!`)
      } else {
        // Enhanced error analysis
        let errorAnalysis = '🔍 ERROR ANALYSIS:\n\n'
        
        if (data.error && data.error.includes('Key not found')) {
          errorAnalysis += '❌ BREVO API KEY ISSUE:\n'
          errorAnalysis += '- Your API key is invalid or expired\n'
          errorAnalysis += '- Get a new key from: Brevo → Account → SMTP & API\n'
          errorAnalysis += '- Update BREVO_API in .env.local\n\n'
        }
        
        if (data.error && data.error.includes('unauthorized')) {
          errorAnalysis += '❌ AUTHORIZATION ISSUE:\n'
          errorAnalysis += '- Check if API key is correct\n'
          errorAnalysis += '- Verify account is active\n\n'
        }
        
        if (data.status === 400) {
          errorAnalysis += '❌ BAD REQUEST (400):\n'
          errorAnalysis += '- Check email format\n'
          errorAnalysis += '- Verify FROM_EMAIL is set\n\n'
        }
        
        if (data.status === 403) {
          errorAnalysis += '❌ FORBIDDEN (403):\n'
          errorAnalysis += '- FROM_EMAIL not verified in Brevo\n'
          errorAnalysis += '- Account limits exceeded\n\n'
        }
        
        const errorDetails = [
          `Message: ${data.message}`,
          data.error ? `Error: ${data.error}` : null,
          data.status ? `Status: ${data.status}` : null,
          data.testEmail ? `Test Email: ${data.testEmail}` : null,
          data.debug ? `Debug: ${JSON.stringify(data.debug, null, 2)}` : null
        ].filter(Boolean).join('\n')
        
        console.error('🧪 [TEST PAGE] Detailed error analysis:', {
          message: data.message,
          error: data.error,
          status: data.status,
          testEmail: data.testEmail,
          debug: data.debug
        })
        
        alert(`${errorAnalysis}RAW ERROR:\n${errorDetails}`)
      }
      
    } catch (error) {
      console.error('🧪 [TEST PAGE] Network/Parse Error:', error)
      const networkError = {
        success: false,
        message: 'Network or parsing error',
        error: error.message,
        stack: error.stack
      }
      setResult(networkError)
      alert(`❌ Network/Parse Error:\n\n${error.message}\n\nCheck browser console for details`)
    } finally {
      setLoading(false)
    }
  }

  const testBrevoConfig = async () => {
    setLoading(true)
    
    console.log('🔧 [CONFIG TEST] Testing Brevo configuration...')
    
    try {
      const response = await fetch('/api/test-brevo')
      console.log('🔧 [CONFIG TEST] Response status:', response.status)
      
      const data = await response.json()
      console.log('🔧 [CONFIG TEST] Response data:', data)
      
      if (data.success) {
        alert(`✅ Brevo configuration is working!\n\nAccount: ${data.debug?.accountInfo?.email}\nFrom Email: ${data.debug?.fromEmail}`)
      } else {
        let configAnalysis = '🔍 CONFIGURATION ANALYSIS:\n\n'
        
        if (!data.debug?.hasApiKey) {
          configAnalysis += '❌ MISSING API KEY:\n'
          configAnalysis += '- BREVO_API not found in environment\n'
          configAnalysis += '- Check .env.local file\n\n'
        }
        
        if (data.debug?.status === 401) {
          configAnalysis += '❌ UNAUTHORIZED (401):\n'
          configAnalysis += '- API key is invalid or expired\n'
          configAnalysis += '- Generate new key in Brevo dashboard\n\n'
        }
        
        if (data.debug?.status === 403) {
          configAnalysis += '❌ FORBIDDEN (403):\n'
          configAnalysis += '- Account suspended or limited\n'
          configAnalysis += '- Check account status in Brevo\n\n'
        }
        
        if (!data.debug?.fromEmail || data.debug?.fromEmail === 'not set') {
          configAnalysis += '⚠️ FROM_EMAIL ISSUE:\n'
          configAnalysis += '- FROM_EMAIL not set in .env.local\n'
          configAnalysis += '- This may cause email sending to fail\n\n'
        }
        
        console.error('🔧 [CONFIG TEST] Configuration error details:', data.debug)
        alert(`${configAnalysis}RAW ERROR:\n${data.message}\n\nDebug: ${JSON.stringify(data.debug, null, 2)}`)
      }
      
      setResult(data)
    } catch (error) {
      console.error('🔧 [CONFIG TEST] Network error:', error)
      alert(`❌ Network Error testing Brevo configuration:\n\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Email Testing Tool</CardTitle>
            <p className="text-sm text-gray-600">
              Test your Brevo email integration before using the main invitation system.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to test"
                className="w-full"
              />
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={sendTestEmail} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Sending...' : `Send Test Email to ${email}`}
              </Button>
              
              <Button 
                onClick={testBrevoConfig} 
                variant="outline" 
                disabled={loading}
              >
                Test Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
                {result.success ? '✅ Success' : '❌ Error'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">📋 Setup Checklist</CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700 space-y-2">
            <div>1. ✅ Add BREVO_API to .env.local</div>
            <div>2. ✅ Add FROM_EMAIL to .env.local</div>
            <div>3. ✅ Verify sender email in Brevo dashboard</div>
            <div>4. ✅ Restart your development server</div>
            <div>5. ✅ Test with the buttons above</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">🚀 Quick URLs</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <div>Test Brevo Config: <code className="bg-white px-2 py-1 rounded">GET /api/test-brevo</code></div>
            <div>Send Test Email: <code className="bg-white px-2 py-1 rounded">GET /api/test-send-email</code></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}