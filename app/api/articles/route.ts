import { NextResponse } from "next/server"
import type { Article } from "@/lib/mongodb"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get("source")
  const limit = Number.parseInt(searchParams.get("limit") || "50")

  try {
    console.log(`📖 Fetching articles from database - Source: ${source || "All"}, Limit: ${limit}`)

    const db = await getDatabase()
    const articles = db.collection<Article>("articles")

    let query = {}
    if (source && source !== "All") {
      query = { source }
    }

    const result = await articles.find(query).sort({ createdAt: -1 }).limit(limit).toArray()

    console.log(`✅ Found ${result.length} articles in database`)

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

export async function POST() {
  try {
    console.log("🚀 Starting article update process...")

    // Import functions
    const { fetchHackerNews, fetchGitHubTrending, fetchDevTo, generateSummary } = await import("@/lib/news-sources")
    const db = await getDatabase()
    const articlesCollection = db.collection<Article>("articles")

    // Fetch from all sources in parallel
    const [hackerNews, github, devTo] = await Promise.all([fetchHackerNews(), fetchGitHubTrending(), fetchDevTo()])

    console.log(`📊 Fetched: ${hackerNews.length} HN, ${github.length} GitHub, ${devTo.length} Dev.to`)

    const allArticles = [...hackerNews, ...github, ...devTo]

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
