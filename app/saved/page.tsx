"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bookmark, ExternalLink, Trash2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

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

export default function SavedPage() {
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchSavedArticles()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchSavedArticles = async () => {
    try {
      console.log("Fetching saved articles...")
      const response = await fetch("/api/saved", {
        credentials: "include",
        headers: {
          Cookie: document.cookie,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Saved articles data:", data)
        setSavedArticles(data.savedArticles || [])
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch saved articles:", errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to fetch saved articles",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching saved articles:", error)
      toast({
        title: "Error",
        description: "Failed to fetch saved articles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeSaved = async (articleId: string) => {
    try {
      console.log(`Removing saved article: ${articleId}`)
      const response = await fetch("/api/saved", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
        body: JSON.stringify({ articleId }),
      })

      if (response.ok) {
        setSavedArticles((prev) => prev.filter((item) => item.article._id !== articleId))
        toast({
          description: "Article removed from saved items",
        })
      } else {
        const errorData = await response.json()
        console.error("Remove failed:", errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to remove article",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing saved article:", error)
      toast({
        title: "Error",
        description: "Failed to remove article",
        variant: "destructive",
      })
    }
  }

  const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  // Show sign in prompt if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-4 px-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Sign in to save articles</h3>
          <p className="text-muted-foreground max-w-sm text-sm sm:text-base">
            Create an account to save your favorite articles and access them later.
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading saved articles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">Saved Articles</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {savedArticles.length} article{savedArticles.length !== 1 ? "s" : ""} saved for later
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Bookmark className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">{savedArticles.length} saved</span>
          </div>
        </div>
      </div>

      {/* Saved Articles List */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {savedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No saved articles yet</h3>
              <p className="text-muted-foreground max-w-sm text-sm sm:text-base">
                Start saving articles from the feed to read them later. They'll appear here.
              </p>
              <Button asChild className="mt-4">
                <Link href="/feed">Browse Feed</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {savedArticles.map((savedItem) => (
              <Card key={savedItem._id} className="border-border/40">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg shrink-0">{savedItem.article.sourceIcon || "📰"}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-muted-foreground">{savedItem.article.source}</span>
                        <span className="text-xs text-muted-foreground">
                          Saved on {new Date(savedItem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openInNewTab(savedItem.article.url)}
                        className="h-8 w-8 p-0"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSaved(savedItem.article._id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
                        title="Remove from saved"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <h3
                    className="font-semibold leading-tight hover:text-blue-500 cursor-pointer transition-colors"
                    onClick={() => openInNewTab(savedItem.article.url)}
                  >
                    {savedItem.article.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">{savedItem.article.summary}</p>

                  <div className="flex flex-wrap gap-2">
                    {savedItem.article.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
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
