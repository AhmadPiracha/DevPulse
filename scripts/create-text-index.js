// This script creates a text index on the 'articles' collection in MongoDB.
// A text index is necessary for efficient full-text search queries.
// Run this script once after setting up your MongoDB database.

import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = "devpulse"
const COLLECTION_NAME = "articles"

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not set.")
  process.exit(1)
}

async function createTextIndex() {
  let client
  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    console.log(`Attempting to create text index on '${COLLECTION_NAME}' collection...`)

    // Create a text index on the 'title' and 'summary' fields
    // The 'weights' option gives more importance to matches in the title.
    const result = await collection.createIndex(
      { title: "text", summary: "text", tags: "text" },
      { name: "article_text_index", weights: { title: 10, summary: 5, tags: 3 } },
    )

    console.log(`Text index created successfully: ${result}`)
    console.log("You can now perform full-text searches on the title, summary, and tags fields.")
  } catch (error) {
    if (error.code === 85) {
      // 85 is the error code for "Index already exists"
      console.warn("Text index already exists on the collection. Skipping creation.")
    } else {
      console.error("Error creating text index:", error)
      process.exit(1)
    }
  } finally {
    if (client) {
      await client.close()
    }
  }
}

createTextIndex()
