import { NextResponse } from "next/server"
import { getDatabase, type Article } from "@/lib/mongodb"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { checkRateLimit, MAX_REQUESTS } from "@/lib/rate-limiter" // Import MAX_REQUESTS and WINDOW_MS
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userQuery = searchParams.get("q") || ""
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const offset = Number.parseInt(searchParams.get("offset") || "0")

  // Get user ID from token or use IP address for rate limiting
  const token = request.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0]
  let identifier = "anonymous"
  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      identifier = decoded.userId
    }
  } else {
    // Fallback to IP if no user token (less accurate for shared IPs)
    identifier = request.headers.get("x-forwarded-for") || request.ip || "unknown"
  }

  const { allowed, remaining, resetAfter } = await checkRateLimit(identifier)

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `You have exceeded the rate limit. Please try again in ${Math.ceil(resetAfter / 1000)} seconds.`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000 + resetAfter / 1000)),
          "Retry-After": String(Math.ceil(resetAfter / 1000)),
        },
      },
    )
  }

  if (!userQuery) {
    return NextResponse.json({ articles: [], total: 0, message: "No search query provided." }, { status: 400 })
  }

  try {
    console.log(`🔍 AI-Powered Search initiated for query: "${userQuery}"`)

    let searchKeywords: string[] = []

    // Use OpenAI to generate more comprehensive keywords from the user's query
    if (process.env.OPENAI_API_KEY) {
      try {
        const { text } = await generateText({
          model: openai("gpt-3.5-turbo"), // Using gpt-3.5-turbo for cost-effectiveness
          prompt: `Given the user's search query, generate a comma-separated list of 5-10 relevant keywords that can be used to find tech articles. Focus on technologies, concepts, and topics.
          
          User Query: "${userQuery}"
          Keywords:`,
          maxTokens: 50,
          temperature: 0.3,
        })
        searchKeywords = text
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean)
        console.log(`🤖 AI generated keywords: ${searchKeywords.join(", ")}`)
      } catch (aiError) {
        console.warn("⚠️ AI keyword generation failed, falling back to basic query:", aiError)
        searchKeywords = userQuery
          .split(" ")
          .map((s) => s.trim())
          .filter(Boolean)
      }
    } else {
      console.warn("⚠️ OPENAI_API_KEY not set. Falling back to basic keyword search.")
      searchKeywords = userQuery
        .split(" ")
        .map((s) => s.trim())
        .filter(Boolean)
    }

    const db = await getDatabase()
    const articlesCollection = db.collection<Article>("articles")

    // Build a robust search query for MongoDB
    const regexKeywords = searchKeywords.map((keyword) => new RegExp(keyword, "i")) // Case-insensitive regex

    const query = {
      $or: [
        { title: { $in: regexKeywords } },
        { summary: { $in: regexKeywords } },
        { tags: { $in: searchKeywords } }, // Direct match for tags
        { source: { $in: regexKeywords } },
        { author: { $in: searchKeywords } },
      ],
    }

    const searchResults = await articlesCollection
      .find(query, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } }) // Sort by relevance
      .skip(offset)
      .limit(limit)
      .toArray()

    const totalResults = await articlesCollection.countDocuments(query)

    console.log(`✅ Found ${searchResults.length} articles for search query: "${userQuery}"`)

    return NextResponse.json({ articles: searchResults, total: totalResults })
  } catch (error: any) {
    console.error("❌ Error during AI-powered search:", error)
    return NextResponse.json(
      {
        error: "Failed to perform AI-powered search",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
