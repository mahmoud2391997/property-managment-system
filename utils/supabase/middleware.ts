import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
    '/api/webhooks'
  ]
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )
  const isRootPath = request.nextUrl.pathname === '/'
  const isUnauthorizedPage = request.nextUrl.pathname === '/unauthorized'

  if (!user && !isPublicPath && !isRootPath) {
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
        '/unauthorized'
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

  if (user && (isPublicPath || isRootPath)) {
    // Get user type tenant/staff
    const userType = user.user_metadata?.user_type

    if (userType === 'staff') {
      const url = request.nextUrl.clone()
      url.pathname = '/projects'
      return NextResponse.redirect(url)
    } else if (userType === 'tenant') {
      const url = request.nextUrl.clone()
      url.pathname = '/rentals'
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
