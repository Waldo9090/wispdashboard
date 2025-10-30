// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  reload
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase only if we're in the browser and have valid config
let app: any = null
let auth: any = null
let db: any = null

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  // Initialize Firebase only once
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  
  // Initialize Firebase Auth
  auth = getAuth(app)
  
  // Initialize Firestore
  db = getFirestore(app)
}

export { auth, db }

// Google Auth Provider - initialize only on client
let googleProvider: GoogleAuthProvider | null = null
if (typeof window !== 'undefined') {
  googleProvider = new GoogleAuthProvider()
}

// Auth functions with null checks
export const signInWithGoogle = () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase not initialized')
  }
  return signInWithPopup(auth, googleProvider)
}

export const logout = () => {
  if (!auth) {
    throw new Error('Firebase not initialized')
  }
  return signOut(auth)
}

// Email verification functions
export const sendVerificationEmail = (user: any) => sendEmailVerification(user)
export const reloadUser = (user: any) => reload(user)

// Auth state observer
export { onAuthStateChanged }

export default app