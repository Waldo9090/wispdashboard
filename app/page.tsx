"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ArrowRight, Target, Server, Settings, CalendarDays, Clock, LineChart, Zap, Users, Rocket, MessageCircle, Mic, BarChart3 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { CounterUp } from "@/components/ui/counter-up"
import { AnimatedHeading } from "@/components/animated-heading"
import { InteractiveDataSection } from "@/components/interactive-data-section"
import { InteractiveSalesCoachingSection } from "@/components/interactive-sales-coaching-section" // Import the new component

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

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
            <AnimatedHeading
              baseText="Sales automated by AI that "
              phrases={[
                "  finds your perfect leads",
                "  books your prospects",
                "  trains your sales reps",
                "  finds upsell opportunities",
              ]}
              interval={2000} // Time after phrase is fully typed before next one starts
              typingSpeed={75} // Speed of typing each character
            />
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

      {/* Section: The outbound partner built for hard-to-crack markets. */}
      <section className="py-16 md:py-24 lg:py-32 bg-custom-dark-bg text-text-dark-primary">
        <div className="container grid lg:grid-cols-2 gap-12 items-center px-4 md:px-8 lg:px-12">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            The AI sales layer built for markets where outbound breaks down.

            </h2>
            <p className="text-lg text-text-dark-muted max-w-lg">
            Candytrail combines web-crawling lead gen agents, personalized outreach, and real-time call coaching into one seamless system. No more cold lists or guesswork—just high-intent leads, smarter outreach, and daily coaching that drives results.

            </p>
            <Link href="https://calendly.com/adimahna/30min" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
              <Button className="bg-primary-pink text-text-dark-primary hover:bg-primary-pink/90 px-8 py-3 rounded-md shadow-md flex items-center space-x-2">
                <span>Book Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="bg-accent-pink p-8 rounded-xl shadow-lg space-y-6">
            <div className="bg-card-light-bg p-6 rounded-lg flex items-center space-x-4 shadow-sm">
              <Target className="h-6 w-6 text-primary-pink" />
              <span className="text-lg font-semibold text-text-light-primary">AI LEAD GEN</span>
            </div>
            <div className="bg-card-light-bg p-6 rounded-lg flex items-center space-x-4 shadow-sm">
              <Server className="h-6 w-6 text-primary-pink" />
              <span className="text-lg font-semibold text-text-light-primary">SALES INTELLIGENCE</span>
            </div>
            <div className="bg-card-light-bg p-6 rounded-lg flex items-center space-x-4 shadow-sm">
              <Settings className="h-6 w-6 text-primary-pink" />
              <span className="text-lg font-semibold text-text-light-primary">DAILY COACHING</span>
            </div>
          </div>

        </div>
      </section>

      {/* Section: Build better lead lists with custom databases */}
      <InteractiveDataSection />


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

      {/* New Section: Sales Coaching completely done for you */}
      <InteractiveSalesCoachingSection />
    </main>
  </div>
)
}
