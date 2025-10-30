#!/usr/bin/env node

const BASE_URL = 'http://localhost:3001/api/instantly';

async function fetchData(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

function calculateReplyRate(replies, sent) {
  return sent > 0 ? ((replies / sent) * 100).toFixed(2) : '0.00';
}

function calculateOpenRate(opened, sent) {
  return sent > 0 ? ((opened / sent) * 100).toFixed(2) : '0.00';
}

function calculateClickRate(clicks, sent) {
  return sent > 0 ? ((clicks / sent) * 100).toFixed(2) : '0.00';
}

function calculateBounceRate(bounced, sent) {
  return sent > 0 ? ((bounced / sent) * 100).toFixed(2) : '0.00';
}

function getCampaignStatusLabel(status) {
  const statusMap = {
    0: 'Draft',
    1: 'Active', 
    2: 'Paused',
    3: 'Completed',
    4: 'Running Subsequences',
    '-99': 'Account Suspended',
    '-1': 'Accounts Unhealthy',
    '-2': 'Bounce Protect'
  };
  return statusMap[status] || `Unknown (${status})`;
}

async function displayWorkspaces() {
  console.log('🏢 RETRIEVING WORKSPACES...\n');
  
  const workspaces = await fetchData('/workspaces');
  if (!workspaces) return;

  console.log('═'.repeat(80));
  console.log('                           WORKSPACE OVERVIEW');
  console.log('═'.repeat(80));
  
  workspaces.forEach((workspace, index) => {
    console.log(`\n📊 Workspace ${index + 1}:`);
    console.log(`   ID: ${workspace.workspace_id}`);
    console.log(`   Name: ${workspace.workspace_name}`);
    console.log(`   Status: ${workspace.workspace_status === 1 ? '✅ Active' : '⚠️ Inactive'}`);
    console.log(`   Accounts: ${workspace.account_count || 0}`);
    if (workspace.error) {
      console.log(`   ⚠️ Error: Unable to connect`);
    }
  });
  
  return workspaces;
}

async function displayCampaignStats(workspaceId = null) {
  const endpoint = workspaceId ? `/campaigns?workspace_id=${workspaceId}` : '/campaigns';
  console.log(`\n🚀 RETRIEVING CAMPAIGN STATISTICS${workspaceId ? ` (Workspace ${workspaceId})` : ''}...\n`);
  
  const campaigns = await fetchData(endpoint);
  if (!campaigns || campaigns.length === 0) {
    console.log('❌ No campaigns found or unable to retrieve data');
    return;
  }

  console.log('═'.repeat(120));
  console.log('                                    CAMPAIGN STATISTICS OVERVIEW');
  console.log('═'.repeat(120));
  
  campaigns.forEach((campaign, index) => {
    const replyRate = calculateReplyRate(campaign.reply_count || 0, campaign.emails_sent_count || 0);
    const openRate = calculateOpenRate(campaign.open_count || 0, campaign.emails_sent_count || 0);
    const clickRate = calculateClickRate(campaign.link_click_count || 0, campaign.emails_sent_count || 0);
    const bounceRate = calculateBounceRate(campaign.bounced_count || 0, campaign.emails_sent_count || 0);
    
    console.log(`\n📈 Campaign ${index + 1}: ${campaign.campaign_name || 'Unnamed Campaign'}`);
    console.log('─'.repeat(100));
    console.log(`   🆔 Campaign ID: ${campaign.campaign_id || 'N/A'}`);
    console.log(`   📊 Status: ${getCampaignStatusLabel(campaign.campaign_status)}`);
    console.log(`   🔄 Evergreen: ${campaign.campaign_is_evergreen ? 'Yes' : 'No'}`);
    console.log('\n   📧 EMAIL METRICS:');
    console.log(`   ├─ Emails Sent: ${(campaign.emails_sent_count || 0).toLocaleString()}`);
    console.log(`   ├─ Leads Count: ${(campaign.leads_count || 0).toLocaleString()}`);
    console.log(`   ├─ Contacted: ${(campaign.contacted_count || 0).toLocaleString()}`);
    console.log(`   └─ New Leads Contacted: ${(campaign.new_leads_contacted_count || 0).toLocaleString()}`);
    
    console.log('\n   📊 ENGAGEMENT METRICS:');
    console.log(`   ├─ Opens: ${(campaign.open_count || 0).toLocaleString()} (${openRate}%)`);
    console.log(`   ├─ Replies: ${(campaign.reply_count || 0).toLocaleString()} (${replyRate}%)`);
    console.log(`   ├─ Clicks: ${(campaign.link_click_count || 0).toLocaleString()} (${clickRate}%)`);
    console.log(`   ├─ Bounced: ${(campaign.bounced_count || 0).toLocaleString()} (${bounceRate}%)`);
    console.log(`   ├─ Unsubscribed: ${(campaign.unsubscribed_count || 0).toLocaleString()}`);
    console.log(`   └─ Completed: ${(campaign.completed_count || 0).toLocaleString()}`);
    
    console.log('\n   💰 OPPORTUNITY METRICS:');
    console.log(`   ├─ Total Opportunities: ${(campaign.total_opportunities || 0).toLocaleString()}`);
    console.log(`   └─ Total Opportunity Value: $${(campaign.total_opportunity_value || 0).toLocaleString()}`);
  });
  
  // Summary statistics
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.campaign_status === 1).length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.emails_sent_count || 0), 0);
  const totalReplies = campaigns.reduce((sum, c) => sum + (c.reply_count || 0), 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + (c.open_count || 0), 0);
  const totalOpportunityValue = campaigns.reduce((sum, c) => sum + (c.total_opportunity_value || 0), 0);
  
  console.log('\n' + '═'.repeat(120));
  console.log('                                       SUMMARY STATISTICS');
  console.log('═'.repeat(120));
  console.log(`📊 Total Campaigns: ${totalCampaigns}`);
  console.log(`✅ Active Campaigns: ${activeCampaigns}`);
  console.log(`📧 Total Emails Sent: ${totalSent.toLocaleString()}`);
  console.log(`💬 Total Replies: ${totalReplies.toLocaleString()} (${calculateReplyRate(totalReplies, totalSent)}%)`);
  console.log(`👁️  Total Opens: ${totalOpens.toLocaleString()} (${calculateOpenRate(totalOpens, totalSent)}%)`);
  console.log(`💰 Total Opportunity Value: $${totalOpportunityValue.toLocaleString()}`);
}

