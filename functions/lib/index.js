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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackerJobStatus = exports.trackerByPhrases = exports.extractAllTrackerPhrases = exports.processCompleteRecording = exports.processMissedTranscripts = exports.retryFailedProcessing = exports.processTranscriptOnUpdate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
// Initialize Firebase Admin SDK
admin.initializeApp();
/**
 * Cloud Function that triggers when a transcript document is updated
 * Automatically processes the transcript for insights when transcription completes
 */
exports.processTranscriptOnUpdate = functions
    .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
})
    .firestore
    .document('transcript/{personId}/timestamps/{transcriptId}')
    .onUpdate(async (change, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const { personId, transcriptId } = context.params;
    const afterData = change.after.data();
    // Check if classification processing has already started or completed FIRST
    const classificationStarted = afterData.classification || false;
    if (classificationStarted === true) {
        // Silent exit - no logs, no processing for already classified transcripts
        return null;
    }
    console.log('🔄 Transcript document updated:', {
        personId,
        transcriptId,
        transcriptionStatus: afterData.transcriptionStatus,
        hasTranscript: !!afterData.transcript,
        transcriptLength: ((_a = afterData.transcript) === null || _a === void 0 ? void 0 : _a.length) || 0
    });
    // Only process if transcriptionStatus exists and is true
    const transcriptionStatus = afterData.transcriptionStatus;
    if (!transcriptionStatus || transcriptionStatus !== true) {
        console.log('⏭️ Transcription not ready for processing');
        console.log(`   • transcriptionStatus: ${transcriptionStatus}`);
        console.log('   • Waiting for transcriptionStatus: true');
        return null;
    }
    console.log('✅ transcriptionStatus is true - checking processing status');
    console.log('✅ Classification not started yet - proceeding with processing');
    // IMMEDIATELY set classification flag to prevent other instances from processing
    try {
        await change.after.ref.update({
            classification: true,
            classificationStartedAt: new Date()
        });
        console.log('🔒 Set classification lock to prevent duplicate processing');
    }
    catch (error) {
        console.log('❌ Failed to set classification lock:', error);
        return null;
    }
    // Check other conditions
    const hasContent = (((_b = afterData.transcript) === null || _b === void 0 ? void 0 : _b.length) || 0) > 0;
    const alreadyAutoProcessed = afterData.autoProcessed || false;
    // Also check if insights already exist to avoid duplicate processing
    let insightsExist = false;
    try {
        const insightRef = admin.firestore().collection('insights').doc(personId).collection('timestamps').doc(transcriptId);
        const insightSnap = await insightRef.get();
        insightsExist = insightSnap.exists;
    }
    catch (error) {
        console.log('⚠️ Error checking for existing insights:', error);
    }
    console.log(`📝 Processing decision:`);
    console.log(`   - transcriptionStatus: ${transcriptionStatus}`);
    console.log(`   - classification: ${classificationStarted} → true (locked)`);
    console.log(`   - Transcript length: ${((_c = afterData.transcript) === null || _c === void 0 ? void 0 : _c.length) || 0} chars`);
    console.log(`   - Has content: ${hasContent}`);
    console.log(`   - Already auto-processed: ${alreadyAutoProcessed}`);
    console.log(`   - Insights exist: ${insightsExist}`);
    if (hasContent && !alreadyAutoProcessed && !insightsExist) {
        console.log(`✨ All conditions met - processing transcript with classification lock!`);
    }
    else {
        if (!hasContent) {
            console.log('⏭️ No transcript content, skipping processing');
        }
        else if (alreadyAutoProcessed) {
            console.log('⏭️ Already auto-processed, skipping');
        }
        else if (insightsExist) {
            console.log('⏭️ Insights already exist, skipping to avoid duplicates');
        }
        return null;
    }
    try {
        // Mark as processing started
        await change.after.ref.update({
            autoProcessStarted: true,
            autoProcessStartedAt: new Date()
        });
        console.log('🔄 Processing transcript using same logic as process-transcript-insights API');
        // STEP 4: Extract tracker phrases directly (no external calls)
        console.log('\n🔄 STEP 4: Extracting tracker phrases directly');
        const extractionResult = await extractTrackerPhrasesDirectly(afterData.transcript, afterData['speaker transcript']);
        console.log('✅ STEP 4 SUCCESS: Tracker phrases extracted directly');
        console.log('   • Success:', extractionResult.success);
        console.log('   • Trackers found:', extractionResult.trackerResults ? Object.keys(extractionResult.trackerResults).length : 0);
        console.log('   • Method:', extractionResult.extractionMethod);
        console.log('   • Tokens used:', extractionResult.tokensUsed);
        console.log('   • Cost estimate:', extractionResult.costEstimate);
        // STEP 5: Process sentence classification directly (no external calls)
        console.log('\n🔄 STEP 5: Processing sentence classification directly');
        let classificationResult = { classifiedTranscript: [] };
        try {
            console.log('   • Starting direct sentence classification...');
            classificationResult = await classifyTranscriptDirectly(afterData.transcript);
            console.log('✅ STEP 5 SUCCESS: Classification completed directly');
            console.log('   • Total sentences classified:', classificationResult.totalSentences);
            console.log('   • Classified sentences:', classificationResult.classifiedTranscript.length);
        }
        catch (classifyError) {
            console.log('❌ STEP 5 ERROR: Direct classification failed');
            console.log('   • Error:', classifyError instanceof Error ? classifyError.message : classifyError);
            console.log('   • Stack:', classifyError instanceof Error ? classifyError.stack : 'No stack');
        }
        // STEP 6: Generate tracker scoring based on trackerByPhrases data using OpenAI
        console.log('\n🎯 STEP 6: Generating OpenAI-powered tracker scoring analysis');
        const trackerScoring = await generateTrackerScoringWithAI(classificationResult.classifiedTranscript || []);
        console.log('   • Tracker scoring generated for:', Object.keys(trackerScoring).length, 'trackers');
        // Create insights document with both trackerByPhrases and trackerScoring (same as API route)
        const insightsData = {
            trackerByPhrases: classificationResult.classifiedTranscript || [],
            trackerScoring: trackerScoring,
            extractionMethod: 'openai-sentence-classification',
            totalSentences: classificationResult.totalSentences || 0,
            calculatedAt: new Date(),
            transcriptId,
            personId
        };
        // Save to insights collection using Firebase Admin SDK (same as API route)
        const insightRef = admin.firestore().collection('insights').doc(personId).collection('timestamps').doc(transcriptId);
        await insightRef.set(insightsData);
        console.log('\n💾 STEP 7: Saving insights to Firestore');
        console.log('   • Path: insights/' + personId + '/timestamps/' + transcriptId);
        console.log('   • TrackerByPhrases count:', ((_d = classificationResult.classifiedTranscript) === null || _d === void 0 ? void 0 : _d.length) || 0);
        console.log('   • TrackerScoring trackers:', Object.keys(insightsData.trackerScoring || {}).length);
        console.log('   • Total sentences processed:', classificationResult.totalSentences || 0);
        console.log('   • Data structure:');
        console.log('     - trackerByPhrases length:', ((_e = insightsData.trackerByPhrases) === null || _e === void 0 ? void 0 : _e.length) || 0);
        console.log('     - trackerScoring keys:', Object.keys(insightsData.trackerScoring || {}));
        console.log('✅ STEP 7 SUCCESS: Insights saved to Firestore');
        const result = {
            success: true,
            insightsData
        };
        console.log('✅ Auto-processing completed successfully:', {
            transcriptId,
            success: result.success,
            trackerByPhrasesCount: ((_g = (_f = result.insightsData) === null || _f === void 0 ? void 0 : _f.trackerByPhrases) === null || _g === void 0 ? void 0 : _g.length) || 0,
            trackerScoringCount: Object.keys(((_h = result.insightsData) === null || _h === void 0 ? void 0 : _h.trackerScoring) || {}).length
        });
        // Mark as successfully processed
        await change.after.ref.update({
            autoProcessed: true,
            autoProcessedAt: new Date(),
            autoProcessStarted: false,
            autoProcessResult: {
                success: true,
                trackerByPhrasesCount: ((_k = (_j = result.insightsData) === null || _j === void 0 ? void 0 : _j.trackerByPhrases) === null || _k === void 0 ? void 0 : _k.length) || 0,
                trackerScoringCount: Object.keys(((_l = result.insightsData) === null || _l === void 0 ? void 0 : _l.trackerScoring) || {}).length,
                processedAt: new Date().toISOString()
            }
        });
        // Log success metrics
        console.log('📊 Auto-processing metrics:', {
            personId,
            transcriptId,
            processingTimeSeconds: Date.now() - (((_m = change.after.createTime) === null || _m === void 0 ? void 0 : _m.toMillis()) || 0),
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
        await change.after.ref.update({
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
        // Trigger the processing function manually by simulating an update
        const mockChange = {
            before: { data: () => ({}) },
            after: transcriptSnap // Use the current transcript data
        };
        const result = await (0, exports.processTranscriptOnUpdate)(mockChange, {
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
    // Note: Firestore only allows one != filter, so we'll filter the rest in code
    const missedQuery = await admin.firestore()
        .collectionGroup('timestamps')
        .where('autoProcessed', '!=', true)
        .where('createdAt', '<', oneHourAgo)
        .limit(50) // Get more to filter in code
        .get();
    // Filter out already failed or started processing in code
    const missedDocs = missedQuery.docs.filter(doc => {
        const data = doc.data();
        return !data.autoProcessFailed && !data.autoProcessStarted && data.transcript && data.transcript.length > 0;
    }).slice(0, 10); // Take only first 10
    console.log(`📋 Found ${missedDocs.length} missed transcripts to process (out of ${missedQuery.size} candidates)`);
    const processingPromises = [];
    for (const doc of missedDocs) {
        const path = doc.ref.path;
        const pathParts = path.split('/');
        const personId = pathParts[1];
        const transcriptId = pathParts[3];
        console.log('🔄 Processing missed transcript:', { personId, transcriptId });
        // Process each missed transcript by simulating an update
        const mockChange = {
            before: { data: () => ({}) },
            after: doc // Use the current document
        };
        const promise = (0, exports.processTranscriptOnUpdate)(mockChange, {
            params: { personId, transcriptId }
        }).catch((error) => {
            console.error(`❌ Failed to process missed transcript ${transcriptId}:`, error);
        });
        processingPromises.push(promise);
    }
    await Promise.allSettled(processingPromises);
    console.log(`✅ Completed processing ${missedDocs.length} missed transcripts`);
    return null;
});
/**
 * Cloud Function to process complete recording workflow
 * Replaces manualProcessRecording API and coordinates all processing
 */
exports.processCompleteRecording = functions
    .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
})
    .https.onCall(async (data, context) => {
    console.log('🚀 [PROCESS-COMPLETE-RECORDING] Starting complete recording processing');
    try {
        const { recordingData, personId, recordingId } = data;
        if (!recordingData || !personId || !recordingId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required data');
        }
        console.log('📋 Processing recording:', { personId, recordingId });
        // STEP 1: Extract and save transcript with proper format
        console.log('\n🔄 STEP 1: Processing transcript data');
        const transcriptResult = await processTranscriptData(recordingData, personId, recordingId);
        // STEP 2: Calculate analytics metrics
        console.log('\n📊 STEP 2: Calculating analytics metrics');
        const analyticsResult = await calculateAnalyticsMetrics(recordingData, personId, recordingId);
        // STEP 3: Process insights (tracker phrases + sentence classification)
        console.log('\n🎯 STEP 3: Processing insights');
        const insightsResult = await processInsightsFully(transcriptResult.transcript, transcriptResult.speakerTranscript, personId, recordingId);
        // STEP 4: Generate sales recommendations
        console.log('\n🔔 STEP 4: Generating sales recommendations');
        const salesResult = await generateSalesRecommendations(transcriptResult.transcript, insightsResult, personId, recordingId);
        // STEP 5: Send notifications
        console.log('\n📱 STEP 5: Sending push notifications');
        const notificationResult = await sendRecordingNotification(personId, recordingId, recordingData.title);
        console.log('✅ Complete recording processing finished successfully');
        return {
            success: true,
            transcript: transcriptResult,
            analytics: analyticsResult,
            insights: insightsResult,
            sales: salesResult,
            notification: notificationResult,
            recordingId,
            personId
        };
    }
    catch (error) {
        console.error('❌ Complete recording processing failed:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Complete processing failed');
    }
});
/**
 * Cloud Function to extract tracker phrases from transcript
 * Replaces /app/api/extract-all-tracker-phrases/route.ts
 */
exports.extractAllTrackerPhrases = functions
    .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
})
    .https.onCall(async (data, context) => {
    var _a, _b;
    console.log('🚀 [EXTRACT-ALL-PHRASES] Cloud Function Called');
    try {
        const { transcriptText, speakerTranscript, transcriptId, personId, saveToFirestore } = data;
        console.log('📄 Transcript length:', (transcriptText === null || transcriptText === void 0 ? void 0 : transcriptText.length) || 0);
        console.log('🎙️ Speaker entries:', (speakerTranscript === null || speakerTranscript === void 0 ? void 0 : speakerTranscript.length) || 0);
        if (!transcriptText) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing transcript text');
        }
        // If saveToFirestore mode, we need transcriptId and personId
        if (saveToFirestore && (!transcriptId || !personId)) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing transcriptId or personId for Firestore save');
        }
        // Initialize OpenAI
        const openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY
        });
        console.log('🤖 Starting OpenAI tracker phrase extraction...');
        // Enhanced prompt for better phrase extraction
        const prompt = `You are an expert at analyzing medical spa consultation transcripts. Extract specific phrases and quotes that demonstrate each tracking category.

TRANSCRIPT:
${transcriptText}

For each category below, find SPECIFIC PHRASES or QUOTES from the transcript that demonstrate that category. Return actual text snippets, not descriptions.

TRACKING CATEGORIES:
1. **INTRODUCTION** - Greetings, name introductions, welcoming statements
2. **RAPPORT-BUILDING** - Personal questions, comfort checks, building connection
3. **LISTENING-TO-CONCERNS** - Patient concerns, objections, fears being addressed
4. **OVERALL-ASSESSMENT** - Comprehensive evaluations, holistic approaches
5. **TREATMENT-PLAN** - Specific recommendations, treatment explanations
6. **PRICING-QUESTIONS** - Cost discussions, budget conversations
7. **FOLLOW-UP-BOOKING** - Scheduling, next steps, appointment booking

Response format (JSON):
{
  "introduction": ["exact phrase 1", "exact phrase 2"],
  "rapport-building": ["exact phrase 1", "exact phrase 2"],
  "listening-to-concerns": ["exact phrase 1"],
  "overall-assessment": ["exact phrase 1"],
  "treatment-plan": ["exact phrase 1", "exact phrase 2"],
  "pricing-questions": [],
  "follow-up-booking": ["exact phrase 1"]
}`;
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert at extracting specific phrases from medical spa consultations. Always respond with valid JSON containing actual quotes from the transcript."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1,
            max_tokens: 3000,
            response_format: { type: "json_object" }
        });
        const rawContent = response.choices[0].message.content;
        let trackerResults;
        try {
            trackerResults = JSON.parse(rawContent || '{}');
        }
        catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            // Fallback empty results
            trackerResults = {
                "introduction": [],
                "rapport-building": [],
                "listening-to-concerns": [],
                "overall-assessment": [],
                "treatment-plan": [],
                "pricing-questions": [],
                "follow-up-booking": []
            };
        }
        console.log('✅ Tracker phrases extracted successfully');
        console.log('📊 Results summary:', Object.entries(trackerResults).map(([key, phrases]) => `${key}: ${Array.isArray(phrases) ? phrases.length : 0} phrases`).join(', '));
        const result = {
            success: true,
            trackerResults,
            extractionMethod: 'openai-cloud-function',
            tokensUsed: ((_a = response.usage) === null || _a === void 0 ? void 0 : _a.total_tokens) || 0,
            costEstimate: `$${((((_b = response.usage) === null || _b === void 0 ? void 0 : _b.total_tokens) || 0) * 0.00015 / 1000).toFixed(4)}`
        };
        // If saveToFirestore mode, save results
        if (saveToFirestore && transcriptId && personId) {
            console.log('💾 Saving extraction results to Firestore...');
            const extractionRef = admin.firestore()
                .collection('extractions')
                .doc(personId)
                .collection('timestamps')
                .doc(transcriptId);
            await extractionRef.set(Object.assign(Object.assign({}, result), { savedAt: new Date(), transcriptId,
                personId }));
            console.log('✅ Extraction results saved to Firestore');
        }
        return result;
    }
    catch (error) {
        console.error('❌ Extract tracker phrases failed:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Extraction failed');
    }
});
exports.trackerByPhrases = functions
    .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
})
    .https.onCall(async (data, context) => {
    try {
        const { transcriptText, jobId } = data;
        if (!transcriptText) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing transcript text');
        }
        // Create job ID if not provided
        const backgroundJobId = jobId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('🚀 [TRACKER-BY-PHRASES] Starting background job:', backgroundJobId);
        console.log('📄 Transcript length:', transcriptText.length);
        // Estimate processing time based on transcript length
        const estimatedBatches = Math.ceil(transcriptText.split(/[.!?]+/).length / 10);
        const estimatedTimeMs = estimatedBatches * 3000; // 3 seconds per batch
        const estimatedTime = `${Math.round(estimatedTimeMs / 1000)} seconds`;
        // Initialize job in Firestore
        const jobRef = admin.firestore().collection('processingJobs').doc(backgroundJobId);
        const job = {
            id: backgroundJobId,
            status: 'pending',
            progress: { completed: 0, total: estimatedBatches, percentage: 0 },
            results: [],
            createdAt: new Date(),
            transcriptText
        };
        await jobRef.set(job);
        // Start background processing (don't await)
        processTranscriptInBackground(backgroundJobId, transcriptText).catch(error => {
            console.error('❌ Background processing failed:', error);
        });
        return {
            success: true,
            jobId: backgroundJobId,
            estimatedTime,
            estimatedBatches,
            status: 'pending'
        };
    }
    catch (error) {
        console.error('❌ TrackerByPhrases job creation failed:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Job creation failed');
    }
});
/**
 * Cloud Function to get job status
 * Replaces /app/api/trackerByPhrases/status/[jobId]/route.ts
 */
