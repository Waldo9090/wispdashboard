// Test script for sentence classification
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testClassifyTranscript(transcriptText) {
  console.log('🧪 Testing sentence classification...');
  console.log('📄 Transcript:', transcriptText);
  
  // Split transcript into sentences
  const sentences = transcriptText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  console.log('📊 Total sentences to classify:', sentences.length);
  console.log('📝 Sentences:', sentences);

  if (sentences.length === 0) {
    console.log('⚠️ No sentences found - treating entire transcript as one sentence');
    sentences.push(transcriptText.trim());
  }

  const classifiedTranscript = [];
  const batchSize = 10;

  for (let i = 0; i < sentences.length; i += batchSize) {
    const batch = sentences.slice(i, i + batchSize);
    const currentBatch = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(sentences.length / batchSize);
    
    console.log(`🔄 Processing batch ${currentBatch}/${totalBatches}`);

    try {
      const prompt = `Classify each sentence into one of these tracker categories or 'none':
- introduction: Professional greeting, name introductions, welcoming patient
- rapport-building: Building personal connection, comfort checks, making patient feel at ease
- listening-to-concerns: Patient expressing concerns, objections, fears that need addressing
- overall-assessment: Comprehensive evaluation, holistic approach, big-picture analysis
- treatment-plan: Specific recommendations, treatment explanations, procedure options
- pricing-questions: Cost discussions, budget conversations, payment options
- follow-up-booking: Scheduling appointments, next steps, continuity planning

Sentences to classify:
${batch.map((s, idx) => `${i + idx + 1}. "${s.trim()}"`).join('\n')}

Respond with JSON array: [{"text": "sentence", "tracker": "category"}]`;

      console.log('📤 OpenAI Prompt:', prompt);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at classifying medical spa consultation sentences. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      console.log('📥 OpenAI Raw Response:', response.choices[0].message.content);

      const result = JSON.parse(response.choices[0].message.content || '[]');
      console.log('📋 Parsed Result:', result);
      
      // Handle different possible OpenAI response formats
      let classifications = [];
      if (Array.isArray(result)) {
        classifications = result;
      } else if (result.classifications && Array.isArray(result.classifications)) {
        classifications = result.classifications;
      } else {
        console.error('❌ Unexpected OpenAI response format:', result);
        classifications = [];
      }
      
      console.log('🏷️ Classifications:', classifications);

      // Add the classifications with proper format including metadata
      classifications.forEach((classification, idx) => {
        const sentenceIndex = i + idx;
        const sentence = batch[idx] || '';
        
        classifiedTranscript.push({
          text: classification.text || sentence.trim(),
          tracker: classification.tracker || 'none',
          confidence: 0.8, // Default confidence
          start: sentenceIndex * 1000, // Estimated start time in ms
          end: (sentenceIndex + 1) * 1000, // Estimated end time in ms
          timestamp: `${Math.floor(sentenceIndex * 1).toString().padStart(2, '0')}:${Math.floor((sentenceIndex * 1) % 60).toString().padStart(2, '0')}` // Estimated timestamp
        });
      });
      
      // If no classifications returned, add all sentences as 'none'
      if (classifications.length === 0) {
        console.log('⚠️ No classifications returned, marking all as none');
        batch.forEach((sentence, idx) => {
          const sentenceIndex = i + idx;
          classifiedTranscript.push({
            text: sentence.trim(),
            tracker: 'none',
            confidence: 0.8,
            start: sentenceIndex * 1000,
            end: (sentenceIndex + 1) * 1000,
            timestamp: `${Math.floor(sentenceIndex * 1).toString().padStart(2, '0')}:${Math.floor((sentenceIndex * 1) % 60).toString().padStart(2, '0')}`
          });
        });
      }
      
    } catch (error) {
      console.error(`❌ Error processing batch ${currentBatch}:`, error);
      // Add sentences as unclassified on error with proper format
      batch.forEach((sentence, idx) => {
        const sentenceIndex = i + idx;
        classifiedTranscript.push({
          text: sentence.trim(),
          tracker: 'none',
          confidence: 0.8,
          start: sentenceIndex * 1000,
          end: (sentenceIndex + 1) * 1000,
          timestamp: `${Math.floor(sentenceIndex * 1).toString().padStart(2, '0')}:${Math.floor((sentenceIndex * 1) % 60).toString().padStart(2, '0')}`
        });
      });
    }
  }

  console.log(`✅ Classification completed: ${classifiedTranscript.length} sentences processed`);
  console.log('📋 Final Result:');
  console.log(JSON.stringify(classifiedTranscript, null, 2));

  return {
    classifiedTranscript,
    totalSentences: sentences.length,
    success: true,
    extractionMethod: 'test-direct-processing'
  };
}

// Test cases
async function runTests() {
  console.log('🧪 Running Classification Tests\n');
  
  // Test 1: Medical spa consultation
  console.log('='.repeat(50));
  console.log('TEST 1: Medical Spa Consultation');
  console.log('='.repeat(50));
  await testClassifyTranscript("Hello, welcome to our clinic. What brings you in today? I'd like to recommend botox for your forehead. The cost would be $300. Would you like to schedule a follow-up appointment?");
  
  console.log('\n');
  
  // Test 2: Non-medical content (like your "Opponent Discussion")
  console.log('='.repeat(50));
  console.log('TEST 2: Non-Medical Content');
  console.log('='.repeat(50));
  await testClassifyTranscript("How did you hear about Google? I got botox at one office and then I didn't like some of the stuff that went on there.");
  
  console.log('\n');
  
  // Test 3: Empty/short content
  console.log('='.repeat(50));
  console.log('TEST 3: Short Content');
  console.log('='.repeat(50));
  await testClassifyTranscript("Hi there");
}

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testClassifyTranscript };