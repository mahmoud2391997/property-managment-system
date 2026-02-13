import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')

  // Use the Host header to build the real origin the browser is on
  const host = request.headers.get('host') || request.nextUrl.host
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const origin = `${protocol}://${host}`

  const redirectTo = (path: string) => NextResponse.redirect(`${origin}${path}`)

  if (!code) {
    console.log('[auth/callback] No code parameter')
    return redirectTo('/login')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.log('[auth/callback] exchangeCodeForSession error:', error.message)
    return redirectTo('/login')
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.log('[auth/callback] No user after session exchange')
    return redirectTo('/login')
  }

  console.log('[auth/callback] User authenticated:', user.id, user.email)

  // Check tenant table first
  const tenant = await prisma.tenants.findUnique({
    where: { id: user.id },
    select: { id: true },
  })

  if (tenant) {
    console.log('[auth/callback] Found tenant, redirecting to /payments')
    return redirectTo('/payments')
  }

  // Then check staff table
  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { id: true },
  })

  if (staff) {
    console.log('[auth/callback] Found staff, redirecting to /projects')
    return redirectTo('/projects')
  }

  // User exists in auth but not in either table
  console.log('[auth/callback] User not found in tenant or staff table, signing out')
  await supabase.auth.signOut()
  return redirectTo('/login?error=no_account')
}
