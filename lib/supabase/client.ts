import { createClient } from '@supabase/supabase-js';

// 1. We grab the keys from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 2. We check to make sure the keys actually exist to prevent silent crashes
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL ERROR: Supabase environment variables are missing.");
}

// 3. We create and export the connection so any page can use it
export const supabase = createClient(supabaseUrl, supabaseAnonKey);