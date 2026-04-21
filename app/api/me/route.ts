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

  // For tenant users, return basic info with no permissions
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email
    },
    staff: null,
    role: 'tenant',
    permissions: []
  })
}
