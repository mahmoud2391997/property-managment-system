'use server'

import { redirect } from 'next/navigation'

export async function login(formData: FormData): Promise<string | void> {
  // Demo mode: Direct login without credentials
  // Get the user type from form data if provided
  const userType = formData.get('userType') as string

  if (userType === 'staff') {
    redirect('/dashboard')
  }

  // Default to tenant
  redirect('/rentals')
}

// Keep for backwards compatibility (other files may import this)
export async function tenantLogin(formData: FormData): Promise<string | void> {
  return login(formData)
}
