# Instantly.ai API Integration Setup Guide

This guide provides complete instructions for connecting your analytics dashboard to the Instantly.ai API v2 to display real campaign statistics.

## Prerequisites

- Instantly.ai account with Growth plan or higher (required for API access)
- Node.js and pnpm installed
- Next.js 15+ project (already set up)

## Step 1: Get Your Instantly.ai API Key

1. **Login to Instantly.ai**
   - Go to [Instantly.ai](https://instantly.ai) and log in to your account

2. **Navigate to API Settings**
   - Go to your account settings
   - Find the API section
   - Generate a new API v2 key (not compatible with v1)

3. **Copy Your API Key**
   - Copy the generated Bearer token
   - Store it securely (you'll need it for environment variables)

## Step 2: Environment Configuration

1. **Create Environment File**
   ```bash
   cp .env.example .env.local
   ```

2. **Add Your API Key**
   ```env
   # .env.local
   INSTANTLY_API_KEY=your_instantly_api_key_here
   ```

   **Security Note**: Use `INSTANTLY_API_KEY` for server-side API calls. Only use `NEXT_PUBLIC_INSTANTLY_API_KEY` if you need client-side access and have properly configured CORS.

## Step 3: Install Dependencies

The required dependencies are already installed:
- `recharts` - For charts and data visualization
- `lucide-react` - For icons
- React hooks for state management

## Step 4: API Integration Overview

### Available Endpoints

The integration uses these Instantly.ai API v2 endpoints:

1. **Campaign Analytics Overview**
   - `GET /api/v2/campaigns/analytics/overview`
   - Returns: sent, opened, unique_opened, replies, unique_replies, clicks, unique_clicks, positive_replies, bounces, unsubscribes

2. **Daily Analytics**
   - `GET /api/v2/campaigns/analytics/daily`
   - Returns: Daily breakdown with same metrics plus date

3. **All Campaigns Analytics**
   - `GET /api/v2/campaigns/analytics`
   - Returns: Analytics for all campaigns with campaign details

4. **Step Analytics**
   - `GET /api/v2/campaigns/analytics/steps`
   - Returns: Step-by-step campaign performance

### API Integration Files

#### `lib/instantly-api.ts`
- Core API client with TypeScript interfaces
- Error handling with custom `InstantlyAPIError` class
- Utility functions for calculating rates
- Bearer token authentication

#### `hooks/use-instantly-analytics.ts`
- React hooks for fetching analytics data
- `useInstantlyAnalytics` - Complete analytics data
- `useInstantlyOverview` - Overview data only
- `useInstantlyDailyData` - Daily analytics only
- Built-in loading states and error handling

## Step 5: Component Updates

### Updated Components

#### `MetricCards` Component
- Now displays real data from Instantly API
- Shows 4 key metrics: Reply Rate, Positive Reply Rate, Open Rate, Click Rate
- Includes loading states and error handling
- Responsive grid layout (2 cols on mobile, 4 on desktop)

#### `PerformanceChart` Component
- Can be updated to use real daily analytics data
- Supports multiple data series (sent, replies, opens, clicks)
- Interactive tooltips with real data

## Step 6: Usage Examples

### Basic Usage

```tsx
import { MetricCards } from '@/components/metric-cards'

// Display metrics for all campaigns
<MetricCards />

// Display metrics for specific campaign
<MetricCards campaignId="your-campaign-id" />
```

### Advanced Usage with Hooks

```tsx
import { useInstantlyAnalytics } from '@/hooks/use-instantly-analytics'

function AnalyticsPage() {
  const { overview, dailyData, campaigns, loading, error, refetch } = useInstantlyAnalytics()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Campaign Analytics</h1>
      <p>Total Emails Sent: {overview?.sent.toLocaleString()}</p>
      <p>Reply Rate: {((overview?.unique_replies / overview?.sent) * 100).toFixed(1)}%</p>
      
      {/* Display daily chart */}
      <Chart data={dailyData} />
      
      {/* List all campaigns */}
      {campaigns.map(campaign => (
        <div key={campaign.campaign_id}>
          <h3>{campaign.campaign_name}</h3>
          <p>Status: {campaign.status}</p>
          <p>Sent: {campaign.analytics.sent}</p>
        </div>
      ))}
    </div>
  )
}
```

## Step 7: Available Metrics

### Core Metrics
- **Sent**: Total emails sent
- **Opened**: Total email opens
- **Unique Opened**: Unique recipients who opened
- **Replies**: Total replies received
- **Unique Replies**: Unique recipients who replied
- **Clicks**: Total link clicks
- **Unique Clicks**: Unique recipients who clicked
- **Positive Replies**: Positive sentiment replies
- **Bounces**: Bounced emails
- **Unsubscribes**: Unsubscribe requests

### Calculated Rates
- **Reply Rate**: (Unique Replies / Sent) × 100
- **Open Rate**: (Unique Opened / Sent) × 100
- **Click Rate**: (Unique Clicks / Sent) × 100
- **Positive Reply Rate**: (Positive Replies / Unique Replies) × 100

## Step 8: Error Handling

The integration includes comprehensive error handling:

```tsx
// API errors are automatically caught and displayed
const { data, loading, error } = useInstantlyOverview()

if (error) {
  // Shows user-friendly error messages
  // Logs detailed errors to console for debugging
}
```

## Step 9: Filtering and Date Ranges

```tsx
// Filter by campaign
const { overview } = useInstantlyOverview('campaign-id-123')

// Filter by date range
const { dailyData } = useInstantlyDailyData(
  'campaign-id-123', 
  '2025-01-01',     // start_date
  '2025-01-31'      // end_date
)
```

## Step 10: Testing the Integration

1. **Start Development Server**
   ```bash
   pnpm run dev
   ```

2. **Check Browser Console**
   - Look for any API errors
   - Verify data is being fetched correctly

3. **Test Different Scenarios**
   - With valid API key
   - With invalid API key (should show error)
   - With no campaigns (should show no data message)

## Troubleshooting

### Common Issues

1. **"Cannot find module 'react'" Error**
   ```bash
   pnpm install
   ```

2. **API Key Not Found Error**
   - Check `.env.local` file exists
   - Verify `INSTANTLY_API_KEY` is set correctly
   - Restart development server after adding environment variables

3. **CORS Errors (if using client-side API calls)**
   - Contact Instantly.ai support to configure CORS for your domain
   - Use server-side API calls instead (recommended)

4. **401 Unauthorized**
   - Verify API key is correct
   - Ensure you're using API v2 key (not v1)
   - Check if your plan includes API access

5. **404 Not Found**
   - Ensure you have active campaigns
   - Check campaign IDs are correct

### API Rate Limits
- Respect Instantly.ai's rate limits
- Use React hooks' built-in caching
- Consider implementing additional caching for heavy usage

## Next Steps

1. **Customize Visualizations**
   - Update charts to use real data
   - Add more chart types (bar, pie, line)
   - Create custom date range pickers

2. **Add More Features**
   - Campaign comparison
   - Export data functionality  
   - Real-time updates
   - Historical trend analysis

3. **Performance Optimization**
   - Implement data caching
   - Add pagination for large datasets
   - Optimize re-render cycles

## API Documentation

For complete API documentation, visit:
- [Instantly.ai API v2 Documentation](https://developer.instantly.ai/api/v2)
- [Analytics Endpoints](https://developer.instantly.ai/api/v2/analytics)
- [Campaign Endpoints](https://developer.instantly.ai/api/v2/campaign)

## Support

- **Instantly.ai Support**: Contact through your Instantly.ai dashboard
- **API Issues**: Check the interactive documentation at https://developer.instantly.ai/api/v2
- **Integration Questions**: Review this guide and the TypeScript interfaces in `lib/instantly-api.ts`