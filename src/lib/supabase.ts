import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  )
}

/**
 * Supabase client pinned to the isolated `daily_dashboard` schema so this app's
 * data stays separate from anything else in the project.
 */
export const supabase = createClient(url, anonKey, {
  db: { schema: 'daily_dashboard' },
  auth: { persistSession: false },
})
