"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, ArrowRight } from "lucide-react"
import { useAuth } from '@/context/auth-context';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ChooseChainPage() {
  // All hooks must be called unconditionally at the top level
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [chains, setChains] = useState<{id: string, name: string}[]>([]);
  const [loadingChains, setLoadingChains] = useState(false);

  const loadChains = useCallback(async () => {
    try {
      setLoadingChains(true);
      const chainsRef = collection(db, 'locations');
      const chainsSnap = await getDocs(chainsRef);
      
      const chainsList = chainsSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.id
      }));
      
      if (chainsList.length === 0) {
        setError('No chains found. Please contact your administrator.');
      } else {
        setChains(chainsList);
      }
    } catch (error: any) {
      console.error('Error loading chains:', error);
      setError('Failed to load chains. Please try again.');
    } finally {
      setLoadingChains(false);
    }
  }, []);

  const handleChainSelect = useCallback(async () => {
    if (!selectedChain) {
      setError('Please select a chain');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Save chain to Firestore user document
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          userChain: selectedChain,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        console.log('✅ Saved userChain to Firestore:', selectedChain);
      }
      
      // Also save to localStorage as backup
      localStorage.setItem('userChain', selectedChain);
      
      // Redirect to dashboard with the selected chain
      router.push(`/dashboard?chain=${selectedChain}`);
    } catch (error: any) {
      console.error('Chain save error:', error);
      setError('Failed to save chain selection');
    } finally {
      setIsLoading(false);
    }
  }, [selectedChain, user?.uid, router]);

  // Redirect if user is not signed in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Load chains when user is authenticated
  useEffect(() => {
    if (user) {
      loadChains();
    }
  }, [user, loadChains]);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render if user is not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

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
            <span className="text-2xl font-bold text-foreground ml-3">Wisp AI</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Choose Your Organization</CardTitle>
          <p className="text-muted-foreground mt-2">Select the organization you work with</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Chain Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Organization
            </label>
            {loadingChains ? (
              <div className="w-full px-4 py-3 rounded-lg border border-border bg-muted flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading organizations...</span>
              </div>
            ) : (
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                <option value="">Choose an organization...</option>
                {chains.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Continue Button */}
          <button
            onClick={handleChainSelect}
            disabled={isLoading || !selectedChain || loadingChains}
            className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
              isLoading || !selectedChain || loadingChains
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* User Info */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.email}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 