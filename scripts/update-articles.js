// Node.js script for automated article fetching and newsletter sending
// Run with: node scripts/update-articles.js

import { MongoClient } from "mongodb"
import { newsSources } from "../lib/news-sources.js" // Adjust path as needed

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = "devpulse"

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not set.")
  process.exit(1)
}

let client

async function fetchAndSaveArticles() {
  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(DB_NAME)
    const articlesCollection = db.collection("articles")

    console.log("Starting article update process...")

    for (const source of newsSources) {
      console.log(`Fetching articles from ${source.name} (${source.url})...`)
      try {
        const response = await fetch(source.url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        if (!Array.isArray(data.articles)) {
          console.warn(`Source ${source.name} did not return an array of articles.`)
          continue
        }

        for (const articleData of data.articles) {
          // Basic validation and transformation
          if (!articleData.title || !articleData.url || !articleData.summary) {
            console.warn(`Skipping malformed article from ${source.name}:`, articleData)
            continue
          }

          const existingArticle = await articlesCollection.findOne({ url: articleData.url })

          const article = {
            title: articleData.title,
            summary: articleData.summary,
            url: articleData.url,
            source: source.name,
            tags: articleData.tags || [], // Assume tags might be present or default to empty array
            author: articleData.author || "Unknown",
            score: articleData.score || 0, // Default score
            sourceIcon: source.icon,
            createdAt: existingArticle ? existingArticle.createdAt : new Date(),
            updatedAt: new Date(),
          }

          if (existingArticle) {
            // Update existing article
            await articlesCollection.updateOne({ _id: existingArticle._id }, { $set: article })
            // console.log(`Updated article: ${article.title}`);
          } else {
            // Insert new article
            await articlesCollection.insertOne(article)
            // console.log(`Inserted new article: ${article.title}`);
          }
        }
        console.log(`Successfully processed articles from ${source.name}.`)
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error)
      }
    }
    console.log("Article update process completed.")
  } catch (error) {
    console.error("Failed to connect to MongoDB or general error:", error)
  } finally {
    if (client) {
      await client.close()
    }
  }
}

async function sendNewsletter() {
  try {
    console.log("📧 Sending daily newsletter...")

    const response = await fetch("http://localhost:3000/api/newsletter/send", {
      method: "POST",
    })

    const result = await response.json()

    if (response.ok) {
      console.log("✅ Newsletter sent successfully!")
      console.log(`📊 Sent to ${result.subscriberCount} subscribers`)
      console.log(`📰 Featured ${result.articleCount} articles`)
    } else {
      console.error("❌ Failed to send newsletter:", result.error)
    }
  } catch (error) {
    console.error("❌ Error sending newsletter:", error)
  }
}

// Run both functions
async function main() {
  await fetchAndSaveArticles()
  await sendNewsletter()
}

main()
