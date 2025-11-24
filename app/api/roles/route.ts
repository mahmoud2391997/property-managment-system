import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { NextResponse } from 'next/server'

export async function GET () {
  try {
    const { user, staff, error } = await getUserAndStaff()

    if (error) return error

    // Get all roles for the organization
    const roles = await prisma.roles.findMany({
      where: {
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        title: true
      },
      orderBy: {
        title: 'asc'
      }
    })

    return NextResponse.json(
      {
        success: true,
        roles
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}
