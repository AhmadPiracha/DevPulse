import { NextResponse } from "next/server"
import { getDatabase, type NewsletterSubscriber } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const subscribers = db.collection<NewsletterSubscriber>("newsletter_subscribers")

    // Check if already subscribed
    const existingSubscriber = await subscribers.findOne({ email })
    if (existingSubscriber) {
      if (existingSubscriber.active) {
        return NextResponse.json({ message: "You are already subscribed!" }, { status: 200 })
      } else {
        // Re-activate if previously unsubscribed
        await subscribers.updateOne({ email }, { $set: { active: true, subscribedAt: new Date() } })
        return NextResponse.json({ message: "Welcome back! You've been re-subscribed." }, { status: 200 })
      }
    }

    // Add new subscriber
    const result = await subscribers.insertOne({
      email,
      subscribedAt: new Date(),
      active: true,
    })

    console.log(`New newsletter subscriber: ${email}, ID: ${result.insertedId}`)

    return NextResponse.json({ message: "Successfully subscribed to the newsletter!" }, { status: 201 })
  } catch (error) {
    console.error("Error subscribing to newsletter:", error)
    return NextResponse.json({ error: "Failed to subscribe to newsletter" }, { status: 500 })
  }
}
