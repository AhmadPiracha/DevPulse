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

// Hacker News API integration
export async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    console.log("Fetching Hacker News...")

    // Get top stories
    const topStoriesRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json")
    if (!topStoriesRes.ok) {
      throw new Error(`Hacker News API error: ${topStoriesRes.status}`)
    }

    const topStoryIds = await topStoriesRes.json()
    console.log(`Got ${topStoryIds.length} story IDs from Hacker News`)

    // Get first 10 stories (reduced for testing)
    const storyPromises = topStoryIds.slice(0, 10).map(async (id: number) => {
      try {
        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        if (!storyRes.ok) return null
        return storyRes.json()
      } catch (error) {
        console.error(`Error fetching story ${id}:`, error)
        return null
      }
    })

    const stories = await Promise.all(storyPromises)
    const validStories = stories.filter((story) => story && story.url && story.title)

    console.log(`Got ${validStories.length} valid stories from Hacker News`)

    return validStories.map((story) => ({
      title: story.title,
      url: story.url,
      source: "Hacker News",
      author: story.by,
      score: story.score,
      tags: categorizeArticle(story.title),
      summary: `Hacker News story with ${story.score} points by ${story.by}. Click to read more.`,
      sourceIcon: "🔥",
    }))
  } catch (error) {
    console.error("Error fetching Hacker News:", error)
    return []
  }
}

// GitHub Trending integration
export async function fetchGitHubTrending(): Promise<NewsItem[]> {
  try {
    console.log("Fetching GitHub trending...")

    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const dateString = lastWeek.toISOString().split("T")[0]

    const response = await fetch(
      `https://api.github.com/search/repositories?q=created:>${dateString}&sort=stars&order=desc&per_page=10`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "DevPulse-App",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Got ${data.items?.length || 0} repositories from GitHub`)

    return (data.items || []).map((repo: any) => ({
      title: `${repo.name}: ${repo.description || "No description"}`,
      url: repo.html_url,
      source: "GitHub",
      author: repo.owner.login,
      score: repo.stargazers_count,
      tags: repo.topics?.slice(0, 3) || ["GitHub", "Repository"],
      summary: `GitHub repository with ${repo.stargazers_count} stars. ${repo.description || "No description available."}`,
      sourceIcon: "🐙",
    }))
  } catch (error) {
    console.error("Error fetching GitHub trending:", error)
    return []
  }
}

// Dev.to API integration
export async function fetchDevTo(): Promise<NewsItem[]> {
  try {
    console.log("Fetching Dev.to articles...")

    const response = await fetch("https://dev.to/api/articles?top=7&per_page=10")
    if (!response.ok) {
      throw new Error(`Dev.to API error: ${response.status}`)
    }

    const articles = await response.json()
    console.log(`Got ${articles.length} articles from Dev.to`)

    return articles.map((article: any) => ({
      title: article.title,
      url: article.url,
      source: "Dev.to",
      author: article.user.name,
      score: article.public_reactions_count,
      tags: article.tag_list.slice(0, 3),
      summary: `Dev.to article with ${article.public_reactions_count} reactions. ${article.description || "Click to read more."}`,
      sourceIcon: "💎",
    }))
  } catch (error) {
    console.error("Error fetching Dev.to:", error)
    return []
  }
}

// TechCrunch API integration
export async function fetchTechCrunch(): Promise<NewsItem[]> {
  try {
    console.log("Fetching TechCrunch articles...")

    const response = await fetch("https://techcrunch.com/wp-json/wp/v2/posts?per_page=5")
    if (!response.ok) {
      throw new Error(`TechCrunch API error: ${response.status}`)
    }

    const articles = await response.json()
    console.log(`Got ${articles.length} articles from TechCrunch`)

    return articles.map((article: any) => ({
      title: article.title.rendered,
      url: article.link,
      source: "TechCrunch",
      author: article._embedded.author[0].name,
      score: null, // TechCrunch does not provide a score
      tags: categorizeArticle(article.title.rendered),
      summary: article.excerpt.rendered,
      sourceIcon: "🚀",
    }))
  } catch (error) {
    console.error("Error fetching TechCrunch:", error)
    return []
  }
}

// The Verge RSS feed integration
export async function fetchTheVerge(): Promise<NewsItem[]> {
  try {
    console.log("Fetching The Verge articles...")

    const response = await fetch("https://www.theverge.com/rss/index.xml")
    if (!response.ok) {
      throw new Error(`The Verge API error: ${response.status}`)
    }

    const xml = await response.text()
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, "application/xml")

    const items = xmlDoc.getElementsByTagName("item")
    console.log(`Got ${items.length} articles from The Verge`)

    return Array.from(items).map((item) => ({
      title: item.getElementsByTagName("title")[0].childNodes[0].nodeValue,
      url: item.getElementsByTagName("link")[0].childNodes[0].nodeValue,
      source: "The Verge",
      author: null, // The Verge does not provide author information in RSS feed
      score: null, // The Verge does not provide a score
      tags: categorizeArticle(item.getElementsByTagName("title")[0].childNodes[0].nodeValue),
      summary: item.getElementsByTagName("description")[0].childNodes[0].nodeValue,
      sourceIcon: "📱",
    }))
  } catch (error) {
    console.error("Error fetching The Verge:", error)
    return []
  }
}

// Simple categorization based on keywords
function categorizeArticle(title: string): string[] {
  const categories = {
    JavaScript: ["javascript", "js", "node", "react", "vue", "angular", "typescript"],
    AI: ["ai", "machine learning", "ml", "gpt", "openai", "artificial intelligence"],
    Python: ["python", "django", "flask", "pandas"],
    "Web Development": ["web", "frontend", "backend", "css", "html"],
    DevOps: ["docker", "kubernetes", "aws", "cloud", "deployment"],
    Mobile: ["mobile", "ios", "android", "react native", "flutter"],
    Startups: ["startup", "funding", "vc", "entrepreneur"],
    Security: ["security", "vulnerability", "hack", "breach"],
    Database: ["database", "sql", "mongodb", "postgres"],
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

export const newsSourcesSimple = [
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/wp-json/wp/v2/posts?per_page=5", // Example API endpoint
    icon: "🚀",
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml", // RSS feed, would need parsing
    icon: "📱",
  },
]
