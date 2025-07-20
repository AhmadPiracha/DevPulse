"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Loader2, LayoutDashboard, Bookmark, Tag, ArrowRight, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface SavedArticle {
  _id: string
  article: {
    _id: string
    title: string
    summary: string
    url: string
    source: string
    tags: string[]
    author?: string
    score: number
    sourceIcon?: string
  }
  createdAt: string
}

interface UserPreferences {
  sources: string[]
  tags: string[]
}

interface Article {
  _id: string
  title: string
  summary: string
  url: string
  source: string
  tags: string[]
  author?: string
  score: number
  sourceIcon?: string
  createdAt: string
}

const dashboardTips = [
  "Customize your feed in Settings to see more relevant articles!",
  "Don't forget to save articles for later reading. They'll appear here!",
  "Explore the 'Feed' for the latest tech news from all sources.",
  "Use the search bar in the feed to find specific topics or articles.",
  "Check out the 'About' page to learn more about DevPulse's mission.",
]

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [recentSavedArticles, setRecentSavedArticles] = useState<SavedArticle[]>([])
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [recommendedArticles, setRecommendedArticles] = useState<Article[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [currentTip, setCurrentTip] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth") // Redirect to login if not authenticated
    } else if (user) {
      fetchDashboardData()
      setCurrentTip(dashboardTips[Math.floor(Math.random() * dashboardTips.length)])
    }
  }, [user, authLoading, router])

  const fetchDashboardData = async () => {
    setDashboardLoading(true)
    try {
      // Fetch user preferences first, as they are needed for recommended articles
      const preferencesResponse = await fetch("/api/user/preferences", {
        credentials: "include",
        headers: {
          Cookie: document.cookie,
        },
      })
      let userPreferences: UserPreferences = { sources: [], tags: [] }
      if (preferencesResponse.ok) {
        const data = await preferencesResponse.json()
        userPreferences = data.preferences || { sources: [], tags: [] }
        setPreferences(userPreferences)
      } else {
        console.error("Failed to fetch user preferences:", await preferencesResponse.json())
      }

      // Fetch recent saved articles
      const savedResponse = await fetch("/api/saved", {
        credentials: "include",
        headers: {
          Cookie: document.cookie,
        },
      })
      if (savedResponse.ok) {
        const data = await savedResponse.json()
        setRecentSavedArticles(data.savedArticles?.slice(0, 3) || []) // Get up to 3 recent
      } else {
        console.error("Failed to fetch recent saved articles:", await savedResponse.json())
      }

      // Fetch recommended articles based on preferences
      let recommendedUrl = `/api/articles?limit=5`
      const actualPreferredSources = (userPreferences.sources || []).filter((s: string) => s !== "All")
      if (actualPreferredSources.length > 0) {
        recommendedUrl += `&preferredSources=${encodeURIComponent(actualPreferredSources.join(","))}`
      }
      if (userPreferences.tags && userPreferences.tags.length > 0) {
        recommendedUrl += `&preferredTags=${encodeURIComponent(userPreferences.tags.join(","))}`
      }

      const recommendedResponse = await fetch(recommendedUrl)
      if (recommendedResponse.ok) {
        const data = await recommendedResponse.json()
        setRecommendedArticles(data.articles || [])
      } else {
        console.error("Failed to fetch recommended articles:", await recommendedResponse.json())
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      })
    } finally {
      setDashboardLoading(false)
    }
  }

  if (authLoading || !user || dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  const userDisplayName = user.email.split("@")[0]

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {userDisplayName}!</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Your personalized DevPulse hub</p>
          </div>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm" className="shrink-0 bg-transparent">
          <Loader2 className={`h-4 w-4 mr-2 ${dashboardLoading ? "animate-spin" : ""}`} />
          Refresh Dashboard
        </Button>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button asChild variant="default">
            <Link href="/feed">
              View Feed <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/saved">
              My Saved Articles <Bookmark className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">
              Manage Preferences <Tag className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentSavedArticles.length}</div>
            <p className="text-xs text-muted-foreground">articles saved</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Progress</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">of saved articles read</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preferred Sources</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preferences?.sources?.length || 0}</div>
            <p className="text-xs text-muted-foreground">sources selected</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommended for You */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Recommended for You</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedArticles.map((article) => (
                <div key={article._id} className="space-y-1">
                  <h3 className="font-semibold leading-tight hover:text-blue-500 cursor-pointer transition-colors line-clamp-2">
                    <Link href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.sourceIcon} {article.source}
                    </Badge>
                    {article.tags.slice(0, 1).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <p>
                No recommendations yet.{" "}
                <Link href="/settings" className="text-primary hover:underline">
                  Set your preferences
                </Link>{" "}
                to get tailored articles!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Saved Articles */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Your Recent Saves</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSavedArticles.length > 0 ? (
            <div className="space-y-4">
              {recentSavedArticles.map((savedItem) => (
                <div key={savedItem._id} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <h3 className="font-semibold leading-tight hover:text-blue-500 cursor-pointer transition-colors line-clamp-2">
                    <Link href={savedItem.article.url} target="_blank" rel="noopener noreferrer">
                      {savedItem.article.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{savedItem.article.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {savedItem.article.sourceIcon} {savedItem.article.source}
                    </Badge>
                    {savedItem.article.tags.slice(0, 1).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/saved">
                    View All Saved Articles <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <p>
                No recent saved articles.{" "}
                <Link href="/feed" className="text-primary hover:underline">
                  Browse the feed
                </Link>{" "}
                to save some!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Preferred Sources & Tags */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Your Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Sources:</h3>
            {preferences?.sources && preferences.sources.length > 0 ? (
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-2 p-4">
                  {preferences.sources.map((source) => (
                    <Badge key={source} variant="default" className="whitespace-nowrap">
                      {source}
                    </Badge>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">
                No preferred sources selected.{" "}
                <Link href="/settings" className="text-primary hover:underline">
                  Go to settings
                </Link>{" "}
                to set them.
              </p>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tags:</h3>
            {preferences?.tags && preferences.tags.length > 0 ? (
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-2 p-4">
                  {preferences.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="whitespace-nowrap">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">
                No preferred tags selected.{" "}
                <Link href="/settings" className="text-primary hover:underline">
                  Go to settings
                </Link>{" "}
                to set them.
              </p>
            )}
          </div>
          <div className="pt-4">
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/settings">
                Manage Preferences <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DevPulse Insight */}
      <Card className="border-border/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">DevPulse Insight</CardTitle>
          <Lightbulb className="h-5 w-5 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{currentTip}</p>
        </CardContent>
      </Card>
    </div>
  )
}
