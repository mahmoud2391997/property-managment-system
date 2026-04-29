import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'leases.end'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { leaseId } = await params

    // Verify lease exists and belongs to the organization
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        status: true,
        property_id: true,
        room_id: true
      }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      )
    }

    // Check if lease is already ended
    if (lease.status === 'Ended') {
      return NextResponse.json(
        { error: 'Lease is already ended' },
        { status: 400 }
      )
    }

    // Update lease status to Ended, cancel pending payments, and close tickets
    await prisma.$transaction(async (tx) => {
      // Update lease status
      await tx.leases.update({
        where: { id: leaseId },
        data: { status: 'Ended' }
      })

      // Deactivate all recurring configs for this lease
      await tx.recurring_configs.updateMany({
        where: {
          lease_id: leaseId,
          is_active: true
        },
        data: {
          is_active: false
        }
      })

      // Cancel all pending payments for this lease
      await tx.payments.updateMany({
        where: {
          lease_id: leaseId,
          status: 'Pending'
        },
        data: {
          status: 'Cancelled'
        }
      })

      // Get all open tickets for this lease (not already closed)
      const openTickets = await tx.tickets.findMany({
        where: {
          lease_id: leaseId,
          ticket_statuses: {
            none: {
              state: 'Closed'
            }
          }
        },
        select: { id: true }
      })

      // Close all open tickets by adding a Closed status
      if (openTickets.length > 0) {
        await tx.ticket_statuses.createMany({
          data: openTickets.map(ticket => ({
            ticket_id: ticket.id,
            state: 'Closed',
            performer_type: 'system',
            performer_id: null
          }))
        })
      }

      // Update property/room status to Pending_Inspection
      if (lease.room_id) {
        // This is a room lease - update room status
        await tx.rooms.update({
          where: { id: lease.room_id },
          data: { status: 'Pending_Inspection' }
        })
      } else {
        // This is a property lease - update property status
        await tx.properties.update({
          where: { id: lease.property_id },
          data: { status: 'Pending_Inspection' }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Lease ended successfully'
    })
  } catch (error: any) {
    console.error('Error ending lease:', error)
    return NextResponse.json(
      { error: 'Failed to end lease' },
      { status: 500 }
    )
  }
}
