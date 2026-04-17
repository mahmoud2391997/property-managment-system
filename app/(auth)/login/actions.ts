'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function login(formData: FormData): Promise<string | void> {
  console.log('Login action called')
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('Attempting login with email:', data.email)

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    const status = error.status ?? 0
    const msg = error.message?.toLowerCase() ?? ''

    if (status === 400 && msg.includes('invalid'))
      return 'Invalid email or password'
    if (msg.includes('email not confirmed'))
      return 'Please verify your email before signing in'
    if (status === 429)
      return 'Too many login attempts. Please try again later'
    if (status >= 500)
      return 'Our servers are having issues. Please try again later'

    return 'Something went wrong. Please check your connection and try again'
  }

  const userId = authData.user.id

  console.log('Login successful, user ID:', userId)

  // Check tenant table first
  console.log('Checking tenant table...')
  const tenant = await prisma.tenants.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  console.log('Tenant found:', tenant ? 'Yes' : 'No')

  if (tenant) {
    console.log('Redirecting to /payments')
    revalidatePath('/', 'layout')
    redirect('/payments')
  }

  // Then check staff table
  console.log('Checking staff table...')
  const staff = await prisma.staff.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  console.log('Staff found:', staff ? 'Yes' : 'No')

  if (staff) {
    console.log('Redirecting to /projects')
    revalidatePath('/', 'layout')
    redirect('/projects')
  }

  // User exists in auth but not in either table — something is wrong
  await supabase.auth.signOut()
  return 'There was a problem signing in. Please contact support.'
}

// Keep for backwards compatibility (other files may import this)
export async function tenantLogin(formData: FormData): Promise<string | void> {
  return login(formData)
}
