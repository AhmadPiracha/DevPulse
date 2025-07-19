"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Rss, Bookmark, Info, Settings, User, LogOut, Sun, Moon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth-provider"
import { useSidebar } from "@/components/ui/sidebar"

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@devpulse.dev"

const menuItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Feed",
    url: "/feed",
    icon: Rss,
  },
  {
    title: "Saved",
    url: "/saved",
    icon: Bookmark,
    requireAuth: true,
  },
  {
    title: "About",
    url: "/about",
    icon: Info,
  },
  {
    title: "Settings", // Add this item
    url: "/settings",
    icon: Settings,
    requireAuth: true, // Only show if user is logged in
  },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { isMobile } = useSidebar()

  const isAdmin = user?.email === ADMIN_EMAIL

  // Only show mobile nav on mobile devices (md breakpoint and below)
  return (
    <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">DP</span>
          </div>
          <span className="font-mono text-lg font-bold">DevPulse</span>
        </Link>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-border/40 p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-sm font-bold text-primary-foreground">DP</span>
                </div>
                <span className="font-mono text-lg font-bold">DevPulse</span>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-auto p-6">
                <nav className="space-y-2">
                  {menuItems
                    .filter((item) => !item.requireAuth || user)
                    .map((item) => (
                      <Link
                        key={item.title}
                        href={item.url}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                          pathname === item.url ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    ))}

                  {/* Admin Panel - Only for admin */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                        pathname === "/admin" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <Settings className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                </nav>
              </div>

              {/* Footer */}
              <div className="border-t border-border/40 p-6 space-y-4">
                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full justify-start"
                  suppressHydrationWarning
                >
                  <span suppressHydrationWarning>
                    {theme === "dark" ? <Sun className="h-4 w-4 mr-3" /> : <Moon className="h-4 w-4 mr-3" />}
                  </span>
                  <span suppressHydrationWarning>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </Button>

                {/* User Menu */}
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2 text-sm">
                      <User className="h-4 w-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        signOut()
                        setOpen(false)
                      }}
                      className="w-full justify-start text-red-500 hover:text-red-400"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                    <Link href="/auth" onClick={() => setOpen(false)}>
                      <User className="h-4 w-4 mr-3" />
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
