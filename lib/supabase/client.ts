import { createClient, SupabaseClient } from '@supabase/supabase-js'

// These must match your .env.local file exactly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 🛡️ THE FIX: Cache the client globally so Next.js Hot-Reload doesn't spam instances
const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined
}

export const supabase =
  globalForSupabase.supabase ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

// If we are in development mode, save the instance to the global object
if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase
}