"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

export default function DebugPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [envCheck, setEnvCheck] = useState<any>(null)
  const { user } = useAuth()
  const router = useRouter()

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "ahmadpiracha11@gmail.com"

  // Check environment variables on page load
  useEffect(() => {
    checkEnvironment()
  }, [])

  // Admin check - add this after the existing useEffect
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

  const checkEnvironment = async () => {
    try {
      const response = await fetch("/api/env-check")
      const data = await response.json()
      setEnvCheck(data)
    } catch (error) {
      console.error("Environment check failed:", error)
    }
  }

  const testAPI = async () => {
    setLoading(true)
    try {
      console.log("Testing basic API...")
      const response = await fetch("/api/test")
      console.log("Response status:", response.status)

      if (!response.ok) {
        const text = await response.text()
        console.error("Response text:", text)
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      const data = await response.json()
      console.log("Response data:", data)

      setResults({ type: "api-test", data, status: response.status })
    } catch (error: any) {
      console.error("API test error:", error)
      setResults({ type: "api-test", error: error.message, status: "error" })
    }
    setLoading(false)
  }

  const testMongoDB = async () => {
    setLoading(true)
    try {
      console.log("Testing MongoDB stats...")
      const response = await fetch("/api/stats")
      console.log("Stats response status:", response.status)

      if (!response.ok) {
        const text = await response.text()
        console.error("Stats response text:", text)
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      const data = await response.json()
      console.log("Stats data:", data)

      setResults({ type: "mongodb", data, status: response.status })
    } catch (error: any) {
      console.error("MongoDB test error:", error)
      setResults({ type: "mongodb", error: error.message, status: "error" })
    }
    setLoading(false)
  }

  const testHackerNews = async () => {
    setLoading(true)
    try {
      const response = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json")
      const data = await response.json()
      setResults({
        type: "hackernews",
        data: `✅ Got ${data.length} story IDs. First 5: ${data.slice(0, 5).join(", ")}`,
        status: response.status,
      })
    } catch (error: any) {
      setResults({ type: "hackernews", error: error.message, status: "error" })
    }
    setLoading(false)
  }

  const testGitHub = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        "https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&order=desc&per_page=5",
      )
      const data = await response.json()
      setResults({
        type: "github",
        data: `✅ Got ${data.items?.length || 0} repositories. Rate limit: ${response.headers.get("x-ratelimit-remaining")}`,
        status: response.status,
      })
    } catch (error: any) {
      setResults({ type: "github", error: error.message, status: "error" })
    }
    setLoading(false)
  }

  const testDevTo = async () => {
    setLoading(true)
    try {
      const response = await fetch("https://dev.to/api/articles?per_page=5")
      const data = await response.json()
      setResults({
        type: "devto",
        data: `✅ Got ${data.length} articles`,
        status: response.status,
      })
    } catch (error: any) {
      setResults({ type: "devto", error: error.message, status: "error" })
    }
    setLoading(false)
  }

  const testFullUpdate = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/articles", { method: "POST" })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      const data = await response.json()
      setResults({ type: "full-update", data, status: response.status })
    } catch (error: any) {
      setResults({ type: "full-update", error: error.message, status: "error" })
    }
    setLoading(false)
  }

  const getStatusIcon = (status: any) => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />
    if (status === 200 || status === "success") return <CheckCircle className="h-4 w-4 text-green-500" />
    return <AlertCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusVariant = (status: any) => {
    if (status === 200 || status === "success") return "default"
    return "destructive"
  }

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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">DevPulse Debug & Testing</h1>
          <p className="text-muted-foreground">Test all connections step by step</p>
        </div>
        <Button onClick={checkEnvironment} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Env Check
        </Button>
      </div>

      {/* Environment Variables Check */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Environment Variables Check</CardTitle>
        </CardHeader>
        <CardContent>
          {envCheck ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(envCheck.envVars).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">{key}</span>
                    <Badge variant={value === "✅ Set" ? "default" : "destructive"}>{String(value)}</Badge>
                  </div>
                ))}
              </div>

              {envCheck.debugInfo && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Debug Info (Partial Values):</h4>
                  <pre className="text-sm overflow-auto">{JSON.stringify(envCheck.debugInfo, null, 2)}</pre>
                </div>
              )}

              {envCheck.allEnvKeys && envCheck.allEnvKeys.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Found Environment Keys:</h4>
                  <p className="text-sm">{envCheck.allEnvKeys.join(", ")}</p>
                </div>
              )}
            </div>
          ) : (
            <p>Loading environment check...</p>
          )}
        </CardContent>
      </Card>

      {/* Test Buttons */}
      <div className="grid md:grid-cols-2 gap-4">
        <Button onClick={testAPI} disabled={loading} className="flex items-center gap-2">
          {getStatusIcon(results?.type === "api-test" ? results.status : null)}
          Test Basic API
        </Button>

        <Button onClick={testMongoDB} disabled={loading} className="flex items-center gap-2">
          {getStatusIcon(results?.type === "mongodb" ? results.status : null)}
          Test MongoDB Connection
        </Button>

        <Button onClick={testHackerNews} disabled={loading} className="flex items-center gap-2">
          {getStatusIcon(results?.type === "hackernews" ? results.status : null)}
          Test Hacker News API
        </Button>

        <Button onClick={testGitHub} disabled={loading} className="flex items-center gap-2">
          {getStatusIcon(results?.type === "github" ? results.status : null)}
          Test GitHub API
        </Button>

        <Button onClick={testDevTo} disabled={loading} className="flex items-center gap-2">
          {getStatusIcon(results?.type === "devto" ? results.status : null)}
          Test Dev.to API
        </Button>

        <Button onClick={testFullUpdate} disabled={loading} className="flex items-center gap-2">
          {getStatusIcon(results?.type === "full-update" ? results.status : null)}🚀 Test Full Update
        </Button>
      </div>

      {/* Test Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Test Results: {results.type}
              <Badge variant={getStatusVariant(results.status)}>{results.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">
                <p className="text-red-800 dark:text-red-200 font-medium">Error:</p>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{results.error}</p>
              </div>
            ) : (
              <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(results.data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle>🚨 Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-red-600">If MONGODB_URI shows "Missing":</h4>
            <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
              <li>
                Check your <code>.env.local</code> file exists in the root directory
              </li>
              <li>
                Make sure the file contains: <code>MONGODB_URI=your_connection_string</code>
              </li>
              <li>No spaces around the = sign</li>
              <li>No quotes around the value</li>
              <li>
                Restart your dev server: <code>npm run dev</code>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-blue-600">Example .env.local file:</h4>
            <pre className="bg-muted p-3 rounded text-sm mt-2">
              {`MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/devpulse
JWT_SECRET=your_super_secret_key_here
OPENAI_API_KEY=sk-your_openai_key_here`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-green-600">File Location:</h4>
            <p className="text-sm">
              The <code>.env.local</code> file should be in your project root, same level as <code>package.json</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
