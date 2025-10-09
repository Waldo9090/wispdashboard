'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function TranscriptError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Transcript error:', error);
  }, [error]);

  const handleReset = () => {
    // Clear any cached data
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('transcript-cache');
    }
    reset();
  };

  const handleDashboard = () => {
    router.push('/dashboard/activity');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="max-w-md w-full space-y-6 bg-card p-8 rounded-lg shadow-sm border border-border">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || 'There was an error loading this transcript. Please try again.'}
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleReset}
            variant="default"
            className="w-full"
          >
            Try again
          </Button>
          <Button
            onClick={handleDashboard}
            variant="outline"
            className="w-full"
          >
            Back to Activity
          </Button>
        </div>

        {error.digest && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Error ID: {error.digest}
          </div>
        )}
      </div>
    </div>
  );
} 