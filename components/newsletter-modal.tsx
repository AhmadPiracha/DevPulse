"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MailCheck } from "lucide-react"

interface NewsletterModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubscribed(false)

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubscribed(true)
        toast({
          title: "Subscribed!",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to subscribe to newsletter.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setEmail("")
    setSubscribed(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MailCheck className="h-6 w-6 text-primary" /> Subscribe to our Newsletter
          </DialogTitle>
          <DialogDescription>Get the latest tech news and updates delivered straight to your inbox.</DialogDescription>
        </DialogHeader>
        {subscribed ? (
          <div className="text-center py-6 space-y-4">
            <MailCheck className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">You're All Set!</h3>
            <p className="text-muted-foreground">Thank you for subscribing. Check your inbox for a confirmation.</p>
            <Button onClick={handleCloseModal}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subscribe
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
