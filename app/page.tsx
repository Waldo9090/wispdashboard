"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mic, BarChart3, Users, CheckCircle, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <div className="flex items-center space-x-1 transition-transform duration-300 group-hover:scale-110">
              <div className="w-1.5 h-5 bg-purple-500 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-3 bg-purple-400 rounded-full animate-pulse delay-100"></div>
              <div className="w-1.5 h-6 bg-purple-600 rounded-full animate-pulse delay-200"></div>
              <div className="w-1.5 h-2 bg-purple-300 rounded-full animate-pulse delay-300"></div>
            </div>
            <span className="text-2xl font-bold text-gray-900 transition-colors duration-300">WISP AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 hover:scale-105"
              >
                Login
                
              </Button>
            </Link>
            <Link href="/demo">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-0.5">
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 via-transparent to-blue-100/20"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div
          className={`container mx-auto text-center max-w-5xl relative z-10 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="inline-block mb-8 px-6 py-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full border border-purple-200/50 backdrop-blur-sm">
            <p className="text-purple-700 text-lg font-medium">
              ✨ Supercharge Your Aesthetic Consults with AI Voice Analytics
            </p>
          </div>

          <h1 className="text-7xl md:text-9xl font-bold mb-8 leading-tight text-gray-900 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent animate-fade-in">
            Wisp AI
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed opacity-90">
            The AI-powered coaching tool for aesthetic clinics. Wisp AI records and analyzes your front desk and
            consultation conversations—giving you actionable insights that boost conversion rates, ticket sizes, and
            patient satisfaction.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/demo">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-10 py-5 text-lg rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
                Book a Demo
                <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-purple-300 px-10 py-5 text-lg rounded-2xl bg-white/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
              >
                Login to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Wisp AI Section */}
      <section className="py-32 px-6 bg-gradient-to-br from-white via-gray-50 to-purple-50/30">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-6xl md:text-7xl font-bold leading-tight text-gray-900">🎯 Why Wisp AI?</h2>
              <div className="space-y-6 text-xl text-gray-600 leading-relaxed">
                <p>
                  In aesthetic medicine, every conversation matters. Whether it's your receptionist booking a client or
                  a provider walking through treatment options, the way you speak can make or break a sale.
                </p>
                <p>
                  Wisp AI gives aesthetic clinics 100% visibility into those conversations—so you can coach your team,
                  improve outcomes, and grow revenue with data-backed precision.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Mic className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">AI Summary</p>
                      <p className="text-gray-900 font-semibold text-lg">Botox consultation completed</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {["Treatment options discussed", "Pricing presented clearly", "Follow-up scheduled"].map(
                      (item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 transition-colors duration-300"
                        >
                          <span className="text-gray-700">• {item}</span>
                          <span className="text-green-600 font-bold">✓</span>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-500 mb-3 font-medium">Sarah Johnson (Provider)</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 font-medium">Conversion Score: 85%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30">
        <div className="container mx-auto text-center">
          <h2 className="text-6xl md:text-7xl font-bold mb-24 text-gray-900">🧠 How It Works</h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Mic,
                title: "Record Conversations — Seamlessly",
                description:
                  "Set up lightweight audio capture from iPads or mobile devices. Wisp runs in the background—no new apps or clunky hardware needed.",
                bgColor: "from-blue-50 to-blue-100",
                iconColor: "text-blue-600",
              },
              {
                icon: BarChart3,
                title: "AI-Powered Transcription & Analysis",
                description:
                  "Our system automatically transcribes the conversation and flags key moments: pricing objections, missed upsells, tone shifts, and more.",
                bgColor: "from-purple-50 to-purple-100",
                iconColor: "text-purple-600",
              },
              {
                icon: Users,
                title: "Track Performance & Coach Smarter",
                description:
                  "Weekly reports show how your team is performing. Spot trends, highlight top performers, and provide tailored coaching with real examples.",
                bgColor: "from-green-50 to-green-100",
                iconColor: "text-green-600",
              },
            ].map((item, index) => (
              <div key={index} className="group hover:scale-105 transition-all duration-500">
                <div
                  className={`w-28 h-28 bg-gradient-to-r ${item.bgColor} rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2`}
                >
                  <item.icon
                    className={`w-14 h-14 ${item.iconColor} group-hover:scale-110 transition-transform duration-300`}
                  />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-gray-900 group-hover:text-purple-700 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Measure */}
      <section className="py-32 px-6 bg-gradient-to-br from-gray-50 via-white to-purple-50/20">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-5xl font-bold mb-16 text-gray-900">📊 What Wisp AI Measures</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              "Consult-to-booking conversion rate",
              "Talk-to-listen ratio",
              "Objection handling effectiveness",
              "Upsell opportunities captured",
              "Script/treatment menu adherence",
              "Team performance across locations",
            ].map((metric, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group"
              >
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-gray-700 text-lg font-medium">{metric}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-32 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-purple-800/90"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-5xl font-bold mb-8 text-white">👀 Want Early Access?</h2>
          <p className="text-xl mb-8 text-purple-100">
            We're currently working with a small group of aesthetic clinics to shape the product.
          </p>
          <p className="text-lg mb-12 text-purple-100">
            If you're interested in increasing your conversion rates and gaining insights into every conversation
            happening in your business—
          </p>

          <Link href="/demo">
            <Button
              size="lg"
              className="bg-white text-purple-700 hover:bg-gray-100 px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1 group"
            >
              👉 Join our early pilot waitlist
              <ArrowRight className="ml-3 w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>

          <p className="text-sm mt-8 text-purple-200">We'll reach out with next steps and onboarding details.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-gray-100 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-8 group">
            <div className="flex items-center space-x-1 transition-transform duration-300 group-hover:scale-110">
              <div className="w-1.5 h-5 bg-purple-500 rounded-full"></div>
              <div className="w-1.5 h-3 bg-purple-400 rounded-full"></div>
              <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
              <div className="w-1.5 h-2 bg-purple-300 rounded-full"></div>
            </div>
            <span className="text-2xl font-bold text-gray-900">WISP AI</span>
          </div>
          <p className="text-gray-500 text-lg">© 2025 Wisp AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
