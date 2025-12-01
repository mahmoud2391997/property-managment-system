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

    // Only staff can respond to assignment requests
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Only staff can respond to assignment requests' }, { status: 403 })
    }

    const body = await request.json()
    const { ticketId, action, expectedStatus } = body // action: 'accept' | 'reject', expectedStatus: current status client expects

    if (!ticketId || !action) {
      return NextResponse.json({ error: 'ticketId and action are required' }, { status: 400 })
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be "accept" or "reject"' }, { status: 400 })
    }

    // Find the latest assignment for this ticket assigned to this staff
    const latestAssignment = await prisma.ticket_assignments.findFirst({
      where: {
        ticket_id: ticketId,
        assigned_id: staff.id
      },
      orderBy: { requested_at: 'desc' },
      include: {
        tickets: {
          select: { id: true, organization_id: true, reference_id: true, title: true }
        },
        staff_ticket_assignments_assigner_idTostaff: {
          select: { id: true, first_name: true, last_name: true }
        }
      }
    })

    if (!latestAssignment) {
      return NextResponse.json({ error: 'No assignment found for you' }, { status: 404 })
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

    const assigner = latestAssignment.staff_ticket_assignments_assigner_idTostaff
    const staffName = `${staff.first_name} ${staff.last_name || ''}`.trim()
    const ticket = latestAssignment.tickets

    if (action === 'accept') {
      // Get current ticket status to avoid duplicate status changes
      const currentStatus = await prisma.ticket_statuses.findFirst({
        where: { ticket_id: ticketId },
        orderBy: { created_at: 'desc' }
      })

      // Accept the assignment and update ticket status
      await prisma.$transaction(async tx => {
        // Update assignment status
        await tx.ticket_assignments.update({
          where: { id: latestAssignment.id },
          data: {
            status: 'Accepted',
            responded_at: new Date()
          }
        })

        // Update ticket status to In_Progress only if not already In_Progress
        if (currentStatus?.state !== 'In_Progress') {
          await tx.ticket_statuses.create({
            data: {
              ticket_id: ticketId,
              state: 'In_Progress',
              performer_type: 'system',
              performer_id: null
            }
          })
        }

        // Notify the assigner that request was accepted
        if (assigner) {
          await tx.notifications.create({
            data: {
              organization_id: ticket.organization_id,
              user_id: assigner.id,
              title: 'Assignment Request Accepted',
              message: `has accepted your assignment request for ticket #${ticket.reference_id}: "${ticket.title}"`,
              reference_id: ticketId,
              reference_type: 'tickets',
              performer_id: staff.id,
              performer_type: 'staff',
              page: 'tickets'
            }
          })
        }
      })

      // Build events for optimistic UI update
      const events: any[] = [
        {
          type: 'assignment_accepted',
          performerName: staffName,
          performerAvatar: staff.profile_pic || undefined,
          createdAt: new Date().toISOString()
        }
      ]

      // If status changed to In_Progress, add that event too
      if (currentStatus?.state !== 'In_Progress') {
        events.push({
          type: 'status_changed',
          performerType: 'system',
          newStatus: 'In Progress',
          createdAt: new Date().toISOString()
        })
      }

      return NextResponse.json({ success: true, status: 'accepted', events })
    } else {
      // Reject the assignment
      await prisma.$transaction(async tx => {
        // Update assignment status
        await tx.ticket_assignments.update({
          where: { id: latestAssignment.id },
          data: {
            status: 'Rejected',
            responded_at: new Date()
          }
        })

        // Notify the assigner that request was rejected
        if (assigner) {
          await tx.notifications.create({
            data: {
              organization_id: ticket.organization_id,
              user_id: assigner.id,
              title: 'Assignment Request Rejected',
              message: `has rejected your assignment request for ticket #${ticket.reference_id}: "${ticket.title}"`,
              reference_id: ticketId,
              reference_type: 'tickets',
              performer_id: staff.id,
              performer_type: 'staff',
              page: 'tickets'
            }
          })
        }
      })

      // Build events for optimistic UI update
      const assignerName = assigner
        ? `${assigner.first_name} ${assigner.last_name || ''}`.trim()
        : 'Unknown'

      const events: any[] = [
        {
          type: 'assignment_rejected',
          performerName: staffName,
          performerAvatar: staff.profile_pic || undefined,
          fromName: assignerName,
          createdAt: new Date().toISOString()
        }
      ]

      return NextResponse.json({ success: true, status: 'rejected', events })
    }
  } catch (error: any) {
    console.error('Error responding to assignment:', error)
    return NextResponse.json({ error: 'Failed to respond to assignment' }, { status: 500 })
  }
}
