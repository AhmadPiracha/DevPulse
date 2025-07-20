"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bookmark, Loader2, ExternalLink, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { fetchSavedArticles } from "@/lib/server-actions"

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

interface ArticleListProps {
  initialArticles: Article[]
  initialSavedArticles: SavedArticle[]
  hasMore: boolean
  fetchMoreArticles: (offset: number) => Promise<{ articles: Article[]; hasMore: boolean }>
  onSavedArticlesChange?: (savedArticles: SavedArticle[]) => void // Callback to update parent state
}

export function ArticleList({
  initialArticles,
  initialSavedArticles,
  hasMore: initialHasMore,
  fetchMoreArticles,
  onSavedArticlesChange,
}: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>(initialSavedArticles)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [savingArticle, setSavingArticle] = useState<string | null>(null)
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    setArticles(initialArticles)
    setSavedArticles(initialSavedArticles)
    setHasMore(initialHasMore)
  }, [initialArticles, initialSavedArticles, initialHasMore])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const { articles: newArticles, hasMore: newHasMore } = await fetchMoreArticles(articles.length)
      setArticles((prev) => [...prev, ...newArticles])
      setHasMore(newHasMore)
    } catch (error) {
      console.error("Failed to load more articles:", error)
      toast({
        title: "Error",
        description: "Failed to load more articles.",
        variant: "destructive",
      })
    } finally {
      setLoadingMore(false)
    }
  }, [articles.length, fetchMoreArticles, hasMore, loadingMore, toast])

  const isArticleSaved = (articleId: string) => {
    return savedArticles.some((item) => item.articleId === articleId)
  }

  const getArticleProgress = (articleId: string) => {
    const savedItem = savedArticles.find((item) => item.articleId === articleId)
    return savedItem?.readProgress || 0
  }

  const checkAuth = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to perform this action.",
        variant: "destructive",
        action: (
          <Button asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
        ),
      })
      return false
    }
    return true
  }

  const toggleSaved = async (article: Article) => {
    if (!checkAuth()) return
    if (savingArticle === article._id) return

    const isSaved = isArticleSaved(article._id)
    setSavingArticle(article._id)
    try {
      const response = await fetch("/api/saved", {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
        body: JSON.stringify({ articleId: article._id }),
      })

      if (response.ok) {
        const updatedSavedArticles = await fetchSavedArticles()
        setSavedArticles(updatedSavedArticles)
        if (onSavedArticlesChange) {
          onSavedArticlesChange(updatedSavedArticles)
        }
        toast({
          description: isSaved ? "Article removed from saved." : "Article saved for later.",
        })
      } else {
        const errorData = await response.json()
        if (response.status === 401) {
          toast({
            title: "Unauthorized",
            description: "Session expired. Please sign in again.",
            variant: "destructive",
            action: (
              <Button asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            ),
          })
        } else {
          toast({
            title: "Error",
            description: errorData.error || `Failed to ${isSaved ? "remove" : "save"} article.`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error(`Error toggling saved status for article ${article._id}:`, error)
      toast({
        title: "Error",
        description: `Failed to ${isSaved ? "remove" : "save"} article.`,
        variant: "destructive",
      })
    } finally {
      setSavingArticle(null)
    }
  }

  const updateReadingProgress = async (articleId: string, progress: number) => {
    if (!checkAuth()) return
    if (updatingProgress === articleId) return

    setUpdatingProgress(articleId)
    try {
      const response = await fetch("/api/saved/update-progress", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
        body: JSON.stringify({ articleId, progress }),
      })

      if (response.ok) {
        const updatedSavedArticles = await fetchSavedArticles()
        setSavedArticles(updatedSavedArticles)
        if (onSavedArticlesChange) {
          onSavedArticlesChange(updatedSavedArticles)
        }
        toast({
          description: `Reading progress updated to ${progress}%`,
        })
      } else {
        const errorData = await response.json()
        if (response.status === 401) {
          toast({
            title: "Unauthorized",
            description: "Session expired. Please sign in again.",
            variant: "destructive",
            action: (
              <Button asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            ),
          })
        } else {
          toast({
            title: "Error",
            description: errorData.error || "Failed to update reading progress",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error updating reading progress:", error)
      toast({
        title: "Error",
        description: "Failed to update reading progress",
        variant: "destructive",
      })
    } finally {
      setUpdatingProgress(null)
    }
  }

  const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="p-4 sm:p-6">
      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 px-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Bookmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No articles found</h3>
            <p className="text-muted-foreground max-w-sm text-sm sm:text-base">
              Try adjusting your search or preferences.
            </p>
            <Button asChild className="mt-4">
              <Link href="/settings">Adjust Preferences</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.map((article) => {
            const isSaved = isArticleSaved(article._id)
            const progress = getArticleProgress(article._id)
            const isRead = progress === 100

            return (
              <Card key={article._id} className="border-border/40 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg shrink-0">{article.sourceIcon || "📰"}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-muted-foreground">{article.source}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(article.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openInNewTab(article.url)}
                        className="h-8 w-8 p-0"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSaved(article)}
                        disabled={savingArticle === article._id}
                        className={`h-8 w-8 p-0 ${isSaved ? "text-blue-500 hover:text-blue-400" : "text-muted-foreground hover:text-primary"}`}
                        title={isSaved ? "Remove from saved" : "Save for later"}
                      >
                        {savingArticle === article._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bookmark className={`h-4 w-4 ${isSaved ? "text-blue-500" : ""}`} />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  <h3
                    className="font-semibold leading-tight hover:text-blue-500 cursor-pointer transition-colors"
                    onClick={() => openInNewTab(article.url)}
                  >
                    {article.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">{article.summary}</p>

                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                {isSaved && (
                  <div className="p-4 pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">Progress: {progress}%</span>
                      <div
                        className="flex-1 h-2 bg-muted rounded-full"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateReadingProgress(article._id, isRead ? 0 : 100)}
                        disabled={updatingProgress === article._id}
                        className="h-8 w-8 p-0"
                        title={isRead ? "Mark as Unread" : "Mark as Read"}
                      >
                        {updatingProgress === article._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isRead ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button onClick={loadMore} disabled={loadingMore} className="w-full sm:w-auto">
            {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}