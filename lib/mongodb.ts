import { MongoClient, type Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI

// Add connection options to handle SSL issues
const options = {
  // Increase timeouts to handle slow connections
  serverSelectionTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
  connectTimeoutMS: 10000, // 10 seconds
  // Retry settings
  retryWrites: true,
  retryReads: true,
  // Remove the unsupported options: bufferMaxEntries, sslValidate, ssl
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

// Database helper functions
export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise
    return client.db("devpulse")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw new Error("Failed to connect to MongoDB")
  }
}

// Test MongoDB connection
export async function testConnection(): Promise<boolean> {
  try {
    const db = await getDatabase()
    await db.admin().ping()
    return true
  } catch (error) {
    console.error("MongoDB connection test failed:", error)
    return false
  }
}

// Collection interfaces
export interface Article {
  _id?: string
  title: string
  summary: string
  url: string
  source: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  score: number
  author?: string
  sourceIcon?: string
}

export interface SavedArticle {
  _id?: string
  userId: string
  articleId: string
  createdAt: Date
}

export interface NewsletterSubscriber {
  _id?: string
  email: string
  subscribedAt: Date
  active: boolean
}

export interface User {
  _id?: string
  email: string
  password: string // hashed
  createdAt: Date
  preferences?: {
    sources: string[]
    tags: string[]
  }
}
