import { NextResponse } from "next/server"
import { getDatabase, type User } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0]
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection<User>("users")

    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ preferences: user.preferences || { sources: [], tags: [] } })
  } catch (error) {
    console.error("Error fetching user preferences:", error)
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { sources, tags } = await request.json()

    const token = request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0]
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection<User>("users")

    await usersCollection.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: { preferences: { sources: sources || [], tags: tags || [] } } },
    )

    return NextResponse.json({ message: "Preferences updated successfully" })
  } catch (error) {
    console.error("Error updating user preferences:", error)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
