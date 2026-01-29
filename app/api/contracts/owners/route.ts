import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET() {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const ownersData = await prisma.owners.findMany({
      where: {
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        profile_thumb: true
      }
    })

    // Transform to ComboBoxitemsType format
    const owners = ownersData.map(owner => ({
      id: owner.id,
      label: owner.last_name
        ? `${owner.first_name} ${owner.last_name}`
        : owner.first_name,
      avatar: owner.profile_thumb || undefined
    }))

    return NextResponse.json({ owners })
  } catch (error: any) {
    console.error('Error fetching owners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch owners' },
      { status: 500 }
    )
  }
}
