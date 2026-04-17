import { NextResponse } from 'next/server'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET() {
  const { user, staff, permissions, role, error } = await getUserAndStaff()
  if (error) return error

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
