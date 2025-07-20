export interface NewsItem {
  title: string
  url: string
  source: string
  author?: string
  score?: number
  tags: string[]
  summary?: string
  sourceIcon?: string
}

// This file defines the external news sources that DevPulse will fetch articles from.
// Each source includes a name, a URL to its API or RSS feed, and an icon.
// You can add or remove sources as needed.
export const newsSources = [
  {
    name: "Hacker News",
    url: "https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=10", // Example: Algolia API for Hacker News
    icon: "🔥",
  },
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/wp-json/wp/v2/posts?per_page=10", // Example: WordPress REST API
    icon: "🚀",
  },
  {
    name: "Dev.to",
    url: "https://dev.to/api/articles?per_page=10", // Example: Dev.to API
    icon: "💻",
  },
  {
    name: "Smashing Magazine",
    url: "https://www.smashingmagazine.com/wp-json/wp/v2/posts?per_page=10", // Example: WordPress REST API
    icon: "🎨",
  },
  {
    name: "CSS-Tricks",
    url: "https://css-tricks.com/wp-json/wp/v2/posts?per_page=10", // Example: WordPress REST API
    icon: "💅",
  },
  // Add more sources here
  // {
  //   name: "Example Blog",
  //   url: "https://example.com/api/articles",
  //   icon: "📝",
  // },
]

// Hacker News API integration
export async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    console.log("🔥 Fetching Hacker News top stories...")

    const response = await fetch("https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=10")
    if (!response.ok) {
      throw new Error(`Hacker News API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Got ${data.hits.length} story IDs from Hacker News`)

    const validStories = data.hits.filter((story: any) => story.url && story.title && story.points > 50)

    console.log(`✅ Got ${validStories.length} valid stories from Hacker News`)

    return validStories.map((story: any) => ({
      title: story.title,
      url: story.url,
      source: "Hacker News",
      author: story.author,
      score: story.points,
      tags: categorizeArticle(story.title),
      summary: generateBasicSummary(story.title, story.points, story.author, "Hacker News"),
      sourceIcon: "🔥",
    }))
  } catch (error) {
    console.error("❌ Error fetching Hacker News:", error)
    return []
  }
}

