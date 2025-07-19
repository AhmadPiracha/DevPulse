"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Mail, Database, Zap, BarChart3, Users, Calendar, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "ahmadpiracha11@gmail.com"

interface Stats {
  totalArticles: number
  todayArticles: number
  totalSubscribers: number
  sourceStats: Array<{ _id: string; count: number }>
  recentArticles: Array<{ title: string; source: string; createdAt: string }>
}

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [updateResult, setUpdateResult] = useState<any>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  // Check admin access
  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    if (user.email !== ADMIN_EMAIL) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    loadStats()
  }, [user, router])

  const loadStats = async () => {
    try {
      const response = await fetch("/api/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const updateArticles = async () => {
    try {
      setLoading(true)
      toast({
        title: "Starting Update",
        description: "Fetching articles from Hacker News, GitHub, and Dev.to...",
      })

      const response = await fetch("/api/articles", {
        method: "POST",
      })
      const data = await response.json()

      if (response.ok) {
        setUpdateResult(data)
        toast({
          title: "Success!",
          description: `Processed ${data.total} articles. ${data.inserted} new, ${data.modified} updated.`,
        })
        await loadStats()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update articles",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to update articles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendNewsletter = async () => {
    try {
      setLoading(true)
      toast({
        title: "Sending Newsletter",
        description: "Preparing and sending daily digest...",
      })

      const response = await fetch("/api/newsletter/send", {
        method: "POST",
      })
      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Newsletter Sent!",
          description: `Sent to ${data.subscriberCount} subscribers with ${data.articleCount} articles.`,
        })
      } else {
        toast({
          title: "Newsletter Info",
          description: data.error || "Newsletter feature requires Resend API key",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Newsletter Info",
        description: "Newsletter feature requires Resend API key configuration",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show loading or access denied
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">This area is restricted to administrators only.</p>
            <Button onClick={() => router.push("/")} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">DevPulse Admin Panel</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your news aggregation system</p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm" className="shrink-0 bg-transparent">
          <RefreshCw className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Refresh Stats</span>
          <span className="sm:hidden">Refresh</span>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Articles</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalArticles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Today's Articles</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.todayArticles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalSubscribers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Sources</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.sourceStats.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Database className="h-5 w-5 text-blue-500" />
              Update Articles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Fetch latest articles from Hacker News, GitHub Trending, and Dev.to. Basic summaries will be generated
              automatically.
            </p>
            <Button onClick={updateArticles} disabled={loading} className="w-full">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Updating..." : "Update Articles"}
            </Button>
            {updateResult && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total Processed:</span>
                  <Badge variant="secondary">{updateResult.total}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New Articles:</span>
                  <Badge variant="default">{updateResult.inserted}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Updated:</span>
                  <Badge variant="outline">{updateResult.modified}</Badge>
                </div>
                {updateResult.sources && (
                  <div className="text-xs text-muted-foreground pt-2">
                    Sources: HN({updateResult.sources.hackerNews}), GitHub({updateResult.sources.github}), Dev.to(
                    {updateResult.sources.devTo})
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Mail className="h-5 w-5 text-green-500" />
              Newsletter System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send daily digest to subscribers. Requires Resend API key for email delivery.
            </p>
            <Button onClick={sendNewsletter} disabled={loading} variant="outline" className="w-full bg-transparent">
              <Mail className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Newsletter"}
            </Button>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 To enable newsletters:</p>
              <p>1. Get a Resend API key</p>
              <p>2. Add RESEND_API_KEY to environment</p>
              <p>3. Configure your domain</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Stats */}
      {stats && stats.sourceStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Articles by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.sourceStats.map((source) => (
                <div key={source._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium text-sm">{source._id}</span>
                  <Badge variant="secondary">{source.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Articles */}
      {stats && stats.recentArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              Recent Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentArticles.map((article, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{article.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {article.source} • {new Date(article.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
