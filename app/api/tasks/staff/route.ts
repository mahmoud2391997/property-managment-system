'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only staff can access this
    const currentStaff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    if (!currentStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
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
