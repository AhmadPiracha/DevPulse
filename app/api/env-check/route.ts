import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check all environment variables
    const envVars = {
      MONGODB_URI: process.env.MONGODB_URI ? "✅ Set" : "❌ Missing",
      JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing",
      NODE_ENV: process.env.NODE_ENV || "undefined",
    }

    // Show partial values for debugging (hide sensitive parts)
    const debugInfo = {
      MONGODB_URI: process.env.MONGODB_URI
        ? `${process.env.MONGODB_URI.substring(0, 20)}...${process.env.MONGODB_URI.slice(-10)}`
        : "Not set",
      JWT_SECRET: process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 10)}...` : "Not set",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : "Not set",
    }

    return NextResponse.json({
      status: "success",
      envVars,
      debugInfo,
      allEnvKeys: Object.keys(process.env).filter(
        (key) => key.includes("MONGODB") || key.includes("JWT") || key.includes("OPENAI"),
      ),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
