"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTranscriptInsights = exports.processMissedTranscripts = exports.retryFailedProcessing = exports.processTranscriptOnCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
/**
 * Cloud Function that triggers when a new transcript is created
 * Automatically processes the transcript for insights without user interaction
 */
exports.processTranscriptOnCreate = functions.firestore
    .document('transcript/{personId}/timestamps/{transcriptId}')
    .onCreate(async (snap, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { personId, transcriptId } = context.params;
    const transcriptData = snap.data();
    console.log('🔄 New transcript detected for auto-processing:', {
        personId,
        transcriptId,
        hasTranscript: !!transcriptData.transcript,
        transcriptLength: ((_a = transcriptData.transcript) === null || _a === void 0 ? void 0 : _a.length) || 0
    });
    try {
        // Check if already processed to avoid duplicates
        if (transcriptData.autoProcessed) {
            console.log('⚠️ Transcript already processed, skipping:', transcriptId);
            return null;
        }
        // Mark as processing started
        await snap.ref.update({
            autoProcessStarted: true,
            autoProcessStartedAt: new Date()
        });
        // Determine the app URL
        const appUrl = process.env.APP_URL ||
            process.env.FUNCTIONS_EMULATOR ?
            'http://localhost:3001' :
            'https://candytrail.ai';
        console.log('📡 Calling process-transcript-insights API:', appUrl);
        // Call the existing process-transcript-insights API
        const response = await fetch(`${appUrl}/api/process-transcript-insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personId,
                transcriptId,
                transcriptData,
                source: 'cloud-function-auto-process'
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API failed with status ${response.status}: ${errorText}`);
        }
        const result = await response.json();
        console.log('✅ Auto-processing completed successfully:', {
            transcriptId,
            success: result.success,
            trackerByPhrasesCount: ((_c = (_b = result.insightsData) === null || _b === void 0 ? void 0 : _b.trackerByPhrases) === null || _c === void 0 ? void 0 : _c.length) || 0,
            trackerScoringCount: Object.keys(((_d = result.insightsData) === null || _d === void 0 ? void 0 : _d.trackerScoring) || {}).length
        });
        // Mark as successfully processed
        await snap.ref.update({
            autoProcessed: true,
            autoProcessedAt: new Date(),
            autoProcessStarted: false,
            autoProcessResult: {
                success: true,
                trackerByPhrasesCount: ((_f = (_e = result.insightsData) === null || _e === void 0 ? void 0 : _e.trackerByPhrases) === null || _f === void 0 ? void 0 : _f.length) || 0,
                trackerScoringCount: Object.keys(((_g = result.insightsData) === null || _g === void 0 ? void 0 : _g.trackerScoring) || {}).length,
                processedAt: new Date().toISOString()
            }
        });
        // Log success metrics
        console.log('📊 Auto-processing metrics:', {
            personId,
            transcriptId,
            processingTimeSeconds: Date.now() - (((_h = snap.createTime) === null || _h === void 0 ? void 0 : _h.toMillis()) || 0),
            success: true
        });
        return { success: true, transcriptId };
    }
    catch (error) {
        console.error('❌ Auto-processing failed:', {
            transcriptId,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
        });
        // Mark as failed for retry/debugging
        await snap.ref.update({
            autoProcessFailed: true,
            autoProcessError: error instanceof Error ? error.message : 'Unknown error',
            autoProcessErrorAt: new Date(),
            autoProcessStarted: false,
            autoProcessRetryCount: admin.firestore.FieldValue.increment(1)
        });
        // Don't throw - we want the function to succeed even if processing fails
        // This prevents infinite retries and allows for manual intervention
        return { success: false, error: error instanceof Error ? error.message : error };
    }
});
/**
 * HTTP Cloud Function to manually retry failed auto-processing
 * Can be called from the admin dashboard to retry failed transcripts
 */
exports.retryFailedProcessing = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated (add your auth logic here)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { personId, transcriptId } = data;
    if (!personId || !transcriptId) {
        throw new functions.https.HttpsError('invalid-argument', 'personId and transcriptId are required');
    }
    try {
        console.log('🔄 Manual retry requested:', { personId, transcriptId });
        // Get the transcript document
        const transcriptRef = admin.firestore()
            .doc(`transcript/${personId}/timestamps/${transcriptId}`);
        const transcriptSnap = await transcriptRef.get();
        if (!transcriptSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Transcript not found');
        }
        // Reset failure flags
        await transcriptRef.update({
            autoProcessFailed: false,
            autoProcessError: admin.firestore.FieldValue.delete(),
            autoProcessErrorAt: admin.firestore.FieldValue.delete(),
            autoProcessRetryCount: admin.firestore.FieldValue.increment(1)
        });
        // Trigger the processing function manually
        const result = await (0, exports.processTranscriptOnCreate)(transcriptSnap, {
            params: { personId, transcriptId }
        });
        return { success: true, result };
    }
    catch (error) {
        console.error('❌ Manual retry failed:', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Retry failed');
    }
});
/**
 * Scheduled function to process any missed transcripts
 * Runs every hour to catch any transcripts that weren't auto-processed
 */