// GitHub Trending integration
export async function fetchGitHubTrending(): Promise<NewsItem[]> {
  try {
    console.log("🐙 Fetching GitHub trending repositories...")

    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const dateString = lastWeek.toISOString().split("T")[0]

    const response = await fetch(
      `https://api.github.com/search/repositories?q=created:>${dateString}&sort=stars&order=desc&per_page=10`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "DevPulse-News-Agregator",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ Got ${data.items?.length || 0} repositories from GitHub`)

    return (data.items || [])
      .filter((repo: any) => repo.stargazers_count > 10)
      .map((repo: any) => ({
        title: `${repo.name}: ${repo.description || "No description"}`,
        url: repo.html_url,
        source: "GitHub",
        author: repo.owner.login,
        score: repo.stargazers_count,
        tags: repo.topics?.slice(0, 3) || ["GitHub", "Repository"],
        summary: generateBasicSummary(repo.name, repo.stargazers_count, repo.owner.login, "GitHub", repo.description),
        sourceIcon: "🐙",
      }))
  } catch (error) {
    console.error("❌ Error fetching GitHub trending:", error)
    return []
  }
}

// Dev.to API integration
export async function fetchDevTo(): Promise<NewsItem[]> {
  try {
    console.log("💎 Fetching Dev.to articles...")

    const response = await fetch("https://dev.to/api/articles?per_page=10")
    if (!response.ok) {
      throw new Error(`Dev.to API error: ${response.status}`)
    }

    const articles = await response.json()
    console.log(`✅ Got ${articles.length} articles from Dev.to`)

    return articles
      .filter((article: any) => article.public_reactions_count > 5)
      .map((article: any) => ({
        title: article.title,
        url: article.url,
        source: "Dev.to",
        author: article.user.name,
        score: article.public_reactions_count,
        tags: article.tag_list.slice(0, 3),
        summary: generateBasicSummary(
          article.title,
          article.public_reactions_count,
          article.user.name,
          "Dev.to",
          article.description,
        ),
        sourceIcon: "💻",
      }))
  } catch (error) {
    console.error("❌ Error fetching Dev.to:", error)
    return []
  }
}

// AI Summary generation using OpenAI (if available) or fallback to basic summary
export async function generateSummary(title: string, url: string): Promise<string> {
  // If OpenAI API key is available, use AI summary
  if (process.env.OPENAI_API_KEY) {
    try {
      const { generateText } = await import("ai")
      const { openai } = await import("@ai-sdk/openai")

      const { text } = await generateText({
        model: openai("gpt-3.5-turbo"),
        prompt: `Summarize this tech article in 2-3 sentences for developers. Focus on key technical points and why it matters.

Title: ${title}
URL: ${url}

Summary:`,
        maxTokens: 150,
      })

      return text.trim()
    } catch (error) {
      console.error("AI summary failed, using basic summary:", error)
      // Fallback to basic summary
      return generateBasicSummary(title, 0, "Unknown", "Tech")
    }
  }

  // Fallback to basic summary if no OpenAI key
  return generateBasicSummary(title, 0, "Unknown", "Tech")
}

// Basic summary generation (free alternative to OpenAI)
function generateBasicSummary(
  title: string,
  score: number,
  author: string,
  source: string,
  description?: string,
): string {
  const templates = {
    "Hacker News": [
      `Popular discussion on Hacker News with ${score} points by ${author}. ${extractKeywords(title)}.`,
      `Trending tech story with ${score} upvotes. Community discussing ${extractKeywords(title)}.`,
      `Hot topic on HN: ${extractKeywords(title)}. ${score} points and active discussion.`,
    ],
    GitHub: [
      `New repository by ${author} with ${score} stars. ${description || extractKeywords(title)}.`,
      `Trending GitHub project: ${extractKeywords(title)}. ${score} developers starred this repo.`,
      `Popular open-source project with ${score} stars. ${description || "Check out this interesting repository."}.`,
    ],
    "Dev.to": [
      `Developer article by ${author} with ${score} reactions. ${description || extractKeywords(title)}.`,
      `Community favorite: ${extractKeywords(title)}. ${score} developers found this helpful.`,
      `Popular dev article with ${score} reactions. ${description || "Worth reading for developers."}.`,
    ],
    TechCrunch: [
      `TechCrunch article by ${author} with ${score} reactions. ${description || extractKeywords(title)}.`,
      `Latest tech news: ${extractKeywords(title)}. ${score} readers found this insightful.`,
      `Hot topic on TechCrunch: ${extractKeywords(title)}. ${score} reactions and discussions.`,
    ],
    "Smashing Magazine": [
      `Smashing Magazine article by ${author} with ${score} reactions. ${description || extractKeywords(title)}.`,
      `Design and web development insights: ${extractKeywords(title)}. ${score} readers found this helpful.`,
      `Popular design article with ${score} reactions. ${description || "Worth reading for designers."}.`,
    ],
    "CSS-Tricks": [
      `CSS-Tricks article by ${author} with ${score} reactions. ${description || extractKeywords(title)}.`,
      `Web design and CSS tips: ${extractKeywords(title)}. ${score} readers found this useful.`,
      `Popular CSS article with ${score} reactions. ${description || "Worth reading for web developers."}.`,
    ],
  }

  const sourceTemplates = templates[source as keyof typeof templates] || templates["Hacker News"]
  const randomTemplate = sourceTemplates[Math.floor(Math.random() * sourceTemplates.length)]

  return randomTemplate
}

// Extract keywords from title for better summaries
function extractKeywords(title: string): string {
  const techKeywords = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "AI",
    "Machine Learning",
    "Docker",
    "Kubernetes",
    "AWS",
    "TypeScript",
    "Vue",
    "Angular",
    "Database",
    "API",
    "Frontend",
    "Backend",
    "DevOps",
    "Security",
    "Blockchain",
    "Web3",
    "Crypto",
    "Ethereum",
    "Bitcoin",
    "DeFi",
    "NFTs",
    "Smart Contracts",
  ]

  const foundKeywords = techKeywords.filter((keyword) => title.toLowerCase().includes(keyword.toLowerCase()))

  if (foundKeywords.length > 0) {
    return `Focuses on ${foundKeywords.slice(0, 2).join(" and ")}`
  }

  // Fallback to first few words
  const words = title.split(" ").slice(0, 4).join(" ")
  return `About ${words}`
}

// Smart categorization based on keywords
function categorizeArticle(title: string): string[] {
  const categories = {
    JavaScript: ["javascript", "js", "node", "react", "vue", "angular", "typescript", "npm", "webpack"],
    AI: ["ai", "machine learning", "ml", "gpt", "openai", "artificial intelligence", "neural", "llm"],
    Python: ["python", "django", "flask", "pandas", "numpy", "pytorch", "tensorflow"],
    "Web Development": ["web", "frontend", "backend", "css", "html", "api", "rest", "graphql"],
    DevOps: ["docker", "kubernetes", "aws", "cloud", "deployment", "ci/cd", "terraform", "ansible"],
    Mobile: ["mobile", "ios", "android", "react native", "flutter", "swift", "kotlin"],
    Startups: ["startup", "funding", "vc", "entrepreneur", "saas", "business"],
    Security: ["security", "vulnerability", "hack", "breach", "auth", "encryption"],
    Database: ["database", "sql", "mongodb", "postgres", "redis", "elasticsearch"],
    Blockchain: ["blockchain", "crypto", "bitcoin", "ethereum", "web3", "nft", "defi", "smart contract", "tokenomics"],
    "Open Source": ["open source", "github", "license", "contribution", "community"],
    Design: ["design", "ui", "ux", "web design", "graphic design"],
  }

  const titleLower = title.toLowerCase()
  const tags: string[] = []

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => titleLower.includes(keyword))) {
      tags.push(category)
    }
  }

  return tags.length > 0 ? tags.slice(0, 3) : ["Tech"]
}
