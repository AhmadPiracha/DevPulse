"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bookmark, Share2, ExternalLink, Filter, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

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

const filters = ["All", "Hacker News", "GitHub", "Dev.to"]

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [activeFilter, setActiveFilter] = useState("All")
  const [savedItems, setSavedItems] = useState(new Set<string>())
  const { toast } = useToast()
  const { user } = useAuth()

  // Fetch articles from API
  const fetchArticles = async (source?: string) => {
    try {
      setLoading(true)
      const url =
        source && source !== "All"
          ? `/api/articles?source=${encodeURIComponent(source)}&limit=50`
          : `/api/articles?limit=50`

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setArticles(data.articles || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch articles",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching articles:", error)
      toast({
        title: "Error",
        description: "Failed to fetch articles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update articles (fetch new ones from sources)
  const updateArticles = async () => {
    try {
      setUpdating(true)
      toast({
        title: "Updating...",
        description: "Fetching latest articles from all sources",
      })

      const response = await fetch("/api/articles", {
        method: "POST",
      })
      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Updated with ${data.total} articles (${data.inserted} new, ${data.modified} updated)`,
        })
        // Refresh the current view
        await fetchArticles(activeFilter)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update articles",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating articles:", error)
      toast({
        title: "Error",
        description: "Failed to update articles",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Load articles on component mount and filter change
  useEffect(() => {
    fetchArticles(activeFilter)
  }, [activeFilter])

  // Load saved articles for authenticated users
  useEffect(() => {
    if (user) {
      fetchSavedArticles()
    }
  }, [user])

  const fetchSavedArticles = async () => {
    if (!user) return

    try {
      console.log("Fetching saved articles for user:", user.email)
      const response = await fetch("/api/saved", {
        credentials: "include", // Include cookies
        headers: {
          Cookie: document.cookie,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Saved articles response:", data)
        const savedIds = new Set(data.savedArticles?.map((item: any) => item.article._id) || [])
        console.log("Saved article IDs:", Array.from(savedIds))
        setSavedItems(savedIds)
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch saved articles:", errorData)
      }
    } catch (error) {
      console.error("Error fetching saved articles:", error)
    }
  }

  const toggleSave = async (articleId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save articles",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Toggling save for article: ${articleId}`)
      const isSaved = savedItems.has(articleId)
      const method = isSaved ? "DELETE" : "POST"

      console.log(`${isSaved ? "Removing" : "Saving"} article ${articleId}`)

      const response = await fetch("/api/saved", {
        method,
        headers: {
          "Content-Type": "application/json",
          // Ensure cookies are sent
          Cookie: document.cookie,
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({ articleId }),
      })

      const data = await response.json()
      console.log("Save response:", data)

      if (response.ok) {
        const newSavedItems = new Set(savedItems)
        if (isSaved) {
          newSavedItems.delete(articleId)
          toast({ description: "Article removed from saved items" })
        } else {
          newSavedItems.add(articleId)
          toast({ description: "Article saved successfully" })
        }
        setSavedItems(newSavedItems)
      } else {
        console.error("Save failed:", data)
        toast({
          title: "Error",
          description: data.error || "Failed to save article",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error toggling save:", error)
      toast({
        title: "Error",
        description: "Failed to save article",
        variant: "destructive",
      })
    }
  }

  const handleShare = (title: string, url: string) => {
    const shareText = `${title} - ${url}`
    navigator.clipboard.writeText(shareText)
    toast({
      description: "Link copied to clipboard",
    })
  }

  const openArticle = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Tech News Feed</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {loading ? "Loading..." : `${articles.length} articles from the developer community`}
            </p>
          </div>
          <Button onClick={updateArticles} disabled={updating} size="sm" className="gap-2 shrink-0">
            <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{updating ? "Updating..." : "Update Feed"}</span>
            <span className="sm:hidden">{updating ? "..." : "Update"}</span>
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className="whitespace-nowrap shrink-0"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-border/40 animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-full"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No articles found</h3>
              <p className="text-muted-foreground max-w-sm text-sm sm:text-base">
                {activeFilter === "All"
                  ? "Click 'Update Feed' to fetch the latest articles from all sources."
                  : `No articles found for ${activeFilter}. Try a different filter or update the feed.`}
              </p>
              <Button onClick={updateArticles} disabled={updating} className="mt-4">
                <RefreshCw className={`h-4 w-4 mr-2 ${updating ? "animate-spin" : ""}`} />
                {updating ? "Updating..." : "Update Feed"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto">
            {articles.map((article) => (
              <Card key={article._id} className="border-border/40 hover:border-border transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg shrink-0">{article.sourceIcon || "📰"}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-muted-foreground truncate">{article.source}</span>
                        {article.author && (
                          <span className="text-xs text-muted-foreground truncate">by {article.author}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSave(article._id)}
                        className="h-8 w-8 p-0"
                        title={user ? "Save article" : "Sign in to save"}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${savedItems.has(article._id) ? "fill-current text-blue-500" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(article.title, article.url)}
                        className="h-8 w-8 p-0"
                        title="Share article"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <h3
                    className="font-semibold leading-tight hover:text-blue-500 cursor-pointer transition-colors line-clamp-2"
                    onClick={() => openArticle(article.url)}
                  >
                    {article.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {article.summary || "No summary available. Click to read the full article."}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openArticle(article.url)}
                      className="p-0 h-auto text-blue-500 hover:text-blue-400 text-xs sm:text-sm"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Read full article
                    </Button>
                    {article.score > 0 && <span className="text-xs text-muted-foreground">⭐ {article.score}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
