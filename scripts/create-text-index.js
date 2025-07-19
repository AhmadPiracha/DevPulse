import { MongoClient } from "mongodb"
import dotenv from "dotenv" // Import dotenv

dotenv.config({ path: "./.env.local" }) // Load .env.local file

const uri = process.env.MONGODB_URI

if (!uri) {
  console.error("Error: MONGODB_URI environment variable is not set.")
  process.exit(1)
}

async function createTextIndex() {
  let client
  try {
    client = new MongoClient(uri)
    console.log("Attempting to connect to MongoDB...")
    await client.connect()
    console.log("Successfully connected to MongoDB!")

    const db = client.db("devpulse")
    const articlesCollection = db.collection("articles")

    console.log('Creating text index on "title", "summary", and "tags" fields...')
    await articlesCollection.createIndex(
      { title: "text", summary: "text", tags: "text" },
      { name: "article_text_index" },
    )
    console.log('Text index "article_text_index" created successfully!')

    // Verify index creation
    const indexes = await articlesCollection.indexes()
    console.log(
      "Current indexes on articles collection:",
      indexes.map((idx) => idx.name),
    )
  } catch (error) {
    console.error("Error creating text index:", error)
  } finally {
    if (client) {
      await client.close()
      console.log("MongoDB connection closed.")
    }
  }
}

createTextIndex()
