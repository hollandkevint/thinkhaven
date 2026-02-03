import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'

// Lazy initialization to avoid build-time errors
let _supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient | null {
  if (!_supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Return null during build/SSG when env vars not available
    if (!supabaseUrl || !supabaseAnonKey) {
      if (typeof window === 'undefined') {
        // Server-side during build - return null silently
        return null
      }
      throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }

    _supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  return _supabaseClient
}

// Export with getter to maintain backward compatibility
// Returns null-safe proxy during SSG/build
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    if (!client) {
      // Return no-op functions during build
      return () => Promise.resolve({ data: null, error: null })
    }
    return client[prop as keyof SupabaseClient]
  }
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          created_at: string
          updated_at: string
          chat_context: Array<Record<string, unknown>>
          canvas_elements: Array<Record<string, unknown>>
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description: string
          created_at?: string
          updated_at?: string
          chat_context?: Array<Record<string, unknown>>
          canvas_elements?: Array<Record<string, unknown>>
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          created_at?: string
          updated_at?: string
          chat_context?: Array<Record<string, unknown>>
          canvas_elements?: Array<Record<string, unknown>>
        }
      }
      user_workspace: {
        Row: {
          user_id: string
          workspace_state: Record<string, unknown>
          updated_at: string
        }
        Insert: {
          user_id: string
          workspace_state?: Record<string, unknown>
          updated_at?: string
        }
        Update: {
          user_id?: string
          workspace_state?: Record<string, unknown>
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}