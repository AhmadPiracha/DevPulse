"use client"

import type React from "react"
import type { Article } from "@/types/article" // Declare the Article variable
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Input } from "@/components/ui/input"
import { ArticleList } from "@/components/article-list"

const filters = ["All", "Hacker News", "GitHub", "Dev.to"] // Re-added "Crypto News"

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [activeFilter, setActiveFilter] = useState("All")
  const [savedItems, setSavedItems] = useState(new Set<string>())
  const { toast } = useToast()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Article[] | null>(null) // Null means no search active

  // Fetch articles from API
  const fetchArticles = async (source?: string) => {
    try {
      setLoading(true)
      let url = `/api/articles?limit=50`

      // Add source filter from UI (if not "All")
      if (source && source !== "All") {
        url += `&source=${encodeURIComponent(source)}`
      }

      // Add user preferences if logged in
      if (user) {
        const preferencesResponse = await fetch("/api/user/preferences", {
          credentials: "include",
          headers: {
            Cookie: document.cookie,
          },
        })
        if (preferencesResponse.ok) {
          const preferencesData = await preferencesResponse.json()
          const userPreferences = preferencesData.preferences
          if (userPreferences) {
            // Filter out "All" from preferred sources before sending to API
            const actualPreferredSources = (userPreferences.sources || []).filter((s: string) => s !== "All")
            if (actualPreferredSources.length > 0) {
              url += `&preferredSources=${encodeURIComponent(actualPreferredSources.join(","))}`
            }
            if (userPreferences.tags && userPreferences.tags.length > 0) {
              url += `&preferredTags=${encodeURIComponent(userPreferences.tags.join(","))}`
            }
          }
        } else {
          console.warn("Failed to fetch user preferences for feed filtering.")
        }
      }

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults(null) // Clear search if query is empty
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.articles || [])
      } else {
        toast({
          title: "Search Error",
          description: data.error || "Failed to perform search",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error during search:", error)
      toast({
        title: "Search Error",
        description: "Failed to perform search",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load articles on component mount and filter change
  useEffect(() => {
    if (!searchQuery) {
      fetchArticles(activeFilter)
    }
  }, [activeFilter, searchQuery, user])

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
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 max-w-md sm:ml-4">
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="sr-only">Search</span>
            </Button>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSearchResults(null)
                }}
                className="h-9 w-9 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </form>
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
        ) : (
          <ArticleList
            articles={searchResults !== null ? searchResults : articles}
            isSearch={searchResults !== null}
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            updateArticles={updateArticles}
            toggleSave={toggleSave}
            savedItems={savedItems}
            handleShare={handleShare}
            openArticle={openArticle}
            user={user}
            updating={updating}
          />
        )}
      </div>
    </div>
  )
}
