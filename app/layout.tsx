import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Separator } from "@/components/ui/separator"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DevPulse",
  description: "Your personalized hub for staying updated with the latest in tech news and development.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                  <MobileNav />
                  <SidebarTrigger className="-ml-1 hidden md:flex" />
                  <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
                  {/* You can add breadcrumbs or other header content here */}
                  <h1 className="text-lg font-semibold">DevPulse</h1>
                </header>
                {children}
              </SidebarInset>
            </SidebarProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
