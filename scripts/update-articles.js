// Node.js script for automated article fetching
// Run with: node scripts/update-articles.js

async function updateArticles() {
  try {
    console.log("🔄 Fetching latest articles...")

    const response = await fetch("http://localhost:3000/api/articles", {
      method: "POST",
    })

    const result = await response.json()

    if (response.ok) {
      console.log("✅ Articles updated successfully!")
      console.log(`📊 Inserted: ${result.inserted}, Modified: ${result.modified}`)
      console.log(`📰 Total processed: ${result.total} articles`)
    } else {
      console.error("❌ Failed to update articles:", result.error)
    }
  } catch (error) {
    console.error("❌ Error updating articles:", error)
  }
}

async function sendNewsletter() {
  try {
    console.log("📧 Sending daily newsletter...")

    const response = await fetch("http://localhost:3000/api/newsletter/send", {
      method: "POST",
    })

    const result = await response.json()

    if (response.ok) {
      console.log("✅ Newsletter sent successfully!")
      console.log(`📊 Sent to ${result.subscriberCount} subscribers`)
      console.log(`📰 Featured ${result.articleCount} articles`)
    } else {
      console.error("❌ Failed to send newsletter:", result.error)
    }
  } catch (error) {
    console.error("❌ Error sending newsletter:", error)
  }
}

// Run both functions
async function main() {
  await updateArticles()
  await sendNewsletter()
}

main()
