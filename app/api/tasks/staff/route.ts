'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function GET() {
  try {
    const { staff: currentStaff, permissions, error } = await getUserAndStaff()
    if (error) return error as NextResponse
    if (!hasPermission(permissions, 'tasks.access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all staff in the organization
    const staffList = await prisma.staff.findMany({
      where: {
        organization_id: currentStaff.organization_id
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        profile_pic: true,
        roles: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        first_name: 'asc'
      }
    })

    const transformedStaff = staffList.map(s => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name || ''}`.trim(),
      avatar: s.profile_pic || undefined,
      role: s.roles?.title || undefined
    }))

    return NextResponse.json(transformedStaff)
  } catch (error: any) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}
