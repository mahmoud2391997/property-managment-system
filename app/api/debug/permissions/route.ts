import { NextResponse } from 'next/server'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET() {
  try {
    const { user, staff, permissions, role, error } = await getUserAndStaff()
    
    if (error) {
      return NextResponse.json({ 
        error: 'Authentication error',
        details: error
      }, { status: 401 })
    }

    // Check for the specific permissions the dashboard needs
    const requiredPermissions = [
      'financial.overview',
      'expenses.access', 
      'rentals.access',
      'payments.access',
      'properties.access'
    ]

    const permissionStatus = requiredPermissions.map(perm => ({
      permission: perm,
      hasPermission: permissions.has(perm)
    }))

    return NextResponse.json({
      user: {
        id: user?.id,
        email: user?.email
      },
      staff: {
        id: staff?.id,
        organization_id: staff?.organization_id
      },
      role,
      totalPermissions: permissions.size,
      allPermissions: Array.from(permissions),
      requiredPermissionStatus: permissionStatus,
      hasAllRequired: requiredPermissions.every(perm => permissions.has(perm))
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
