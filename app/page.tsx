"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Zap, Users, Mail, Loader2 } from "lucide-react"
import Link from "next/link"
import { NewsletterModal } from "@/components/newsletter-modal"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [showNewsletter, setShowNewsletter] = useState(false)

  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard") // Redirect to dashboard if user is logged in
    }
  }, [user, authLoading, router])

  // Add a loading state return for when the redirect is happening
  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Logo and Brand */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <span className="text-lg sm:text-2xl font-bold text-white font-mono">DP</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Dev<span className="text-blue-500">Pulse</span>
            </h1>
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-mono">
              Stay in the loop. <span className="text-blue-400">Automatically.</span>
            </p>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Get curated tech news from Hacker News, GitHub, Dev.to and more. Smart summaries delivered to developers
              who value their time.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-6 sm:pt-8 px-4">
            <Button asChild size="lg" className="text-base px-6 sm:px-8 w-full sm:w-auto">
              <Link href="/feed">
                <Zap className="mr-2 h-5 w-5" />
                View Feed
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-base px-6 sm:px-8 bg-transparent w-full sm:w-auto"
              asChild
            >
              <Link href="https://t.me/devpulse" target="_blank">
                <Users className="mr-2 h-5 w-5" />
                Join Telegram
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="text-base px-6 sm:px-8 w-full sm:w-auto"
              onClick={() => setShowNewsletter(true)}
            >
              <Mail className="mr-2 h-5 w-5" />
              Subscribe Newsletter
            </Button>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="px-4 sm:px-6 py-8 sm:py-12 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="border-border/40">
              <CardContent className="p-4 sm:p-6 text-center space-y-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold">Smart Summaries</h3>
                <p className="text-sm text-muted-foreground">
                  Get the key points in 2-3 lines. No fluff, just what matters.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="p-4 sm:p-6 text-center space-y-4">
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-semibold">Multiple Sources</h3>
                <p className="text-sm text-muted-foreground">
                  Hacker News, GitHub, Dev.to, and more in one clean feed.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/40 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6 text-center space-y-4">
                <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto">
                  <Mail className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-semibold">Daily Digest</h3>
                <p className="text-sm text-muted-foreground">
                  Get the best stories delivered to your inbox every morning.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <NewsletterModal open={showNewsletter} onOpenChange={setShowNewsletter} />
    </div>
  )
}
