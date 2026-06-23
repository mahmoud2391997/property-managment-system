'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()
    if (error) return error

    if (!hasPermission(permissions, 'leases.access'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { propertyId: leaseId } = await params

    // Verify lease exists and belongs to organization
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id,
        status: 'Current'
      },
      select: {
        id: true
      }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found or not active' },
        { status: 404 }
      )
    }

    // Check for existing scheduled lease end
    const existingSchedule = await prisma.lease_end_schedule.findFirst({
      where: {
        lease_id: leaseId,
        status: 'Current'
      },
      select: {
        id: true,
        scheduled_date: true
      }
    })

    return NextResponse.json({
      existingSchedule: existingSchedule
        ? {
            id: existingSchedule.id,
            scheduledDate: existingSchedule.scheduled_date
          }
        : null
    })
  } catch (error: any) {
    console.error('Error fetching lease end info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lease end info' },
      { status: 500 }
    )
  }
}
