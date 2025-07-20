"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Input } from "@/components/ui/input"
import { ArticleList } from "@/components/article-list"
import { fetchArticles, fetchSavedArticles } from "@/lib/server-actions"

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

interface SavedArticle {
  _id: string
  articleId: string
  userId: string
  createdAt: string
  readProgress?: number
  lastReadAt?: string
}

const filters = ["All", "Hacker News", "GitHub", "Dev.to"]
const ARTICLES_PER_PAGE = 10

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [activeFilter, setActiveFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Article[] | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    async function initialize() {
      setLoading(true)
      try {
        const [articlesData, savedArticlesData] = await Promise.all([
          fetchArticles(0),
          fetchSavedArticles(),
        ])
        setArticles(articlesData.articles)
        setHasMore(articlesData.hasMore)
        setSavedArticles(savedArticlesData)
      } catch (error) {
        console.error("Error initializing feed:", error)
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [user, activeFilter])

  const fetchMoreArticles = async (offset: number) => {
    try {
      const response = await fetchArticles(offset)
      return response
    } catch (error) {
      console.error("Error fetching more articles:", error)
      toast({
        title: "Error",
        description: "Failed to load more articles",
        variant: "destructive",
      })
      throw error
    }
  }

  const fetchArticlesClient = async (source?: string) => {
    if (searchQuery) return
    setLoading(true)
    try {
      let url = `/api/articles?offset=0&limit=${ARTICLES_PER_PAGE}`

      if (source && source !== "All") {
        url += `&source=${encodeURIComponent(source)}`
      }

      if (user) {
        const preferencesResponse = await fetch("/api/user/preferences", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Cookie: document.cookie,
          },
        })
        if (preferencesResponse.ok) {
          const { preferences } = await preferencesResponse.json()
          if (preferences) {
            const actualPreferredSources = (preferences.sources || []).filter((s: string) => s !== "All")
            if (actualPreferredSources.length > 0) {
              url += `&preferredSources=${encodeURIComponent(actualPreferredSources.join(","))}`
            }
            if (preferences.tags && preferences.tags.length > 0) {
              url += `&preferredTags=${encodeURIComponent(preferences.tags.join(","))}`
            }
          }
        } else {
          console.warn("Failed to fetch user preferences for feed filtering.")
        }
      }

      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
      })
      const data = await response.json()

      if (response.ok) {
        setArticles(data.articles || [])
        setHasMore(data.hasMore || data.articles.length === ARTICLES_PER_PAGE)
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

  const updateArticles = async () => {
    try {
      setUpdating(true)
      toast({
        title: "Updating...",
        description: "Fetching latest articles from all sources",
      })

      const response = await fetch("/api/articles", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
      })
      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Updated with ${data.total} articles (${data.inserted} new, ${data.modified} updated)`,
        })
        await fetchArticlesClient(activeFilter)
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
      setSearchResults(null)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
      })
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data.articles || [])
        setHasMore(false)
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

  useEffect(() => {
    if (!searchQuery) {
      fetchArticlesClient(activeFilter)
    }
  }, [activeFilter, searchQuery])

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Tech News Feed</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {loading ? "Loading..." : `${(searchResults || articles).length} articles from the developer community`}
            </p>
          </div>
          <Button onClick={updateArticles} disabled={updating || loading} size="sm" className="gap-2 shrink-0">
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
              disabled={loading}
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
                  fetchArticlesClient(activeFilter)
                }}
                className="h-9 w-9 p-0"
                disabled={loading}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </form>
        </div>

        <div className="px-4 sm:px-6 pb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className="whitespace-nowrap shrink-0"
                disabled={loading}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ArticleList
            initialArticles={searchResults || articles}
            initialSavedArticles={savedArticles}
            hasMore={hasMore}
            fetchMoreArticles={fetchMoreArticles}
            onSavedArticlesChange={setSavedArticles}
          />
        )}
      </div>
    </div>
  )
}