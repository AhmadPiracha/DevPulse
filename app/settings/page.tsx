"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, SettingsIcon } from "lucide-react"

const availableSources = ["Hacker News", "GitHub", "Dev.to", "Crypto News"] // Added "Crypto News"
const commonTags = [
  "JavaScript",
  "AI",
  "Python",
  "Web Development",
  "DevOps",
  "Mobile",
  "Security",
  "Database",
  "Blockchain",
  "Web3",
  "DeFi",
  "NFTs",
] // Expanded tags

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [preferredSources, setPreferredSources] = useState<string[]>([])
  const [preferredTags, setPreferredTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth") // Redirect to login if not authenticated
    } else if (user) {
      fetchPreferences()
    }
  }, [user, authLoading, router])

  const fetchPreferences = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/user/preferences", {
        credentials: "include",
        headers: {
          Cookie: document.cookie,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPreferredSources(data.preferences?.sources || [])
        setPreferredTags(data.preferences?.tags || [])
      } else {
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
      setLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        credentials: "include",
        body: JSON.stringify({ sources: preferredSources, tags: preferredTags }),
      })

      if (response.ok) {
        toast({
          title: "Preferences Saved",
          description: "Your feed preferences have been updated.",
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
      setSaving(false)
    }
  }

  const handleSourceChange = (source: string, checked: boolean) => {
    setPreferredSources((prev) => (checked ? [...prev, source] : prev.filter((s) => s !== source)))
  }

  const handleTagChange = (tag: string, checked: boolean) => {
    setPreferredTags((prev) => (checked ? [...prev, tag] : prev.filter((t) => t !== tag)))
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading preferences...</p>
      </div>
    )
  }

  if (!user) {
    return null // Should be redirected by useEffect
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Preferred News Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Select the sources you want to see in your feed.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableSources.map((source) => (
              <div key={source} className="flex items-center space-x-2">
                <Checkbox
                  id={`source-${source}`}
                  checked={preferredSources.includes(source)}
                  onCheckedChange={(checked) => handleSourceChange(source, checked as boolean)}
                />
                <Label htmlFor={`source-${source}`}>{source}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferred Tags/Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select topics that interest you. Articles with these tags will be prioritized.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {commonTags.map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag}`}
                  checked={preferredTags.includes(tag)}
                  onCheckedChange={(checked) => handleTagChange(tag, checked as boolean)}
                />
                <Label htmlFor={`tag-${tag}`}>{tag}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSavePreferences} disabled={saving} className="w-full">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Preferences
      </Button>
    </div>
  )
}
