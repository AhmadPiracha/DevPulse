// lib/server-actions.ts
"use server"

import { getDatabase, verifyToken } from "@/lib/mongodb"
import type { Article, SavedArticle } from "@/types/article"
import { headers } from "next/headers"

const ARTICLES_PER_PAGE = 10

export async function fetchArticles(offset = 0) {
  try {
    const db = await getDatabase()
    const articlesCollection = db.collection<Article>("articles")

    const articles = await articlesCollection
      .find({})
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(ARTICLES_PER_PAGE + 1)
      .toArray()

    const hasMore = articles.length > ARTICLES_PER_PAGE
    const articlesToSend = hasMore ? articles.slice(0, ARTICLES_PER_PAGE) : articles

    return { articles: articlesToSend, hasMore }
  } catch (error) {
    console.error("Server-side error fetching articles:", error)
    return { articles: [], hasMore: false }
  }
}

export async function fetchSavedArticles() {
  try {
    const cookieHeader = headers().get("cookie")
    const token = cookieHeader?.split("auth-token=")[1]?.split(";")[0]

    if (!token) {
      return []
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return []
    }

    const db = await getDatabase()
    const savedArticlesCollection = db.collection<SavedArticle>("saved_articles")
    const saved = await savedArticlesCollection.find({ userId: decoded.userId }).toArray()
    return saved
  } catch (error) {
    console.error("Server-side error fetching saved articles:", error)
    return []
  }
}