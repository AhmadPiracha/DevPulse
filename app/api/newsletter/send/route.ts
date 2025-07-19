import { NextResponse } from "next/server"
import { getDatabase, type Article, type NewsletterSubscriber } from "@/lib/mongodb"

export async function POST() {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: "Newsletter feature requires Resend API key",
          message: "Add RESEND_API_KEY to your environment variables to enable newsletters",
        },
        { status: 400 },
      )
    }

    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)

    const db = await getDatabase()

    // Get top articles from last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const articles = await db
      .collection<Article>("articles")
      .find({ createdAt: { $gte: yesterday } })
      .sort({ score: -1 })
      .limit(10)
      .toArray()

    // Get all active subscribers
    const subscribers = await db
      .collection<NewsletterSubscriber>("newsletter_subscribers")
      .find({ active: true })
      .toArray()

    if (subscribers.length === 0) {
      return NextResponse.json({ message: "No active subscribers", subscriberCount: 0, articleCount: articles.length })
    }

    // Generate newsletter HTML
    const newsletterHTML = generateNewsletterHTML(articles)

    // Send to all subscribers (in batches to avoid rate limits)
    const batchSize = 50
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)

      const emailPromises = batch.map((subscriber) =>
        resend.emails.send({
          from: "DevPulse Daily <ahmadpiracha11@gmail.com>",
          to: subscriber.email,
          subject: `DevPulse Daily - ${new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          html: newsletterHTML,
        }),
      )

      await Promise.all(emailPromises)

      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return NextResponse.json({
      message: "Newsletter sent successfully",
      subscriberCount: subscribers.length,
      articleCount: articles.length,
    })
  } catch (error) {
    console.error("Newsletter send error:", error)
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 })
  }
}

function generateNewsletterHTML(articles: Article[]) {
  const articleHTML = articles
    .map(
      (article) => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <h2 style="margin: 0 0 8px;">${article.title}</h2>
      <p style="margin: 0;">${article.summary}</p>
      <a href="${article.url}" style="color: #16a34a; text-decoration: none;">Read More</a>
    </div>
  `,
    )
    .join("")

  return `
    <html>
      <head>
        <title>DevPulse Daily Newsletter</title>
      </head>
      <body>
        <h1 style="text-align: center; margin-bottom: 24px;">DevPulse Daily Newsletter</h1>
        ${articleHTML}
      </body>
    </html>
  `
}
