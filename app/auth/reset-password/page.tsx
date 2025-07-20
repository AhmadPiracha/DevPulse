"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!token) {
      toast({
        title: "Error",
        description: "No reset token provided.",
        variant: "destructive",
      })
      router.push("/auth/forgot-password")
    }
  }, [token, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setResetSuccess(true)
        toast({
          title: "Success!",
          description: "Your password has been reset successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reset password.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Reset password error:", error)
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
            <CardTitle className="text-xl sm:text-2xl">Reset Password</CardTitle>
            <CardDescription className="text-sm sm:text-base">Set your new password for DevPulse.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {resetSuccess ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="font-semibold">Password Reset!</h3>
                <p className="text-sm text-muted-foreground">
                  Your password has been successfully updated. You can now sign in with your new password.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/auth">Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
