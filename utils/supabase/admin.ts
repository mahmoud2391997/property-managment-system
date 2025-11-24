import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client
 * Uses service role key for admin operations like creating users
 * ⚠️ ONLY use in server-side code (API routes, server components with caution)
 * This bypasses Row Level Security
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
