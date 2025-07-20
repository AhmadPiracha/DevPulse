import { NextResponse } from "next/server"
import { getDatabase, type NewsletterSubscriber, type Article } from "@/lib/mongodb"
import { Resend } from "resend"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    // Basic authentication/authorization check (e.g., API key, internal call)
    // For a real app, you'd want more robust security here.
    const authHeader = request.headers.get("Authorization")
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const subscribersCollection = db.collection<NewsletterSubscriber>("newsletter_subscribers")
    const articlesCollection = db.collection<Article>("articles")

    // Fetch active subscribers
    const activeSubscribers = await subscribersCollection.find({ active: true }).toArray()

    if (activeSubscribers.length === 0) {
      return NextResponse.json({ message: "No active subscribers to send to." })
    }

    // Fetch recent articles (e.g., last 24 hours, or top 5)
    const recentArticles = await articlesCollection
      .find({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }) // Articles from last 24 hours
      .sort({ score: -1, createdAt: -1 }) // Sort by score then recency
      .limit(5)
      .toArray()

    if (recentArticles.length === 0) {
      return NextResponse.json({ message: "No new articles to send." })
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set. Skipping newsletter send.")
      return NextResponse.json({ error: "RESEND_API_KEY not configured." }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    let successCount = 0
    let failCount = 0

    for (const subscriber of activeSubscribers) {
      const emailContent = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Your Daily DevPulse Digest</h1>
          <p>Here are the top articles from the last 24 hours:</p>
          <ul style="list-style: none; padding: 0;">
            ${recentArticles
              .map(
                (article) => `
              <li style="margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px;">
                <h2 style="font-size: 18px; margin-bottom: 5px;"><a href="${article.url}" style="color: #1d4ed8; text-decoration: none;">${article.title}</a></h2>
                <p style="font-size: 14px; color: #6b7280;">${article.summary}</p>
                <p style="font-size: 12px; color: #9ca3af;">Source: ${article.source} | Tags: ${article.tags.join(", ")}</p>
              </li>
            `,
              )
              .join("")}
          </ul>
          <p>Read more on <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" style="color: #3b82f6; text-decoration: none;">DevPulse</a>.</p>
          <hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            You received this email because you subscribed to DevPulse.
            To unsubscribe, visit your profile settings on DevPulse.
          </p>
        </div>
      `

      try {
        await resend.emails.send({
          from: "DevPulse Digest <digest@devpulse.dev>", // Use a dedicated domain for newsletters
          to: subscriber.email,
          subject: "Your Daily DevPulse Digest",
          html: emailContent,
        })
        successCount++
        console.log(`Newsletter sent to ${subscriber.email}`)
      } catch (error) {
        failCount++
        console.error(`Failed to send newsletter to ${subscriber.email}:`, error)
      }
    }

    return NextResponse.json({
      message: `Newsletter send complete. Sent to ${successCount} subscribers, ${failCount} failed.`,
      successCount,
      failCount,
    })
  } catch (error) {
    console.error("Error sending newsletter:", error)
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 })
  }
}
