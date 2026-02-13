'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function login(formData: FormData): Promise<string | void> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return 'Invalid email or password'
  }

  const userId = authData.user.id

  // Check tenant table first
  const tenant = await prisma.tenants.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (tenant) {
    revalidatePath('/', 'layout')
    redirect('/payments')
  }

  // Then check staff table
  const staff = await prisma.staff.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (staff) {
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
