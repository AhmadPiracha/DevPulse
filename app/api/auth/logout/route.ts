import { NextResponse } from "next/server"
import { serialize } from "cookie"

export async function POST() {
  try {
    const cookie = serialize("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    })

    return NextResponse.json({ message: "Logged out successfully" }, { headers: { "Set-Cookie": cookie } })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}
