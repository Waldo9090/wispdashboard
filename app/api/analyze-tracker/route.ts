import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('\n' + '='.repeat(80))
  console.log('🚀 [ANALYZE-TRACKER] API Route Called')
  console.log('⏰ Timestamp:', new Date().toISOString())
  
  try {
    const { trackerId, detectedPhrases, fullTranscript } = await request.json()
    
    console.log('📋 Tracker ID:', trackerId)
    console.log('📝 Detected phrases count:', detectedPhrases?.length || 0)
    console.log('📄 Full transcript length:', fullTranscript?.length || 0)

    // Debug: Check environment variables
    console.log('🔍 Environment check:')
    console.log('  - NODE_ENV:', process.env.NODE_ENV)
    console.log('  - Has OPENAI_API_KEY:', !!process.env.OPENAI_API_KEY)
    console.log('  - API Key length:', process.env.OPENAI_API_KEY?.length || 0)
    console.log('  - API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 7) || 'none')

    // Debug: Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY environment variable not found')
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          details: 'OPENAI_API_KEY environment variable is missing. Please add it to your .env.local file.'
        },
        { status: 500 }
      )
    }

    console.log('✅ OpenAI API Key found and validated')
    console.log('🔍 Analyzing tracker:', trackerId, 'with', detectedPhrases.length, 'phrases')

    const trackerDescriptions: Record<string, string> = {
      'introduction': 'Professional greeting, introductions, and welcoming the patient to establish initial rapport',
      'rapport-building': 'Building personal connection, asking about comfort, experience, and making the patient feel at ease',
      'listening-to-concerns': 'Actively listening to patient concerns, using mirrors or visual aids, understanding their goals and worries',
      'facial-assessment': 'Conducting thorough facial and skin assessment, examining areas of concern, professional evaluation',
      'treatment-plan': 'Developing and explaining customized treatment recommendations, procedure options, and approach',
      'pricing-questions': 'Transparent discussion of costs, pricing, payment options, and investment in treatment',
      'follow-up-booking': 'Scheduling next appointments, explaining next steps, and ensuring care continuity'
    }

    const prompt = `You are an expert med spa consultation analyzer. Analyze the following conversation for the "${trackerDescriptions[trackerId]}" step.

DETECTED PHRASES:
${detectedPhrases.map((p: any) => `- "${p.phrase}" (${p.speaker})`).join('\n')}

FULL TRANSCRIPT CONTEXT:
${fullTranscript.substring(0, 1000)}...

Based on the detected phrases and conversation context, classify this tracker step as one of:

1. **Strong Execution** - Excellent performance, multiple quality interactions, professional approach
2. **Needs Improvement** - Present but could be enhanced, missing some key elements  
3. **Missed** - Not adequately addressed or completely absent

Provide your response in this exact JSON format:
{
  "category": "[Strong Execution|Needs Improvement|Missed]",
  "reasoning": "Explain why this category was selected and provide specific actionable coaching feedback on how the consultation can be improved for this step"
}

Be specific about what was observed and provide actionable coaching feedback.`

    console.log('🌐 Making OpenAI API call...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert med spa consultation coach. Analyze conversations and provide actionable feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    })

    console.log('📡 OpenAI Response Status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ OpenAI API Error Details:')
      console.error('   Status:', response.status)
      console.error('   Status Text:', response.statusText)
      console.error('   Error Body:', errorText)
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    console.log('✅ OpenAI Response Content:', content)

    try {
      const parsed = JSON.parse(content)
      console.log('✅ Successfully parsed JSON response')
      console.log('📊 Final Result - Category:', parsed.category)
      console.log('💭 Final Result - Reasoning:', parsed.reasoning.substring(0, 100) + '...')
      
      return NextResponse.json({
        category: parsed.category,
        reasoning: parsed.reasoning
      })
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      console.error('📄 Raw Content:', content)
      
      return NextResponse.json({
        category: detectedPhrases.length > 0 ? 'Needs Improvement' : 'Missed',
        reasoning: content || 'Unable to parse OpenAI response properly.'
      })
    }

  } catch (error) {
    console.error('❌ [ANALYZE-TRACKER] Fatal Error:', error)
    console.error('❌ Error Type:', typeof error)
    if (error instanceof Error) {
      console.error('❌ Error Message:', error.message)
      console.error('❌ Error Stack:', error.stack)
    }
    console.log('='.repeat(80) + '\n')
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze tracker',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}