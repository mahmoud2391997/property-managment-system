'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function tenantLogin(formData: FormData): Promise<string | void> {
  const supabase = await createClient()

  const data = {
    email: formData.get('username') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return 'Invalid email or password'
  }

  // Check if user_type is tenant
  const userType = authData.user?.user_metadata?.user_type

  if (userType === 'staff') {
    // Sign out the user since they're on the wrong login page
    await supabase.auth.signOut()
    return 'This email is registered as a staff account. Please use the staff login page.'
  }

  if (userType !== 'tenant') {
    // Sign out the user if user_type is not set or invalid
    await supabase.auth.signOut()
    return 'Invalid email or password'
  }

  revalidatePath('/', 'layout')
  redirect('/payments')
}
