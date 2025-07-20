"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        toast({
          title: "Password Reset Link Sent",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send password reset link.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Forgot password error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-xl font-bold text-white font-mono">DP</span>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl">Forgot Password?</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter your email to receive a password reset link.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </form>
          {message && (
            <div className="text-center text-sm text-green-600 flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" /> {message}
            </div>
          )}
          <div className="text-center text-sm">
            Remember your password?{" "}
            <Link href="/auth" className="text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
