'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only staff can cancel assignment requests
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Only staff can cancel assignment requests' }, { status: 403 })
    }

    // Get current staff's name for event
    const currentStaff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { first_name: true, last_name: true, profile_pic: true }
    })

    const body = await request.json()
    const { ticketId, expectedStatus } = body

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 })
    }

    // Find the latest assignment for this ticket
    const latestAssignment = await prisma.ticket_assignments.findFirst({
      where: {
        ticket_id: ticketId
      },
      orderBy: { requested_at: 'desc' },
      include: {
        tickets: {
          select: { organization_id: true }
        },
        staff_ticket_assignments_assigned_idTostaff: {
          select: { first_name: true, last_name: true }
        },
        staff_ticket_assignments_assigner_idTostaff: {
          select: { first_name: true, last_name: true }
        }
      }
    })

    if (!latestAssignment) {
      return NextResponse.json({ error: 'No assignment found' }, { status: 404 })
    }

    // Check if assignment status has changed (stale state detection)
    if (expectedStatus && latestAssignment.status !== expectedStatus) {
      return NextResponse.json({
        error: 'Assignment has been updated by another staff member',
        code: 'STALE_STATE'
      }, { status: 409 })
    }

    // Check if assignment is still pending
    if (latestAssignment.status !== 'Pending') {
      return NextResponse.json({
        error: 'Assignment has been updated by another staff member',
        code: 'STALE_STATE'
      }, { status: 409 })
    }

    // Verify same organization
    if (latestAssignment.tickets.organization_id !== staff.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // The assigned staff cannot cancel - they should reject instead
    if (latestAssignment.assigned_id === staff.id) {
      return NextResponse.json({ error: 'You cannot cancel your own assignment request. Use reject instead.' }, { status: 403 })
    }

    const isAssignerCancelling = latestAssignment.assigner_id === staff.id

    // Get ticket info for notification
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: { reference_id: true, title: true, organization_id: true }
    })

    // Update assignment status to Cancelled and create notifications
    await prisma.$transaction(async tx => {
      await tx.ticket_assignments.update({
        where: { id: latestAssignment.id },
        data: {
          status: 'Cancelled',
          cancelled_at: new Date(),
          cancelled_by: staff.id
        }
      })

      // Create notifications
      if (isAssignerCancelling) {
        // Assigner cancelled → notify assigned only
        await tx.notifications.create({
          data: {
            organization_id: ticket!.organization_id,
            user_id: latestAssignment.assigned_id,
            title: 'Assignment Request Cancelled',
            message: `has cancelled the assignment request for ticket #${ticket!.reference_id}: "${ticket!.title}"`,
            reference_id: ticketId,
            reference_type: 'tickets',
            performer_id: staff.id,
            performer_type: 'staff',
            page: 'tickets'
          }
        })
      } else {
        // Someone else cancelled → notify both assigner and assigned
        await tx.notifications.createMany({
          data: [
            {
              organization_id: ticket!.organization_id,
              user_id: latestAssignment.assigned_id,
              title: 'Assignment Request Cancelled',
              message: `has cancelled the assignment request for ticket #${ticket!.reference_id}: "${ticket!.title}"`,
              reference_id: ticketId,
              reference_type: 'tickets',
              performer_id: staff.id,
              performer_type: 'staff',
              page: 'tickets'
            },
            {
              organization_id: ticket!.organization_id,
              user_id: latestAssignment.assigner_id,
              title: 'Assignment Request Cancelled',
              message: `has cancelled your assignment request for ticket #${ticket!.reference_id}: "${ticket!.title}"`,
              reference_id: ticketId,
              reference_type: 'tickets',
              performer_id: staff.id,
              performer_type: 'staff',
              page: 'tickets'
            }
          ]
        })
      }
    })

    // Build events for optimistic UI update
    const assignerStaff = latestAssignment.staff_ticket_assignments_assigner_idTostaff
    const assignedStaff = latestAssignment.staff_ticket_assignments_assigned_idTostaff

    const assignerName = assignerStaff
      ? `${assignerStaff.first_name} ${assignerStaff.last_name || ''}`.trim()
      : 'Unknown'
    const assignedName = assignedStaff
      ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
      : 'Unknown'
    const cancelledByName = currentStaff
      ? `${currentStaff.first_name} ${currentStaff.last_name || ''}`.trim()
      : 'Unknown'

    const events: any[] = [
      {
        type: 'assignment_cancelled',
        assignerName,
        assignedName,
        cancelledByName,
        cancelledByAvatar: currentStaff?.profile_pic || undefined,
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json({ success: true, events })
  } catch (error: any) {
    console.error('Error cancelling assignment request:', error)
    return NextResponse.json({ error: 'Failed to cancel assignment request' }, { status: 500 })
  }
}
