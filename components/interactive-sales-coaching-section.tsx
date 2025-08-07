'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

// Custom visual components
const ClarityVisual = () => (
  <div className="w-full h-full bg-gray-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Sales Call Dashboard</h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-500 text-sm font-bold">LIVE</span>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-2 gap-6">
        {/* Recent Calls */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Recent Calls</h4>
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="text-sm font-medium text-gray-900">Sarah Johnson - Acme Corp</div>
              <div className="text-xs text-gray-500">2 minutes ago • 15:32</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="text-sm font-medium text-gray-900">Mike Chen - TechStart</div>
              <div className="text-xs text-gray-500">5 minutes ago • 15:28</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="text-sm font-medium text-gray-900">Lisa Park - GrowthCo</div>
              <div className="text-xs text-gray-500">12 minutes ago • 15:18</div>
            </div>
          </div>
        </div>
        
        {/* Call Details */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Call Details</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Transcript Preview</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Sarah: "I understand your concerns about the pricing..."</div>
              <div>Client: "Yes, we're looking for something more..."</div>
              <div>Sarah: "Let me show you our enterprise package..."</div>
              <div>Client: "That sounds more in line with our budget."</div>
              <div>Sarah: "Perfect! Let me send you the proposal..."</div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">CLOSED</span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">$25K DEAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const CoachingVisual = () => (
  <div className="w-full h-full bg-gray-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Coaching Dashboard</h3>
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
          87
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-2 gap-6">
        {/* Call Performance List */}
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              92
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Call with Acme Corp</div>
              <div className="text-xs text-gray-600">Great objection handling</div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-4">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              73
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Call with TechStart</div>
              <div className="text-xs text-gray-600">Needs improvement on closing</div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              89
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Call with DataFlow</div>
              <div className="text-xs text-gray-600">Excellent discovery questions</div>
            </div>
          </div>
        </div>
        
        {/* Coaching Annotations */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Coaching Annotations</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">12:34</span>
              <span className="text-xs text-gray-700">Great rapport building here!</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">18:45</span>
              <span className="text-xs text-gray-700">Try to probe deeper on pain points</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">23:12</span>
              <span className="text-xs text-gray-700">Perfect closing technique!</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Suggested Actions */}
      <div className="px-6 pb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Suggested Actions</h4>
        <div className="space-y-2">
          <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-sm">
            📚 Share objection handling playbook
          </div>
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm">
            🎯 Schedule 1:1 coaching session
          </div>
        </div>
      </div>
    </div>
  </div>
)

const IntelligenceVisual = () => (
  <div className="w-full h-full bg-gray-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Sales Intelligence Dashboard</h3>
        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center animate-pulse">
          <span className="text-white text-sm">🧠</span>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-2 gap-6">
        {/* Top Performers */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Top Performers</h4>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Sarah Chen</div>
                  <div className="text-xs text-gray-600">97% close rate</div>
                </div>
              </div>
              <div className="text-green-600 font-bold text-sm">$2.1M</div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Mike Johnson</div>
                  <div className="text-xs text-gray-600">89% close rate</div>
                </div>
              </div>
              <div className="text-yellow-600 font-bold text-sm">$1.8M</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Alex Rivera</div>
                  <div className="text-xs text-gray-600">85% close rate</div>
                </div>
              </div>
              <div className="text-red-600 font-bold text-sm">$1.6M</div>
            </div>
          </div>
        </div>
        
        {/* Winning Phrases */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Winning Phrases</h4>
          <div className="space-y-3">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
              <div className="text-xs text-purple-800">"Tell me more about your biggest challenge"</div>
              <div className="text-green-600 font-bold text-xs">+23%</div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
              <div className="text-xs text-green-800">"What would success look like?"</div>
              <div className="text-green-600 font-bold text-xs">+18%</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
              <div className="text-xs text-red-800">"Let me send you a proposal"</div>
              <div className="text-red-600 font-bold text-xs">-12%</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Team Performance Chart */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-700">Team Performance Trends</h4>
          <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg px-3 py-2">
            <div className="text-blue-600 text-xs font-bold mb-1">LIVE</div>
            <div className="text-xs text-gray-700">Sarah just closed a</div>
            <div className="text-green-600 font-bold text-sm">$50K deal!</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 h-24 flex items-end justify-between relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-px bg-gradient-to-r from-green-400 to-pink-400"></div>
          </div>
          <div className="text-xs text-gray-500">Close Rate</div>
          <div className="text-xs text-gray-500">Revenue</div>
        </div>
      </div>
    </div>
  </div>
)

interface TabContent {
  tag: string
  title: string
  description: string
  buttonText: string
  buttonHref?: string
}

const tabData: Record<string, TabContent> = {
  'CLARITY': {
    tag: 'CLARITY',
    title: 'Hear what your team actually says',
    description: 'Wisp automatically records and transcribes every sales call—so managers don\'t have to guess what happened. Get full visibility into every rep\'s conversations, from first pitch to close.',
    buttonText: 'Book Demo',
    buttonHref: 'https://calendly.com/adimahna/30min',
  },
  'COACHING': {
    tag: 'COACHING',
    title: 'Train reps with daily, targeted feedback',
    description: 'Wisp scores every call and highlights where deals are won or lost. Managers can leave timestamped comments and let reps self-correct—no need to wait for quarterly reviews or shadow sessions.',
    buttonText: 'Book Demo',
    buttonHref: 'https://calendly.com/adimahna/30min',
  },
  'INTELLIGENCE': {
    tag: 'INTELLIGENCE',
    title: 'Scale what your top reps do best',
    description: 'Wisp analyzes thousands of conversations to find what actually closes—whether it\'s a phrase, tone, or objection-handling tactic. These patterns get turned into real-time training moments for your whole team.',
    buttonText: 'Book Demo',
    buttonHref: 'https://calendly.com/adimahna/30min',
  },
}

export function InteractiveSalesCoachingSection() {
  const [activeTab, setActiveTab] = useState('CLARITY')
  const currentContent = tabData[activeTab]

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-custom-dark-bg text-text-dark-primary">
      <div className="container px-4 md:px-8 lg:px-12 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-12 text-text-dark-primary">
          Learn from every conversation. Boost every sale.

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
            <a
              href={currentContent.buttonHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary-pink text-text-dark-primary hover:bg-primary-pink/90 px-8 py-3 rounded-md shadow-md text-center font-medium transition-colors"
            >
              {currentContent.buttonText}
            </a>
          </div>
          <div className="flex justify-center items-center">
            <div className="w-full h-[400px] max-w-[600px] rounded-xl overflow-hidden">
              {activeTab === 'CLARITY' && <ClarityVisual />}
              {activeTab === 'COACHING' && <CoachingVisual />}
              {activeTab === 'INTELLIGENCE' && <IntelligenceVisual />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
