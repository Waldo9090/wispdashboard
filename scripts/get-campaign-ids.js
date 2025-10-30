// Script to help identify campaign IDs for Roger campaigns
// Run this with: node scripts/get-campaign-ids.js

const campaigns = [
  'Roger Hospital Chapel Hill',
  'Roger Real Estate Offices', 
  'Roger Wisconsin leads'
]

console.log('=== Campaign ID Mapping ===')
console.log('Look for these campaign names in your API responses:')
campaigns.forEach((name, index) => {
  console.log(`${index + 1}. "${name}"`)
})

console.log('\n=== Next Steps ===')
console.log('1. Check your campaigns API at /api/instantly/campaigns')
console.log('2. Find the campaign_id values for the campaigns above')  
console.log('3. Update the CAMPAIGN_ACCESS_MAP in app/client/[token]/page.tsx')
console.log('4. Replace the placeholder IDs with actual campaign IDs')

console.log('\n=== Client Access URLs ===')
console.log('Once configured, clients can access:')
console.log('• Roger Hospital Chapel Hill: /client/roger-hospital-chapel-hill')
console.log('• Roger Real Estate Offices: /client/roger-real-estate-offices') 
console.log('• Roger Wisconsin Leads: /client/roger-wisconsin-leads')