'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getBotStatus, leaveBot, getBotRecording, getBotTranscript } from '@/lib/attendee';
import { useAuth } from '@/context/auth-context';
import { collection, writeBatch, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { exportToNotion } from '@/lib/notion-export';
import { useMeetings } from '@/src/context/meetings-context';
import { useToast } from '@/components/ui/use-toast';

// Add timestamp to all console logs
// const originalConsoleLog = console.log;
// const originalConsoleError = console.error;
// console.log = (...args) => {
//   originalConsoleLog(`[${new Date().toISOString()}]`, ...args);
// };
// console.error = (...args) => {
//   originalConsoleError(`[${new Date().toISOString()}]`, ...args);
// };

interface BotStatus {
  id: string;
  state: string;
  recordingState?: string;
  transcriptionState?: string;
  meetingUrl: string;
  processingStatus?: string;
  lastStatusUpdate?: string;
  statusHistory?: {
    status: string;
    timestamp: string;
    details: {
      recording?: string;
      transcription?: string;
      transcriptLength?: number;
      noSpeechDetected?: boolean;
    };
  }[];
}

interface BotStatusContextType {
  activeBots: BotStatus[];
  addBot: (botId: string, meetingUrl: string) => void;
  removeBot: (botId: string) => void;
  finishBot: (botId: string) => Promise<void>;
}

const BotStatusContext = createContext<BotStatusContextType | undefined>(undefined);

export function useBotStatus() {
  const context = useContext(BotStatusContext);
  if (context === undefined) {
    throw new Error('useBotStatus must be used within a BotStatusProvider');
  }
  return context;
}

interface TranscriptUtterance {
  speaker_name: string;
  speaker_uuid: string;
  speaker_user_uuid: string | null;
  timestamp_ms: number;
  duration_ms: number;
  transcription: null | string | { transcript: string };
}

interface SpeakerTranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
}

interface ActionItem {
  title: string;
  description: string;
}

