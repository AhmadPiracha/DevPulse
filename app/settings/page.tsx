"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Loader2, Settings, KeyRound, Mail } from "lucide-react"
import { newsSources } from "@/lib/news-sources"

interface UserPreferences {
  sources: string[]
  tags: string[]
}

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { toast } = useToast()

  const [preferences, setPreferences] = useState<UserPreferences>({ sources: [], tags: [] })
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [savingPreferences, setSavingPreferences] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [updatingPassword, setUpdatingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPreferences()
    } else if (!authLoading) {
      // Redirect or show message if not logged in
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your settings.",
        variant: "destructive",
      })
    }
  }, [user, authLoading, toast])

  const fetchPreferences = async () => {
    setLoadingPreferences(true)
    try {
      const response = await fetch("/api/user/preferences", {
        credentials: "include",
        headers: {
          Cookie: document.cookie,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences || { sources: [], tags: [] })
      } else {
        console.error("Failed to fetch preferences:", await response.json())
        toast({
          title: "Error",
          description: "Failed to load preferences.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching preferences:", error)
      toast({
        title: "Error",
        description: "Failed to load preferences.",
        variant: "destructive",
      })
    } finally {
      setLoadingPreferences(false)
    }
  }

  const handleSourceChange = (sourceName: string, checked: boolean) => {
    setPreferences((prev) => {
      const newSources = checked ? [...prev.sources, sourceName] : prev.sources.filter((s) => s !== sourceName)

      // Special handling for "All" source
      if (sourceName === "All") {
        return { ...prev, sources: checked ? ["All"] : [] }
      } else if (newSources.includes("All") && checked) {
        // If a specific source is checked, and "All" was previously selected, remove "All"
        return { ...prev, sources: newSources.filter((s) => s !== "All") }
      } else if (newSources.length === 0 && !checked) {
        // If all specific sources are unchecked, default to "All"
        return { ...prev, sources: ["All"] }
      }
      return { ...prev, sources: newSources }
    })
  }

  const handleTagChange = (tag: string, checked: boolean) => {
    setPreferences((prev) => {
      const newTags = checked ? [...prev.tags, tag] : prev.tags.filter((t) => t !== tag)
      return { ...prev, tags: newTags }
    })
  }

  const savePreferences = async () => {
    setSavingPreferences(true)
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        toast({
          description: "Preferences saved successfully!",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to save preferences.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save preferences.",
        variant: "destructive",
      })
    } finally {
      setSavingPreferences(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingPassword(true)

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      setUpdatingPassword(false)
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      })
      setUpdatingPassword(false)
      return
    }

    try {
      const response = await fetch("/api/user/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          description: "Password updated successfully!",
        })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmNewPassword("")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update password.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        title: "Error",
        description: "Failed to update password.",
        variant: "destructive",
      })
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    })
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  const allTags = [
    "Programming",
    "Web Development",
    "AI",
    "Machine Learning",
    "Cloud",
    "DevOps",
    "Cybersecurity",
    "Data Science",
    "Mobile Development",
    "Frontend",
    "Backend",
    "Databases",
    "Open Source",
    "Productivity",
    "Career",
  ]

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your account and preferences.</p>
        </div>
      </div>

      {/* Email Verification Status */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" /> Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.isVerified ? (
            <p className="text-sm text-green-600">Your email address ({user.email}) is verified.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600">Your email address ({user.email}) is not verified.</p>
              <Button
                onClick={() => {
                  // Assuming email is available from user object
                  fetch("/api/auth/resend-verification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: user.email }),
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.error) {
                        toast({ title: "Error", description: data.error, variant: "destructive" })
                      } else {
                        toast({ description: data.message || "Verification email sent!" })
                      }
                    })
                    .catch((err) => {
                      console.error("Resend verification error:", err)
                      toast({
                        title: "Error",
                        description: "Failed to resend verification email.",
                        variant: "destructive",
                      })
                    })
                }}
                disabled={updatingPassword}
              >
                Resend Verification Email
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences Card */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Content Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingPreferences ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading preferences...</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold">Preferred Sources:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Add "All" option */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="source-all"
                      checked={preferences.sources.includes("All")}
                      onCheckedChange={(checked) => handleSourceChange("All", !!checked)}
                    />
                    <Label htmlFor="source-all">All Sources</Label>
                  </div>
                  {newsSources.map((source) => (
                    <div key={source.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${source.name}`}
                        checked={preferences.sources.includes(source.name) && !preferences.sources.includes("All")}
                        onCheckedChange={(checked) => handleSourceChange(source.name, !!checked)}
                        disabled={preferences.sources.includes("All")}
                      />
                      <Label htmlFor={`source-${source.name}`}>
                        {source.icon} {source.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Preferred Tags:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={preferences.tags.includes(tag)}
                        onCheckedChange={(checked) => handleTagChange(tag, !!checked)}
                      />
                      <Label htmlFor={`tag-${tag}`}>#{tag}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={savePreferences} disabled={savingPreferences} className="w-full">
                {savingPreferences && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Preferences
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Password Update Card */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Update Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
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
            <Button type="submit" disabled={updatingPassword} className="w-full">
              {updatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logout Card */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignOut} variant="destructive" className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
