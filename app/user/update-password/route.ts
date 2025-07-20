import { NextResponse } from "next/server"
import { updateUserPassword, verifyToken } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json()

    const token = headers().get("cookie")?.split("auth-token=")[1]?.split(";")[0]
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
    }

    await updateUserPassword(decoded.userId, currentPassword, newPassword)

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error: any) {
    console.error("Update password error:", error)
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 500 })
  }
}
