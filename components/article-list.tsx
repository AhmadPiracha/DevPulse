"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bookmark, Share2, ExternalLink, Filter, RefreshCw } from "lucide-react"
import type { User } from "@/components/auth-provider" // Import User type

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

interface ArticleListProps {
  articles: Article[]
  isSearch: boolean
  searchQuery: string
  activeFilter: string
  updateArticles: () => Promise<void>
  toggleSave: (articleId: string) => Promise<void>
  savedItems: Set<string>
  handleShare: (title: string, url: string) => void
  openArticle: (url: string) => void
  user: User | null
  updating: boolean
}

export function ArticleList({
  articles,
  isSearch,
  searchQuery,
  activeFilter,
  updateArticles,
  toggleSave,
  savedItems,
  handleShare,
  openArticle,
  user,
  updating,
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Filter className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{isSearch ? "No search results found" : "No articles found"}</h3>
          <p className="text-muted-foreground max-w-sm text-sm sm:text-base">
            {isSearch
              ? `No articles matched your query "${searchQuery}". Try a different search term.`
              : activeFilter === "All"
                ? "Click 'Update Feed' to fetch the latest articles from all sources."
                : `No articles found for ${activeFilter}. Try a different filter or update the feed.`}
          </p>
          {!isSearch && (
            <Button onClick={updateArticles} disabled={updating} className="mt-4">
              <RefreshCw className={`h-4 w-4 mr-2 ${updating ? "animate-spin" : ""}`} />
              {updating ? "Updating..." : "Update Feed"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
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
                  <Bookmark className={`h-4 w-4 ${savedItems.has(article._id) ? "fill-current text-blue-500" : ""}`} />
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
  )
}
