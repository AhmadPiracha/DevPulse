import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Github, Twitter, Mail, Zap, Users, Clock, Filter } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b border-border/40">
        <div className="p-6">
          <h1 className="text-2xl font-bold">About DevPulse</h1>
          <p className="text-muted-foreground">The developer-focused tech news aggregator built for busy engineers</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Mission */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                DevPulse was created to solve a simple problem: developers are drowning in information. With dozens of
                tech news sources, forums, and communities, it's impossible to stay updated without spending hours
                reading.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We use AI to curate and summarize the most important tech news from trusted sources, delivering only
                what matters to your inbox and feed. No clickbait, no fluff—just the essential updates that help you
                stay ahead in your career.
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-5 w-5 text-green-500" />
                  Smart Curation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes thousands of articles daily, filtering out noise and highlighting stories that matter
                  to developers.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Time-Saving Summaries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get the key points in 2-3 lines. Spend seconds, not minutes, understanding each story.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-purple-500" />
                  Multiple Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Aggregated from Hacker News, GitHub, Dev.to, Reddit, and other trusted developer communities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5 text-orange-500" />
                  Daily Digest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get the top stories delivered to your inbox every morning. Perfect for your coffee break.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tech Stack */}
          {/* <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Built With</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Next.js</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Tailwind CSS</Badge>
                <Badge variant="secondary">shadcn/ui</Badge>
                <Badge variant="secondary">OpenAI</Badge>
                <Badge variant="secondary">Vercel</Badge>
                <Badge variant="secondary">Supabase</Badge>
              </div>
            </CardContent>
          </Card> */}

          {/* Contact */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/ahmadpiracha" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://twitter.com/ahmadpiracha3" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:ahmadpiracha11@gmail.com">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
