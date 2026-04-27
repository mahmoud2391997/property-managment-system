import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function updateSession (request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll () {
          return request.cookies.getAll()
        },
        setAll (cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  const publicPaths = [
    '/login',
    '/signup',
    '/confirm',
    '/error',
    '/forgot-password',
    '/reset-password',
    '/setup-password',
    '/api/auth',
    '/api/webhooks',
    '/migrate'
  ]
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )
  const authPaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/setup-password'
  ]
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )
  const isRootPath = request.nextUrl.pathname === '/'
  const isMigratePath = request.nextUrl.pathname === '/migrate'
  const isUnauthorizedPage = request.nextUrl.pathname === '/unauthorized'

  // Prevent going back to auth pages after login.
  if (user && isAuthPath) {
    const userType = user.user_metadata?.user_type
    if (userType === 'staff' || userType === 'tenant') {
      const url = request.nextUrl.clone()
      url.pathname = userType === 'staff' ? '/projects' : '/payments'
      return NextResponse.redirect(url)
    }
  }

  if (!user && !isPublicPath) {
    // no user, redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, check permissions
  if (user && !isPublicPath && !isUnauthorizedPage) {
    const userType = user.user_metadata?.user_type
    const isOnboardingPath = request.nextUrl.pathname.startsWith('/onboarding')

    // Check if user is staff
    if (userType === 'staff') {
      const { data: staff } = await supabase
        .from('staff')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      const hasOrganization = staff && staff.organization_id

      // If no organization, redirect to onboarding (unless already there)
      if (!hasOrganization && !isOnboardingPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }

      // If has organization but trying to access onboarding, redirect away
      if (hasOrganization && isOnboardingPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/projects'
        return NextResponse.redirect(url)
      }

      
      // Staff cannot access tenant-only pages
      const tenantOnlyPaths = ['/rentals']
      const isTenantOnlyPath = tenantOnlyPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
      )
      if (isTenantOnlyPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        return NextResponse.redirect(url)
      }

      // Staff permission checks
      const pathPermissionMap: Record<string, string> = {
        '/properties': 'properties.access',
        '/bookings': 'bookings.access',
        '/leases': 'leases.access',
        '/tasks': 'tasks.access',
        '/tickets': 'tickets.access',
        '/expenses': 'expenses.access',
        '/payments': 'payments.access',
        '/tenants': 'tenants.access',
        '/staff': 'staff.access',
        '/agents': 'agents.access',
        '/owners': 'owners.access',
        '/vendors': 'vendors.access',
        '/projects': 'projects.access',
        '/rooms': 'rooms.access',
        '/reports': 'reports.access',
        '/notices': 'notices.access',
        '/contracts': 'contracts.access',
        '/notifications': 'notifications.access',
        '/views': 'views.access',
        '/staff/roles': 'roles.access',
        '/tenant_screening': 'tenant_screening.access',
        '/recurring': 'recurring.access',
      }

      for (const [path, permission] of Object.entries(pathPermissionMap)) {
        if (request.nextUrl.pathname.startsWith(path)) {
          const { permissions } = await getUserAndStaff()
          if (permissions && !hasPermission(permissions, permission)) {
            const url = request.nextUrl.clone()
            url.pathname = '/unauthorized'
            return NextResponse.redirect(url)
          }
          break
        }
      }
    } else {
      // Non-staff users cannot access onboarding
      if (isOnboardingPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        return NextResponse.redirect(url)
      }
    }

    // Check if user is tenant trying to access restricted pages
    if (userType === 'tenant') {
      const tenantAllowedPaths = [
        '/rentals',
        '/payments',
        '/tickets',
        '/notifications',
        '/api',
        '/unauthorized',
        '/tenant-welcome'
      ]
      const isRootPath = request.nextUrl.pathname === '/'
      const isAllowedForTenant =
        isRootPath ||
        tenantAllowedPaths.some(path =>
          request.nextUrl.pathname.startsWith(path)
        )

      if (!isAllowedForTenant) {
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        return NextResponse.redirect(url)
      }
    }
  }

  if (user && (isRootPath || isMigratePath)) {
    // Get user type tenant/staff
    const userType = user.user_metadata?.user_type

    if (userType === 'staff') {
      const url = request.nextUrl.clone()
      url.pathname = '/projects'
      return NextResponse.redirect(url)
    } else if (userType === 'tenant') {
      const url = request.nextUrl.clone()
      url.pathname = '/payments'
      return NextResponse.redirect(url)
    } else {
      // No valid user type detected, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
