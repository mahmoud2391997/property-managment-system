import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { hasPermission } from '@/lib/has-permission'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect root path to the frontend demo
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/demo'
    return NextResponse.redirect(url)
  }

  // Bypass all middleware logic and Supabase client initialization for demo routes
  if (pathname.startsWith('/demo')) {
    return NextResponse.next({ request })
  }

  // If Supabase keys are missing, redirect non-public routes to demo and let public routes pass through
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const publicPaths = ['/login', '/signup', '/confirm', '/error', '/forgot-password', '/reset-password', '/setup-password', '/migrate']
    const isPublic = publicPaths.some(path => pathname.startsWith(path))
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/demo'
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,

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
    '/migrate',
    '/unauthorized'
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

  // Helper: clear all Supabase auth cookies and redirect to /unauthorized
  const redirectToUnauthorized = () => {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    const response = NextResponse.redirect(url)
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
      }
    })
    return response
  }

  // Sidebar menu order for staff (mirrors app-sidebar.tsx)
  const staffMenuOrder = [
    { path: '/dashboard', permission: 'dashboard.access' },
    { path: '/projects', permission: 'projects.access' },
    { path: '/properties', permission: 'properties.access' },
    { path: '/rooms', permission: 'rooms.access' },
    { path: '/payments', permission: 'payments.access' },
    { path: '/expenses', permission: 'expenses.access' },
    { path: '/tenants', permission: 'tenants.access' },
    { path: '/owners', permission: 'owners.access' },
    { path: '/agents', permission: 'agents.access' },
    { path: '/vendors', permission: 'vendors.access' },
    { path: '/staff', permission: 'staff.access' },
    { path: '/tenant_screening', permission: 'tenant_screening.access' },
    { path: '/tickets', permission: 'tickets.access' },
    { path: '/tasks', permission: 'tasks.access' },
    { path: '/notices', permission: 'notices.access' },
    { path: '/notifications', permission: 'notifications.access' },
    { path: '/reports', permission: 'reports.access' },
  ]

  // Determine user type from user_metadata (set during login)
  // Fallback to DB for users who logged in before metadata was added
  const getUserType = async () => {
    const userType = user?.user_metadata?.user_type
    if (userType === 'tenant') return 'tenant'
    if (userType === 'staff') return 'staff'

    // Fallback: check tenants table
    const { data: tenant } = await supabase.from('tenants').select('id').eq('id', user?.id).maybeSingle()
    if (tenant) return 'tenant'
    return 'staff'
  }

  // Determine home page based on user type and permissions
  const getHomePath = async (): Promise<string> => {
    const userType = await getUserType()
    if (userType === 'tenant') return '/rentals'

    // For staff, find first allowed menu item based on permissions
    // Fetch permissions directly via Supabase REST API
    const { data: staffRow } = await supabase
      .from('staff')
      .select('role_id')
      .eq('id', user?.id)
      .maybeSingle()

    if (staffRow?.role_id) {
      const { data: permRows } = await supabase
        .from('roles_permissions')
        .select('permissions!inner(module, action)')
        .eq('role_id', staffRow.role_id)

      if (permRows) {
        const permissions = new Set<string>(
          permRows.map((p: any) => `${p.permissions.module}.${p.permissions.action}`.trim().toLowerCase())
        )
        const firstAllowed = staffMenuOrder.find(item => permissions.has(item.permission))
        if (firstAllowed) return firstAllowed.path
      }
    }

    return '/dashboard'
  }

  // Prevent going back to auth pages after login
  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = await getHomePath()
    return NextResponse.redirect(url)
  }

  // No user and not on public path or root — redirect to login
  if (!user && !isPublicPath && !isRootPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Root path: redirect to home if logged in, redirect to login if not
  if (isRootPath) {
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = await getHomePath()
      return NextResponse.redirect(url)
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, check permissions
  if (user && !isPublicPath && !isUnauthorizedPage) {
    const userType = await getUserType()

    // Check if user is staff
    if (userType === 'staff') {
      // Staff cannot access tenant-only pages
      const tenantOnlyPaths = ['/rentals']
      const isTenantOnlyPath = tenantOnlyPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
      )
      if (isTenantOnlyPath) {
        return redirectToUnauthorized()
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
          const { data: staffRow } = await supabase
            .from('staff')
            .select('role_id')
            .eq('id', user.id)
            .maybeSingle()

          if (staffRow?.role_id) {
            const { data: permRows } = await supabase
              .from('roles_permissions')
              .select('permissions!inner(module, action)')
              .eq('role_id', staffRow.role_id)

            if (permRows) {
              const userPermissions = new Set<string>(
                permRows.map((p: any) => `${p.permissions.module}.${p.permissions.action}`.trim().toLowerCase())
              )
              if (!hasPermission(userPermissions, permission)) {
                return redirectToUnauthorized()
              }
            }
          }
          break
        }
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
        '/tenant-welcome'
      ]
      const isAllowedForTenant =
        tenantAllowedPaths.some(path =>
          request.nextUrl.pathname.startsWith(path)
        )

      if (!isAllowedForTenant) {
        return redirectToUnauthorized()
      }
    }
  }

  // Migrate path: redirect logged-in users away
  if (user && isMigratePath) {
    const url = request.nextUrl.clone()
    url.pathname = await getHomePath()
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
