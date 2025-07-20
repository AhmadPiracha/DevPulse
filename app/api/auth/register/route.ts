import { NextResponse } from "next/server"
import { createUser } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const user = await createUser(email, password)

    // Do not set cookie here, user needs to verify email first
    return NextResponse.json(
      { message: "User registered successfully. Please verify your email.", user: { id: user._id, email: user.email } },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 })
  }
}
