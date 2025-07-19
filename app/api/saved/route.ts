import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Get user from auth token
    const token = request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0]
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const savedArticles = db.collection("saved_articles")

    // Get saved articles with article details using aggregation
    const saved = await savedArticles
      .aggregate([
        { $match: { userId: decoded.userId } },
        {
          $addFields: {
            articleObjectId: { $toObjectId: "$articleId" },
          },
        },
        {
          $lookup: {
            from: "articles",
            localField: "articleObjectId",
            foreignField: "_id",
            as: "article",
          },
        },
        { $unwind: "$article" },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    console.log(`Found ${saved.length} saved articles for user ${decoded.userId}`)

    return NextResponse.json({ savedArticles: saved })
  } catch (error) {
    console.error("Error fetching saved articles:", error)
    return NextResponse.json({ error: "Failed to fetch saved articles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { articleId } = await request.json()

    // Get user from auth token
    const token = request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0]
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!articleId) {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 })
    }

    console.log(`Saving article ${articleId} for user ${decoded.userId}`)

    const db = await getDatabase()
    const savedArticles = db.collection("saved_articles")

    // Check if already saved
    const existing = await savedArticles.findOne({
      userId: decoded.userId,
      articleId: articleId,
    })

    if (existing) {
      return NextResponse.json({ error: "Article already saved" }, { status: 400 })
    }

    // Save the article
    const result = await savedArticles.insertOne({
      userId: decoded.userId,
      articleId: articleId,
      createdAt: new Date(),
    })

    console.log(`Article saved successfully with ID: ${result.insertedId}`)

    return NextResponse.json({ message: "Article saved successfully" })
  } catch (error) {
    console.error("Error saving article:", error)
    return NextResponse.json({ error: "Failed to save article" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { articleId } = await request.json()

    // Get user from auth token
    const token = request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0]
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!articleId) {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 })
    }

    console.log(`Removing saved article ${articleId} for user ${decoded.userId}`)

    const db = await getDatabase()
    const savedArticles = db.collection("saved_articles")

    const result = await savedArticles.deleteOne({
      userId: decoded.userId,
      articleId: articleId,
    })

    console.log(`Delete result: ${result.deletedCount} documents deleted`)

    return NextResponse.json({ message: "Article removed from saved" })
  } catch (error) {
    console.error("Error removing saved article:", error)
    return NextResponse.json({ error: "Failed to remove saved article" }, { status: 500 })
  }
}
