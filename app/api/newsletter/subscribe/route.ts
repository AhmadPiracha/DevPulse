import { NextResponse } from "next/server"
import { getDatabase, type NewsletterSubscriber } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const db = await getDatabase()
    const subscribers = db.collection<NewsletterSubscriber>("newsletter_subscribers")

    // Check if already subscribed
    const existing = await subscribers.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: "Email already subscribed" }, { status: 400 })
    }

    // Add to database
    await subscribers.insertOne({
      email,
      subscribedAt: new Date(),
      active: true,
    })

    // Send welcome email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
          from: "DevPulse <ahmadpiracha11@gmail.com>",
          to: email,
          subject: "Welcome to DevPulse! 🚀",
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">Welcome to DevPulse!</h1>
              <p>Thanks for subscribing to our daily tech digest.</p>
              <p>You'll receive curated tech news with summaries every morning at 8 AM.</p>
              <p>Stay in the loop. Automatically. 🔄</p>
              <hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                You can unsubscribe anytime by replying to any email.
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Email sending failed:", emailError)
        // Don't fail the subscription if email fails
      }
    }

    return NextResponse.json({ message: "Successfully subscribed!" })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}
