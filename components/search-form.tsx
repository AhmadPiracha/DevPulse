"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState } from "react"

export function SearchFormComponent() {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Future enhancement: Add logic to handle search
    console.log("Search query:", query)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-2 pb-4"
    >
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search in DevPulse..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 py-2 text-sm"
        />
      </div>
      <Button type="submit" variant="secondary" size="sm" className="shrink-0">
        Go
      </Button>
    </form>
  )
}
