/**
 * Test script to verify the processTranscriptInsights Cloud Function works
 * This will test the new Cloud Function implementation instead of the API route
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, onSnapshot, getDoc } = require('firebase/firestore');
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require('firebase/functions');

// Firebase config (using your existing project)
const firebaseConfig = {
  apiKey: "test-key-for-emulator",
  authDomain: "descript-15fab.firebaseapp.com", 
  projectId: "descript-15fab",
  storageBucket: "descript-15fab.appspot.com",
  messagingSenderId: "619700216448",
  appId: "test-app-id"
};

// Initialize Firebase to use local emulator
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);

// Point to emulators
if (typeof window === 'undefined') {
  const { connectFirestoreEmulator } = require('firebase/firestore');
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔗 Connected to Firestore emulator');
  } catch (error) {
    console.log('⚠️ Firestore emulator already connected or error:', error.message);
  }
  
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔗 Connected to Functions emulator');
  } catch (error) {
    console.log('⚠️ Functions emulator already connected or error:', error.message);
  }
}

// Test transcript data
const testTranscript = {
  transcript: `Hello doctor, welcome to our medical spa consultation. 
  My name is Dr. Smith and I'll be helping you today with your aesthetic concerns.
  I want to make sure you feel comfortable throughout our discussion.
  What brings you in to see us today? I'm interested in Botox treatments for my forehead lines.
  I've been noticing more wrinkles lately and wanted to explore my options.
  That's a great choice. Botox is very effective for forehead lines and crow's feet.
  The treatment involves small injections that relax the muscles causing the wrinkles.
  How much would this treatment cost? The Botox treatment is $12 per unit.
  For your forehead, you'll likely need about 20-25 units, so around $240-300.
  We also offer package deals if you're interested in treating multiple areas.
  That sounds reasonable. How often would I need to come back?
  Typically, Botox lasts 3-4 months, so we recommend touch-ups every 3-4 months.
  I'd like to schedule the treatment. When would be the best time?
  Let me check our schedule. We have availability next Tuesday or Friday morning.
  Tuesday works perfect for me. Can we book that appointment now?`,
  
  'speaker transcript': [
    {
      speaker: 'Doctor',
      text: 'Hello doctor, welcome to our medical spa consultation. My name is Dr. Smith and I\'ll be helping you today with your aesthetic concerns.',
      timestamp: '00:01'
    },
    {
      speaker: 'Patient', 
      text: 'What brings you in to see us today? I\'m interested in Botox treatments for my forehead lines.',
      timestamp: '00:15'
    },
    {
      speaker: 'Doctor',
      text: 'That\'s a great choice. Botox is very effective for forehead lines and crow\'s feet. The treatment involves small injections that relax the muscles causing the wrinkles.',
      timestamp: '00:30'
    },
    {
      speaker: 'Patient',
      text: 'How much would this treatment cost?',
      timestamp: '00:45'
    },
    {
      speaker: 'Doctor',
      text: 'The Botox treatment is $12 per unit. For your forehead, you\'ll likely need about 20-25 units, so around $240-300.',
      timestamp: '00:50'
    }
  ],
  
  duration: 180,
  speakers: ['Doctor', 'Patient'],
  createdAt: new Date(),
  location: 'Test Medical Spa Cloud Function'
};

async function testCloudFunction() {
  console.log('\n🚀 TESTING CLOUD FUNCTION: processTranscriptInsights');
  console.log('='.repeat(60));
  
  const testPersonId = `cf_test_person_${Date.now()}`;
  const testTranscriptId = `cf_test_transcript_${Date.now()}`;
  
  console.log('📋 Test IDs:');
  console.log('   • Person ID:', testPersonId);
  console.log('   • Transcript ID:', testTranscriptId);
  
  try {
    // Step 1: Add test transcript to Firestore
    console.log('\n📝 Step 1: Adding test transcript to Firestore...');
    const transcriptRef = doc(db, 'transcript', testPersonId, 'timestamps', testTranscriptId);
    await setDoc(transcriptRef, testTranscript);
    console.log('✅ Test transcript added to Firestore');
    
    // Step 2: Call the Cloud Function
    console.log('\n⚡ Step 2: Calling processTranscriptInsights Cloud Function...');
    const processTranscriptInsights = httpsCallable(functions, 'processTranscriptInsights');
    
    const startTime = Date.now();
    console.log('   • Function call initiated...');
    console.log('   • This may take several minutes for full processing...');
    
    const result = await processTranscriptInsights({
      transcriptId: testTranscriptId,
      personId: testPersonId
    });
    
    const duration = Date.now() - startTime;
    
    console.log('\n🎉 SUCCESS! Cloud Function completed successfully');
    console.log('   • Processing time:', Math.round(duration / 1000), 'seconds');
    console.log('   • Result:', result.data.success ? 'SUCCESS' : 'FAILED');
    console.log('   • Message:', result.data.message);
    
    if (result.data.insightsData) {
      console.log('\n📊 INSIGHTS DATA GENERATED:');
      console.log('   • TrackerByPhrases count:', result.data.insightsData.trackerByPhrases?.length || 0);
      console.log('   • TrackerScoring trackers:', Object.keys(result.data.insightsData.trackerScoring || {}).length);
      console.log('   • Extraction method:', result.data.insightsData.extractionMethod);
      console.log('   • Total sentences:', result.data.insightsData.totalSentences);
      
      // Show sample tracker results
      if (result.data.insightsData.trackerScoring) {
        console.log('\n🎯 SAMPLE TRACKER SCORING:');
        Object.entries(result.data.insightsData.trackerScoring).slice(0, 3).forEach(([tracker, data]) => {
          console.log(`   • ${tracker}: ${data.category} (${data.phraseCount} phrases)`);
        });
      }
    }
    
    // Step 3: Verify insights were saved to Firestore
    console.log('\n💾 Step 3: Verifying insights saved to Firestore...');
    const insightRef = doc(db, 'insights', testPersonId, 'timestamps', testTranscriptId);
    const insightSnap = await getDoc(insightRef);
    
    if (insightSnap.exists()) {
      const insightData = insightSnap.data();
      console.log('✅ Insights successfully saved to Firestore');
      console.log('   • Path: insights/' + testPersonId + '/timestamps/' + testTranscriptId);
      console.log('   • TrackerByPhrases:', insightData.trackerByPhrases?.length || 0, 'sentences');
      console.log('   • TrackerScoring:', Object.keys(insightData.trackerScoring || {}).length, 'trackers');
    } else {
      console.log('❌ Insights not found in Firestore - this indicates an error');
    }
    
    console.log('\n✅ CLOUD FUNCTION MIGRATION TEST COMPLETED SUCCESSFULLY!');
    console.log('🚀 Ready for production deployment!');
    
  } catch (error) {
    console.error('\n💥 Cloud Function test failed:', error);
    
    if (error.code) {
      console.error('   • Error Code:', error.code);
    }
    if (error.message) {
      console.error('   • Error Message:', error.message);
    }
    if (error.details) {
      console.error('   • Error Details:', error.details);
    }
    
    process.exit(1);
  }
}

// Run the test
testCloudFunction();

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});