import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK for server-side operations
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    try {
      // Check if we have service account credentials
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        console.log('🔧 Initializing Firebase Admin with service account credentials')
        // Use service account credentials
        initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
        console.log('✅ Firebase Admin initialized successfully')
      } else {
        console.log('⚠️ Missing Firebase Admin environment variables, attempting default initialization')
        console.log('Missing variables:', {
          FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
          FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        })
        // Fallback to default credentials (for local development)
        initializeApp();
      }
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error)
      throw new Error('Firebase Admin initialization failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }
  
  return getFirestore();
};

// Export the Firestore instance
export const adminDb = initializeFirebaseAdmin(); 