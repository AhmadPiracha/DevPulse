"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NewsletterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewsletterModal({ open, onOpenChange }: NewsletterModalProps) {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitted(true)
    setIsLoading(false)

    toast({
      description: "Successfully subscribed to the newsletter!",
    })

    // Reset after 2 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setEmail("")
      onOpenChange(false)
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Subscribe to DevPulse
          </DialogTitle>
          <DialogDescription>
            Get the daily digest in your inbox. The best tech news, curated and summarized.
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Subscribing..." : "Subscribe to Newsletter"}
              </Button>

              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>• Daily digest delivered at 8 AM</p>
                <p>• Unsubscribe anytime</p>
                <p>• No spam, just quality content</p>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="font-semibold">You're all set!</h3>
              <p className="text-sm text-muted-foreground">
                Welcome to DevPulse. Your first digest will arrive tomorrow morning.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
