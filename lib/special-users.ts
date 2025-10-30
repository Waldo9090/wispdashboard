// Special users who should only see Roger Campaigns (no dashboard/analytics access)
const ROGER_CAMPAIGNS_ONLY_USERS = [
  'mike@delectablecap.com',
  'kristi.kaiser@wingsover.com'
]

// Check if user should only see Roger Campaigns
export function isRogerCampaignsOnlyUser(email: string | null | undefined): boolean {
  if (!email) return false
  return ROGER_CAMPAIGNS_ONLY_USERS.includes(email.toLowerCase())
}

// Export the list for reference if needed
export { ROGER_CAMPAIGNS_ONLY_USERS }