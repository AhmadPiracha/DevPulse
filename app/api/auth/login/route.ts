import { NextResponse } from "next/server"
import { authenticateUser, generateToken } from "@/lib/auth"
import { serialize } from "cookie"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials or email not verified" }, { status: 401 })
    }

    const token = generateToken(user._id!.toString())

    const cookie = serialize("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return NextResponse.json(
      { message: "Logged in successfully", user: { id: user._id, email: user.email, isVerified: user.isVerified } },
      { headers: { "Set-Cookie": cookie } },
    )
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 401 })
  }
}
