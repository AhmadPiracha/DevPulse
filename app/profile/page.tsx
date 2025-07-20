"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { Loader2, Mail, CalendarDays } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U"
  const joinDate = user.id ? new Date(Number.parseInt(user.id.substring(0, 8), 16) * 1000).toLocaleDateString() : "N/A" // Extract creation date from MongoDB ObjectId

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} alt={user.email} />
              <AvatarFallback className="text-4xl font-bold">{userInitial}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl sm:text-3xl">{user.email.split("@")[0]}</CardTitle>
          <p className="text-sm sm:text-base text-muted-foreground">{user.email}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Member Since:</span>
              <span className="text-sm text-muted-foreground">{joinDate}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Quick Links</h3>
            <div className="grid grid-cols-1 gap-3">
              <Button asChild variant="outline">
                <Link href="/settings">Edit Profile & Preferences</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/saved">View Saved Articles</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
