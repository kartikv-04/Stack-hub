"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Search, Bell } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '@/hooks/use-auth'  // assuming your useAuth hook is here

export default function LandingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">PriceTracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Track E-commerce Prices Like a Pro
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Monitor product prices across multiple e-commerce platforms and get notified when prices drop. Make smarter
            purchasing decisions with historical price data.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Tracking Prices
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Search className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Smart Price Monitoring</CardTitle>
              <CardDescription>
                Simply paste any product URL and we'll start tracking its price across multiple platforms.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Historical Data</CardTitle>
              <CardDescription>
                View detailed price history with charts and trends to make informed purchasing decisions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Price Alerts</CardTitle>
              <CardDescription>
                Get instant notifications when prices drop below your target threshold.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">Ready to Save Money?</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of smart shoppers who never overpay again.
          </p>
          <Link href="/register">
            <Button size="lg">Create Free Account</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
