import { NextRequest, NextResponse } from 'next/server';
import { processConversations, generateDashboardMetrics } from '@/lib/conversation-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chainId, locationId, options = {} } = body;

    if (!chainId || !locationId) {
      return NextResponse.json(
        { error: 'chainId and locationId are required' },
        { status: 400 }
      );
    }

    //console.log(`Starting conversation analysis for ${chainId}/${locationId}`);

    // Process conversations
    const { processedSentences, summary } = await processConversations(chainId, locationId);

    // Generate metrics for dashboard
    const dashboardMetrics = generateDashboardMetrics(processedSentences);

    // Optional: Save results to database
    if (options.saveResults) {
      // You can add code here to save the results back to Firebase
      // For now, we'll just return the data
    }

    const response = {
      success: true,
      chainId,
      locationId,
      summary,
      metricsCount: dashboardMetrics.length,
      sentenceCount: processedSentences.length,
      dashboardMetrics: dashboardMetrics.slice(0, 100), // Limit response size
      // Include full data if requested
      ...(options.includeFullData && {
        processedSentences: processedSentences.slice(0, 1000) // Limit for response size
      })
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error processing conversations:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process conversations',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const locationId = searchParams.get('locationId');

  if (!chainId || !locationId) {
    return NextResponse.json(
      { error: 'chainId and locationId query parameters are required' },
      { status: 400 }
    );
  }

  try {
    // For GET requests, just return a preview/status
    const { summary } = await processConversations(chainId, locationId);
    
    return NextResponse.json({
      success: true,
      chainId,
      locationId,
      preview: true,
      summary
    });

  } catch (error: any) {
    console.error('Error getting conversation preview:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get conversation preview',
        message: error.message
      },
      { status: 500 }
    );
  }
}