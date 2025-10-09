



"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic } from "lucide-react"
import { useAuth } from '@/context/auth-context';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function SignInPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [showClinicSelect, setShowClinicSelect] = useState(false);
  const [clinics, setClinics] = useState<{id: string, name: string, chain: string}[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  
  // Email/Password authentication states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Check if user has userChain and redirect accordingly
  useEffect(() => {
    const checkUserChainAndRedirect = async () => {
      if (user && !loading) {
        try {
          // Check if user already has userChain in Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.userChain) {
              // User already has a chain set, go directly to dashboard
              console.log('✅ User has userChain:', userData.userChain);
              router.push('/dashboard');
              return;
            }
          }
          // No userChain found, go to choose-chain page
          router.push('/choose-chain');
        } catch (error) {
          console.error('Error checking userChain:', error);
          // Fallback to choose-chain page on error
          router.push('/choose-chain');
        }
      }
    };

    checkUserChainAndRedirect();
  }, [user, loading, router]);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render the sign-in form if user is already signed in
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const loadClinics = async () => {
    try {
      setLoadingClinics(true);
      
      // Get all chains first
      const chainsRef = collection(db, 'locations');
      const chainsSnap = await getDocs(chainsRef);
      
      const clinicsList: {id: string, name: string, chain: string}[] = [];
      
      // For each chain, get its locations
      for (const chainDoc of chainsSnap.docs) {
        const chainId = chainDoc.id;
        const chainName = chainDoc.data().name || chainId;
        
        try {
          const locationsRef = collection(db, 'locations', chainId);
          const locationsSnap = await getDocs(locationsRef);
          
          locationsSnap.docs.forEach(locationDoc => {
            const locationId = locationDoc.id;
            const locationData = locationDoc.data();
            
            // Try to get the name from the location document
            let locationName = locationData.name;
            
            // If no name document exists, try to get it from a 'name' subcollection
            if (!locationName) {
              // Use the location ID as fallback name
              locationName = locationId;
            }
            
            clinicsList.push({
              id: `${chainId}/${locationId}`,
              name: `${locationName} (${chainName})`,
              chain: chainId
            });
          });
        } catch (error) {
          console.error(`Error loading locations for chain ${chainId}:`, error);
          // Continue with other chains even if one fails
        }
      }
      
      if (clinicsList.length === 0) {
        setError('No clinics found. Please contact your administrator.');
      } else {
        setClinics(clinicsList);
      }
    } catch (error: any) {
      console.error('Error loading clinics:', error);
      setError('Failed to load clinics. Please try again.');
    } finally {
      setLoadingClinics(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await signInWithGoogle();
      
      if (result?.user) {
        // Show clinic selection after successful sign in
        setShowClinicSelect(true);
        // Load clinics from Firestore
        loadClinics();
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/signin',
        handleCodeInApp: false,
      });
      setError(null);
      // Show success message
      setError('✅ Password reset email sent! Check your inbox and spam folder.');
      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setError('📧 No account found with this email address.');
          break;
        case 'auth/invalid-email':
          setError('📧 Please enter a valid email address.');
          break;
        default:
          setError(`Failed to send reset email: ${error.message}`);
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setShowForgotPassword(false);

      let authResult;
      
      if (isSignUp) {
        // Create new user with Firebase Auth
        authResult = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save user data to Firestore (NO password storage)
        await setDoc(doc(db, 'users', authResult.user.uid), {
          email: email,
          displayName: email.split('@')[0], // Use email prefix as display name
          createdAt: new Date().toISOString(),
          lastSignIn: new Date().toISOString(),
          authMethod: 'email',
          // Note: Password is handled securely by Firebase Auth
        }, { merge: true });
        
        console.log('✅ New user created with Firebase Auth and saved to Firestore');
      } else {
        // Sign in existing user with Firebase Auth
        authResult = await signInWithEmailAndPassword(auth, email, password);
        
        // Update last sign in time in Firestore
        await setDoc(doc(db, 'users', authResult.user.uid), {
          lastSignIn: new Date().toISOString()
        }, { merge: true });
        
        console.log('✅ User authenticated with Firebase Auth');
      }

      // Show clinic selection after successful authentication
      setShowClinicSelect(true);
      loadClinics();
      
    } catch (error: any) {
      console.error('Firebase Auth error:', error);
      
      // Handle specific Firebase Auth error codes with clear messages
      switch (error.code) {
        case 'auth/user-not-found':
          setError('📧 No account found with this email. Please sign up.');
          setIsSignUp(true);
          break;
          
        case 'auth/wrong-password':
          setError('❌ Incorrect password. Please check your password and try again.');
          setShowForgotPassword(true);
          break;
          
        case 'auth/email-already-in-use':
          setError('⚠️ An account with this email already exists. Please sign in instead.');
          setIsSignUp(false);
          break;
          
        case 'auth/weak-password':
          setError('🔒 Password should be at least 6 characters long.');
          break;
          
        case 'auth/invalid-email':
          setError('📧 Please enter a valid email address.');
          break;
          
        case 'auth/invalid-credential':
          setError('🔐 Invalid email or password. Please check your credentials.');
          setShowForgotPassword(true);
          break;
          
        case 'auth/too-many-requests':
          setError('⏰ Too many failed attempts. Please try again later.');
          break;
          
        case 'auth/network-request-failed':
          setError('🌐 Network error. Please check your internet connection.');
          break;
          
        case 'auth/operation-not-allowed':
          setError('🚫 Email/password authentication is not enabled in Firebase.');
          break;
          
        default:
          setError(`Authentication failed: ${error.message || 'Unknown error'}`);
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClinicSelect = async () => {
    if (!selectedClinic) {
      setError('Please select a clinic');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Parse the selected clinic to get chain and location
      const [chainId, locationId] = selectedClinic.split('/');
      const selectedClinicData = clinics.find(c => c.id === selectedClinic);
      
      // Save clinic information to localStorage
      localStorage.setItem('userClinic', selectedClinic);
      localStorage.setItem('userChain', chainId);
      localStorage.setItem('userLocation', locationId);
      
      // Also save to Firestore user document
      if (user && user.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          userChain: chainId,
          userClinic: selectedClinic,
          userLocation: locationId,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        console.log('✅ Saved user preferences to Firestore');
      }
      
      // Redirect to dashboard since userChain is now set
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Clinic save error:', error);
      setError('Failed to save clinic');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm border border-border">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logocandyprob.png" 
              alt="Wisp AI Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-bold text-foreground ml-3">Candytrail</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">{isSignUp ? 'Create Account' : 'Welcome back'}</CardTitle>
          <p className="text-muted-foreground mt-2">{isSignUp ? 'Create your new account' : 'Sign in to your account'}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!showClinicSelect ? (
            <>
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
                ) : (
                  <>
                    <GoogleIcon />
                    <span className="text-sm text-foreground font-medium">
                      Continue with Google
                    </span>
                  </>
                )}
              </button>

              {/* OR Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">OR</span>
                </div>
              </div>

              {/* Email/Password Authentication */}
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  disabled={isLoading}
                />
                
                <input
                  type="password"
                  placeholder="Enter your password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  disabled={isLoading}
                />
                
                {isSignUp && (
                  <input
                    type="password"
                    placeholder="Confirm your password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    disabled={isLoading}
                  />
                )}
                
                <button
                  onClick={handleEmailAuth}
                  disabled={isLoading || !email || !password || (isSignUp && !confirmPassword)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-sm font-medium">
                      {isSignUp ? 'Create account' : 'Continue with email'}
                    </span>
                  )}
                </button>

                {/* Forgot Password Button */}
                {showForgotPassword && !isSignUp && (
                  <button
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot your password? Reset it here
                  </button>
                )}

                {/* Toggle between sign in and sign up */}
                <div className="text-center">
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                    disabled={isLoading}
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Clinic Selection */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select your clinic
                </label>
                {loadingClinics ? (
                  <div className="w-full px-4 py-3 rounded-lg border border-border bg-muted flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading clinics...</span>
                  </div>
                ) : (
                  <select
                    value={selectedClinic}
                    onChange={(e) => setSelectedClinic(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    <option value="">Choose a clinic...</option>
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <button
                onClick={handleClinicSelect}
                disabled={isLoading || !selectedClinic}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                ) : (
                  <span className="text-sm font-medium">
                    Continue to Dashboard
                  </span>
                )}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 