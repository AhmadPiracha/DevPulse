import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test basic API response
    console.log("Testing API endpoint...")

    // Test MongoDB connection
    const { testConnection } = await import("@/lib/mongodb")
    const mongoConnected = await testConnection()

    // Test environment variables
    const hasMongoUri = !!process.env.MONGODB_URI
    const hasJwtSecret = !!process.env.JWT_SECRET
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    const result = {
      status: "success",
      message: "API is working!",
      timestamp: new Date().toISOString(),
      mongodb: {
        connected: mongoConnected,
        hasUri: hasMongoUri,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret,
        hasOpenAI,
      },
    }

    console.log("Test result:", result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Test API error:", error)

    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
        mongodb: {
          connected: false,
          error: error.message,
        },
      },
      { status: 500 },
    )
  }
}
