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
                Turn client conversations into <span className="text-purple-600">revenue intelligence.</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
                Transform every consultation, treatment discussion, and follow-up into actionable insights that boost
                your medical spa's revenue and client satisfaction.
              </p>
                        <div className="flex justify-start gap-4">
            <Button
              size="lg"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:text-gray-900 hover:border-purple-400 px-8 py-4 text-lg font-semibold"
              onClick={() => window.location.href = '/signin'}
            >
              Login
            </Button>
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
              <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                <source src="/videos/videotalking.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {/* Gradient overlay for blurbs readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent"></div>

              {/* Blurbs with animations */}
              <div className="absolute top-1/4 left-1/4 bg-gray-800 text-white px-4 py-2 rounded-full text-sm animate-fade-in-left animate-delay-300">
                What could be done better?
              </div>
              <div className="absolute top-1/2 right-1/4 bg-gray-800 text-white px-4 py-2 rounded-full text-sm animate-fade-in-right animate-delay-500">
                02:15 – First Impressions
              </div>
              <div className="absolute bottom-1/4 left-1/3 bg-gray-800 text-white px-4 py-2 rounded-full text-sm animate-fade-in-left animate-delay-700">
                09:40 – Skin Goals
              </div>
              <div className="absolute bottom-1/6 right-1/6 bg-gray-800 text-white px-4 py-2 rounded-full text-sm animate-fade-in-right animate-delay-900">
                18:22 – Treatment Education
              </div>
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
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50 bg-transparent font-semibold"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  See How It Works
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

      {/* New Section: Discover the Impact (replaces "Real Results") */}
      <section id="results" className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Discover the <span className="text-purple-600">WispAI Impact</span>
          </h2>
          <p className="text-gray-700 mb-12">See how WispAI can transform your medical spa's potential.</p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-100 border border-gray-200 p-6 rounded-lg shadow-sm">
              <CardContent className="p-0 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 border border-purple-300 rounded-full flex items-center justify-center mb-4">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">Actionable Insights</h3>
                <p className="text-gray-700 text-sm">
                  Uncover hidden opportunities in every client interaction to drive growth.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-100 border border-gray-200 p-6 rounded-lg shadow-sm">
              <CardContent className="p-0 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 border border-purple-300 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">Empowered Team</h3>
                <p className="text-gray-700 text-sm">
                  Equip your staff with the tools to enhance client engagement and sales performance.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-100 border border-gray-200 p-6 rounded-lg shadow-sm">
              <CardContent className="p-0 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 border border-purple-300 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">Maximized Revenue</h3>
                <p className="text-gray-700 text-sm">
                  Optimize your service offerings and pricing strategies for greater profitability.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <Button className="neon-purple text-white px-8 py-3 font-semibold">Learn More About Our Impact</Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked <span className="text-purple-600">Questions</span>
            </h2>
            <p className="text-xl text-gray-700">Everything you need to know about WispAI</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border border-gray-200 bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                  What is WispAI and how can it help my medical spa?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  WispAI is an AI-powered platform designed to analyze client conversations and provide actionable
                  insights to boost your medical spa's revenue. It helps identify upsell opportunities, improve
                  treatment recommendations, and enhance overall client satisfaction.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border border-gray-200 bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                  How does WispAI ensure data privacy and security?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  We prioritize data privacy and security with robust encryption protocols and secure data handling
                  practices. All client information is processed and stored with the utmost care to ensure
                  confidentiality and integrity.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border border-gray-200 bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                  What kind of support does WispAI offer?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  WispAI provides comprehensive support including initial onboarding, training sessions for your staff,
                  and ongoing technical assistance. Our team is dedicated to ensuring you get the most out of our
                  platform.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border border-gray-200 bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                  Is WispAI compatible with my existing systems?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  WispAI is designed for seamless integration with many popular medical spa management and booking
                  systems. During your demo, we can discuss your specific setup and ensure compatibility.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border border-gray-200 bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                  How long does it take to set up WispAI?
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Setup is quick and straightforward. Our team will guide you through the process, which typically takes
                  just a few hours to get your account configured and ready to start analyzing conversations.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            Ready to boost your <span className="text-purple-600">medical spa revenue?</span>
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
            <Button
              size="lg"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-8 py-3 bg-transparent font-semibold"
            >
              View Pricing Plans
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
