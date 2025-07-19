import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Fetching stats...")

    // Import MongoDB functions
    const { getDatabase } = await import("@/lib/mongodb")

    // Test connection first
    const db = await getDatabase()
    console.log("Connected to database")

    // Initialize collections if they don't exist
    const articles = db.collection("articles")
    const subscribers = db.collection("newsletter_subscribers")

    // Get article stats
    const totalArticles = await articles.countDocuments()
    console.log(`Total articles: ${totalArticles}`)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayArticles = await articles.countDocuments({
      createdAt: { $gte: todayStart },
    })
    console.log(`Today's articles: ${todayArticles}`)

    // Get source breakdown
    const sourceStats = await articles
      .aggregate([
        {
          $group: {
            _id: "$source",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()
    console.log("Source stats:", sourceStats)

    // Get subscriber count
    const totalSubscribers = await subscribers.countDocuments({ active: true })
    console.log(`Total subscribers: ${totalSubscribers}`)

    // Get recent articles
    const recentArticles = await articles.find().sort({ createdAt: -1 }).limit(5).toArray()
    console.log(`Recent articles: ${recentArticles.length}`)

    const result = {
      totalArticles,
      todayArticles,
      totalSubscribers,
      sourceStats,
      recentArticles: recentArticles.map((article) => ({
        title: article.title,
        source: article.source,
        createdAt: article.createdAt,
      })),
    }

    console.log("Stats result:", result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Stats API error:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch stats",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
