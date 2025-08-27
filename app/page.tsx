"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ArrowRight, Target, Server, Settings, CalendarDays, Clock, LineChart, Zap, Users, Rocket, MessageCircle, Mic, BarChart3 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { CounterUp } from "@/components/ui/counter-up"
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
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 bg-custom-light-bg overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          loop
          muted
          playsInline
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CANDYTRAIL-BmM71mJr0fP9EFbn0h4JNwVUtwhzuj.mp4"
        />
        <div className="absolute inset-0 bg-black opacity-50 z-0"></div> {/* Overlay for readability */}
        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center px-4 md:px-8 lg:px-12 text-text-dark-primary">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-gray-800 px-3 py-2 text-xs font-medium text-white space-x-2">
              <Image src="/yclogothing.svg" width={16} height={16} alt="Y Combinator Logo" className="h-4 w-4 object-contain" />
              <span>Backed by Y Combinator</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
              Intelligence from every customer interaction
            </h1>
            <Link href="https://calendly.com/adimahna/30min" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
              <Button className="bg-primary-pink text-text-dark-primary hover:bg-primary-pink/90 px-8 py-3 rounded-md shadow-md flex items-center space-x-2">
                <span>Book Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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
            <div className="bg-card-dark-bg p-8 rounded-xl shadow-lg space-y-4 flex flex-col items-center">
              <div className="w-20 h-20 bg-accent-pink rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-10 h-10 text-primary-pink" />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-primary-pink text-text-dark-primary rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">1</span>
                <h3 className="text-2xl font-bold">Talk</h3>
              </div>
              <p className="text-text-dark-muted">
                Your reps talks to your customers.
                <br />
                They try to close the deal.
              </p>
              <div className="w-full h-1 bg-accent-pink mt-4" />
            </div>
            <div className="bg-card-dark-bg p-8 rounded-xl shadow-lg space-y-4 flex flex-col items-center">
              <div className="w-20 h-20 bg-accent-pink rounded-full flex items-center justify-center mb-6">
                <Mic className="w-10 h-10 text-primary-pink" />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-primary-pink text-text-dark-primary rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">2</span>
                <h3 className="text-2xl font-bold">Capture</h3>
              </div>
              <p className="text-text-dark-muted">
                Candytrail automatically records and transcribes every sales conversation.
              </p>
              <div className="w-full h-1 bg-accent-pink mt-4" />
            </div>
            <div className="bg-card-dark-bg p-8 rounded-xl shadow-lg space-y-4 flex flex-col items-center">
              <div className="w-20 h-20 bg-accent-pink rounded-full flex items-center justify-center mb-6">
                <BarChart3 className="w-10 h-10 text-primary-pink" />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-primary-pink text-text-dark-primary rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">3</span>
                <h3 className="text-2xl font-bold">Analyse</h3>
              </div>
              <p className="text-text-dark-muted">
                Candytrail&apos;s AI analyzes patterns and delivers actionable coaching insights.
              </p>
              <div className="w-full h-1 bg-accent-pink mt-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Complete Customer Interaction Intelligence */}
      <section className="py-16 md:py-24 lg:py-32 bg-custom-dark-bg text-text-dark-primary">
        <div className="container grid lg:grid-cols-2 gap-12 items-center px-4 md:px-8 lg:px-12">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Complete Customer Interaction Intelligence
            </h2>
            <p className="text-lg text-text-dark-muted max-w-lg">
              Complete customer interaction tracking with recordings, transcripts, and analytics from every touchpoint.
            </p>
          </div>
          <div className="relative">
            <div 
              className="bg-card-dark-bg rounded-xl p-6 shadow-lg relative overflow-hidden"
              style={{
                backgroundImage: `url('/images/thenewimage.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="relative z-10">
                <div className="bg-black/70 rounded-lg p-4 mb-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-5 w-5 text-primary-pink" />
                    <span className="text-sm font-medium text-white">Smart Insights:</span>
                  </div>
                  <ul className="text-sm text-gray-200 space-y-1">
                    <li>• Patient expressed concerns about treatment timeline</li>
                    <li>• Agreed on comprehensive care plan, $3,200 value</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-black/70 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-pink rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-white">Dr. Sarah Chen</span>
                    </div>
                    <div className="text-xs text-gray-300">11:30</div>
                  </div>
                  <div className="bg-black/70 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-sm text-gray-200">
                      "Based on your symptoms, I'd recommend starting with our comprehensive wellness assessment..."
                    </p>
                  </div>
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
              <div className="relative z-10">
                <div className="bg-black/70 rounded-lg p-4 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-white mb-3">INTERACTION BREAKDOWN</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary-pink rounded-full flex items-center justify-center text-white text-xs">C</div>
                        <span className="text-sm font-medium text-white">Client Consultation</span>
                      </div>
                      <span className="text-xs text-gray-300">08:22</span>
                    </div>
                    <p className="text-xs text-gray-200 ml-8">Specialist discussed skincare routine and client goals...</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary-pink rounded-full flex items-center justify-center text-white text-xs">C</div>
                        <span className="text-sm font-medium text-white">Concern Resolution</span>
                      </div>
                      <span className="text-xs text-gray-300">12:15</span>
                    </div>
                    <p className="text-xs text-gray-200 ml-8">Client expressed budget concerns, specialist offered alternatives...</p>
                  </div>
                </div>
                
                <div className="bg-black/70 rounded-lg p-4 backdrop-blur-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-primary-pink rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm text-white">01 - Skin Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-primary-pink rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm text-white">02 - Treatment Recommendation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-500 rounded-sm"></div>
                      <span className="text-sm text-gray-300">03 - Package Selection</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/70 rounded-lg p-4 backdrop-blur-sm">
                  <h4 className="text-sm font-medium text-white mb-2">SERVICE PROTOCOL</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-pink">78%</span>
                    <span className="text-xs text-gray-300">14/18</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                    <div className="bg-primary-pink h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Streamlined Training and Enhanced Performance
            </h2>
            <p className="text-lg text-text-light-muted max-w-lg">
              AI-powered coaching tools accelerate team improvement and training efficiency. Deliver personalized feedback to every team member while enabling supervisors to coach more staff effectively.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Manage your team remotely */}
      <section className="py-16 md:py-24 lg:py-32 bg-custom-dark-bg text-text-dark-primary">
        <div className="container grid lg:grid-cols-2 gap-12 items-center px-4 md:px-8 lg:px-12">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Manage your team remotely.
            </h2>
            <p className="text-lg text-text-dark-muted max-w-lg">
              With our platform, you can supervise from any location. Your team leaders no longer need constant travel. They can guide and support all staff members directly from their home office or any remote location.
            </p>
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
                <div className="bg-black/70 rounded-lg p-4 mb-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-5 w-5 text-primary-pink" />
                    <span className="text-sm font-medium text-white">Performance Analytics:</span>
                  </div>
                  <ul className="text-sm text-gray-200 space-y-1">
                    <li>• Client expressed interest in premium service package</li>
                    <li>• Successfully closed consultation, $2,800 service agreement</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-black/70 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-pink rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-white">Emma Rodriguez (Service Specialist)</span>
                    </div>
                    <div className="text-xs text-gray-300">16:20</div>
                  </div>
                  <div className="bg-black/70 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-sm text-gray-200">
                      "I understand your concerns about the process. Let me walk you through exactly what we'll be doing..."
                    </p>
                  </div>
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
            Ready to ditch hit-or-miss ride-alongs?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Let Candytrail auto-coach every conversation and turn daily customer interactions into data-driven training.
          </p>
          <div className="space-y-4">
            <Link href="https://calendly.com/adimahna/30min" target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary-pink text-white hover:bg-primary-pink/90 px-8 py-4 rounded-md shadow-md text-lg font-semibold flex items-center space-x-2 mx-auto">
                <span>Book a Live Demo</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-gray-400">
              Check out candytrail at <span className="text-primary-pink">candytrail.ai</span> | Reach us at <span className="text-primary-pink">founders@candytrail.ai</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
)
}