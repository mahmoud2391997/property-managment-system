import { NextResponse } from 'next/server'
import { getUserType } from '@/utils/getUserType'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET() {
  const { userType, user, organizationId, tenantId, error } = await getUserType()
  if (error) return error

  // For staff users, get permissions and role
  if (userType === 'staff') {
    const { staff, permissions, role } = await getUserAndStaff()
    if (!staff) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      staff: {
        id: staff.id,
        organization_id: staff.organization_id
      },
      role,
      permissions: Array.from(permissions)
    })
  }

  // For tenant users, return tenant-specific permissions
  const tenantPermissions = [
    'tenants.access',
    'tenants.create',
    'tenants.update',
    'tenants.delete',
    'tenants.view_own',
    'tenants.view_lease',
    'tenants.make_payment',
    'tenants.view_property',
    'leases.access',
    'rentals.access',
    'tickets.access',
    'tickets.create',
    'tickets.update',
    'notifications.access',
    'payments.access',
    'payments.make_payment'
  ]

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email
    },
    staff: null,
    role: 'tenant',
    permissions: Array.from(tenantPermissions)
  })
}
