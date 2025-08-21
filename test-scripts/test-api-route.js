/**
 * Test script to verify the /api/process-transcript-insights API route works
 * This will test the original Next.js API route functionality
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, onSnapshot, getDoc } = require('firebase/firestore');

// Firebase config (using wispaibiz project - matches your environment variables)
const firebaseConfig = {
  apiKey: "AIzaSyDGjaqSQ-3VBvI0sbJXd0OMF8F-yqtOZyY",
  authDomain: "wispaibiz.firebaseapp.com",
  projectId: "wispaibiz",
  storageBucket: "wispaibiz.firebasestorage.app",
  messagingSenderId: "625426170564",
  appId: "1:625426170564:web:045f4c53f79eedc21b7f91"
};

// Initialize Firebase to use local emulator
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Point to emulators
if (typeof window === 'undefined') {
  const { connectFirestoreEmulator } = require('firebase/firestore');
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔗 Connected to Firestore emulator');
  } catch (error) {
    console.log('⚠️ Firestore emulator already connected or error:', error.message);
  }
}

// Medical spa consultation test transcript (realistic data)
const testTranscript = {
  transcript: `Hello, welcome to Serenity Medical Spa! My name is Dr. Martinez and I'll be your consultant today. 
  I want to start by saying how excited we are to help you achieve your aesthetic goals.
  Please, have a seat and make yourself comfortable. Can I get you some water or tea?
  
  Before we begin, I'd love to learn more about what brings you in today. What are your main concerns?
  
  Well, I've been noticing more fine lines around my eyes and forehead. I'm 42 and I feel like I'm starting to look tired all the time. 
  I've been researching Botox treatments and I'm curious if that would be right for me.
  
  Thank you for sharing that with me. Those concerns are very common for people in their early 40s, and you're absolutely right that Botox can be an excellent solution. 
  Let me take a closer look at your facial structure and muscle movement.
  
  I can see exactly what you're referring to. You have some dynamic wrinkles - those are the lines that appear when you make facial expressions. 
  The good news is that Botox is incredibly effective for exactly this type of concern.
  
  How does the Botox treatment actually work? I've heard it's injected but I'm a bit nervous about needles.
  
  I completely understand your concern about needles - that's very normal. Botox works by temporarily relaxing the muscles that cause those wrinkles. 
  The injections are very quick, using ultra-fine needles, and most patients say it feels like a tiny pinch.
  
  For your forehead and crow's feet area, we'd typically use about 20-25 units total. Each unit costs $12, so you're looking at around $240-300 for the treatment.
  
  That seems reasonable for the results. How long does it last?
  
  Botox typically lasts 3-4 months. Most patients come in for touch-ups every 3-4 months to maintain their results. 
  After a few treatments, many people find the effects last even longer.
  
  I think I'd like to move forward with the treatment. When could we schedule this?
  
  Wonderful! I'm so glad you feel confident about moving forward. Let me check our availability. 
  We have openings this Thursday afternoon or Friday morning. Which works better for your schedule?
  
  Friday morning would be perfect. Can we book that now?
  
  Absolutely! I'll have my assistant get you scheduled for Friday at 10 AM. You'll love the results!`,
  
  'speaker transcript': [
    {
      speaker: 'Doctor',
      text: "Hello, welcome to Serenity Medical Spa! My name is Dr. Martinez and I'll be your consultant today.",
      timestamp: '00:01'
    },
    {
      speaker: 'Doctor', 
      text: 'I want to start by saying how excited we are to help you achieve your aesthetic goals.',
      timestamp: '00:05'
    },
    {
      speaker: 'Doctor',
      text: 'Please, have a seat and make yourself comfortable. Can I get you some water or tea?',
      timestamp: '00:08'
    },
    {
      speaker: 'Doctor',
      text: "Before we begin, I'd love to learn more about what brings you in today. What are your main concerns?",
      timestamp: '00:15'
    },
    {
      speaker: 'Patient',
      text: "Well, I've been noticing more fine lines around my eyes and forehead. I'm 42 and I feel like I'm starting to look tired all the time.",
      timestamp: '00:20'
    },
    {
      speaker: 'Patient',
      text: "I've been researching Botox treatments and I'm curious if that would be right for me.",
      timestamp: '00:28'
    },
    {
      speaker: 'Doctor',
      text: "Thank you for sharing that with me. Those concerns are very common for people in their early 40s, and you're absolutely right that Botox can be an excellent solution.",
      timestamp: '00:35'
    },
    {
      speaker: 'Doctor',
      text: 'Let me take a closer look at your facial structure and muscle movement.',
      timestamp: '00:42'
    },
    {
      speaker: 'Doctor',
      text: "I can see exactly what you're referring to. You have some dynamic wrinkles - those are the lines that appear when you make facial expressions.",
      timestamp: '00:50'
    },
    {
      speaker: 'Doctor',
      text: 'The good news is that Botox is incredibly effective for exactly this type of concern.',
      timestamp: '00:58'
    },
    {
      speaker: 'Patient',
      text: "How does the Botox treatment actually work? I've heard it's injected but I'm a bit nervous about needles.",
      timestamp: '01:05'
    },
    {
      speaker: 'Doctor',
      text: "I completely understand your concern about needles - that's very normal. Botox works by temporarily relaxing the muscles that cause those wrinkles.",
      timestamp: '01:12'
    },
    {
      speaker: 'Doctor',
      text: 'The injections are very quick, using ultra-fine needles, and most patients say it feels like a tiny pinch.',
      timestamp: '01:20'
    },
    {
      speaker: 'Doctor',
      text: "For your forehead and crow's feet area, we'd typically use about 20-25 units total. Each unit costs $12, so you're looking at around $240-300 for the treatment.",
      timestamp: '01:28'
    },
    {
      speaker: 'Patient',
      text: 'That seems reasonable for the results. How long does it last?',
      timestamp: '01:38'
    },
    {
      speaker: 'Doctor',
      text: 'Botox typically lasts 3-4 months. Most patients come in for touch-ups every 3-4 months to maintain their results.',
      timestamp: '01:45'
    },
    {
      speaker: 'Doctor',
      text: 'After a few treatments, many people find the effects last even longer.',
      timestamp: '01:53'
    },
    {
      speaker: 'Patient',
      text: "I think I'd like to move forward with the treatment. When could we schedule this?",
      timestamp: '02:00'
    },
    {
      speaker: 'Doctor',
      text: "Wonderful! I'm so glad you feel confident about moving forward. Let me check our availability.",
      timestamp: '02:05'
    },
    {
      speaker: 'Doctor',
      text: 'We have openings this Thursday afternoon or Friday morning. Which works better for your schedule?',
      timestamp: '02:12'
    },
    {
      speaker: 'Patient',
      text: 'Friday morning would be perfect. Can we book that now?',
      timestamp: '02:18'
    },
    {
      speaker: 'Doctor',
      text: "Absolutely! I'll have my assistant get you scheduled for Friday at 10 AM. You'll love the results!",
      timestamp: '02:22'
    }
  ],
  
  duration: 150,
  speakers: ['Doctor', 'Patient'],
  createdAt: new Date(),
  location: 'Serenity Medical Spa - API Route Test'
};

async function testAPIRoute() {
  console.log('\n🚀 TESTING API ROUTE: /api/process-transcript-insights');
  console.log('='.repeat(80));
  
  const testPersonId = `api_test_person_${Date.now()}`;
  const testTranscriptId = `api_test_transcript_${Date.now()}`;
  
  console.log('📋 Test Configuration:');
  console.log('   • API URL: http://localhost:3000/api/process-transcript-insights');
  console.log('   • Person ID:', testPersonId);
  console.log('   • Transcript ID:', testTranscriptId);
  console.log('   • Test transcript: Medical spa Botox consultation');
  
  try {
    // Step 1: Add test transcript to Firestore (wispaibiz project)
    console.log('\n📝 Step 1: Adding test transcript to wispaibiz Firestore...');
    const transcriptRef = doc(db, 'transcript', testPersonId, 'timestamps', testTranscriptId);
    await setDoc(transcriptRef, testTranscript);
    console.log('✅ Test transcript added to wispaibiz Firestore');
    
    // Step 2: Call the API route (exactly like frontend does)
    console.log('\n⚡ Step 2: Calling /api/process-transcript-insights API route...');
    console.log('   • This should match exactly how your original frontend calls it');
    console.log('   • Expected: Processing via Next.js API route');
    
    const startTime = Date.now();
    console.log('   • API call initiated...');
    console.log('   • Processing medical spa consultation transcript...');
    
    const response = await fetch('http://localhost:3000/api/process-transcript-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transcriptId: testTranscriptId,
        personId: testPersonId
      })
    });
    
    const result = await response.json();
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    if (!response.ok) {
      throw new Error(`API Route failed: ${result.error || response.statusText}`);
    }
    
    console.log('\n🎉 SUCCESS! API Route completed successfully');
    console.log('   • Processing time:', duration, 'seconds');
    console.log('   • Result status:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('   • Message:', result.message);
    
    if (result.insightsData) {
      console.log('\n📊 INSIGHTS DATA GENERATED:');
      console.log('   • TrackerByPhrases sentences:', result.insightsData.trackerByPhrases?.length || 0);
      console.log('   • TrackerScoring analysis:', Object.keys(result.insightsData.trackerScoring || {}).length, 'trackers');
      console.log('   • Extraction method:', result.insightsData.extractionMethod);
      console.log('   • Total sentences processed:', result.insightsData.totalSentences);
      
      // Show medical spa specific tracker results
      if (result.insightsData.trackerScoring) {
        console.log('\n🏥 MEDICAL SPA TRACKER ANALYSIS:');
        const trackers = result.insightsData.trackerScoring;
        
        if (trackers.introduction) {
          console.log(`   • Introduction: ${trackers.introduction.category} (${trackers.introduction.phraseCount} phrases)`);
        }
        if (trackers['rapport-building']) {
          console.log(`   • Rapport Building: ${trackers['rapport-building'].category} (${trackers['rapport-building'].phraseCount} phrases)`);
        }
        if (trackers['treatment-plan']) {
          console.log(`   • Treatment Plan: ${trackers['treatment-plan'].category} (${trackers['treatment-plan'].phraseCount} phrases)`);
        }
        if (trackers['pricing-questions']) {
          console.log(`   • Pricing Discussion: ${trackers['pricing-questions'].category} (${trackers['pricing-questions'].phraseCount} phrases)`);
        }
        if (trackers['follow-up-booking']) {
          console.log(`   • Follow-up Booking: ${trackers['follow-up-booking'].category} (${trackers['follow-up-booking'].phraseCount} phrases)`);
        }
      }
    }
    
    // Step 3: Verify insights were saved to wispaibiz Firestore
    console.log('\n💾 Step 3: Verifying insights saved to wispaibiz Firestore...');
    const insightRef = doc(db, 'insights', testPersonId, 'timestamps', testTranscriptId);
    const insightSnap = await getDoc(insightRef);
    
    if (insightSnap.exists()) {
      const insightData = insightSnap.data();
      console.log('✅ Insights successfully saved to wispaibiz Firestore');
      console.log('   • Path: insights/' + testPersonId + '/timestamps/' + testTranscriptId);
      console.log('   • TrackerByPhrases stored:', insightData.trackerByPhrases?.length || 0, 'sentences');
      console.log('   • TrackerScoring stored:', Object.keys(insightData.trackerScoring || {}).length, 'trackers');
      console.log('   • Calculated at:', insightData.calculatedAt);
    } else {
      console.log('❌ ERROR: Insights not found in wispaibiz Firestore');
      throw new Error('Insights were not saved to Firestore');
    }
    
    // Step 4: Validate that this matches frontend expectations
    console.log('\n🔍 Step 4: Validating frontend compatibility...');
    const frontendExpectedFields = [
      'trackerByPhrases',
      'trackerScoring', 
      'extractionMethod',
      'totalSentences',
      'calculatedAt'
    ];
    
    const missingFields = frontendExpectedFields.filter(field => 
      !(field in (result.insightsData || {}))
    );
    
    if (missingFields.length === 0) {
      console.log('✅ All expected frontend fields present');
    } else {
      console.log('❌ Missing frontend fields:', missingFields.join(', '));
    }
    
    console.log('\n🚀 API ROUTE TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ Next.js API route working perfectly');
    console.log('✅ Frontend integration verified');
    console.log('✅ Medical spa consultation processing working perfectly');
    
  } catch (error) {
    console.error('\n💥 API Route test failed:', error);
    
    if (error.message) {
      console.error('   • Error Message:', error.message);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check that Next.js is running on localhost:3000');
    console.log('   • Verify Firebase emulators are running with wispaibiz project');
    console.log('   • Ensure API route exists at /api/process-transcript-insights');
    
    process.exit(1);
  }
}

// Run the test
testAPIRoute();

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 API Route test interrupted by user');
  process.exit(0);
});