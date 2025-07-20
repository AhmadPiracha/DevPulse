# DevPulse

DevPulse is your personalized hub for staying updated with the latest in tech news and development. It aggregates articles from various sources, allowing you to customize your feed, save articles for later, and track your reading progress.

## Features

-   **Personalized News Feed**: Tailor your feed by selecting preferred sources and tags.
-   **Save for Later**: Bookmark articles to read at your convenience.
-   **Reading Progress**: Track how much of an article you've read.
-   **User Authentication**: Securely manage your account with email verification and password reset.
-   **Responsive Design**: Access DevPulse seamlessly on any device.
-   **Newsletter**: Subscribe to a daily digest of top tech articles.

## Technologies Used

-   **Next.js 14**: React framework for production.
-   **React Server Components (RSCs)**: For improved performance and SEO.
-   **TypeScript**: For type safety.
-   **Tailwind CSS**: For rapid UI development.
-   **shadcn/ui**: Reusable UI components.
-   **MongoDB**: NoSQL database for data storage.
-   **Resend**: For sending transactional emails (email verification, password reset, newsletters).
-   **Vercel**: Deployment platform.

## Getting Started

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/your-repo/devpulse.git
cd devpulse
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

### 3. Set up Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables:

```plaintext
# MongoDB Connection URI
# Replace with your MongoDB Atlas connection string
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/devpulse?retryWrites=true&w=majority"

# JWT Secret for authentication tokens
JWT_SECRET="your_super_secret_jwt_key_here"

# Resend API Key for email services (verification, password reset)
# Get one from https://resend.com/
RESEND_API_KEY="re_YOUR_RESEND_API_KEY"

# Public URL for your application (used in email links)
# For local development, use http://localhost:3000
# For Vercel deployments, Vercel automatically sets VERCEL_URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Internal API Key for cron jobs or internal services (e.g., newsletter send)
# This should be a strong, randomly generated string.
INTERNAL_API_KEY="your_internal_api_key_for_cron_jobs"
