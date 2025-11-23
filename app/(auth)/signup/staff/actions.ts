'use server'

import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData): Promise<{ error?: string } | void> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirm_password = formData.get('confirm_password') as string

  // Validation
  if (!email.trim()) {
    return { error: 'Email is required' }
  }

  if (password !== confirm_password) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  // Create user in auth.users table only
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/confirm`,
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  return {}
}
