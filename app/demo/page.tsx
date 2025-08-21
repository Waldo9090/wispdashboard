"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, CheckCircle } from "lucide-react"

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    clinicType: "",
    teamSize: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              We've received your demo request. Our team will reach out within 24 hours to schedule your personalized
              demo.
            </p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="/logocandyprob.png" 
              alt="Wisp AI Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-foreground">Wisp AI</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Book Your Demo</h1>
          <p className="text-muted-foreground">See how Wisp AI can transform your aesthetic clinic's conversation analytics</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Schedule Your Personalized Demo</CardTitle>
            <CardDescription>
              Tell us about your clinic and we'll show you how Wisp AI can boost your conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Clinic/Company Name *</Label>
                <Input
                  id="company"
                  placeholder="Your clinic name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicType">Clinic Type *</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, clinicType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select clinic type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medspa">Med Spa</SelectItem>
                      <SelectItem value="cosmetic">Cosmetic Clinic</SelectItem>
                      <SelectItem value="hormone">Hormone Therapy / TRT</SelectItem>
                      <SelectItem value="weightloss">Weight Loss Clinic</SelectItem>
                      <SelectItem value="plastic">Plastic Surgery</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, teamSize: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1-5 people</SelectItem>
                      <SelectItem value="6-15">6-15 people</SelectItem>
                      <SelectItem value="16-50">16-50 people</SelectItem>
                      <SelectItem value="50+">50+ people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Tell us about your goals</Label>
                <Textarea
                  id="message"
                  placeholder="What challenges are you facing with conversion rates or team coaching?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Book My Demo
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/" className="text-primary hover:text-primary/80 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
