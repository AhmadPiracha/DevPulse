import { NextResponse } from "next/server"
import type { Article } from "@/lib/mongodb"
import { getDatabase } from "@/lib/mongodb"
import { checkRateLimit, MAX_REQUESTS } from "@/lib/rate-limiter" // Import MAX_REQUESTS and WINDOW_MS
import { verifyToken } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sourceFilter = searchParams.get("source") // From UI filter buttons
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const preferredSourcesParam = searchParams.get("preferredSources") // From user preferences
  const preferredTagsParam = searchParams.get("preferredTags") // From user preferences

  try {
    console.log(
      `📖 Fetching articles from database - Source: ${sourceFilter || "All"}, Limit: ${limit}, Preferred Sources: ${preferredSourcesParam || "None"}, Preferred Tags: ${preferredTagsParam || "None"}`,
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
      const preferredSources = preferredSourcesParam.split(",").filter((s) => s && s !== "All") // Filter out empty strings and "All"
      if (preferredSources.length > 0) {
        matchQuery.source = { $in: preferredSources }
      }
    }

    // 3. Handle preferred tags with aggregation for sorting
    if (preferredTagsParam) {
      const preferredTags = preferredTagsParam.split(",").filter(Boolean) // Filter out empty strings
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
          { $limit: limit },
        ]
        const result = await articlesCollection.aggregate(pipeline).toArray()
        console.log(`✅ Found ${result.length} articles in database with preferences (aggregation)`)
        return NextResponse.json({ articles: result })
      }
    }

    // 4. If no preferred tags or aggregation not used, use find with default sort
    const result = await articlesCollection.find(matchQuery).sort({ createdAt: -1 }).limit(limit).toArray()

    console.log(`✅ Found ${result.length} articles in database (find)`)

    return NextResponse.json({ articles: result })
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
    console.log("🚀 Starting article update process...")

    // Import functions
    const { fetchHackerNews, fetchGitHubTrending, fetchDevTo, fetchCryptoNews } = await import("@/lib/news-sources") // Import fetchCryptoNews
    const db = await getDatabase()
    const articlesCollection = db.collection<Article>("articles")

    // Fetch from all sources in parallel
    const [hackerNews, github, devTo, cryptoNews] = await Promise.all([
      // Add cryptoNews
      fetchHackerNews(),
      fetchGitHubTrending(),
      fetchDevTo(),
      fetchCryptoNews(), // Call the new function
    ])

    console.log(
      `📊 Fetched: ${hackerNews.length} HN, ${github.length} GitHub, ${devTo.length} Dev.to, ${cryptoNews.length} Crypto News`,
    ) // Update log

    const allArticles = [...hackerNews, ...github, ...devTo, ...cryptoNews] // Combine all articles

    if (allArticles.length === 0) {
      return NextResponse.json({
        message: "No articles fetched from any source",
        inserted: 0,
        modified: 0,
        total: 0,
      })
    }

    console.log("🤖 Generating AI summaries...")

    // Generate summaries for all articles - but use the existing summaries from the fetch functions
    const articlesWithSummaries = await Promise.all(
      allArticles.map(async (article, index) => {
        console.log(`Processing summary ${index + 1}/${allArticles.length}: ${article.title.slice(0, 50)}...`)

        // Use the summary that was already generated in the fetch functions
        // The generateSummary function is now available but we'll use the basic summaries for speed
        const summary = article.summary || `${article.source} article: ${article.title}`

        return {
          title: article.title,
          url: article.url,
          source: article.source,
          author: article.author,
          score: article.score || 0,
          tags: article.tags,
          summary,
          sourceIcon: article.sourceIcon,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }),
    )

    console.log("💾 Saving articles to MongoDB...")

    // Insert into MongoDB - Fixed bulk operation
    const bulkOps = articlesWithSummaries.map((article) => ({
      updateOne: {
        filter: { url: article.url },
        update: {
          $set: {
            title: article.title,
            source: article.source,
            author: article.author,
            score: article.score || 0,
            tags: article.tags,
            summary: article.summary,
            sourceIcon: article.sourceIcon,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            url: article.url,
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }))

    const result = await articlesCollection.bulkWrite(bulkOps)

    console.log(`✅ Database operation complete: ${result.upsertedCount} inserted, ${result.modifiedCount} modified`)

    return NextResponse.json({
      message: "Articles updated successfully",
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
      total: articlesWithSummaries.length,
      sources: {
        hackerNews: hackerNews.length,
        github: github.length,
        devTo: devTo.length,
        cryptoNews: cryptoNews.length, // Add cryptoNews count
      },
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
