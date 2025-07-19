import { NextResponse } from "next/server"
import { createUser, generateToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const user = await createUser(email, password)
    const token = generateToken(user._id!)

    const response = NextResponse.json({
      message: "User created successfully",
      user: { id: user._id, email: user.email },
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to create user",
      },
      { status: 400 },
    )
  }
}
