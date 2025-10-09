'use client';

import { Loader2 } from "lucide-react";

export default function TranscriptLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-sans">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Loading transcript...</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch the transcript details
          </p>
        </div>
      </div>
    </div>
  );
} 