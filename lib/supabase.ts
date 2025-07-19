import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string
          title: string
          summary: string
          url: string
          source: string
          tags: string[]
          created_at: string
          updated_at: string
          score: number
          author: string | null
        }
        Insert: {
          id?: string
          title: string
          summary: string
          url: string
          source: string
          tags: string[]
          created_at?: string
          updated_at?: string
          score?: number
          author?: string | null
        }
        Update: {
          id?: string
          title?: string
          summary?: string
          url?: string
          source?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
          score?: number
          author?: string | null
        }
      }
      saved_articles: {
        Row: {
          id: string
          user_id: string
          article_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string
          created_at?: string
        }
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          subscribed_at: string
          active: boolean
        }
        Insert: {
          id?: string
          email: string
          subscribed_at?: string
          active?: boolean
        }
        Update: {
          id?: string
          email?: string
          subscribed_at?: string
          active?: boolean
        }
      }
    }
  }
}
