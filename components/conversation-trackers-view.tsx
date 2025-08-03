'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Loader2, RefreshCw, Users, MessageSquare, TrendingUp, ChevronRight, ChevronDown } from 'lucide-react';
import { getUserDisplayName } from '@/lib/decryption-utils';

// Stage colors matching your screenshot
const STAGE_COLORS = {
  "Patient Interview & History": { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-700", dot: "bg-purple-500" },
  "Aesthetic Goals Discovery": { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-700", dot: "bg-blue-500" },
  "Treatment Education & Knowledge": { bg: "bg-green-100", border: "border-green-500", text: "text-green-700", dot: "bg-green-500" },
  "Previous Experience Review": { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-700", dot: "bg-yellow-500" },
  "Facial Assessment & Analysis": { bg: "bg-red-100", border: "border-red-500", text: "text-red-700", dot: "bg-red-500" },
  "Treatment Planning & Options": { bg: "bg-orange-100", border: "border-orange-500", text: "text-orange-700", dot: "bg-orange-500" },
  "Objection Handling & Concerns": { bg: "bg-teal-100", border: "border-teal-500", text: "text-teal-700", dot: "bg-teal-500" },
  "Closing & Treatment Commitment": { bg: "bg-gray-100", border: "border-gray-500", text: "text-gray-700", dot: "bg-gray-500" }
};

interface ProcessedSentence {
  rep_id: string;
  speaker: string;
  stage: string;
  sentence: string;
  cluster_label: string | number;
}

interface StageData {
  stage: string;
  clusters: ClusterData[];
  totalSentences: number;
  totalTranscripts: number;
  percentage: number;
}

interface ClusterData {
  clusterName: string;
  sentences: ProcessedSentence[];
  transcriptCount: number;
  percentage: number;
}

interface TrackersData {
  summary: any;
  sentences: ProcessedSentence[];
  stages: StageData[];
  lastUpdated: string;
}

export function ConversationTrackersView() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [trackersData, setTrackersData] = useState<TrackersData | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [selectedPhrases, setSelectedPhrases] = useState<ProcessedSentence[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTrackersData();
  }, []);

  const loadTrackersData = async () => {
    try {
      setIsLoading(true);
      
      // Load the processed conversation data
      const response = await fetch('/api/batch-process-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'load',
          chainId: 'All-Chains',
          locationId: 'All-Locations'
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const sentences = data.data.processedSentences || [];
        const summary = data.data.summary || {};
        
        // Process sentences into hierarchical stage data
        const stages = processIntoStageHierarchy(sentences);
        
        setTrackersData({
          summary,
          sentences,
          stages,
          lastUpdated: data.data.loadedAt || new Date().toISOString()
        });
        
        // Load customer names after setting tracker data
        await loadCustomerNames(sentences);
      }
    } catch (error) {
      console.error('Error loading trackers data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reprocessAllData = async () => {
    try {
      setIsReprocessing(true);
      
      // Trigger reprocessing of all conversation data
      const response = await fetch('/api/batch-process-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // After reprocessing, reload the data
        await loadTrackersData();
        console.log('Reprocessing completed:', result.summary);
      } else {
        console.error('Reprocessing failed:', result.error);
      }
    } catch (error) {
      console.error('Error reprocessing data:', error);
    } finally {
      setIsReprocessing(false);
    }
  };

  const processIntoStageHierarchy = (sentences: ProcessedSentence[]): StageData[] => {
    const stageGroups: Record<string, ProcessedSentence[]> = {};
    const totalTranscripts = new Set(sentences.map(s => s.rep_id)).size;
    
    // Group sentences by stage
    sentences.forEach(sentence => {
      if (sentence.cluster_label === "Uncategorized" || sentence.cluster_label === -1) return;
      
      if (!stageGroups[sentence.stage]) {
        stageGroups[sentence.stage] = [];
      }
      stageGroups[sentence.stage].push(sentence);
    });
    
    // Process each stage
    return Object.entries(stageGroups).map(([stage, stageSentences]) => {
      // Group by cluster within stage
      const clusterGroups: Record<string, ProcessedSentence[]> = {};
      
      stageSentences.forEach(sentence => {
        const clusterName = sentence.cluster_label.toString();
        if (!clusterGroups[clusterName]) {
          clusterGroups[clusterName] = [];
        }
        clusterGroups[clusterName].push(sentence);
      });
      
      // Create cluster data
      const clusters: ClusterData[] = Object.entries(clusterGroups).map(([clusterName, clusterSentences]) => {
        const transcriptIds = new Set(clusterSentences.map(s => s.rep_id));
        return {
          clusterName,
          sentences: clusterSentences,
          transcriptCount: transcriptIds.size,
          percentage: (transcriptIds.size / totalTranscripts) * 100
        };
      }).sort((a, b) => b.percentage - a.percentage);
      
      const stageTranscriptIds = new Set(stageSentences.map(s => s.rep_id));
      
      return {
        stage,
        clusters,
        totalSentences: stageSentences.length,
        totalTranscripts: stageTranscriptIds.size,
        percentage: (stageTranscriptIds.size / totalTranscripts) * 100
      };
    }).sort((a, b) => b.percentage - a.percentage);
  };

  const toggleStage = (stage: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedStages(newExpanded);
  };

  const toggleCluster = (clusterKey: string) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(clusterKey)) {
      newExpanded.delete(clusterKey);
    } else {
      newExpanded.add(clusterKey);
    }
    setExpandedClusters(newExpanded);
  };

  const getUniqueTranscriptIds = (sentences: ProcessedSentence[]): string[] => {
    return [...new Set(sentences.map(s => s.rep_id))];
  };

  // Extract base document ID from rep_id (remove timestamp part)
  const extractBaseDocumentId = (repId: string): string => {
    // rep_id format: "userId_timestampId" 
    // We need just the first part before the underscore (the base document ID)
    const parts = repId.split('_');
    return parts[0]; // Return just the base document ID
  };

  // Fetch encrypted user data from transcript collection
  const fetchEncryptedUserData = async (baseDocumentId: string) => {
    try {
      // Call an API endpoint to fetch transcript data
      const response = await fetch('/api/fetch-transcript-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: baseDocumentId })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.encryptedUserData || null;
      }
    } catch (error) {
      console.error('Error fetching encrypted user data:', error);
    }
    return null;
  };

  // Load customer names for all unique transcript IDs
  const loadCustomerNames = async (sentences: ProcessedSentence[]) => {
    const uniqueRepIds = [...new Set(sentences.map(s => s.rep_id))];
    const newCustomerNames: Record<string, string> = {};
    
    // console.log('🔍 Loading customer names for', uniqueRepIds.length, 'transcript IDs...');
    
    for (const repId of uniqueRepIds) {
      try {
        const baseDocumentId = extractBaseDocumentId(repId);
        
        // Skip if we already have this customer name
        if (customerNames[repId]) {
          newCustomerNames[repId] = customerNames[repId];
          continue;
        }
        
        // console.log('📋 Fetching encrypted data for:', baseDocumentId);
        const encryptedUserData = await fetchEncryptedUserData(baseDocumentId);
        
        if (encryptedUserData) {
          // console.log('🔐 Attempting to decrypt user data for:', baseDocumentId);
          // Use baseDocumentId as the userEmail parameter for getUserDisplayName
          const decryptedName = await getUserDisplayName(baseDocumentId, encryptedUserData);
          
          if (decryptedName && decryptedName !== baseDocumentId && decryptedName !== 'Unknown User') {
            newCustomerNames[repId] = decryptedName;
            // console.log('✅ Successfully decrypted name for', repId, ':', decryptedName);
          } else {
            newCustomerNames[repId] = `Customer ${repId.slice(0, 8)}...`;
            // console.log('⚠️ Using fallback name for', repId);
          }
        } else {
          newCustomerNames[repId] = `Customer ${repId.slice(0, 8)}...`;
          // console.log('⚠️ No encrypted data found for', baseDocumentId);
        }
      } catch (error) {
        // console.error('❌ Error loading customer name for', repId, ':', error);
        newCustomerNames[repId] = `Customer ${repId.slice(0, 8)}...`;
      }
    }
    
    setCustomerNames(prev => ({ ...prev, ...newCustomerNames }));
    // console.log('🎉 Loaded customer names:', newCustomerNames);
  };

  // Get display name for a rep_id
  const getCustomerDisplayName = (repId: string): string => {
    return customerNames[repId] || `Customer ${repId.slice(0, 8)}...`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Conversation Trackers</h2>
          <p className="text-muted-foreground">Organized by stages, clusters, and conversation transcripts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTrackersData} disabled={isLoading || isReprocessing} variant="outline">
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh Data
          </Button>
          <Button onClick={reprocessAllData} disabled={isLoading || isReprocessing}>
            {isReprocessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            Reprocess All Data
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackersData?.stages.length || 0}</div>
            <p className="text-xs text-muted-foreground">With conversation data</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clusters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trackersData?.stages.reduce((sum, stage) => sum + stage.clusters.length, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Named conversation themes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transcripts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trackersData ? new Set(trackersData.sentences.map(s => s.rep_id)).size : 0}
            </div>
            <p className="text-xs text-muted-foreground">Processed conversations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clustered Phrases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trackersData?.sentences.filter(s => s.cluster_label !== "Uncategorized" && s.cluster_label !== -1).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Grouped by similarity</p>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchical Display */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Hierarchy</CardTitle>
          <CardDescription>
            Click stages to expand clusters, click clusters to see transcript IDs, click IDs to view phrases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : trackersData?.stages.length ? (
            <div className="space-y-4">
              {trackersData.stages.map((stageData) => {
                const colors = STAGE_COLORS[stageData.stage as keyof typeof STAGE_COLORS];
                const isStageExpanded = expandedStages.has(stageData.stage);
                
                return (
                  <div key={stageData.stage} className={`border ${colors.border} rounded-lg`}>
                    {/* Stage Header */}
                    <div 
                      className={`p-4 ${colors.bg} cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={() => toggleStage(stageData.stage)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isStageExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                          <div className={`w-4 h-4 rounded-full ${colors.dot}`} />
                          <div>
                            <div className="font-semibold">{stageData.stage}</div>
                            <div className="text-sm text-muted-foreground">
                              {stageData.clusters.length} clusters • {stageData.totalTranscripts} transcripts • {stageData.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            <Users className="w-3 h-3 mr-1" />
                            {stageData.totalTranscripts}
                          </Badge>
                          <Badge variant="outline">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {stageData.totalSentences}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Clusters */}
                    {isStageExpanded && (
                      <div className="p-4 space-y-3">
                        {stageData.clusters.map((cluster) => {
                          const clusterKey = `${stageData.stage}_${cluster.clusterName}`;
                          const isClusterExpanded = expandedClusters.has(clusterKey);
                          const uniqueTranscriptIds = getUniqueTranscriptIds(cluster.sentences);
                          
                          return (
                            <div key={clusterKey} className="border rounded-lg">
                              {/* Cluster Header */}
                              <div 
                                className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => toggleCluster(clusterKey)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isClusterExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                    <div className="font-medium">{cluster.clusterName}</div>
                                  </div>
                                  <div className="flex gap-2 text-sm">
                                    <Badge variant="outline">
                                      {cluster.transcriptCount} transcripts ({cluster.percentage.toFixed(1)}%)
                                    </Badge>
                                    <Badge variant="secondary">
                                      {cluster.sentences.length} phrases
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Transcript IDs */}
                              {isClusterExpanded && (
                                <div className="p-3 space-y-2">
                                  <div className="text-sm font-medium text-muted-foreground">
                                    Customers (click to view phrases):
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {uniqueTranscriptIds.map((transcriptId) => {
                                      const transcriptSentences = cluster.sentences.filter(s => s.rep_id === transcriptId);
                                      const isSelected = selectedPhrases.length > 0 && selectedPhrases[0]?.rep_id === transcriptId;
                                      const customerName = getCustomerDisplayName(transcriptId);
                                      
                                      return (
                                        <div 
                                          key={transcriptId}
                                          className={`p-3 border rounded cursor-pointer transition-colors ${
                                            isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                                          }`}
                                          onClick={() => setSelectedPhrases(transcriptSentences)}
                                        >
                                          <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                              <div className="font-medium text-sm">
                                                {customerName}
                                              </div>
                                              <div className="font-mono text-xs text-muted-foreground">
                                                ID: {transcriptId.slice(0, 20)}...
                                              </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                              {transcriptSentences.length} phrases
                                            </Badge>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No conversation data found. Try processing conversations first.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Phrases Details */}
      {selectedPhrases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Phrases ({selectedPhrases.length})</CardTitle>
            <CardDescription>
              From customer: {getCustomerDisplayName(selectedPhrases[0].rep_id)} in {selectedPhrases[0].cluster_label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary Information */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded">
                <div>
                  <strong>Customer:</strong> {getCustomerDisplayName(selectedPhrases[0].rep_id)}
                </div>
                <div>
                  <strong>Stage:</strong> {selectedPhrases[0].stage}
                </div>
                <div>
                  <strong>Cluster:</strong> {selectedPhrases[0].cluster_label}
                </div>
                <div>
                  <strong>Total Phrases:</strong> {selectedPhrases.length}
                </div>
                <div className="col-span-2">
                  <strong>Transcript ID:</strong> 
                  <span className="font-mono ml-2 text-xs text-muted-foreground">{selectedPhrases[0].rep_id}</span>
                </div>
              </div>
              
              {/* All Phrases */}
              <div>
                <strong>All Phrases:</strong>
                <div className="mt-2 space-y-3">
                  {selectedPhrases.map((phrase, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-600">
                          Phrase #{index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {phrase.speaker}
                        </Badge>
                      </div>
                      <div className="italic text-gray-800">
                        "{phrase.sentence}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}