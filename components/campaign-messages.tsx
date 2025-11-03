'use client'

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, Clock, Copy, Eye, EyeOff } from "lucide-react"

interface CampaignStep {
  type: string
  delay: number
  variants: Array<{
    subject: string
    body: string
    v_disabled?: boolean
  }>
}

interface CampaignSequence {
  steps: CampaignStep[]
}

interface CampaignData {
  id: string
  name: string
  sequences: CampaignSequence[]
  status: number
}

interface CampaignMessagesProps {
  campaignName?: string
  campaignId?: string
  workspaceId: string
}

export function CampaignMessages({ campaignName, campaignId, workspaceId }: CampaignMessagesProps) {
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [copiedVariant, setCopiedVariant] = useState<string | null>(null)

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const copyToClipboard = (text: string, variantId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedVariant(variantId)
      setTimeout(() => setCopiedVariant(null), 2000)
    })
  }

  const formatEmailBody = (body: string) => {
    // Format the email body for better readability by converting HTML to plain text with line breaks
    return body
      // Replace HTML div tags with line breaks
      .replace(/<div>/gi, '\n')
      .replace(/<\/div>/gi, '')
      // Replace BR tags with line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Replace multiple consecutive line breaks with double line breaks for paragraphs
      .replace(/\n\s*\n/g, '\n\n')
      // Remove any other HTML tags but keep the content
      .replace(/<[^>]*>/g, '')
      // Handle escaped characters
      .replace(/\n/g, '\n')
      .replace(/\\n/g, '\n')
      // Clean up extra whitespace while preserving intentional line breaks
      .replace(/[ \t]+/g, ' ')
      .replace(/\n /g, '\n')
      .replace(/ \n/g, '\n')
      .trim()
  }

  useEffect(() => {
    const fetchCampaignData = async () => {
      setLoading(true)
      setError(null)

      try {
        let actualCampaignId = campaignId

        // If we don't have a campaignId but have a campaignName, we need to find it first
        if (!actualCampaignId && campaignName) {
          // First, get all campaigns to find the one with matching name
          const listResponse = await fetch(`/api/instantly/campaigns?workspaceId=${workspaceId}`)
          if (!listResponse.ok) {
            throw new Error(`Failed to fetch campaigns list: ${listResponse.statusText}`)
          }

          const listData = await listResponse.json()
          const campaigns = Array.isArray(listData) ? listData : (listData.items || [])
          
          console.log('Available campaigns:', campaigns.map((c: any) => ({ id: c.id, name: c.name })))
          console.log('Searching for campaign name:', campaignName)
          
          // Try multiple matching strategies
          let campaign = campaigns.find((c: any) => 
            c.name?.toLowerCase().includes(campaignName.toLowerCase())
          )
          
          // If not found, try exact match
          if (!campaign) {
            campaign = campaigns.find((c: any) => 
              c.name?.toLowerCase() === campaignName.toLowerCase()
            )
          }
          
          // If still not found, try partial match without dashes
          if (!campaign) {
            const searchName = campaignName.replace(/-/g, ' ')
            campaign = campaigns.find((c: any) => 
              c.name?.toLowerCase().includes(searchName.toLowerCase()) ||
              searchName.toLowerCase().includes(c.name?.toLowerCase())
            )
          }
          
          if (!campaign) {
            console.error('Campaign not found. Available campaigns:', campaigns.map((c: any) => c.name))
            throw new Error(`Campaign "${campaignName}" not found. Available campaigns: ${campaigns.map((c: any) => c.name).join(', ')}`)
          }
          
          actualCampaignId = campaign.id
        }

        if (!actualCampaignId) {
          throw new Error('No campaign ID available')
        }

        // Now fetch the specific campaign details with sequences
        const response = await fetch(`/api/instantly/campaigns/${actualCampaignId}?workspaceId=${workspaceId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch campaign: ${response.statusText}`)
        }

        const data = await response.json()
        setCampaignData(data)
      } catch (err) {
        console.error('Error fetching campaign data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (workspaceId) {
      fetchCampaignData()
    }
  }, [campaignName, campaignId, workspaceId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading campaign messages...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <Mail className="w-16 h-16 mx-auto mb-4 text-red-300" />
          <h3 className="text-lg font-medium mb-2">Error Loading Messages</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!campaignData || !campaignData.sequences || campaignData.sequences.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">No Messages Found</h3>
        <p className="text-sm text-slate-600">
          This campaign doesn't have any email sequences configured.
        </p>
      </div>
    )
  }

  const sequence = campaignData.sequences[0] // Instantly API docs say only first element is used
  const statusLabels = {
    0: 'Draft',
    1: 'Active', 
    2: 'Paused',
    3: 'Completed',
    4: 'Running Subsequences',
    '-99': 'Account Suspended',
    '-1': 'Accounts Unhealthy',
    '-2': 'Bounce Protect'
  }

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">{campaignData.name}</h3>
            <p className="text-sm text-slate-600 mt-1">Email Sequence Messages</p>
          </div>
          <Badge 
            variant={campaignData.status === 1 ? "default" : "secondary"}
            className={campaignData.status === 1 ? "bg-green-100 text-green-800" : ""}
          >
            {statusLabels[campaignData.status as keyof typeof statusLabels] || 'Unknown'}
          </Badge>
        </div>
        <div className="text-sm text-slate-600">
          <span className="font-medium">{sequence.steps.length}</span> email steps in sequence
        </div>
      </div>

      {/* Email Steps */}
      <div className="space-y-4">
        {sequence.steps.map((step, stepIndex) => {
          const stepId = `step-${stepIndex}`
          const isExpanded = expandedSteps.has(stepId)
          
          return (
            <Card key={stepIndex} className="border-slate-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-indigo-700">{stepIndex + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">
                        Email Step {stepIndex + 1}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {step.delay === 0 ? 'Send immediately' : `Wait ${step.delay} days`}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{step.variants.length}</span> variant{step.variants.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStepExpansion(stepId)}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    {isExpanded ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Hide Messages
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        View Messages
                      </>
                    )}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="space-y-4">
                    {step.variants.map((variant, variantIndex) => {
                      const variantId = `${stepId}-variant-${variantIndex}`
                      const variantLetter = String.fromCharCode(65 + variantIndex) // A, B, C, etc.
                      
                      return (
                        <div 
                          key={variantIndex} 
                          className={`border rounded-lg p-4 ${
                            variant.v_disabled ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Variant {variantLetter}
                              </Badge>
                              {variant.v_disabled && (
                                <Badge variant="secondary" className="text-xs">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(`Subject: ${variant.subject}\n\n${formatEmailBody(variant.body)}`, variantId)}
                              className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1 h-auto"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              {copiedVariant === variantId ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>

                          {/* Subject Line */}
                          <div className="mb-4">
                            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                              Subject Line
                            </label>
                            <div className="mt-1 p-3 bg-slate-50 rounded border text-sm text-slate-800 font-medium">
                              {variant.subject || 'No subject'}
                            </div>
                          </div>

                          {/* Email Body */}
                          <div>
                            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                              Email Body
                            </label>
                            <div className="mt-1 p-4 bg-slate-50 rounded border text-sm text-slate-700 leading-relaxed">
                              <div className="whitespace-pre-wrap font-mono">
                                {formatEmailBody(variant.body) || 'No content'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {sequence.steps.length === 0 && (
        <div className="text-center py-12">
          <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No Email Steps</h3>
          <p className="text-sm text-slate-600">
            This campaign sequence doesn't have any email steps configured.
          </p>
        </div>
      )}
    </div>
  )
}