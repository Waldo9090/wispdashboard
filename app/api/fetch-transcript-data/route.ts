import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { documentId, transcriptId } = await request.json();
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    console.log('🔍 Fetching transcript data for:', { documentId, transcriptId });

    // If transcriptId is provided, fetch from timestamps subcollection
    if (transcriptId) {
      const transcriptRef = db.collection('transcript').doc(documentId).collection('timestamps').doc(transcriptId);
      const transcriptDoc = await transcriptRef.get();

      if (!transcriptDoc.exists) {
        console.log('⚠️ Transcript document not found:', { documentId, transcriptId });
        return NextResponse.json(
          { error: 'Transcript document not found' },
          { status: 404 }
        );
      }

      const transcriptData = transcriptDoc.data();
      
      console.log('📋 Found transcript data:', {
        hasTranscript: !!transcriptData?.transcript,
        hasSpeakerTranscript: !!transcriptData?.['speaker transcript'],
        transcriptLength: transcriptData?.transcript?.length || 0
      });
      
      return NextResponse.json({
        success: true,
        documentId,
        transcriptId,
        transcript: transcriptData?.transcript || null,
        speakerTranscript: transcriptData?.['speaker transcript'] || null,
        hasTranscript: !!transcriptData?.transcript
      });
    } else {
      // Original logic for fetching from root document
      const transcriptRef = db.collection('transcript').doc(documentId);
      const transcriptDoc = await transcriptRef.get();

      if (!transcriptDoc.exists) {
        console.log('⚠️ Transcript document not found:', documentId);
        return NextResponse.json(
          { error: 'Transcript document not found' },
          { status: 404 }
        );
      }

      const transcriptData = transcriptDoc.data();
      
      // Return the encrypted user data if it exists
      const encryptedUserData = transcriptData?.encryptedUserData || null;
      
      console.log('📋 Found encrypted user data:', !!encryptedUserData);
      
      return NextResponse.json({
        success: true,
        documentId,
        encryptedUserData,
        hasEncryptedData: !!encryptedUserData
      });
    }

  } catch (error: any) {
    console.error('❌ Error fetching transcript data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch transcript data',
        message: error.message
      },
      { status: 500 }
    );
  }
}