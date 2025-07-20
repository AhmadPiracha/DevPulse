"use client"

import type React from "react"

import { Home, Settings, LayoutDashboard, Bookmark, UserCircle2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { SearchFormComponent } from "./search-form"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronUp } from "lucide-react"
import { useAuth } from "./auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

// Menu items.
const mainItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Feed",
    url: "/feed",
    icon: Home,
  },
  {
    title: "Saved",
    url: "/saved",
    icon: Bookmark,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

const accountItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: UserCircle2,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U"
  const userDisplayName = user?.email ? user.email.split("@")[0] : "Guest"

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="text-lg font-bold text-white font-mono">DP</span>
          </div>
          <span className="text-lg font-semibold">DevPulse</span>
        </Link>
        <SearchFormComponent />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`}
                        alt={user.email}
                      />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                    <span>{userDisplayName}</span>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  {accountItems.map((item) => (
                    <DropdownMenuItem key={item.title} asChild>
                      <Link href={item.url}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={signOut}>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/auth">
                  <UserCircle2 />
                  <span>Sign In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
