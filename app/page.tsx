"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  TrendingUp,
  Calendar,
  MessageSquare,
  BarChart3,
  Clock,
  Star,
  Zap,
  Lightbulb,
  Users,
  DollarSign,
} from "lucide-react" // Added Lightbulb, Users, DollarSign

export default function MedicalSpaLanding() {
  const [activeTab, setActiveTab] = useState("visibility") // Default active tab

  const renderFeatureContent = () => {
    switch (activeTab) {
      case "visibility":
        return (
          <div className="bg-gray-100 rounded-lg p-12 border border-gray-200">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-sm text-purple-600 font-semibold mb-4">VISIBILITY</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  See what your clients <span className="text-purple-600">really want</span>
                </h3>
                <p className="text-gray-700 mb-8 leading-relaxed">
                  Our AI analyzes every consultation to identify client preferences, concerns, and budget
                  considerations. No more guessing what treatments to recommend - get data-driven insights that lead to
                  higher conversion rates.
                </p>
                <Button className="neon-purple text-white font-semibold">See How It Works</Button>
              </div>
              <div className="relative">
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600 font-medium">Client Insights Dashboard</span>
                    <div className="text-xs text-gray-500 font-medium">Live Analysis</div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded text-gray-900 border border-gray-200">
                      <div className="text-sm font-semibold">Budget Discussion</div>
                      <div className="text-xs text-gray-600 mt-1">Client mentioned $3,000 budget</div>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded text-gray-900">
                      <div className="text-sm font-semibold">Upsell Opportunity</div>
                      <div className="text-xs text-purple-600 mt-1">Perfect candidate for premium package</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "coaching":
        return (
          <div className="bg-gray-100 rounded-lg p-12 border border-gray-200">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-sm text-purple-600 font-semibold mb-4">COACHING</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  Train your team to <span className="text-purple-600">close more deals</span>
                </h3>
                <p className="text-gray-700 mb-8 leading-relaxed">
                  Get real-time coaching suggestions during consultations. Our AI identifies missed opportunities and
                  provides instant feedback to help your staff improve their sales techniques and client interactions.
                </p>
                <Button className="neon-purple text-white font-semibold">View Training Tools</Button>
              </div>
              <div className="relative">
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600 font-medium">Coaching Suggestions</span>
                    <div className="text-xs text-green-600 font-medium">Active</div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-gray-900">
                      <div className="text-sm font-semibold">Suggest Add-on Service</div>
                      <div className="text-xs text-green-600 mt-1">Client shows interest in skincare routine</div>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-gray-900">
                      <div className="text-sm font-semibold">Address Concern</div>
                      <div className="text-xs text-yellow-600 mt-1">Client mentioned budget constraints</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "intelligence":
        return (
          <div className="bg-gray-100 rounded-lg p-12 border border-gray-200">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-sm text-purple-600 font-semibold mb-4">INTELLIGENCE</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  Make <span className="text-purple-600">data-driven decisions</span>
                </h3>
                <p className="text-gray-700 mb-8 leading-relaxed">
                  Access comprehensive analytics and insights about your client interactions. Track conversion rates,
                  identify top-performing treatments, and optimize your spa's revenue strategy with actionable
                  intelligence.
                </p>
                <Button className="neon-purple text-white font-semibold">Explore Analytics</Button>
              </div>
              <div className="relative">
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600 font-medium">Performance Analytics</span>
                    <div className="text-xs text-blue-600 font-medium">This Month</div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded text-gray-900 border border-gray-200">
                      <div className="text-sm font-semibold">Top Treatment: Botox</div>
                      <div className="text-xs text-gray-600 mt-1">85% conversion rate</div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-gray-900">
                      <div className="text-sm font-semibold">Revenue Trend</div>
                      <div className="text-xs text-blue-600 mt-1">+32% increase this quarter</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }
  return (
    <div className="min-h-screen bg-white text-gray-900 font-poppins">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/images/wisp-logo.png" alt="WispAI" className="w-8 h-8" />
              <div className="text-2xl font-bold text-gray-900 text-purple-600">WispAI</div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:text-gray-900 hover:border-purple-400 font-semibold"
                onClick={() => window.location.href = '/signin'}
              >
                Login
              </Button>
              <Button
                className="neon-purple text-white font-semibold"
                onClick={() => window.open("https://calendly.com/adimahna/30min", "_blank")}
              >
                Book Demo
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Automate your sales layer with <span className="text-purple-600">AI</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
                Wisp finds leads, records every consult, flags missed opportunities, and coaches your aesthetic clinic team to close more packages.
              </p>
                        <div className="flex justify-start gap-4">

            <Button
              size="lg"
              className="neon-purple text-white px-12 py-4 text-lg font-semibold"
              onClick={() => window.open("https://calendly.com/adimahna/30min", "_blank")}
            >
                Book a Demo
            </Button>
          </div>
            </div>

            <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-lg bg-gray-200">
              <img 
                src="/images/newfoundimage.jpg" 
                alt="Aesthetic clinic consultation" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Gradient overlay for blurbs readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent"></div>

              {/* Blurbs with animations */}
              <div className="absolute top-1/4 left-1/4 bg-purple-800 text-white px-4 py-2 rounded-full text-sm animate-fade-in-left animate-delay-300">
              18:22 – Treatment Education
              </div>
              <div className="absolute top-1/2 right-1/4 bg-purple-800 text-white px-4 py-2 rounded-full text-sm animate-fade-in-right animate-delay-500">
              What could be done better?
              </div>
              <div className="absolute bottom-1/4 left-1/3 bg-purple-800 text-white px-4 py-2 rounded-full text-sm animate-fade-in-left animate-delay-700">
              02:15 – First Impressions
              </div>
              <div className="absolute bottom-1/6 right-1/6 bg-purple-800 text-white px-4 py-2 rounded-full text-sm animate-fade-in-right animate-delay-900">
              09:40 – Skin Goals
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Opportunity Finder Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              {/* Globe Visualization */}
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <div className="relative w-full h-64 flex items-center justify-center">
                  {/* Globe */}
                  <div className="w-48 h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full border-2 border-gray-200 relative overflow-hidden">
                    {/* Globe dots pattern */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full relative">
                        {/* North America */}
                        <div className="absolute top-8 left-1/4 w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="absolute top-12 left-1/3 w-1 h-1 bg-purple-500 rounded-full"></div>
                        <div className="absolute top-16 left-1/4 w-1 h-1 bg-purple-500 rounded-full"></div>
                        {/* Europe */}
                        <div className="absolute top-6 right-1/3 w-1 h-1 bg-purple-500 rounded-full"></div>
                        <div className="absolute top-10 right-1/4 w-1 h-1 bg-purple-500 rounded-full"></div>
                        {/* Asia */}
                        <div className="absolute top-8 right-1/6 w-1 h-1 bg-purple-500 rounded-full"></div>
                        <div className="absolute top-14 right-1/8 w-1 h-1 bg-purple-500 rounded-full"></div>
                        {/* Australia */}
                        <div className="absolute bottom-8 left-1/3 w-1 h-1 bg-purple-500 rounded-full"></div>
                        {/* South America */}
                        <div className="absolute bottom-12 left-1/4 w-1 h-1 bg-purple-500 rounded-full"></div>
                        <div className="absolute bottom-16 left-1/3 w-1 h-1 bg-purple-500 rounded-full"></div>
                        {/* Africa */}
                        <div className="absolute bottom-8 right-1/3 w-1 h-1 bg-purple-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Callout Boxes */}
                  <div className="absolute top-4 right-8 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">New Treatment Trends Detected</span>
                    </div>
                  </div>
                  
                  <div className="absolute top-1/2 left-4 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">Ideal Patients Identified</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-8 right-4 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">VIP Clients Monitored</span>
                    </div>
                  </div>
                  <div className="absolute bottom-8 left-8 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">Revenue Opportunities Uncovered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Opportunity Intelligence for Clinics</h2>
              </div>
              
              <p className="text-gray-700 mb-6 text-lg">
                Empower your clinic to grow faster with AI that uncovers new business opportunities from your existing client base and industry trends.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Identifies moments to upsell</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Follows key clients prefernce changes</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Finds new leads for your clinic</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Hero Section (now light) */}
      <section className="bg-gray-100 text-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Unlock insights from every <span className="text-purple-600">client interaction.</span>
              </h2>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Record and analyze client consultations to identify upsell opportunities, improve treatment
                recommendations, and maximize revenue per visit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="neon-purple text-white font-semibold"
                  onClick={() => window.open("https://calendly.com/adimahna/30min", "_blank")}
                >
                  Book a Demo
                </Button>

              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600 font-medium">Client Consultation Analysis</span>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/20"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">03:02 - Treatment Discussion</span>
                    <Clock className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">15:34 - Upsell Opportunity</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">45:08 - Follow-up Scheduling</span>
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 border border-purple-200 rounded">
                    <span className="text-sm text-gray-900">1:27:45 Revenue Opportunity</span>
                    <span className="text-purple-600 font-bold">$2,400</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-100 border-gray-200 text-center p-8 hover:border-purple-300 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 border border-purple-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-purple-600 mb-2">Up to 2x</div>
                <div className="text-gray-900 font-semibold mb-2">Boosted Operational Efficiency</div>
                <div className="text-gray-600 text-sm">
                  Streamline workflows and save valuable time in daily operations
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-100 border-gray-200 text-center p-8 hover:border-purple-300 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 border border-purple-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-purple-600 mb-2">Significant</div>
                <div className="text-gray-900 font-semibold mb-2">Enhanced Client Engagement</div>
                <div className="text-gray-600 text-sm">
                  Improve interactions and foster stronger client relationships
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-100 border-gray-200 text-center p-8 hover:border-purple-300 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 border border-purple-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-purple-600 mb-2">Increased</div>
                <div className="text-gray-900 font-semibold mb-2">Elevated Client Satisfaction</div>
                <div className="text-gray-600 text-sm">Deliver personalized experiences that delight your clients</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              How it Works
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Transform your consultations into actionable insights in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1: Record */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-purple-100 border-2 border-purple-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Record</h3>
              <p className="text-gray-700">Capture your client consultations with our easy-to-use recording system.</p>
            </div>

            {/* Step 2: Analyze */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Analyze</h3>
              <p className="text-gray-700">Our AI processes conversations to identify opportunities and insights.</p>
            </div>

            {/* Step 3: Optimize */}
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-green-100 border-2 border-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Optimize</h3>
              <p className="text-gray-700">Get actionable recommendations to improve sales and client satisfaction.</p>
            </div>
          </div>

          {/* Connection Lines */}
          <div className="hidden md:block relative mt-8">
            <div className="absolute top-1/2 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-purple-300 to-blue-300 transform -translate-y-1/2"></div>
            <div className="absolute top-1/2 right-1/3 w-1/3 h-0.5 bg-gradient-to-r from-blue-300 to-green-300 transform -translate-y-1/2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Learn from every conversation. <span className="text-purple-600">Boost every sale.</span>
            </h2>
            <div className="flex justify-center space-x-8 mt-8">
              <button
                onClick={() => setActiveTab("visibility")}
                className={`pb-2 px-4 font-semibold transition-colors ${
                  activeTab === "visibility"
                    ? "text-gray-900 border-b-2 border-purple-500"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                VISIBILITY
              </button>
              <button
                onClick={() => setActiveTab("coaching")}
                className={`pb-2 px-4 font-semibold transition-colors ${
                  activeTab === "coaching"
                    ? "text-gray-900 border-b-2 border-purple-500"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                COACHING
              </button>
              <button
                onClick={() => setActiveTab("intelligence")}
                className={`pb-2 px-4 font-semibold transition-colors ${
                  activeTab === "intelligence"
                    ? "text-gray-900 border-b-2 border-purple-500"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                INTELLIGENCE
              </button>
            </div>
          </div>

          {renderFeatureContent()}
        </div>
      </section>


      {/* CTA Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            Ready to boost your <span className="text-purple-600"> revenue?</span>
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of medical spas already using our platform to increase revenue, improve client satisfaction,
            and grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="neon-purple text-white px-8 py-3 font-semibold"
              onClick={() => window.open("https://calendly.com/adimahna/30min", "_blank")}
            >
              Book Your Demo Today
            </Button>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/images/wisp-logo.png" alt="WispAI" className="w-6 h-6" />
                <div className="text-2xl font-bold text-gray-900 text-purple-600">WispAI</div>
              </div>
              <p className="text-gray-600">Transforming medical spa conversations into revenue intelligence.</p>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Data Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2025 WispAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
