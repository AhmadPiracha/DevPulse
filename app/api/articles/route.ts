import { NextResponse } from "next/server"
import type { Article } from "@/lib/mongodb"
import { getDatabase } from "@/lib/mongodb"
import { checkRateLimit, MAX_REQUESTS } from "@/lib/rate-limiter" // Import MAX_REQUESTS and WINDOW_MS
import { verifyToken } from "@/lib/auth"
import { headers } from "next/headers"
import { newsSources } from "@/lib/news-sources"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sourceFilter = searchParams.get("source") // From UI filter buttons
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const offset = Number.parseInt(searchParams.get("offset") || "0")
  const preferredSourcesParam = searchParams.get("preferredSources") // From user preferences
  const preferredTagsParam = searchParams.get("preferredTags") // From user preferences

  try {
    console.log(
      `📖 Fetching articles from database - Source: ${sourceFilter || "All"}, Limit: ${limit}, Offset: ${offset}, Preferred Sources: ${preferredSourcesParam || "None"}, Preferred Tags: ${preferredTagsParam || "None"}`,
    )

    const db = await getDatabase()
    const articlesCollection = db.collection<Article>("articles")

    const matchQuery: any = {}

    // 1. Apply source filter from UI (if not "All")
    if (sourceFilter && sourceFilter !== "All") {
      matchQuery.source = sourceFilter
    }

    // 2. Apply preferred sources from user preferences (if set, overrides UI filter)
    if (preferredSourcesParam) {
      const preferredSources = preferredSourcesParam
        .split(",")
        .map((s) => decodeURIComponent(s.trim()))
        .filter((s) => s && s !== "All") // Filter out empty strings and "All"
      if (preferredSources.length > 0) {
        matchQuery.source = { $in: preferredSources }
      }
    }

    // 3. Handle preferred tags with aggregation for sorting
    if (preferredTagsParam) {
      const preferredTags = preferredTagsParam
        .split(",")
        .map((t) => decodeURIComponent(t.trim()))
        .filter(Boolean) // Filter out empty strings
      if (preferredTags.length > 0) {
        const pipeline = [
          { $match: matchQuery }, // Apply source filtering first
          {
            $addFields: {
              tagMatchScore: {
                $size: {
                  $setIntersection: ["$tags", preferredTags],
                },
              },
            },
          },
          { $sort: { tagMatchScore: -1, score: -1, createdAt: -1 } }, // Prioritize by tag match, then score, then date
          { $skip: offset },
          { $limit: limit + 1 }, // Fetch one extra to check if there's more
        ]
        const result = await articlesCollection.aggregate(pipeline).toArray()
        const hasMore = result.length > limit
        const articlesToSend = hasMore ? result.slice(0, limit) : result
        console.log(`✅ Found ${articlesToSend.length} articles in database with preferences (aggregation)`)
        return NextResponse.json({ articles: articlesToSend, hasMore })
      }
    }

    // 4. If no preferred tags or aggregation not used, use find with default sort
    const articles = await articlesCollection
      .find(matchQuery)
      .sort({ createdAt: -1 }) // Sort by most recent
      .skip(offset)
      .limit(limit + 1) // Fetch one extra to check if there's more
      .toArray()

    const hasMore = articles.length > limit
    const articlesToSend = hasMore ? articles.slice(0, limit) : articles

    console.log(`✅ Found ${articlesToSend.length} articles in database (find)`)

    return NextResponse.json({ articles: articlesToSend, hasMore })
  } catch (error: any) {
    console.error("❌ Error fetching articles from database:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch articles",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  // Get user ID from token or use IP address for rate limiting
  const token = headers().get("cookie")?.split("auth-token=")[1]?.split(";")[0]
  let identifier = "anonymous"
  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      identifier = decoded.userId
    }
  } else {
    // Fallback to IP if no user token (less accurate for shared IPs)
    identifier = headers().get("x-forwarded-for") || "unknown" // Use headers().get for Next.js 14
  }

  const { allowed, remaining, resetAfter } = await checkRateLimit(identifier)

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `You have exceeded the rate limit. Please try again in ${Math.ceil(resetAfter / 1000)} seconds.`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000 + resetAfter / 1000)),
          "Retry-After": String(Math.ceil(resetAfter / 1000)),
        },
      },
    )
  }

  try {
    // Basic authentication/authorization check (e.g., API key, internal call)
    const authHeader = request.headers.get("Authorization")
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🚀 Starting article update process...")

    const db = await getDatabase()
    const articlesCollection = db.collection<Article>("articles")

    let newArticlesCount = 0
    let updatedArticlesCount = 0

    for (const source of newsSources) {
      console.log(`Fetching articles from ${source.name} (${source.url})...`)
      try {
        const response = await fetch(source.url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        // Adjust based on the actual API response structure
        const articlesFromSource = data.articles || data.hits || data // Handle different API structures

        if (!Array.isArray(articlesFromSource)) {
          console.warn(`Source ${source.name} did not return an array of articles.`)
          continue
        }

        for (const articleData of articlesFromSource) {
          // Normalize article data from different sources
          const normalizedArticle: Partial<Article> = {
            title: articleData.title || articleData.story_title || articleData.name,
            summary: articleData.summary || articleData.description || articleData.excerpt,
            url: articleData.url || articleData.story_url || articleData.link,
            source: source.name,
            tags: articleData.tags || articleData.keywords || [],
            author: articleData.author || articleData.by || "Unknown",
            score: articleData.points || articleData.score || 0,
            sourceIcon: source.icon,
          }

          // Skip if essential fields are missing after normalization
          if (!normalizedArticle.title || !normalizedArticle.url || !normalizedArticle.summary) {
            console.warn(`Skipping malformed article from ${source.name}:`, articleData)
            continue
          }

          const existingArticle = await articlesCollection.findOne({ url: normalizedArticle.url })

          if (existingArticle) {
            // Update existing article
            await articlesCollection.updateOne(
              { _id: existingArticle._id },
              { $set: { ...normalizedArticle, updatedAt: new Date() } },
            )
            updatedArticlesCount++
          } else {
            // Insert new article
            await articlesCollection.insertOne({
              ...normalizedArticle,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Article)
            newArticlesCount++
          }
        }
        console.log(`Successfully processed articles from ${source.name}.`)
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error)
      }
    }
    console.log(`Article update process completed. New: ${newArticlesCount}, Updated: ${updatedArticlesCount}`)
    return NextResponse.json({
      message: "Articles updated successfully",
      newArticles: newArticlesCount,
      updatedArticles: updatedArticlesCount,
    })
  } catch (error: any) {
    console.error("❌ Error updating articles:", error)
    return NextResponse.json(
      {
        error: "Failed to update articles",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
