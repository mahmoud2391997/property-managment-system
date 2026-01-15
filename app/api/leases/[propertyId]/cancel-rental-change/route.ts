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
        monthly_rent: true,
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

    // Find the scheduled change
    const scheduledChange = await prisma.scheduled_rental_changes.findFirst({
      where: {
        lease_id: leaseId,
        status: 'Scheduled'
      }
    })

    if (!scheduledChange) {
      return NextResponse.json(
        { error: 'No scheduled rental change found' },
        { status: 404 }
      )
    }

    // Use transaction to update status and send notification
    await prisma.$transaction(async (tx) => {
      // Update status to Cancelled
      await tx.scheduled_rental_changes.update({
        where: {
          id: scheduledChange.id
        },
        data: {
          status: 'Cancelled'
        }
      })

      // Send notification to tenant
      const tenantUserId = lease.tenants.id
      const newRent = Number(scheduledChange.new_monthly_rent)
      const effectiveDateFormatted = scheduledChange.effective_from.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
      })

      const pageUrl = `rentals?reference_id=${lease.reference_id}`

      await tx.notifications.create({
        data: {
          organization_id: staff.organization_id,
          user_id: tenantUserId,
          title: 'Rental Change Cancelled',
          message: `The scheduled rental change to RM ${newRent.toFixed(2)} effective ${effectiveDateFormatted} has been cancelled. Your rent will remain at RM ${Number(lease.monthly_rent).toFixed(2)}.`,
          reference_id: scheduledChange.id,
          reference_type: 'scheduled_rental_change',
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
      message: 'Scheduled rental change cancelled'
    })
  } catch (error: any) {
    console.error('Error cancelling rental change:', error)
    return NextResponse.json(
      { error: 'Failed to cancel rental change' },
      { status: 500 }
    )
  }
}
