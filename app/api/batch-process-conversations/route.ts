import { NextRequest, NextResponse } from 'next/server';
import { 
  batchProcessConversations, 
  getProcessingStatus,
  loadProcessingResults,
  DEFAULT_CONFIG,
  type BatchProcessingConfig 
} from '@/lib/conversation-batch-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      config = DEFAULT_CONFIG,
      action = 'process' // 'process', 'status', 'load'
    } = body;

    console.log(`Batch processing action: ${action}`);

    switch (action) {
      case 'process':
        const results = await batchProcessConversations(config);
        return NextResponse.json({
          success: true,
          action: 'process',
          results,
          summary: {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            totalSentences: results.reduce((sum, r) => sum + (r.sentenceCount || 0), 0),
            totalMetrics: results.reduce((sum, r) => sum + (r.metricsCount || 0), 0)
          }
        });

      case 'status':
        const statusResults = await getProcessingStatus(config.chains);
        return NextResponse.json({
          success: true,
          action: 'status',
          results: statusResults,
          summary: {
            total: statusResults.length,
            processed: statusResults.filter(r => r.processed).length,
            unprocessed: statusResults.filter(r => !r.processed).length
          }
        });

      case 'load':
        const { chainId, locationId } = body;
        if (!chainId || !locationId) {
          return NextResponse.json(
            { error: 'chainId and locationId are required for load action' },
            { status: 400 }
          );
        }

        const loadedData = await loadProcessingResults(chainId, locationId);
        return NextResponse.json({
          success: true,
          action: 'load',
          chainId,
          locationId,
          data: loadedData
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Error in batch processing:', error);
    
    return NextResponse.json(
      { 
        error: 'Batch processing failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    if (action === 'status') {
      // Get status for default configuration
      const statusResults = await getProcessingStatus(DEFAULT_CONFIG.chains);
      
      return NextResponse.json({
        success: true,
        action: 'status',
        results: statusResults,
        config: DEFAULT_CONFIG,
        summary: {
          total: statusResults.length,
          processed: statusResults.filter(r => r.processed).length,
          unprocessed: statusResults.filter(r => !r.processed).length
        }
      });
    }

    if (action === 'config') {
      return NextResponse.json({
        success: true,
        action: 'config',
        config: DEFAULT_CONFIG
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error getting batch processing info:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get batch processing info',
        message: error.message
      },
      { status: 500 }
    );
  }
}