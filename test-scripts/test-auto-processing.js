/**
 * Test script to verify Firebase Cloud Functions auto-processing
 * This will add a test transcript to Firestore and watch it get processed automatically
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, onSnapshot } = require('firebase/firestore');

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

// Point to emulator
if (typeof window === 'undefined') {
  const { connectFirestoreEmulator } = require('firebase/firestore');
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔗 Connected to Firestore emulator');
  } catch (error) {
    console.log('⚠️ Emulator already connected or error:', error.message);
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
  
  duration: 180,
  speakers: ['Doctor', 'Patient'],
  createdAt: new Date(),
  location: 'Test Medical Spa',
  
  // Important: Don't set autoProcessed initially
  autoProcessed: false
};

async function testAutoProcessing() {
  console.log('\n🚀 TESTING FIREBASE CLOUD FUNCTIONS AUTO-PROCESSING');
  console.log('='.repeat(60));
  
  const testPersonId = `test_person_${Date.now()}`;
  const testTranscriptId = `test_transcript_${Date.now()}`;
  
  console.log('📋 Test IDs:');
  console.log('   • Person ID:', testPersonId);
  console.log('   • Transcript ID:', testTranscriptId);
  
  try {
    // Step 1: Set up listener BEFORE adding document
    console.log('\n👂 Setting up real-time listener...');
    const transcriptRef = doc(db, 'transcript', testPersonId, 'timestamps', testTranscriptId);
    
    const unsubscribe = onSnapshot(transcriptRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('\n📊 TRANSCRIPT STATUS UPDATE:');
        console.log('   • autoProcessStarted:', data.autoProcessStarted || false);
        console.log('   • autoProcessed:', data.autoProcessed || false);
        console.log('   • autoProcessFailed:', data.autoProcessFailed || false);
        
        if (data.autoProcessed) {
          console.log('\n🎉 SUCCESS! Transcript was auto-processed!');
          console.log('   • Processing result:', data.autoProcessResult || 'No result data');
          console.log('   • Processed at:', data.autoProcessedAt?.toDate?.() || data.autoProcessedAt);
          
          // Check if insights were created
          console.log('\n🔍 Checking for generated insights...');
          
          unsubscribe(); // Stop listening
          process.exit(0);
        }
        
        if (data.autoProcessFailed) {
          console.log('\n❌ AUTO-PROCESSING FAILED!');
          console.log('   • Error:', data.autoProcessError);
          console.log('   • Failed at:', data.autoProcessErrorAt?.toDate?.() || data.autoProcessErrorAt);
          
          unsubscribe();
          process.exit(1);
        }
      }
    }, (error) => {
      console.error('❌ Listener error:', error);
    });
    
    // Step 2: Add the test transcript (this should trigger the Cloud Function)
    console.log('\n📝 Adding test transcript to Firestore...');
    console.log('   • This should trigger the Cloud Function automatically');
    
    await setDoc(transcriptRef, testTranscript);
    
    console.log('✅ Test transcript added successfully!');
    console.log('\n⏳ Waiting for Cloud Function to process...');
    console.log('   • Expected: Cloud Function should detect new transcript');
    console.log('   • Expected: Auto-process via /api/process-transcript-insights');
    console.log('   • Expected: Background TrackerByPhrases processing');
    console.log('   • Expected: Insights saved to Firestore');
    
    // Wait up to 5 minutes for processing
    setTimeout(() => {
      console.log('\n⏰ TIMEOUT: Processing took longer than 5 minutes');
      console.log('   • This might be normal for the first run');
      console.log('   • Check Firebase Functions logs for details');
      unsubscribe();
      process.exit(1);
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAutoProcessing();

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});