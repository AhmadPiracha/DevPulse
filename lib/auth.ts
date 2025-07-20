import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDatabase, type User } from "./mongodb"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function createUser(email: string, password: string): Promise<User> {
  const db = await getDatabase()
  const users = db.collection<User>("users")

  // Check if user already exists
  const existingUser = await users.findOne({ email })
  if (existingUser) {
    throw new Error("User already exists")
  }

  const hashedPassword = await hashPassword(password)
  const user: User = {
    email,
    password: hashedPassword,
    createdAt: new Date(),
    preferences: {
      sources: ["All"],
      tags: [],
    },
  }

  const result = await users.insertOne(user)
  return { ...user, _id: result.insertedId.toString() }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const db = await getDatabase()
  const users = db.collection<User>("users")

  const user = await users.findOne({ email })
  if (!user) return null

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return null

  return user
}

export async function updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const db = await getDatabase()
  const users = db.collection<User>("users")

  const user = await users.findOne({ _id: new ObjectId(userId) })
  if (!user) {
    throw new Error("User not found")
  }

  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) {
    throw new Error("Invalid current password")
  }

  const hashedPassword = await hashPassword(newPassword)
  await users.updateOne({ _id: new ObjectId(userId) }, { $set: { password: hashedPassword } })
}
