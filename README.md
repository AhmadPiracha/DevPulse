# DevPulse: Developer-Focused Tech News Aggregator

![DevPulse Logo](public/placeholder.svg?height=100&width=100&query=DevPulse%20Logo)

DevPulse is a modern, developer-focused tech news aggregator designed to help busy engineers stay updated with the most important news without getting overwhelmed. It curates and summarizes content from various trusted sources like Hacker News, GitHub Trending, and Dev.to, delivering essential updates directly to your feed and inbox.

## ✨ Features

*   **Smart Curation**: AI-powered curation to filter noise and highlight relevant tech news.
*   **Time-Saving Summaries**: Get key points of articles in 2-3 sentences.
*   **Multiple Sources**: Aggregates content from Hacker News, GitHub Trending, and Dev.to.
*   **Daily Digest**: Optional daily newsletter delivery of top stories to your inbox.
*   **User Authentication**: Secure sign-up and sign-in with email/password.
*   **Saved Articles**: Users can save articles for later reading.
*   **Admin Panel**: Dedicated section for administrators to manage articles, view stats, and trigger newsletter sends.
*   **Responsive Design**: Optimized for both desktop and mobile devices.
*   **Theme Toggle**: Switch between light and dark modes.

## 🚀 Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components, Server Actions)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
*   **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas)
*   **Authentication**: JWT (JSON Web Tokens)
*   **AI Summaries (Optional)**: [OpenAI API](https://openai.com/docs/api/) via [AI SDK](https://sdk.vercel.ai/) [^3]
*   **Email Service (Optional)**: [Resend](https://resend.com/)
*   **Deployment**: [Vercel](https://vercel.com/)

## ⚙️ Getting Started

Follow these steps to set up and run DevPulse locally.

### Prerequisites

*   Node.js (v18.x or higher)
*   npm or yarn
*   MongoDB Atlas account (or a local MongoDB instance)
*   (Optional) OpenAI API Key for AI summaries
*   (Optional) Resend API Key for newsletters

### Installation

1.  **Clone the repository:**

    \`\`\`bash
    git clone <your-repository-url>
    cd devpulse
    \`\`\`

2.  **Install dependencies:**

    \`\`\`bash
    npm install
    # or
    yarn install
    \`\`\`

### Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables. You can copy the content from `.env.local.example`:

```plaintext
# Copy this file to .env.local and fill in your values

# MongoDB Connection String (Required)
# Make sure to replace <username>, <password>, and <cluster-url>
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/devpulse?retryWrites=true&w=majority&appName=devpulse

# JWT Secret for Authentication (Required)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# OpenAI API Key for AI Summaries (Optional)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Resend API Key for Newsletters (Optional)
RESEND_API_KEY=re_your_resend_api_key_here

# Admin Email (Required)
NEXT_PUBLIC_ADMIN_EMAIL=your-admin-email@example.com
