import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { MobileNav } from "@/components/mobile-nav"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "DevPulse - Stay in the loop. Automatically.",
  description: "Developer-focused tech news aggregator with AI summaries and daily digest",
  keywords: ["tech news", "developer", "programming", "hacker news", "github", "dev.to"],
  authors: [{ name: "DevPulse Team" }],
  openGraph: {
    title: "DevPulse - Developer Tech News",
    description: "Stay updated with the latest tech news, curated for developers",
    type: "website",
  },
}

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SidebarProvider defaultOpen={true}>
              <div className="flex min-h-screen w-full">
                {/* Desktop Sidebar - Hidden on mobile */}
                <AppSidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Mobile Navigation - Only shown on mobile */}
                  <MobileNav />

                  {/* Page Content */}
                  <main className="flex-1 overflow-hidden">{children}</main>
                </div>
              </div>
            </SidebarProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