async function displayCampaignBreakdown(workspaceId = null) {
  const endpoint = workspaceId ? `/campaigns/breakdown?workspace_id=${workspaceId}` : '/campaigns/breakdown';
  console.log(`\n🔍 RETRIEVING DETAILED CAMPAIGN BREAKDOWN${workspaceId ? ` (Workspace ${workspaceId})` : ''}...\n`);
  
  const campaigns = await fetchData(endpoint);
  if (!campaigns || campaigns.length === 0) {
    console.log('❌ No campaign breakdown data found');
    return;
  }

  campaigns.forEach((campaign, campaignIndex) => {
    if (!campaign.steps || campaign.steps.length === 0) return;
    
    console.log('═'.repeat(120));
    console.log(`                      CAMPAIGN BREAKDOWN: ${campaign.campaign_name || 'Unnamed Campaign'}`);
    console.log('═'.repeat(120));
    
    campaign.steps.forEach((step, stepIndex) => {
      const replyRate = calculateReplyRate(step.replies || 0, step.sent || 0);
      const openRate = calculateOpenRate(step.opened || 0, step.sent || 0);
      const clickRate = calculateClickRate(step.clicks || 0, step.sent || 0);
      
      console.log(`\n🎯 ${step.variant || `Step ${stepIndex + 1}`}:`);
      console.log(`   ├─ Sent: ${(step.sent || 0).toLocaleString()}`);
      console.log(`   ├─ Opened: ${(step.opened || 0).toLocaleString()} (${openRate}%) | Unique: ${(step.unique_opened || 0).toLocaleString()}`);
      console.log(`   ├─ Replies: ${(step.replies || 0).toLocaleString()} (${replyRate}%) | Unique: ${(step.unique_replies || 0).toLocaleString()}`);
      console.log(`   └─ Clicks: ${(step.clicks || 0).toLocaleString()} (${clickRate}%) | Unique: ${(step.unique_clicks || 0).toLocaleString()}`);
    });
  });
}

async function main() {
  console.log('🚀 INSTANTLY.AI ANALYTICS DASHBOARD STATISTICS RETRIEVER');
  console.log('═'.repeat(80));
  console.log('This tool retrieves and displays all available campaign statistics');
  console.log('from your Instantly.ai analytics dashboard.\n');

  // Check if server is running
  try {
    await fetch('http://localhost:3001');
  } catch (error) {
    console.log('❌ Error: Development server is not running!');
    console.log('📝 Please run "npm run dev" first to start the Next.js server');
    console.log('🌐 Then access http://localhost:3001 to verify the dashboard is working');
    process.exit(1);
  }

  // Get workspaces first
  const workspaces = await displayWorkspaces();
  
  if (workspaces && workspaces.length > 0) {
    // Display stats for each workspace
    for (const workspace of workspaces) {
      if (!workspace.error) {
        await displayCampaignStats(workspace.workspace_id);
        await displayCampaignBreakdown(workspace.workspace_id);
      }
    }
  } else {
    // Fallback to default workspace
    await displayCampaignStats();
    await displayCampaignBreakdown();
  }

  console.log('\n' + '═'.repeat(120));
  console.log('                                   RETRIEVAL COMPLETE');
  console.log('═'.repeat(120));
  console.log('📊 All available campaign statistics have been displayed above.');
  console.log('💡 If you see "No performance data" in the dashboard, check:');
  console.log('   1. API keys are properly configured in your .env file');
  console.log('   2. The API keys have access to campaign data');
  console.log('   3. There are active campaigns in your Instantly.ai account');
  console.log('🔧 For troubleshooting, check the browser console for detailed error messages.');
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
  });
}

module.exports = { main, displayCampaignStats, displayWorkspaces };