exports.processMissedTranscripts = functions.pubsub
    .schedule('0 * * * *') // Every hour
    .onRun(async (context) => {
    console.log('🔍 Checking for missed transcripts...');
    const now = admin.firestore.Timestamp.now();
    const oneHourAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - (60 * 60 * 1000));
    // Find transcripts created over an hour ago that haven't been processed
    const missedQuery = await admin.firestore()
        .collectionGroup('timestamps')
        .where('autoProcessed', '!=', true)
        .where('autoProcessFailed', '!=', true)
        .where('autoProcessStarted', '!=', true)
        .where('createdAt', '<', oneHourAgo)
        .limit(10) // Process max 10 at a time to avoid timeouts
        .get();
    console.log(`📋 Found ${missedQuery.size} missed transcripts to process`);
    const processingPromises = [];
    for (const doc of missedQuery.docs) {
        const path = doc.ref.path;
        const pathParts = path.split('/');
        const personId = pathParts[1];
        const transcriptId = pathParts[3];
        console.log('🔄 Processing missed transcript:', { personId, transcriptId });
        // Process each missed transcript
        const promise = (0, exports.processTranscriptOnCreate)(doc, {
            params: { personId, transcriptId }
        }).catch((error) => {
            console.error(`❌ Failed to process missed transcript ${transcriptId}:`, error);
        });
        processingPromises.push(promise);
    }
    await Promise.allSettled(processingPromises);
    console.log(`✅ Completed processing ${missedQuery.size} missed transcripts`);
    return null;
});
/**
 * HTTPS Cloud Function to process transcript insights
 * Replaces the Next.js API route to eliminate timeout issues
 * Can handle long-running processing without HTTP timeout limitations
 */
