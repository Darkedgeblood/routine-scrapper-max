import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// True once both environment variables are set. Without them the app still builds and runs;
// the account sheet just explains that accounts are not set up yet.
export const isSupabaseConfigured = Boolean(url && anonKey)

// The anon key is public by design. Row Level Security in supabase/schema.sql is what keeps
// each person's reminders and profile private.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
