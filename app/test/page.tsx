"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

export default function TestPage() {
  const [result, setResult] = useState<string>("")
  const { user } = useAuth()
  const router = useRouter()

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "ahmadpiracha11@gmaill.com"

  // Admin check
  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }
    if (user.email !== ADMIN_EMAIL) {
      router.push("/")
      return
    }
  }, [user, router])

  // Don't render for non-admin users
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">This page is restricted to administrators.</p>
        </div>
      </div>
    )
  }

  const testFetch = async () => {
    try {
      const response = await fetch("/api/articles")
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    }
  }

  const testUpdate = async () => {
    try {
      const response = await fetch("/api/articles", { method: "POST" })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Test Page</h1>
        <p className="text-muted-foreground">Test the basic functionality</p>
      </div>

      <div className="flex gap-4">
        <Button onClick={testFetch}>Test Fetch Articles</Button>
        <Button onClick={testUpdate}>Test Update Articles</Button>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto whitespace-pre-wrap">{result}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
