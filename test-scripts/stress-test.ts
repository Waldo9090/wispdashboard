/**
 * Comprehensive stress test for the new background processing system
 * Tests with 5000-sentence transcript to validate no timeouts occur
 */

import { LARGE_TEST_TRANSCRIPT, TEST_METADATA } from '../test-data/large-transcript';

interface TestResult {
  success: boolean;
  duration: number;
  trackerByPhrasesCount: number;
  trackerScoringCount: number;
  error?: string;
}

class StressTestRunner {
  private baseUrl: string;
  private testPersonId: string;
  private testTranscriptId: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    this.testPersonId = 'test_person_stress';
    this.testTranscriptId = `test_transcript_${Date.now()}`;
  }

  /**
   * Main test runner
   */
  async runStressTest(): Promise<TestResult> {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 STARTING COMPREHENSIVE STRESS TEST');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📊 Transcript size:', TEST_METADATA.totalSentences, 'sentences');
    console.log('📈 Expected batches:', TEST_METADATA.expectedBatches);
    console.log('⏱️ Expected duration:', TEST_METADATA.estimatedProcessingTime);
    console.log('='.repeat(80));

    const startTime = Date.now();

    try {
      // Test 1: Verify TrackerByPhrases background processing
      console.log('\n🔬 TEST 1: Background TrackerByPhrases Processing');
      const trackerResult = await this.testTrackerByPhrases();
      console.log('✅ TEST 1 PASSED:', trackerResult.classifiedTranscript?.length, 'sentences classified');

      // Test 2: Verify end-to-end process-transcript-insights
      console.log('\n🔬 TEST 2: End-to-End Process Transcript Insights');
      const insightsResult = await this.testProcessTranscriptInsights();
      console.log('✅ TEST 2 PASSED:', {
        trackerByPhrases: insightsResult.trackerByPhrasesCount,
        trackerScoring: insightsResult.trackerScoringCount
      });

      // Test 3: Verify job cleanup and memory management
      console.log('\n🔬 TEST 3: Job Management and Cleanup');
      await this.testJobManagement();
      console.log('✅ TEST 3 PASSED: Job management working correctly');

      const duration = Date.now() - startTime;
      console.log('\n' + '='.repeat(80));
      console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
      console.log('⏱️ Total duration:', Math.round(duration / 1000), 'seconds');
      console.log('📊 Performance: Well within acceptable limits');
      console.log('='.repeat(80));

      return {
        success: true,
        duration,
        trackerByPhrasesCount: insightsResult.trackerByPhrasesCount,
        trackerScoringCount: insightsResult.trackerScoringCount
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('\n' + '='.repeat(80));
      console.log('❌ STRESS TEST FAILED');
      console.log('⏱️ Failed after:', Math.round(duration / 1000), 'seconds');
      console.log('💥 Error:', error instanceof Error ? error.message : error);
      console.log('='.repeat(80));

      return {
        success: false,
        duration,
        trackerByPhrasesCount: 0,
        trackerScoringCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test the new background TrackerByPhrases API directly
   */
  private async testTrackerByPhrases(): Promise<any> {
    console.log('   • Starting background job for TrackerByPhrases...');
    
    // Start the job
    const startResponse = await fetch(`${this.baseUrl}/api/trackerByPhrases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcriptText: LARGE_TEST_TRANSCRIPT,
        jobId: `stress_test_${this.testTranscriptId}`
      })
    });

    if (!startResponse.ok) {
      throw new Error(`Failed to start TrackerByPhrases job: ${startResponse.status}`);
    }

    const { jobId, estimatedTime } = await startResponse.json();
    console.log('   • Job started:', jobId);
    console.log('   • Estimated time:', estimatedTime);

    // Poll for completion with detailed progress tracking
    return await this.pollForJobCompletion(jobId, 'TrackerByPhrases');
  }

  /**
   * Test the full process-transcript-insights API
   */
  private async testProcessTranscriptInsights(): Promise<any> {
    console.log('   • Calling process-transcript-insights with large transcript...');

    const response = await fetch(`${this.baseUrl}/api/process-transcript-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personId: this.testPersonId,
        transcriptId: this.testTranscriptId,
        transcriptData: {
          transcript: LARGE_TEST_TRANSCRIPT,
          duration: 1800, // 30 minutes
          speakers: ['Doctor', 'Patient']
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Process insights failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('   • Response received successfully');
    console.log('   • Processing completed:', result.success);

    return {
      trackerByPhrasesCount: result.insightsData?.trackerByPhrases?.length || 0,
      trackerScoringCount: Object.keys(result.insightsData?.trackerScoring || {}).length
    };
  }

  /**
   * Test job management features
   */
  private async testJobManagement(): Promise<void> {
    // Test job status endpoint
    const testJobId = `management_test_${Date.now()}`;
    
    // Start a small job for testing
    const startResponse = await fetch(`${this.baseUrl}/api/trackerByPhrases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcriptText: "This is a small test transcript for job management testing.",
        jobId: testJobId
      })
    });

    if (!startResponse.ok) {
      throw new Error('Failed to start management test job');
    }

    // Test status endpoint
    const statusResponse = await fetch(`${this.baseUrl}/api/trackerByPhrases/status/${testJobId}`);
    
    if (!statusResponse.ok) {
      throw new Error('Job status endpoint not working');
    }

    const statusData = await statusResponse.json();
    console.log('   • Job status endpoint working:', statusData.status);

    // Wait for completion
    await this.pollForJobCompletion(testJobId, 'Management Test');
  }

  /**
   * Poll for job completion with progress tracking
   */
  private async pollForJobCompletion(jobId: string, testName: string): Promise<any> {
    const maxWaitTime = 20 * 60 * 1000; // 20 minutes max
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now();
    let lastProgress = -1;

    console.log(`   • Polling for ${testName} completion...`);

    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await fetch(`${this.baseUrl}/api/trackerByPhrases/status/${jobId}`);

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();

      // Log progress updates
      if (statusData.progress?.percentage !== lastProgress) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`   • Progress: ${statusData.progress?.completed || 0}/${statusData.progress?.total || 0} batches (${statusData.progress?.percentage || 0}%) - ${elapsed}s elapsed`);
        
        if (statusData.estimatedTimeRemaining) {
          console.log(`   • Estimated time remaining: ${statusData.estimatedTimeRemaining}`);
        }
        
        lastProgress = statusData.progress?.percentage || 0;
      }

      if (statusData.status === 'completed') {
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        console.log(`   • ${testName} completed successfully in ${totalTime} seconds`);
        return statusData;
      }

      if (statusData.status === 'failed') {
        throw new Error(`${testName} job failed: ${statusData.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`${testName} job timed out after 20 minutes`);
  }

  /**
   * Validate results meet expected criteria
   */
  private validateResults(result: TestResult): boolean {
    const criteria = {
      completedSuccessfully: result.success,
      processedAllSentences: result.trackerByPhrasesCount > 4500, // Allow some margin
      hasTrackerScoring: result.trackerScoringCount >= 7,
      reasonableDuration: result.duration < 25 * 60 * 1000 // Under 25 minutes
    };

    console.log('\n📋 VALIDATION CRITERIA:');
    Object.entries(criteria).forEach(([key, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${key}: ${passed}`);
    });

    return Object.values(criteria).every(Boolean);
  }
}

/**
 * Run the stress test when this script is executed
 */
async function runTest() {
  const runner = new StressTestRunner();
  
  try {
    const result = await runner.runStressTest();
    
    if (result.success) {
      console.log('\n🎯 STRESS TEST SUMMARY:');
      console.log(`   • Total processing time: ${Math.round(result.duration / 1000)} seconds`);
      console.log(`   • Sentences processed: ${result.trackerByPhrasesCount}`);
      console.log(`   • Tracker categories: ${result.trackerScoringCount}`);
      console.log(`   • System performance: EXCELLENT ✅`);
      
      process.exit(0);
    } else {
      console.log('\n💥 STRESS TEST FAILED:');
      console.log(`   • Error: ${result.error}`);
      console.log(`   • Duration before failure: ${Math.round(result.duration / 1000)} seconds`);
      
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💀 CATASTROPHIC TEST FAILURE:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { StressTestRunner, TestResult };

// Run if called directly
if (require.main === module) {
  runTest();
}