exports.processTranscriptInsights = functions
    .runWith({
    timeoutSeconds: 540,
    memory: '1GB' // Increased memory for better performance
})
    .https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    console.log('\n='.repeat(80));
    console.log('🚀 [CLOUD FUNCTION] Process Transcript Insights Started');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('='.repeat(80));
    try {
        const { transcriptId, personId } = data;
        if (!transcriptId || !personId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing transcriptId or personId');
        }
        console.log('\n📋 STEP 1: Processing insights for:');
        console.log('   • Person ID:', personId);
        console.log('   • Transcript ID:', transcriptId);
        // Fetch the transcript data using Firebase Admin SDK
        console.log('\n📥 STEP 2: Fetching transcript data from Firestore');
        console.log('   • Path: transcript/' + personId + '/timestamps/' + transcriptId);
        const transcriptRef = admin.firestore().collection('transcript').doc(personId).collection('timestamps').doc(transcriptId);
        const transcriptSnap = await transcriptRef.get();
        if (!transcriptSnap.exists) {
            console.log('❌ STEP 2 FAILED: Transcript document not found');
            throw new functions.https.HttpsError('not-found', 'Transcript not found');
        }
        console.log('✅ STEP 2 SUCCESS: Transcript document found');
        const transcriptData = transcriptSnap.data();
        if (!transcriptData) {
            console.log('❌ STEP 2 FAILED: No transcript data found');
            throw new functions.https.HttpsError('not-found', 'No transcript data found');
        }
        console.log('\n📊 STEP 3: Validating transcript data');
        console.log('   • Has transcript field:', !!transcriptData.transcript);
        console.log('   • Has speaker transcript field:', !!transcriptData['speaker transcript']);
        console.log('   • Transcript length:', ((_a = transcriptData.transcript) === null || _a === void 0 ? void 0 : _a.length) || 0);
        console.log('   • Speaker entries:', ((_b = transcriptData['speaker transcript']) === null || _b === void 0 ? void 0 : _b.length) || 0);
        if (!transcriptData.transcript || !transcriptData['speaker transcript']) {
            console.log('❌ STEP 3 FAILED: Missing transcript content');
            throw new functions.https.HttpsError('invalid-argument', 'Missing transcript content');
        }
        console.log('✅ STEP 3 SUCCESS: Transcript data validated');
        // Call extract-all-tracker-phrases API
        console.log('\n🔄 STEP 4: Calling extract-all-tracker-phrases API');
        const baseUrlExtract = process.env.APP_URL || 'https://candytrail.ai';
        console.log('   • Calling URL:', `${baseUrlExtract}/api/extract-all-tracker-phrases`);
        const extractResponse = await fetch(`${baseUrlExtract}/api/extract-all-tracker-phrases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transcriptText: transcriptData.transcript,
                speakerTranscript: transcriptData['speaker transcript']
            })
        });
        if (!extractResponse.ok) {
            throw new functions.https.HttpsError('internal', `Failed to extract tracker phrases: ${extractResponse.status}`);
        }
        const extractionResult = await extractResponse.json();
        console.log('✅ STEP 4 SUCCESS: Tracker phrases extracted');
        console.log('   • Success:', extractionResult.success);
        console.log('   • Trackers found:', extractionResult.trackerResults ? Object.keys(extractionResult.trackerResults).length : 0);
        // Start background sentence classification
        console.log('\n🔄 STEP 5: Starting background sentence classification');
        let classificationResult = { classifiedTranscript: [] };
        try {
            const baseUrl = baseUrlExtract;
            // STEP 5A: Start background job
            console.log('   • Starting background classification job...');
            const startResponse = await fetch(`${baseUrl}/api/trackerByPhrases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcriptText: transcriptData.transcript,
                    jobId: `${personId}_${transcriptId}_${Date.now()}`
                })
            });
            if (!startResponse.ok) {
                throw new Error(`Failed to start job: ${startResponse.status}`);
            }
            const { jobId, estimatedTime } = await startResponse.json();
            console.log('✅ STEP 5A SUCCESS: Background job started');
            console.log('   • Job ID:', jobId);
            console.log('   • Estimated time:', estimatedTime);
            // STEP 5B: Poll for completion with extended timeout for Cloud Functions
            console.log('\n⏳ STEP 5B: Polling for job completion...');
            const maxWaitTime = 45 * 60 * 1000; // 45 minutes for Cloud Functions (they can run up to 60 minutes)
            const pollInterval = 5000; // 5 seconds between polls
            const startTime = Date.now();
            let lastProgress = 0;
            while (Date.now() - startTime < maxWaitTime) {
                const statusResponse = await fetch(`${baseUrl}/api/trackerByPhrases/status/${jobId}`);
                if (!statusResponse.ok) {
                    throw new Error(`Failed to check job status: ${statusResponse.status}`);
                }
                const statusData = await statusResponse.json();
                // Show progress updates
                if (((_c = statusData.progress) === null || _c === void 0 ? void 0 : _c.percentage) !== lastProgress) {
                    console.log(`   • Progress: ${((_d = statusData.progress) === null || _d === void 0 ? void 0 : _d.completed) || 0}/${((_e = statusData.progress) === null || _e === void 0 ? void 0 : _e.total) || 0} batches (${((_f = statusData.progress) === null || _f === void 0 ? void 0 : _f.percentage) || 0}%)`);
                    if (statusData.estimatedTimeRemaining) {
                        console.log(`   • Estimated time remaining: ${statusData.estimatedTimeRemaining}`);
                    }
                    lastProgress = (_g = statusData.progress) === null || _g === void 0 ? void 0 : _g.percentage;
                }
                if (statusData.status === 'completed') {
                    classificationResult = {
                        classifiedTranscript: statusData.classifiedTranscript,
                        success: true,
                        totalSentences: statusData.totalSentences,
                        extractionMethod: statusData.extractionMethod
                    };
                    console.log('✅ STEP 5B SUCCESS: Classification completed');
                    console.log('   • Total sentences classified:', statusData.totalSentences);
                    console.log('   • Processing time:', Math.round((Date.now() - startTime) / 1000), 'seconds');
                    break;
                }
                if (statusData.status === 'failed') {
                    throw new Error(`Job failed: ${statusData.error}`);
                }
                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
            // Check if we timed out
            if (Date.now() - startTime >= maxWaitTime) {
                console.log('⚠️ STEP 5B TIMEOUT: Job did not complete within 45 minutes');
                throw new Error('Processing timeout - job took longer than expected');
            }
        }
        catch (classifyError) {
            console.log('❌ STEP 5 ERROR: Background classification failed');
            console.log('   • Error:', classifyError instanceof Error ? classifyError.message : classifyError);
            throw new functions.https.HttpsError('internal', `Classification failed: ${classifyError instanceof Error ? classifyError.message : classifyError}`);
        }
        // Generate tracker scoring based on trackerByPhrases data using OpenAI
        console.log('\n🎯 STEP 6: Generating OpenAI-powered tracker scoring analysis');
        const trackerScoring = await generateTrackerScoringWithAI(classificationResult.classifiedTranscript || []);
        console.log('   • Tracker scoring generated for:', Object.keys(trackerScoring).length, 'trackers');
        // Create insights document with both trackerByPhrases and trackerScoring
        const insightsData = {
            trackerByPhrases: classificationResult.classifiedTranscript || [],
            trackerScoring: trackerScoring,
            extractionMethod: 'cloud-function-processing',
            totalSentences: classificationResult.totalSentences || 0,
            calculatedAt: new Date(),
            transcriptId,
            personId
        };
        // Save to insights collection using Firebase Admin SDK
        const insightRef = admin.firestore().collection('insights').doc(personId).collection('timestamps').doc(transcriptId);
        await insightRef.set(insightsData);
        console.log('\n💾 STEP 7: Saving insights to Firestore');
        console.log('   • Path: insights/' + personId + '/timestamps/' + transcriptId);
        console.log('   • TrackerByPhrases count:', ((_h = classificationResult.classifiedTranscript) === null || _h === void 0 ? void 0 : _h.length) || 0);
        console.log('   • TrackerScoring trackers:', Object.keys(insightsData.trackerScoring || {}).length);
        console.log('   • Total sentences processed:', classificationResult.totalSentences || 0);
        console.log('✅ STEP 7 SUCCESS: Insights saved to Firestore');
        console.log('\n✅ CLOUD FUNCTION COMPLETE: All steps finished successfully');
        console.log('='.repeat(80));
        return {
            success: true,
            insightsData,
            message: 'Insights processed and saved successfully via Cloud Function'
        };
    }
    catch (error) {
        console.log('\n❌ CLOUD FUNCTION ERROR: Process transcript insights failed');
        console.log('   • Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.log('   • Error message:', error instanceof Error ? error.message : error);
        console.log('   • Error stack:', error instanceof Error ? error.stack : 'No stack');
        console.log('='.repeat(80));
        // Re-throw Firebase errors
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error occurred');
    }
});
// Helper function for OpenAI tracker scoring (moved from API route)
async function generateTrackerScoringWithAI(classifiedSentences) {
    console.log('🤖 Starting OpenAI-powered tracker scoring evaluation...');
    const OpenAI = require('openai');
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    // Group sentences by tracker
    const trackerGroups = {};
    classifiedSentences.forEach(sentence => {
        if (sentence.tracker && sentence.tracker !== 'none') {
            if (!trackerGroups[sentence.tracker]) {
                trackerGroups[sentence.tracker] = [];
            }
            trackerGroups[sentence.tracker].push(sentence);
        }
    });
    // Create summary of detected phrases for each tracker
    const trackerSummaries = Object.entries(trackerGroups).map(([trackerId, sentences]) => {
        return `${trackerId.toUpperCase()}: ${sentences.length} phrases detected
Examples: ${sentences.slice(0, 3).map(s => `"${s.text}"`).join(', ')}`;
    }).join('\n\n');
    const prompt = `You are an expert medical spa consultation performance evaluator. Analyze the tracker phrase detection results from a consultation transcript and provide detailed scoring.

DETECTED TRACKER PHRASES:
${trackerSummaries}

TRACKER CATEGORIES TO EVALUATE:
1. **INTRODUCTION** - Professional greeting, name introductions, welcoming patient
2. **RAPPORT-BUILDING** - Building personal connection, comfort checks, making patient feel at ease
3. **LISTENING-TO-CONCERNS** - Patient expressing concerns, objections, fears that need addressing
4. **OVERALL-ASSESSMENT** - Comprehensive evaluation, holistic approach, big-picture analysis
5. **TREATMENT-PLAN** - Specific recommendations, treatment explanations, procedure options
6. **PRICING-QUESTIONS** - Cost discussions, budget conversations, payment options
7. **FOLLOW-UP-BOOKING** - Scheduling appointments, next steps, continuity planning

For each tracker category, evaluate the performance and assign:
- **Category**: "Great", "Needs Improvement", or "Missed"
- **Reasoning**: 2-3 sentence explanation of why this score was given and specific recommendations

EVALUATION CRITERIA:
- **Great**: Strong presence with meaningful, detailed coverage
- **Needs Improvement**: Some coverage but lacking depth or frequency
- **Missed**: No or minimal coverage of this critical area

Provide specific, actionable feedback in your reasoning.

RESPONSE FORMAT (JSON):
{
  "introduction": {
    "category": "Great",
    "phraseCount": 4,
    "reasoning": "Excellent opening with warm welcome and clear introductions. The consultant established a professional yet friendly tone from the start."
  },
  "rapport-building": {
    "category": "Needs Improvement", 
    "phraseCount": 2,
    "reasoning": "Limited rapport-building detected. Consider asking more personal questions and showing greater interest in the patient's comfort level."
  }
  // ... continue for all 7 trackers
}`;
    console.log('🌐 Making OpenAI API call for tracker scoring evaluation...');
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert medical spa consultation performance evaluator. Provide detailed, actionable feedback on conversation tracking performance. Always respond with valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 2000,
            response_format: { type: "json_object" }
        });
        const rawContent = response.choices[0].message.content;
        console.log('✅ OpenAI Tracker Scoring Response received');
        console.log('📝 Raw response length:', rawContent === null || rawContent === void 0 ? void 0 : rawContent.length);
        let result;
        try {
            result = JSON.parse(rawContent || '{}');
            console.log('✅ Successfully parsed tracker scoring JSON');
        }
        catch (parseError) {
            console.error('❌ JSON Parse Error for tracker scoring:', parseError);
            // Fallback to simple scoring if OpenAI fails
            result = generateSimpleTrackerScoring(classifiedSentences);
        }
        return result;
    }
    catch (error) {
        console.error('❌ OpenAI tracker scoring failed:', error);
        // Fallback to simple scoring
        return generateSimpleTrackerScoring(classifiedSentences);
    }
}
function generateSimpleTrackerScoring(classifiedSentences) {
    console.log('📊 Using fallback simple tracker scoring...');
    const trackerScoring = {};
    // Count sentences for each tracker
    const trackerCounts = {};
    classifiedSentences.forEach(sentence => {
        if (sentence.tracker && sentence.tracker !== 'none') {
            trackerCounts[sentence.tracker] = (trackerCounts[sentence.tracker] || 0) + 1;
        }
    });
    // Define scoring criteria for each tracker
    const trackerDefinitions = [
        { id: 'introduction', name: 'Introduction', minGood: 2, minGreat: 4 },
        { id: 'rapport-building', name: 'Rapport Building', minGood: 3, minGreat: 6 },
        { id: 'listening-to-concerns', name: 'Patient Concerns', minGood: 2, minGreat: 5 },
        { id: 'overall-assessment', name: 'Overall Assessment', minGood: 2, minGreat: 4 },
        { id: 'treatment-plan', name: 'Treatment Plan', minGood: 3, minGreat: 8 },
        { id: 'pricing-questions', name: 'Pricing Questions', minGood: 1, minGreat: 3 },
        { id: 'follow-up-booking', name: 'Follow-up Booking', minGood: 1, minGreat: 3 }
    ];
    trackerDefinitions.forEach(tracker => {
        const phraseCount = trackerCounts[tracker.id] || 0;
        let category;
        let reasoning;
        if (phraseCount === 0) {
            category = 'Missed';
            reasoning = `No ${tracker.name.toLowerCase()} phrases detected in the conversation. This is a critical area that should be addressed.`;
        }
        else if (phraseCount < tracker.minGood) {
            category = 'Needs Improvement';
            reasoning = `Only ${phraseCount} ${tracker.name.toLowerCase()} phrase${phraseCount === 1 ? '' : 's'} detected. Consider expanding this area for better patient engagement.`;
        }
        else if (phraseCount < tracker.minGreat) {
            category = 'Needs Improvement';
            reasoning = `${phraseCount} ${tracker.name.toLowerCase()} phrases detected. Good coverage but could be enhanced for optimal patient experience.`;
        }
        else {
            category = 'Great';
            reasoning = `Excellent coverage with ${phraseCount} ${tracker.name.toLowerCase()} phrases detected. Strong execution in this area.`;
        }
        trackerScoring[tracker.id] = {
            category,
            phraseCount,
            reasoning
        };
    });
    return trackerScoring;
}
exports.default = { processTranscriptOnCreate: exports.processTranscriptOnCreate, retryFailedProcessing: exports.retryFailedProcessing, processMissedTranscripts: exports.processMissedTranscripts, processTranscriptInsights: exports.processTranscriptInsights };
//# sourceMappingURL=index.js.map