// Helper function for timestamp formatting
function formatTimestampMMSS(timeInMs: number): string {
  if (isNaN(timeInMs) || timeInMs < 0) {
    return "00:00";
  }
  const totalSeconds = Math.floor(timeInMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function BotStatusProvider({ children }: { children: ReactNode }) {
  const [activeBots, setActiveBots] = useState<BotStatus[]>([]);
  const { user } = useAuth();
  const { refreshMeetings } = useMeetings();
  const { toast } = useToast();

  // Monitor bot statuses
  useEffect(() => {
    if (activeBots.length === 0) return;

    // // console.log('🤖 Starting bot status monitoring for:', activeBots.map(b => ({
//     //   id: b.id,
//     //   state: b.state,
//     //   url: b.meetingUrl
//     // })));

    const interval = setInterval(async () => {
      for (const bot of activeBots) {
        try {
          // // console.log(`\n📡 Checking status for bot ${bot.id}...`);
          const status = await getBotStatus(bot.id);
          
          // // console.log(`✅ Got status for bot ${bot.id}:`, {
//           //   state: status.state,
//           //   recording: status.recording_state,
//           //   transcription: status.transcription_state,
//           //   previousState: bot.state
//           // });
          
          setActiveBots(prev => prev.map(b => 
            b.id === bot.id 
              ? {
                  ...b,
                  state: status.state,
                  recordingState: status.recording_state,
                  transcriptionState: status.transcription_state,
                  lastStatusUpdate: new Date().toISOString(),
                  statusHistory: b.statusHistory 
                    ? [...b.statusHistory, {
                        status: status.state,
                        timestamp: new Date().toISOString(),
                        details: {
                          recording: status.recording_state,
                          transcription: status.transcription_state
                        }
                      }]
                    : [{
                        status: status.state,
                        timestamp: new Date().toISOString(),
                        details: {
                          recording: status.recording_state,
                          transcription: status.transcription_state
                        }
                      }]
                }
              : b
          ));

          // Auto-process when bot is complete
          if (status.state === 'ended' && 
              status.recording_state === 'complete' && 
              status.transcription_state === 'complete' &&
              bot.state !== 'processing') {
            
            setActiveBots(prev => prev.map(b => 
              b.id === bot.id 
                ? { ...b, state: 'processing', processingStatus: 'Starting processing...' }
                : b
            ));

            await processRecording(bot.id);
          }
        } catch (error) {
          // // console.error('Error checking bot status:', error);
          
          // If bot is not found (404), remove it from active bots to stop polling
          if (error instanceof Error && error.message.includes('404')) {
            // // console.log(`🗑️ Bot ${bot.id} not found, removing from active tracking`);
            setActiveBots(prev => prev.filter(b => b.id !== bot.id));
          }
        }
      }
    }, 10000); // Optimized: Check bot status every 10 seconds instead of 5

    return () => clearInterval(interval);
  }, [activeBots]);

  const processRecording = async (botId: string) => {
    if (!user?.email) return;

    try {
      // // console.log('Starting recording processing for bot:', botId);

      const updateProcessingStatus = (status: string) => {
        setActiveBots(prev => prev.map(b => 
          b.id === botId ? { ...b, processingStatus: status } : b
        ));
      };

      // Get recording URL
      const recording = await getBotRecording(botId);
      if (!recording || !recording.url) {
        throw new Error('No recording URL available');
      }

      // Get transcript with retries
      let transcriptData: TranscriptUtterance[] | null = null;
      let attempts = 0;
      const maxAttempts = 5;
      const retryDelay = 3000;

      while (attempts < maxAttempts) {
        updateProcessingStatus(`Fetching transcript (Attempt ${attempts + 1}/${maxAttempts})...`);
        transcriptData = await getBotTranscript(botId);

        if (transcriptData && transcriptData.length > 0) {
          break;
        }

        attempts++;
        if (attempts < maxAttempts) {
          updateProcessingStatus(`Waiting ${retryDelay / 1000}s before retry ${attempts + 1}/${maxAttempts}...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }

      if (!transcriptData || transcriptData.length === 0) {
        throw new Error('No transcript data available after multiple attempts.');
      }

      // Build transcript
      const speakerTranscript: SpeakerTranscriptEntry[] = (transcriptData || []).map((utt) => {
        let text = '';
        if (utt.transcription && typeof utt.transcription === 'object') {
          text = utt.transcription.transcript || '';
        } else if (typeof utt.transcription === 'string') {
          text = utt.transcription;
        }

        return {
          speaker: utt.speaker_name || 'Unknown',
          text,
          timestamp: formatTimestampMMSS(utt.timestamp_ms)
        };
      });

      const transcript = speakerTranscript.map((st) => st.text).join(' ').trim();
      const timestamp = Date.now();
      const uniqueId = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;

      // Generate summary
      updateProcessingStatus('Generating summary...');
      const summaryRes = await fetch('/api/generate-summary-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });

      if (!summaryRes.ok) {
        throw new Error('Failed to start summary generation');
      }

      const { summaryId } = await summaryRes.json();

      // Poll for summary results
      updateProcessingStatus('Waiting for summary to complete...');
      let summaryAttempts = 0;
      const maxSummaryAttempts = 60;
      let summaryData = null;

      while (summaryAttempts < maxSummaryAttempts) {
        await new Promise(r => setTimeout(r, 5000));
        summaryAttempts++;

        const statusRes = await fetch(`/api/summary-status?summaryId=${summaryId}`);
        if (!statusRes.ok) continue;

        const jobStatus = await statusRes.json();
        if (jobStatus.status === 'completed') {
          summaryData = jobStatus.result;
          break;
        }
        if (jobStatus.status === 'error') {
          throw new Error(jobStatus.error || 'Summary generation failed');
        }

        updateProcessingStatus(`Summary status: ${jobStatus.status}... (${summaryAttempts}/${maxSummaryAttempts})`);
      }

      if (!summaryData) {
        throw new Error('Summary generation timeout');
      }

      const { emoji: meetingEmoji, name: meetingName, notes: meetingNotes } = summaryData;

      // Extract action items
      updateProcessingStatus('Extracting action items...');
      const actionItemsResponse = await fetch('/api/extract-action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });

      let extractedActionItems = [];
      if (actionItemsResponse.ok) {
        const actionItemsData = await actionItemsResponse.json();
        extractedActionItems = actionItemsData.actionItems || [];
      }

      // Save to Firestore
      updateProcessingStatus('Saving meeting data...');
      const db = getFirebaseDb();
      const batch = writeBatch(db);

      const meetingData = {
        audioURL: recording.url,
        emoji: meetingEmoji || '📝',
        id: uniqueId,
        name: meetingName || 'New Meeting',
        notes: meetingNotes || '',
        'speaker transcript': speakerTranscript,
        tags: ['meeting'],
        timestamp: serverTimestamp(),
        timestampMs: Date.now(),
        title: meetingName || 'New Meeting',
        transcript,
        type: 'recording',
        actionItems: extractedActionItems.map((item: ActionItem) => ({
          id: `${uniqueId}-${Math.random().toString(36).substring(2, 15)}`,
          title: item.title,
          description: item.description,
          done: false
        })),
        speakerCount: new Set(speakerTranscript.map(st => st.speaker)).size,
      };

      const meetingsCollection = collection(db, 'transcript', user.email, 'timestamps');
      const meetingRef = doc(meetingsCollection, uniqueId);
      await batch.set(meetingRef, meetingData);

      // Save action items
      if (extractedActionItems.length > 0) {
        updateProcessingStatus('Saving action items...');
        await batch.commit();

        const actionItemsCollection = collection(db, 'transcript', user.email, 'actionItems');
        
        for (let i = 0; i < extractedActionItems.length; i++) {
          const item = extractedActionItems[i];
          const actionItemId = `${uniqueId}_${i}`;
          
          const actionItemData = {
            description: item.description || 'No description provided',
            done: false,
            id: actionItemId,
            meeting: {
              id: uniqueId,
              name: meetingName || 'New Meeting',
              timestamp: serverTimestamp()
            },
            title: item.title || 'Untitled Action Item'
          };

          const actionItemRef = doc(actionItemsCollection, actionItemId);
          await setDoc(actionItemRef, actionItemData);
        }
      } else {
        await batch.commit();
      }

      // Process automations
      updateProcessingStatus('Processing automations...');
      await exportToNotion(user.email);

      // Refresh meetings
      refreshMeetings();

      toast({
        title: 'Meeting recorded successfully',
        description: 'The recording and notes have been saved.',
      });

      // Remove bot from active list
      setActiveBots(prev => prev.filter(b => b.id !== botId));

    } catch (error: any) {
      // console.error('Error processing recording:', error);
      toast({
        title: 'Error processing recording',
        description: error.message,
        variant: 'destructive',
      });

      // Update bot status to show error
      setActiveBots(prev => prev.map(b => 
        b.id === botId 
          ? { ...b, state: 'error', processingStatus: `Error: ${error.message}` }
          : b
      ));
    }
  };

  const addBot = (botId: string, meetingUrl: string) => {
    setActiveBots(prev => [...prev, {
      id: botId,
      state: 'joining',
      meetingUrl,
      processingStatus: 'Bot joining meeting...'
    }]);
  };

  const removeBot = (botId: string) => {
    setActiveBots(prev => prev.filter(bot => bot.id !== botId));
  };

  const finishBot = async (botId: string) => {
    try {
      await leaveBot(botId);
      setActiveBots(prev => prev.map(b => 
        b.id === botId ? { ...b, state: 'leaving', processingStatus: 'Bot leaving meeting...' } : b
      ));
      
      toast({
        title: 'Bot leaving meeting',
        description: 'The bot is leaving. Recording processing will begin shortly.',
      });
    } catch (error: any) {
      // console.error('Error leaving meeting:', error);
      toast({
        title: 'Failed to leave meeting',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <BotStatusContext.Provider value={{
      activeBots,
      addBot,
      removeBot,
      finishBot
    }}>
      {children}
    </BotStatusContext.Provider>
  );
} 