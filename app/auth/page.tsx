"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"signin" | "signup">("signin")

  const [signinData, setSigninData] = useState({ email: "", password: "" })
  const [signupData, setSignupData] = useState({ email: "", password: "" })

  if (user) {
    router.push("/")
    return null
  }

  const handleChange =
    (key: "signin" | "signup") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      if (key === "signin") setSigninData({ ...signinData, [name]: value })
      else setSignupData({ ...signupData, [name]: value })
    }

  const handleSubmit = async (type: "signin" | "signup", e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const data = type === "signin" ? signinData : signupData

    try {
      if (type === "signin") await signIn(data.email, data.password)
      else await signUp(data.email, data.password)

      toast({
        title: type === "signin" ? "Welcome back!" : "Account created!",
        description:
          type === "signin"
            ? "You have been signed in successfully."
            : "Welcome to DevPulse. You can now save articles and get personalized content.",
      })
      router.push("/")
    } catch (error: any) {
      toast({
        title: `${type === "signin" ? "Sign in" : "Sign up"} failed`,
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-xl font-bold text-white font-mono">DP</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl">Welcome to DevPulse</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {tab === "signin"
                ? "Sign in to save articles and get personalized content"
                : "Create an account to unlock the full experience"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Sign In Form */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={(e) => handleSubmit("signin", e)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={signinData.email}
                    onChange={handleChange("signin")}
                    required
                    autoComplete="email"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={signinData.password}
                    onChange={handleChange("signin")}
                    required
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up Form */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={(e) => handleSubmit("signup", e)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupData.email}
                    onChange={handleChange("signup")}
                    required
                    autoComplete="email"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={signupData.password}
                    onChange={handleChange("signup")}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
