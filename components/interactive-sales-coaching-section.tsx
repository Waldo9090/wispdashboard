'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

// Custom visual components
const VisibilityVisual = () => (
  <svg width="600" height="400" viewBox="0 0 600 400" className="w-full h-full">
    <rect width="600" height="400" fill="#f8fafc" rx="12" />
    
    {/* Call recording interface */}
    <rect x="50" y="60" width="500" height="280" fill="#ffffff" rx="8" stroke="#e2e8f0" strokeWidth="2" />
    
    {/* Header bar */}
    <rect x="50" y="60" width="500" height="50" fill="#1e293b" rx="8" />
    <circle cx="80" cy="85" r="6" fill="#ef4444" />
    <circle cx="100" cy="85" r="6" fill="#f59e0b" />
    <circle cx="120" cy="85" r="6" fill="#10b981" />
    <text x="150" y="90" fill="#ffffff" fontSize="14" fontWeight="bold">Sales Call Recording</text>
    
    {/* Recording indicator */}
    <circle cx="480" cy="85" r="8" fill="#ef4444">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <text x="495" y="90" fill="#ffffff" fontSize="12">REC</text>
    
    {/* Audio waveform */}
    <rect x="70" y="140" width="460" height="80" fill="#f1f5f9" rx="6" />
    <text x="80" y="160" fill="#64748b" fontSize="12" fontWeight="bold">Audio Waveform</text>
    
    {/* Animated waveform bars */}
    <g transform="translate(80, 170)">
      {[...Array(20)].map((_, i) => (
        <rect key={i} x={i * 20} y="20" width="8" height="30" fill="#ec4899" opacity="0.6" rx="2">
          <animate attributeName="height" values="10;40;20;30;15" dur="2s" begin={`${i * 0.1}s`} repeatCount="indefinite" />
          <animate attributeName="y" values="35;5;25;15;30" dur="2s" begin={`${i * 0.1}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </g>
    
    {/* Transcription area */}
    <rect x="70" y="240" width="460" height="80" fill="#f8fafc" rx="6" stroke="#e2e8f0" strokeWidth="1" />
    <text x="80" y="260" fill="#475569" fontSize="12" fontWeight="bold">Live Transcription</text>
    
    {/* Speaker labels and text */}
    <g transform="translate(80, 270)">
      <rect width="80" height="20" fill="#ddd6fe" rx="10" />
      <text x="12" y="14" fill="#7c3aed" fontSize="10" fontWeight="bold">Sales Rep</text>
      <text x="90" y="14" fill="#374151" fontSize="11">Hi John, thanks for joining the call today...</text>
      
      <rect y="25" width="80" height="20" fill="#fecaca" rx="10" />
      <text x="15" y="39" fill="#dc2626" fontSize="10" fontWeight="bold">Customer</text>
      <text x="90" y="39" fill="#374151" fontSize="11">Thanks for reaching out. I'm interested in...</text>
    </g>
    
    {/* Playback controls */}
    <g transform="translate(250, 350)">
      <circle cx="0" cy="0" r="20" fill="#ec4899" />
      <polygon points="-8,-8 -8,8 8,0" fill="white" />
      
      <circle cx="50" cy="0" r="15" fill="#6b7280" />
      <rect x="46" y="-6" width="3" height="12" fill="white" />
      <rect x="51" y="-6" width="3" height="12" fill="white" />
      
      <circle cx="100" cy="0" r="15" fill="#6b7280" />
      <rect x="96" y="-6" width="8" height="12" fill="white" />
    </g>
    
    {/* Time indicator */}
    <text x="300" y="385" fill="#6b7280" fontSize="12" textAnchor="middle">12:34 / 45:67</text>
  </svg>
)

const CoachingVisual = () => (
  <svg width="600" height="400" viewBox="0 0 600 400" className="w-full h-full">
    <rect width="600" height="400" fill="#f8fafc" rx="12" />
    
    {/* Dashboard interface */}
    <rect x="30" y="40" width="540" height="320" fill="#ffffff" rx="8" stroke="#e2e8f0" strokeWidth="2" />
    
    {/* Header */}
    <rect x="30" y="40" width="540" height="50" fill="#1e293b" rx="8" />
    <text x="50" y="68" fill="#ffffff" fontSize="16" fontWeight="bold">Coaching Dashboard</text>
    
    {/* Performance score */}
    <g transform="translate(450, 55)">
      <circle cx="0" cy="0" r="18" fill="#10b981" />
      <text x="0" y="5" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">87</text>
    </g>
    
    {/* Call list with scores */}
    <g transform="translate(50, 110)">
      <rect width="200" height="40" fill="#f1f5f9" rx="6" />
      <circle cx="20" cy="20" r="12" fill="#10b981" />
      <text x="16" y="25" fill="white" fontSize="10" fontWeight="bold">92</text>
      <text x="45" y="18" fill="#374151" fontSize="12" fontWeight="bold">Call with Acme Corp</text>
      <text x="45" y="30" fill="#6b7280" fontSize="10">Great objection handling</text>
      
      <rect y="50" width="200" height="40" fill="#fef3c7" rx="6" />
      <circle cx="20" cy="70" r="12" fill="#f59e0b" />
      <text x="16" y="75" fill="white" fontSize="10" fontWeight="bold">73</text>
      <text x="45" y="68" fill="#374151" fontSize="12" fontWeight="bold">Call with TechStart</text>
      <text x="45" y="80" fill="#6b7280" fontSize="10">Needs improvement on closing</text>
      
      <rect y="100" width="200" height="40" fill="#dcfce7" rx="6" />
      <circle cx="20" cy="120" r="12" fill="#22c55e" />
      <text x="16" y="125" fill="white" fontSize="10" fontWeight="bold">89</text>
      <text x="45" y="118" fill="#374151" fontSize="12" fontWeight="bold">Call with DataFlow</text>
      <text x="45" y="130" fill="#6b7280" fontSize="10">Excellent discovery questions</text>
    </g>
    
    {/* Coaching annotations */}
    <g transform="translate(280, 110)">
      <rect width="280" height="140" fill="#f8fafc" rx="6" stroke="#e2e8f0" strokeWidth="1" />
      <text x="10" y="25" fill="#475569" fontSize="14" fontWeight="bold">Coaching Annotations</text>
      
      {/* Timestamped feedback */}
      <g transform="translate(10, 40)">
        <rect width="60" height="20" fill="#ec4899" rx="10" />
        <text x="30" y="14" fill="white" fontSize="10" textAnchor="middle">12:34</text>
        <text x="70" y="14" fill="#374151" fontSize="11">Great rapport building here!</text>
        
        <rect y="30" width="60" height="20" fill="#f59e0b" rx="10" />
        <text x="30" y="44" fill="white" fontSize="10" textAnchor="middle">18:45</text>
        <text x="70" y="44" fill="#374151" fontSize="11">Try to probe deeper on pain points</text>
        
        <rect y="60" width="60" height="20" fill="#10b981" rx="10" />
        <text x="30" y="74" fill="white" fontSize="10" textAnchor="middle">25:12</text>
        <text x="70" y="74" fill="#374151" fontSize="11">Perfect closing technique!</text>
      </g>
      
      {/* Performance trends */}
      <g transform="translate(10, 110)">
        <text x="0" y="0" fill="#475569" fontSize="12" fontWeight="bold">Performance Trend</text>
        <path d="M0 20 L50 15 L100 10 L150 8 L200 5" stroke="#ec4899" strokeWidth="3" fill="none">
          <animate attributeName="stroke-dasharray" values="0 200;200 0" dur="3s" repeatCount="indefinite" />
        </path>
        <circle cx="200" cy="5" r="3" fill="#ec4899">
          <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>
    
    {/* Action items */}
    <g transform="translate(50, 270)">
      <text x="0" y="0" fill="#475569" fontSize="14" fontWeight="bold">Suggested Actions</text>
      <rect y="10" width="400" height="25" fill="#ddd6fe" rx="4" />
      <text x="10" y="27" fill="#7c3aed" fontSize="12">📚 Share objection handling playbook</text>
      <rect y="40" width="400" height="25" fill="#fecaca" rx="4" />
      <text x="10" y="57" fill="#dc2626" fontSize="12">🎯 Schedule 1:1 coaching session</text>
    </g>
  </svg>
)

const IntelligenceVisual = () => (
  <svg width="600" height="400" viewBox="0 0 600 400" className="w-full h-full">
    <rect width="600" height="400" fill="#f8fafc" rx="12" />
    
    {/* Analytics dashboard */}
    <rect x="30" y="30" width="540" height="340" fill="#ffffff" rx="8" stroke="#e2e8f0" strokeWidth="2" />
    
    {/* Header */}
    <rect x="30" y="30" width="540" height="50" fill="#1e293b" rx="8" />
    <text x="50" y="58" fill="#ffffff" fontSize="16" fontWeight="bold">Sales Intelligence Dashboard</text>
    
    {/* AI Brain icon */}
    <g transform="translate(520, 45)">
      <path d="M15 5 C20 0, 25 5, 25 10 C30 8, 32 15, 28 18 C30 25, 20 28, 15 25 C10 28, 0 25, 2 18 C-2 15, 0 8, 5 10 C5 5, 10 0, 15 5 Z" 
            fill="#8b5cf6" opacity="0.8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </path>
      <circle cx="10" cy="12" r="1.5" fill="#ffffff" />
      <circle cx="20" cy="12" r="1.5" fill="#ffffff" />
    </g>
    
    {/* Top performers leaderboard */}
    <g transform="translate(50, 100)">
      <text x="0" y="0" fill="#475569" fontSize="14" fontWeight="bold">Top Performers</text>
      <rect y="10" width="160" height="30" fill="#dcfce7" rx="4" />
      <circle cx="15" cy="25" r="8" fill="#22c55e" />
      <text x="11" y="29" fill="white" fontSize="10" fontWeight="bold">1</text>
      <text x="30" y="22" fill="#374151" fontSize="12" fontWeight="bold">Sarah Chen</text>
      <text x="30" y="32" fill="#6b7280" fontSize="10">97% close rate</text>
      <text x="130" y="28" fill="#22c55e" fontSize="14" fontWeight="bold">$2.1M</text>
      
      <rect y="45" width="160" height="30" fill="#fef3c7" rx="4" />
      <circle cx="15" cy="60" r="8" fill="#f59e0b" />
      <text x="11" y="64" fill="white" fontSize="10" fontWeight="bold">2</text>
      <text x="30" y="57" fill="#374151" fontSize="12" fontWeight="bold">Mike Johnson</text>
      <text x="30" y="67" fill="#6b7280" fontSize="10">89% close rate</text>
      <text x="130" y="63" fill="#f59e0b" fontSize="14" fontWeight="bold">$1.8M</text>
      
      <rect y="80" width="160" height="30" fill="#fed7d7" rx="4" />
      <circle cx="15" cy="95" r="8" fill="#ef4444" />
      <text x="11" y="99" fill="white" fontSize="10" fontWeight="bold">3</text>
      <text x="30" y="92" fill="#374151" fontSize="12" fontWeight="bold">Alex Rivera</text>
      <text x="30" y="102" fill="#6b7280" fontSize="10">85% close rate</text>
      <text x="130" y="98" fill="#ef4444" fontSize="14" fontWeight="bold">$1.6M</text>
    </g>
    
    {/* Winning phrases */}
    <g transform="translate(250, 100)">
      <text x="0" y="0" fill="#475569" fontSize="14" fontWeight="bold">Winning Phrases</text>
      <rect y="10" width="200" height="25" fill="#ddd6fe" rx="4" />
      <text x="10" y="27" fill="#7c3aed" fontSize="11">"Tell me more about your biggest challenge"</text>
      <text x="170" y="27" fill="#10b981" fontSize="10" fontWeight="bold">+23%</text>
      
      <rect y="40" width="200" height="25" fill="#ecfdf5" rx="4" />
      <text x="10" y="57" fill="#059669" fontSize="11">"What would success look like?"</text>
      <text x="170" y="57" fill="#10b981" fontSize="10" fontWeight="bold">+18%</text>
      
      <rect y="70" width="200" height="25" fill="#fef2f2" rx="4" />
      <text x="10" y="87" fill="#dc2626" fontSize="11">"Let me send you a proposal"</text>
      <text x="170" y="87" fill="#ef4444" fontSize="10" fontWeight="bold">-12%</text>
    </g>
    
    {/* Performance analytics chart */}
    <g transform="translate(50, 230)">
      <text x="0" y="0" fill="#475569" fontSize="14" fontWeight="bold">Team Performance Trends</text>
      <rect y="15" width="400" height="100" fill="#f8fafc" rx="6" stroke="#e2e8f0" strokeWidth="1" />
      
      {/* Chart grid */}
      <g opacity="0.3">
        <line x1="0" y1="35" x2="400" y2="35" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="0" y1="65" x2="400" y2="65" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="0" y1="95" x2="400" y2="95" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="100" y1="15" x2="100" y2="115" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="200" y1="15" x2="200" y2="115" stroke="#e2e8f0" strokeWidth="1" />
        <line x1="300" y1="15" x2="300" y2="115" stroke="#e2e8f0" strokeWidth="1" />
      </g>
      
      {/* Trend lines */}
      <path d="M20 85 L80 75 L140 65 L200 55 L260 45 L320 35 L380 25" stroke="#10b981" strokeWidth="3" fill="none">
        <animate attributeName="stroke-dasharray" values="0 400;400 0" dur="4s" repeatCount="indefinite" />
      </path>
      <path d="M20 95 L80 90 L140 85 L200 78 L260 70 L320 62 L380 55" stroke="#ec4899" strokeWidth="3" fill="none" strokeDasharray="5,5">
        <animate attributeName="stroke-dasharray" values="5,5;10,10;5,5" dur="2s" repeatCount="indefinite" />
      </path>
      
      {/* Data points */}
      <circle cx="380" cy="25" r="4" fill="#10b981">
        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="380" cy="55" r="4" fill="#ec4899">
        <animate attributeName="r" values="4;6;4" dur="2.3s" repeatCount="indefinite" />
      </circle>
      
      {/* Legend */}
      <g transform="translate(420, 35)">
        <circle cx="0" cy="0" r="3" fill="#10b981" />
        <text x="10" y="4" fill="#475569" fontSize="10">Close Rate</text>
        <circle cx="0" cy="20" r="3" fill="#ec4899" />
        <text x="10" y="24" fill="#475569" fontSize="10">Revenue</text>
      </g>
    </g>
    
    {/* Real-time insights */}
    <g transform="translate(480, 230)">
      <rect width="80" height="80" fill="#f0f9ff" rx="6" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="5,5">
        <animate attributeName="stroke-dasharray" values="5,5;10,10;5,5" dur="2s" repeatCount="indefinite" />
      </rect>
      <text x="40" y="20" fill="#0ea5e9" fontSize="10" textAnchor="middle" fontWeight="bold">LIVE</text>
      <text x="40" y="35" fill="#374151" fontSize="8" textAnchor="middle">Sarah just</text>
      <text x="40" y="45" fill="#374151" fontSize="8" textAnchor="middle">closed a</text>
      <text x="40" y="55" fill="#22c55e" fontSize="12" textAnchor="middle" fontWeight="bold">$50K</text>
      <text x="40" y="68" fill="#374151" fontSize="8" textAnchor="middle">deal!</text>
    </g>
  </svg>
)

interface TabContent {
  tag: string
  title: string
  description: string
  buttonText: string
}

const tabData: Record<string, TabContent> = {
  'VISIBILITY': {
    tag: 'VISIBILITY',
    title: 'Hear what your team actually says',
    description: 'Wisp automatically records and transcribes every sales call—so managers don\'t have to guess what happened. Get full visibility into every rep\'s conversations, from first pitch to close.',
    buttonText: 'SEE CALL VISIBILITY',
  },
  'COACHING': {
    tag: 'COACHING',
    title: 'Train reps with daily, targeted feedback',
    description: 'Wisp scores every call and highlights where deals are won or lost. Managers can leave timestamped comments and let reps self-correct—no need to wait for quarterly reviews or shadow sessions.',
    buttonText: 'EXPLORE COACHING TOOLS',
  },
  'INTELLIGENCE': {
    tag: 'INTELLIGENCE',
    title: 'Scale what your top reps do best',
    description: 'Wisp analyzes thousands of conversations to find what actually closes—whether it\'s a phrase, tone, or objection-handling tactic. These patterns get turned into real-time training moments for your whole team.',
    buttonText: 'UNLOCK SALES INTELLIGENCE',
  },
}

export function InteractiveSalesCoachingSection() {
  const [activeTab, setActiveTab] = useState('VISIBILITY')
  const currentContent = tabData[activeTab]

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-custom-dark-bg text-text-dark-primary">
      <div className="container px-4 md:px-8 lg:px-12 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-12 text-text-dark-primary">
          Learn from every conversation. Get more wins.
        </h2>
        <div className="flex justify-center space-x-8 mb-12 text-lg font-semibold">
          {Object.keys(tabData).map((tabName) => (
            <div
              key={tabName}
              className={`relative pb-2 cursor-pointer ${
                activeTab === tabName ? 'text-primary-pink' : 'text-text-dark-muted hover:text-primary-pink transition-colors'
              }`}
              onClick={() => setActiveTab(tabName)}
            >
              {tabName}
              {activeTab === tabName && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-pink"></span>
              )}
            </div>
          ))}
        </div>
        <div className="bg-card-light-bg p-8 rounded-xl shadow-lg grid lg:grid-cols-2 gap-8 items-center text-left">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-text-light-primary">
              {currentContent.tag}
            </div>
            <h3 className="text-3xl md:text-4xl font-bold leading-tight text-text-light-primary">
              {currentContent.title}
            </h3>
            <p className="text-lg text-text-light-muted">
              {currentContent.description}
            </p>
            <Button className="bg-primary-pink text-text-dark-primary hover:bg-primary-pink/90 px-8 py-3 rounded-md shadow-md">
              {currentContent.buttonText}
            </Button>
          </div>
          <div className="flex justify-center items-center">
            <div className="w-full h-full max-w-[600px] max-h-[400px] flex items-center justify-center">
              {activeTab === 'VISIBILITY' && <VisibilityVisual />}
              {activeTab === 'COACHING' && <CoachingVisual />}
              {activeTab === 'INTELLIGENCE' && <IntelligenceVisual />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
