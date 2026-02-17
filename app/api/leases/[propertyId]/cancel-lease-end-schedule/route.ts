'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { propertyId: leaseId } = await params

    // Verify lease exists and belongs to organization
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        reference_id: true,
        tenants: {
          select: {
            id: true
          }
        }
      }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      )
    }

    // Find the current schedule
    const schedule = await prisma.lease_end_schedule.findFirst({
      where: {
        lease_id: leaseId,
        status: 'Current'
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'No scheduled lease end found' },
        { status: 404 }
      )
    }

    // Use transaction to update status and send notification
    await prisma.$transaction(async (tx) => {
      // Update status to Cancelled
      await tx.lease_end_schedule.update({
        where: {
          id: schedule.id
        },
        data: {
          status: 'Cancelled',
          cancelled_by: staff.id,
          cancelled_at: new Date()
        }
      })

      // Send notification to tenant
      const tenantUserId = lease.tenants.id
      const formattedDate = schedule.scheduled_date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      const pageUrl = `rentals?reference_id=${lease.reference_id}`

      await tx.notifications.create({
        data: {
          organization_id: staff.organization_id,
          user_id: tenantUserId,
          title: 'Planned Checkout Cancelled',
          message: `The planned checkout scheduled for ${formattedDate} has been cancelled.`,
          reference_id: schedule.id,
          reference_type: 'lease_end_schedule',
          performer_id: null,
          performer_type: 'system',
          page: pageUrl,
          affected_type: 'tenant',
          affected_id: tenantUserId
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Scheduled lease end cancelled'
    })
  } catch (error: any) {
    console.error('Error cancelling lease end schedule:', error)
    return NextResponse.json(
      { error: 'Failed to cancel lease end schedule' },
      { status: 500 }
    )
  }
}
