import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import OnboardingClient from './onboarding-client'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (userError || !user) {
    redirect('/login')
  }

  // Check if user_type is staff
  const userType = user.user_metadata?.user_type

  // If not staff, redirect to appropriate login page
  if (userType !== 'staff') {
    redirect('/login')
  }

  // Check if staff has organization_id
  const staffRecord = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  // If staff exists and has organization_id, redirect to staff login
  if (staffRecord && staffRecord.organization_id) {
    redirect('/login/staff')
  }

  // If staff doesn't exist OR has no organization_id, allow onboarding
  return <OnboardingClient />
}
