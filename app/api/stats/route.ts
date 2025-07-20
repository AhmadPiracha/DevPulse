import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    const articlesCollection = db.collection("articles")
    const usersCollection = db.collection("users")
    const savedArticlesCollection = db.collection("saved_articles")
    const newsletterSubscribersCollection = db.collection("newsletter_subscribers")

    const totalArticles = await articlesCollection.countDocuments()
    const totalUsers = await usersCollection.countDocuments()
    const totalSavedArticles = await savedArticlesCollection.countDocuments()
    const totalSubscribers = await newsletterSubscribersCollection.countDocuments({ active: true })

    return NextResponse.json({
      totalArticles,
      totalUsers,
      totalSavedArticles,
      totalSubscribers,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
