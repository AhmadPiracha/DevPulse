import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase, type User } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0]

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection<User>("users")
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Return a sanitized user object (without password hash)
    return NextResponse.json({ user: { id: user._id?.toString(), email: user.email, isVerified: user.isVerified } })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
