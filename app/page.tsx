"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ArrowRight, Target, Server, Settings, CalendarDays, Clock, LineChart, Zap, Users, Rocket, MessageCircle, Mic, BarChart3, Phone, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InteractiveSalesCoachingSection } from "@/components/interactive-sales-coaching-section" // Import the new component

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentBusinessType, setCurrentBusinessType] = useState(0)
  
  const businessTypes = [
    "Medical Spa",
    "Retail Store", 
    "Healthcare Clinic",
    "Industrial Sales Team"
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    // Add smooth scrolling behavior to the entire page
    document.documentElement.style.scrollBehavior = 'smooth'
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBusinessType((prev) => (prev + 1) % businessTypes.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

return (
  <div className="min-h-screen bg-custom-light-bg font-sans">
    {/* Header/Navbar */}
    <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 md:px-8 lg:px-12 transition-all duration-300 ${
      isScrolled 
        ? 'bg-black/20 backdrop-blur-md border-b border-white/10' 
        : 'bg-transparent'
    }`}>
      <Link href="#" className="flex items-center space-x-2">
        <Image src="/logocandyprob.png" width={24} height={24} alt="Candytrail Logo" className="h-6 w-6" />
        <span className="text-xl font-bold text-white drop-shadow-md">candytrail</span>
      </Link>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-white hover:bg-white/10 px-4 py-2 rounded-md backdrop-blur-sm flex items-center space-x-2">
              <span>Solutions</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg w-80 p-2">
            <DropdownMenuItem className="hover:bg-gray-100/80 focus:bg-gray-100/80 p-4 rounded-lg">
              <Link href="/automated-outbound" className="w-full flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mt-1">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Automated Outbound</div>
                  <div className="text-sm text-gray-600">AI-powered lead generation and personalized outreach campaigns.</div>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-100/80 focus:bg-gray-100/80 p-4 rounded-lg">
              <Link href="/" className="w-full flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Customer Experience</div>
                  <div className="text-sm text-gray-600">Analyze conversations and improve customer interactions.</div>
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href="/signin">
          <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 px-6 py-2 rounded-md backdrop-blur-sm bg-white/10">
            Login
          </Button>
        </Link>
        <Link href="https://calendly.com/adimahna/30min" target="_blank" rel="noopener noreferrer">
          <Button className="bg-primary-pink text-text-dark-primary hover:bg-primary-pink/90 px-6 py-2 rounded-md shadow-md">
            Book Demo
          </Button>
        </Link>
      </div>
    </header>

    <main>
      {/* Hero Section with Video Background */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 bg-black overflow-hidden">
        {/* Right-half background image with left fade to black */}
        <div className="absolute inset-y-0 right-0 w-1/2 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('/images/BackImage.png')` }}
          />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-l from-transparent to-black" />
        </div>
        <div className="absolute inset-0 bg-black opacity-50 z-0"></div> {/* Overlay for readability */}
        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center px-4 md:px-8 lg:px-12 text-text-dark-primary">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-gray-800 px-3 py-2 text-xs font-medium text-white space-x-2">
              <Image src="/yclogothing.svg" width={16} height={16} alt="Y Combinator Logo" className="h-4 w-4 object-contain" />
              <span>Backed by Y Combinator</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
              Reveal insights from every conversation
            </h1>
            <p className="text-lg text-gray-200 max-w-xl">
              Capture and review in‑person sales visits to coach better, spread winning playbooks, and find missed revenue.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <Link href="https://calendly.com/adimahna/30min" target="_blank" rel="noopener noreferrer" className="inline-block">
                <Button className="bg-primary-pink text-text-dark-primary hover:bg-primary-pink/90 px-10 py-8 text-lg md:text-xl rounded-xl shadow-md font-semibold flex items-center space-x-3">
                  <span>Book Demo</span>
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>
              <Link href="tel:+19494138582" className="inline-block">
                <Button className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-8 text-lg md:text-xl rounded-xl shadow-md font-semibold flex items-center space-x-3">
                  <span>Talk to us</span>
                  <Phone className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
          {/* Calendar removed */}
        </div>
      </section>




      {/* Section: How it Works */}
      <section className="py-16 md:py-24 lg:py-32 bg-custom-dark-bg text-text-dark-primary">
        <div className="container px-4 md:px-8 lg:px-12 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-12">
            How it Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-pink/10 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-primary-pink" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Talk</h3>
              <p className="text-gray-600 text-sm">
                Reps engage customers naturally
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-pink/10 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-primary-pink" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Capture</h3>
              <p className="text-gray-600 text-sm">
                AI records and transcribes automatically
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-pink/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary-pink" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyze</h3>
              <p className="text-gray-600 text-sm">
                Get instant coaching and insights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Complete Customer Interaction Intelligence */}
      <section className="py-16 md:py-24 lg:py-32 bg-custom-dark-bg text-text-dark-primary">
        <div className="container grid lg:grid-cols-2 gap-12 items-center px-4 md:px-8 lg:px-12">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Full visibility into every conversation
            </h2>
            <p className="text-lg text-text-dark-muted max-w-lg mb-6">
              Automatic recording and AI analysis of every customer conversation.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-pink rounded-full"></div>
                <span className="text-text-dark-muted">Record and transcribe all meetings</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-pink rounded-full"></div>
                <span className="text-text-dark-muted">Extract key insights and outcomes</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-pink rounded-full"></div>
                <span className="text-text-dark-muted">Get personalized coaching tips</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div 
              className="bg-card-dark-bg rounded-xl p-6 shadow-lg relative overflow-hidden min-h-[400px]"
              style={{
                backgroundImage: `url('/images/thenewimage.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="relative z-10">
                <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm max-w-xs">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-3 w-3 text-primary-pink" />
                    <span className="text-xs font-medium text-gray-800">Insights</span>
                  </div>
                  <p className="text-xs text-gray-600">Timeline resolved, $3.2k agreed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Accelerate Training and Improve Performance 5x Faster */}
      <section className="py-16 md:py-24 lg:py-32 bg-custom-light-bg text-text-light-primary">
        <div className="container grid lg:grid-cols-2 gap-12 items-center px-4 md:px-8 lg:px-12">
          <div className="relative">
            <div 
              className="bg-white rounded-xl p-6 shadow-lg space-y-4 relative overflow-hidden"
              style={{
                backgroundImage: `url('/images/beauty.jpeg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="relative z-10 space-y-4">
                <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm max-w-xs">
                  <h3 className="text-xs font-semibold text-gray-800 mb-3">CONVERSATION OUTLINE</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs mt-0.5">1</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800">Customer Discovery</span>
                          <span className="text-xs text-gray-500">09:15</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Discussed skincare goals...</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs mt-0.5">2</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800">Objection Handling</span>
                          <span className="text-xs text-gray-500">14:32</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Budget concerns addressed...</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm max-w-xs">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-xs font-medium text-gray-800">01 - Fibrex</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-xs font-medium text-gray-800">02 - Price Presentation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-300 rounded"></div>
                      <span className="text-xs text-gray-500">03 - Total Offer</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm max-w-xs">
                  <h4 className="text-xs font-semibold text-gray-800 mb-2">SCRIPT CHECKLIST</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-purple-600">100%</span>
                    <span className="text-xs text-gray-500">10/24</span>
                  </div>
                  <div className="w-full bg-gray-200 roasunded-full h-1.5 mt-2">
                    <div className="bg-purple-600 h-1.5 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              AI-Powered Training
            </h2>
            <p className="text-lg text-text-light-muted max-w-lg mb-6">
              Automated coaching that improves performance after every conversation.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-pink rounded-full"></div>
                <span className="text-text-light-muted">Identify strengths and weaknesses</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-pink rounded-full"></div>
                <span className="text-text-light-muted">Get specific improvement tips</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-pink rounded-full"></div>
                <span className="text-text-light-muted">Track progress over time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Manage your team remotely */}
      <section className="py-16 md:py-24 lg:py-32 bg-custom-dark-bg text-text-dark-primary">
        <div className="container grid lg:grid-cols-2 gap-12 items-center px-4 md:px-8 lg:px-12">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Remote Team Management
            </h2>
            <p className="text-lg text-text-dark-muted max-w-lg mb-6">
              Monitor and coach your team from anywhere without being there.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-pink rounded-full"></div>
                <span className="text-text-dark-muted">Real-time performance monitoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-pink rounded-full"></div>
                <span className="text-text-dark-muted">Instant coaching notifications</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-pink rounded-full"></div>
                <span className="text-text-dark-muted">Team analytics dashboard</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div 
              className="bg-card-dark-bg rounded-xl p-6 shadow-lg relative overflow-hidden"
              style={{
                backgroundImage: `url('/images/newwoman.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="relative z-10">
                <div className="bg-white/70 rounded-lg p-4 mb-4 backdrop-blur-sm max-w-xs">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="h-4 w-4 text-primary-pink" />
                    <span className="text-sm font-semibold text-gray-800">Performance</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Premium interest detected</li>
                    <li>• $2,800 consultation closed</li>
                  </ul>
                </div>
                <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm max-w-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-primary-pink rounded-full flex items-center justify-center">
                      <Users className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-800">Emma Rodriguez</span>
                    <span className="text-xs text-gray-500 ml-auto">16:20</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    "Let me walk you through the process..."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Section: Sales Coaching completely done for you */}
      <InteractiveSalesCoachingSection />

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 lg:py-32 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="container relative z-10 px-4 md:px-8 lg:px-12 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
            Ready to ditch hit-or-miss shadows?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Let Candytrail auto-coach every conversation and turn daily customer interactions into data-driven training.
          </p>
          <div>
            <Link href="https://calendly.com/adimahna/30min" target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary-pink text-white hover:bg-primary-pink/90 px-12 py-6 rounded-xl shadow-lg text-xl md:text-2xl font-semibold flex items-center space-x-3 mx-auto">
                <span>Book a Live Demo</span>
                <ArrowRight className="h-7 w-7" />
              </Button>
            </Link>
            <p className="text-sm text-gray-400 mt-8">
              Check out candytrail at <span className="text-primary-pink">candytrail.ai</span> | Reach us at <span className="text-primary-pink">founders@candytrail.ai</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
)
}