exports.getTrackerJobStatus = functions.https.onCall(async (data, context) => {
    var _a;
    try {
        const { jobId } = data;
        if (!jobId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing jobId');
        }
        const jobRef = admin.firestore().collection('processingJobs').doc(jobId);
        const jobDoc = await jobRef.get();
        if (!jobDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Job not found');
        }
        const job = jobDoc.data();
        // Calculate estimated time remaining
        let estimatedTimeRemaining = null;
        if (job.status === 'processing' && job.progress.percentage > 0) {
            const timeElapsed = Date.now() - (((_a = job.startedAt) === null || _a === void 0 ? void 0 : _a.getTime()) || Date.now());
            const timePerPercent = timeElapsed / job.progress.percentage;
            const remainingPercent = 100 - job.progress.percentage;
            const remainingMs = remainingPercent * timePerPercent;
            estimatedTimeRemaining = `${Math.round(remainingMs / 1000)} seconds`;
        }
        return Object.assign(Object.assign({ success: true, jobId, status: job.status, progress: job.progress, estimatedTimeRemaining }, (job.status === 'completed' && {
            classifiedTranscript: job.results,
            totalSentences: job.results.length,
            extractionMethod: 'openai-background-processing'
        })), (job.status === 'failed' && {
            error: job.error
        }));
    }
    catch (error) {
        console.error('❌ Get job status failed:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Status check failed');
    }
});
// Background processing function
async function processTranscriptInBackground(jobId, transcriptText) {
    const jobRef = admin.firestore().collection('processingJobs').doc(jobId);
    try {
        console.log('🔄 Starting background processing for job:', jobId);
        // Update job status to processing
        await jobRef.update({
            status: 'processing',
            startedAt: new Date()
        });
        // Initialize OpenAI
        const openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY
        });
        // Split transcript into sentences
        const sentences = transcriptText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        console.log('📊 Total sentences to classify:', sentences.length);
        if (sentences.length === 0) {
            console.log('⚠️ No sentences found - treating entire transcript as one sentence');
            sentences.push(transcriptText.trim());
        }
        const classifiedTranscript = [];
        const batchSize = 10;
        const parallelBatches = 5; // Process 5 batches in parallel
        // Create all batches first
        const allBatches = [];
        for (let i = 0; i < sentences.length; i += batchSize) {
            const batch = sentences.slice(i, i + batchSize);
            allBatches.push({ batch, startIndex: i });
        }
        const totalBatches = allBatches.length;
        console.log(`📊 Background job - Total batches to process: ${totalBatches}`);
        console.log(`🚀 Processing ${parallelBatches} batches in parallel`);
        // Process batches in parallel groups
        for (let groupStart = 0; groupStart < allBatches.length; groupStart += parallelBatches) {
            const batchGroup = allBatches.slice(groupStart, groupStart + parallelBatches);
            const groupNumber = Math.floor(groupStart / parallelBatches) + 1;
            const totalGroups = Math.ceil(allBatches.length / parallelBatches);
            console.log(`🔄 Processing parallel group ${groupNumber}/${totalGroups} (${batchGroup.length} batches)`);
            // Process all batches in this group in parallel
            const batchPromises = batchGroup.map(async ({ batch, startIndex }) => {
                const batchNumber = Math.floor(startIndex / batchSize) + 1;
                try {
                    const prompt = `Classify each sentence into one of these tracker categories or 'none':
- introduction: Professional greeting, name introductions, welcoming patient
- rapport-building: Building personal connection, comfort checks, making patient feel at ease
- listening-to-concerns: Patient expressing concerns, objections, fears that need addressing
- overall-assessment: Comprehensive evaluation, holistic approach, big-picture analysis
- treatment-plan: Specific recommendations, treatment explanations, procedure options
- pricing-questions: Cost discussions, budget conversations, payment options
- follow-up-booking: Scheduling appointments, next steps, continuity planning

Sentences to classify:
${batch.map((s, idx) => `${startIndex + idx + 1}. "${s.trim()}"`).join('\n')}

Respond with JSON object: {"classifications": [{"text": "sentence", "tracker": "category"}]}`;
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: "You are an expert at classifying medical spa consultation sentences. Always respond with valid JSON."
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
                    const result = JSON.parse(response.choices[0].message.content || '{"classifications": []}');
                    const classifications = result.classifications || [];
                    return { batchNumber, classifications };
                }
                catch (error) {
                    console.error(`❌ Error processing batch ${batchNumber}:`, error);
                    // Add sentences as unclassified on error
                    const errorClassifications = batch.map(sentence => ({
                        text: sentence.trim(),
                        tracker: 'none'
                    }));
                    return { batchNumber, classifications: errorClassifications, error: true };
                }
            });
            // Wait for all batches in this parallel group to complete
            const groupResults = await Promise.allSettled(batchPromises);
            // Process results from this parallel group
            groupResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    const { classifications } = result.value;
                    classifiedTranscript.push(...classifications);
                }
                else {
                    console.error(`❌ Batch failed completely:`, result.reason);
                }
            });
            // Update progress after each parallel group
            const completed = Math.min(groupStart + parallelBatches, totalBatches);
            const percentage = Math.round((completed / totalBatches) * 100);
            await jobRef.update({
                'progress.completed': completed,
                'progress.total': totalBatches,
                'progress.percentage': percentage
            });
            console.log(`✅ Parallel group ${groupNumber}/${totalGroups} completed`);
            // Small delay between parallel groups to avoid overwhelming OpenAI API
            if (groupStart + parallelBatches < allBatches.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        // Mark job as completed
        await jobRef.update({
            status: 'completed',
            completedAt: new Date(),
            results: classifiedTranscript,
            'progress.percentage': 100
        });
        console.log(`✅ Background processing completed for job ${jobId}:`, {
            totalSentences: sentences.length,
            classifiedSentences: classifiedTranscript.length
        });
    }
    catch (error) {
        console.error(`❌ Background processing failed for job ${jobId}:`, error);
        // Mark job as failed
        await jobRef.update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Processing failed',
            completedAt: new Date()
        });
    }
}
// Helper function for OpenAI tracker scoring (moved from API route)
async function generateTrackerScoringWithAI(classifiedSentences) {
    console.log('🤖 Starting OpenAI-powered tracker scoring evaluation...');
    const openai = new openai_1.default({
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
// Helper functions for complete recording processing
async function processTranscriptData(recordingData, personId, recordingId) {
    console.log('🔄 Processing transcript data...');
    // Extract transcript and speaker data from recording
    const transcript = recordingData.transcript || '';
    const speakerTranscript = recordingData.speakerTranscript || recordingData['speaker transcript'] || [];
    console.log('📄 Transcript length:', transcript.length);
    console.log('🎙️ Speaker entries:', speakerTranscript.length);
    // Save to Firestore with proper format
    const transcriptRef = admin.firestore()
        .collection('transcript')
        .doc(personId)
        .collection('timestamps')
        .doc(recordingId);
    const transcriptDocument = {
        transcript,
        'speaker transcript': speakerTranscript,
        transcriptionStatus: true,
        calculatedAt: new Date(),
        durationSeconds: recordingData.durationSeconds || 0,
        title: recordingData.title || 'Untitled Recording',
        hasWordLevelData: speakerTranscript.length > 0,
        recordingId,
        personId
    };
    await transcriptRef.set(transcriptDocument);
    console.log('✅ Transcript data saved to Firestore');
    return { transcript, speakerTranscript, transcriptDocument };
}
async function calculateAnalyticsMetrics(recordingData, personId, recordingId) {
    console.log('📊 Calculating analytics metrics...');
    // Basic analytics calculation (simplified version)
    const speakerTranscript = recordingData.speakerTranscript || [];
    const durationSeconds = recordingData.durationSeconds || 0;
    // Calculate basic metrics
    const consultantWords = speakerTranscript.filter((s) => s.speaker === 'Consultant').length;
    const customerWords = speakerTranscript.filter((s) => s.speaker === 'Customer' || s.speaker === 'Patient').length;
    const totalWords = consultantWords + customerWords;
    const analytics = {
        calculatedAt: new Date(),
        hasValidSpeakerData: speakerTranscript.length > 0,
        durationSeconds,
        talkRatio: totalWords > 0 ? consultantWords / totalWords : 0,
        longestMonologue: 0,
        longestCustomerStory: durationSeconds * 0.4,
        interactivity: speakerTranscript.length > 10 ? 0.8 : 0.2,
        talkSpeed: totalWords > 0 ? totalWords / Math.max(durationSeconds, 1) : 0,
        patience: 0.7 // Default value
    };
    // Save analytics to Firestore
    const analyticsRef = admin.firestore()
        .collection('analytics')
        .doc(personId)
        .collection('timestamps')
        .doc(recordingId);
    await analyticsRef.set(analytics);
    console.log('✅ Analytics data saved');
    return analytics;
}
async function processInsightsFully(transcript, speakerTranscript, personId, recordingId) {
    var _a;
    console.log('🎯 Processing complete insights...');
    // STEP 1: Extract tracker phrases
    await extractTrackerPhrasesDirectly(transcript, speakerTranscript);
    // STEP 2: Classify sentences with proper format
    const classificationResult = await classifyTranscriptDirectly(transcript);
    // STEP 3: Generate tracker scoring
    const trackerScoring = await generateTrackerScoringWithAI(classificationResult.classifiedTranscript || []);
    // STEP 4: Save to insights collection
    const insightsData = {
        trackerByPhrases: classificationResult.classifiedTranscript || [],
        trackerScoring: trackerScoring,
        extractionMethod: 'cloud-function-complete',
        totalSentences: classificationResult.totalSentences || 0,
        calculatedAt: new Date(),
        transcriptId: recordingId,
        personId
    };
    const insightRef = admin.firestore()
        .collection('insights')
        .doc(personId)
        .collection('timestamps')
        .doc(recordingId);
    await insightRef.set(insightsData);
    console.log('✅ Insights saved with', ((_a = classificationResult.classifiedTranscript) === null || _a === void 0 ? void 0 : _a.length) || 0, 'classified sentences');
    return insightsData;
}
async function generateSalesRecommendations(transcript, insights, personId, recordingId) {
    console.log('🔔 Generating sales recommendations...');
    // Simple sales recommendations based on tracker scoring
    const recommendations = [];
    const trackerScoring = insights.trackerScoring || {};
    Object.entries(trackerScoring).forEach(([tracker, data]) => {
        if (data.category === 'Missed' || data.category === 'Needs Improvement') {
            recommendations.push({
                type: 'improvement',
                tracker,
                message: data.reasoning,
                priority: data.category === 'Missed' ? 'high' : 'medium'
            });
        }
    });
    // Save recommendations to alerts collection
    if (recommendations.length > 0) {
        const alertRef = admin.firestore()
            .collection('alerts')
            .doc(personId)
            .collection('recommendations')
            .doc(recordingId);
        await alertRef.set({
            recommendations,
            createdAt: new Date(),
            recordingId,
            personId,
            type: 'sales_recommendations'
        });
        console.log('✅ Sales recommendations saved:', recommendations.length, 'items');
    }
    return { recommendations, count: recommendations.length };
}
async function sendRecordingNotification(personId, recordingId, title) {
    console.log('📱 Sending recording completion notification...');
    try {
        // Get FCM token from user document
        const userRef = admin.firestore().collection('users').doc(personId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            console.log('❌ User document not found for notifications');
            return { success: false, error: 'User not found' };
        }
        const userData = userDoc.data();
        const fcmToken = userData === null || userData === void 0 ? void 0 : userData.fcmToken;
        if (!fcmToken) {
            console.log('❌ No FCM token found for user');
            return { success: false, error: 'No FCM token' };
        }
        // Send notification
        const message = {
            token: fcmToken,
            notification: {
                title: 'Recording Processed',
                body: `"${title}" has been analyzed and is ready for review.`
            },
            data: {
                recordingId,
                personId,
                type: 'recording_complete'
            }
        };
        const response = await admin.messaging().send(message);
        console.log('✅ Push notification sent successfully:', response);
        return { success: true, messageId: response };
    }
    catch (error) {
        console.error('❌ Failed to send push notification:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Notification failed' };
    }
}
// Helper functions for direct processing (no external API calls)
async function extractTrackerPhrasesDirectly(transcriptText, speakerTranscript) {
    var _a, _b;
    console.log('🤖 Starting direct tracker phrase extraction...');
    const openai = new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY
    });
    const prompt = `You are an expert at analyzing medical spa consultation transcripts. Extract specific phrases and quotes that demonstrate each tracking category.

TRANSCRIPT:
${transcriptText}

For each category below, find SPECIFIC PHRASES or QUOTES from the transcript that demonstrate that category. Return actual text snippets, not descriptions.

TRACKING CATEGORIES:
1. **INTRODUCTION** - Greetings, name introductions, welcoming statements
2. **RAPPORT-BUILDING** - Personal questions, comfort checks, building connection
3. **LISTENING-TO-CONCERNS** - Patient concerns, objections, fears being addressed
4. **OVERALL-ASSESSMENT** - Comprehensive evaluations, holistic approaches
5. **TREATMENT-PLAN** - Specific recommendations, treatment explanations
6. **PRICING-QUESTIONS** - Cost discussions, budget conversations
7. **FOLLOW-UP-BOOKING** - Scheduling, next steps, appointment booking

Response format (JSON):
{
  "introduction": ["exact phrase 1", "exact phrase 2"],
  "rapport-building": ["exact phrase 1", "exact phrase 2"],
  "listening-to-concerns": ["exact phrase 1"],
  "overall-assessment": ["exact phrase 1"],
  "treatment-plan": ["exact phrase 1", "exact phrase 2"],
  "pricing-questions": [],
  "follow-up-booking": ["exact phrase 1"]
}`;
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are an expert at extracting specific phrases from medical spa consultations. Always respond with valid JSON containing actual quotes from the transcript."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: "json_object" }
    });
    const rawContent = response.choices[0].message.content;
    let trackerResults;
    try {
        trackerResults = JSON.parse(rawContent || '{}');
    }
    catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        trackerResults = {
            "introduction": [],
            "rapport-building": [],
            "listening-to-concerns": [],
            "overall-assessment": [],
            "treatment-plan": [],
            "pricing-questions": [],
            "follow-up-booking": []
        };
    }
    return {
        success: true,
        trackerResults,
        extractionMethod: 'openai-direct',
        tokensUsed: ((_a = response.usage) === null || _a === void 0 ? void 0 : _a.total_tokens) || 0,
        costEstimate: `$${((((_b = response.usage) === null || _b === void 0 ? void 0 : _b.total_tokens) || 0) * 0.00015 / 1000).toFixed(4)}`
    };
}
async function classifyTranscriptDirectly(transcriptText) {
    console.log('🤖 Starting direct sentence classification...');
    const openai = new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY
    });
    // Split transcript into sentences
    const sentences = transcriptText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    console.log('📊 Total sentences to classify:', sentences.length);
    if (sentences.length === 0) {
        console.log('⚠️ No sentences found - treating entire transcript as one sentence');
        sentences.push(transcriptText.trim());
    }
    const classifiedTranscript = [];
    const batchSize = 10;
    const parallelBatches = 5; // Process 5 batches in parallel
    // Create all batches first
    const allBatches = [];
    for (let i = 0; i < sentences.length; i += batchSize) {
        const batch = sentences.slice(i, i + batchSize);
        allBatches.push({ batch, startIndex: i });
    }
    const totalBatches = allBatches.length;
    console.log(`📊 Total batches to process: ${totalBatches}`);
    console.log(`🚀 Processing ${parallelBatches} batches in parallel`);
    // Process batches in parallel groups
    for (let groupStart = 0; groupStart < allBatches.length; groupStart += parallelBatches) {
        const batchGroup = allBatches.slice(groupStart, groupStart + parallelBatches);
        const groupNumber = Math.floor(groupStart / parallelBatches) + 1;
        const totalGroups = Math.ceil(allBatches.length / parallelBatches);
        console.log(`🔄 Processing parallel group ${groupNumber}/${totalGroups} (${batchGroup.length} batches)`);
        // Process all batches in this group in parallel
        const batchPromises = batchGroup.map(async ({ batch, startIndex }) => {
            const batchNumber = Math.floor(startIndex / batchSize) + 1;
            try {
                const prompt = `Classify each sentence into one of these tracker categories or 'none':
- introduction: Professional greeting, name introductions, welcoming patient
- rapport-building: Building personal connection, comfort checks, making patient feel at ease
- listening-to-concerns: Patient expressing concerns, objections, fears that need addressing
- overall-assessment: Comprehensive evaluation, holistic approach, big-picture analysis
- treatment-plan: Specific recommendations, treatment explanations, procedure options
- pricing-questions: Cost discussions, budget conversations, payment options
- follow-up-booking: Scheduling appointments, next steps, continuity planning

Sentences to classify:
${batch.map((s, idx) => `${startIndex + idx + 1}. "${s.trim()}"`).join('\n')}

Respond with JSON object: {"sentences": [{"text": "sentence", "tracker": "category"}]}`;
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert at classifying medical spa consultation sentences. Always respond with valid JSON."
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
                const result = JSON.parse(response.choices[0].message.content || '{"sentences": []}');
                // Handle different possible OpenAI response formats
                let classifications = [];
                if (result.sentences && Array.isArray(result.sentences)) {
                    classifications = result.sentences;
                }
                else if (Array.isArray(result)) {
                    classifications = result;
                }
                else {
                    console.log(`❌ Unexpected OpenAI response format for batch ${batchNumber}:`, result);
                    // Still continue processing but log the unexpected format
                    classifications = result.sentences || [];
                }
                // Return classifications with metadata for this batch
                const batchResults = classifications.map((classification, idx) => {
                    const sentenceIndex = startIndex + idx;
                    const sentence = batch[idx] || '';
                    return {
                        text: classification.text || sentence.trim(),
                        tracker: classification.tracker || 'none',
                        confidence: 0.8,
                        start: sentenceIndex * 1000,
                        end: (sentenceIndex + 1) * 1000,
                        timestamp: `${Math.floor(sentenceIndex * 1).toString().padStart(2, '0')}:${Math.floor((sentenceIndex * 1) % 60).toString().padStart(2, '0')}`,
                        batchNumber
                    };
                });
                // If no classifications returned, add all sentences as 'none'
                if (batchResults.length === 0) {
                    batch.forEach((sentence, idx) => {
                        const sentenceIndex = startIndex + idx;
                        batchResults.push({
                            text: sentence.trim(),
                            tracker: 'none',
                            confidence: 0.8,
                            start: sentenceIndex * 1000,
                            end: (sentenceIndex + 1) * 1000,
                            timestamp: `${Math.floor(sentenceIndex * 1).toString().padStart(2, '0')}:${Math.floor((sentenceIndex * 1) % 60).toString().padStart(2, '0')}`,
                            batchNumber
                        });
                    });
                }
                console.log(`✅ Batch ${batchNumber} completed: ${batchResults.length} sentences classified`);
                return { batchNumber, results: batchResults };
            }
            catch (error) {
                console.error(`❌ Error processing batch ${batchNumber}:`, error);
                // Add sentences as unclassified on error
                const errorResults = batch.map((sentence, idx) => {
                    const sentenceIndex = startIndex + idx;
                    return {
                        text: sentence.trim(),
                        tracker: 'none',
                        confidence: 0.8,
                        start: sentenceIndex * 1000,
                        end: (sentenceIndex + 1) * 1000,
                        timestamp: `${Math.floor(sentenceIndex * 1).toString().padStart(2, '0')}:${Math.floor((sentenceIndex * 1) % 60).toString().padStart(2, '0')}`,
                        batchNumber,
                        error: true
                    };
                });
                return { batchNumber, results: errorResults, error: true };
            }
        });
        // Wait for all batches in this parallel group to complete
        const groupResults = await Promise.allSettled(batchPromises);
        // Process results from this parallel group
        groupResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const { results } = result.value;
                classifiedTranscript.push(...results);
            }
            else {
                const batchInfo = batchGroup[index];
                const batchNumber = Math.floor(batchInfo.startIndex / batchSize) + 1;
                console.error(`❌ Batch ${batchNumber} failed completely:`, result.reason);
                // Add all sentences from failed batch as 'none'
                batchInfo.batch.forEach((sentence, idx) => {
                    const sentenceIndex = batchInfo.startIndex + idx;
                    classifiedTranscript.push({
                        text: sentence.trim(),
                        tracker: 'none',
                        confidence: 0.8,
                        start: sentenceIndex * 1000,
                        end: (sentenceIndex + 1) * 1000,
                        timestamp: `${Math.floor(sentenceIndex * 1).toString().padStart(2, '0')}:${Math.floor((sentenceIndex * 1) % 60).toString().padStart(2, '0')}`,
                        batchNumber,
                        error: true
                    });
                });
            }
        });
        console.log(`✅ Parallel group ${groupNumber}/${totalGroups} completed`);
        // Small delay between parallel groups to avoid overwhelming OpenAI API
        if (groupStart + parallelBatches < allBatches.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    console.log(`✅ Direct sentence classification completed: ${classifiedTranscript.length} sentences processed`);
    return {
        classifiedTranscript,
        totalSentences: sentences.length,
        success: true,
        extractionMethod: 'openai-direct-processing'
    };
}
exports.default = {
    processTranscriptOnUpdate: exports.processTranscriptOnUpdate,
    retryFailedProcessing: exports.retryFailedProcessing,
    processMissedTranscripts: exports.processMissedTranscripts,
    extractAllTrackerPhrases: exports.extractAllTrackerPhrases,
    trackerByPhrases: exports.trackerByPhrases,
    getTrackerJobStatus: exports.getTrackerJobStatus,
    processCompleteRecording: exports.processCompleteRecording
};
//# sourceMappingURL=index.js.map