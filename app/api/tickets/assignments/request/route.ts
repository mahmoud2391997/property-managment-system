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

    // Only staff can send assignment requests
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Only staff can send assignment requests' }, { status: 403 })
    }

    const body = await request.json()
    const { ticketId, assignedId, expectedStatus } = body

    if (!ticketId || !assignedId) {
      return NextResponse.json({ error: 'ticketId and assignedId are required' }, { status: 400 })
    }

    // Verify ticket exists and belongs to same organization
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: { id: true, organization_id: true, reference_id: true, title: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.organization_id !== staff.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify assigned staff exists and belongs to same organization
    const assignedStaff = await prisma.staff.findUnique({
      where: { id: assignedId },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!assignedStaff || assignedStaff.organization_id !== staff.organization_id) {
      return NextResponse.json({ error: 'Assigned staff not found' }, { status: 404 })
    }

    // Check if there's an active assignment (pending or accepted) for this ticket
    const activeAssignment = await prisma.ticket_assignments.findFirst({
      where: {
        ticket_id: ticketId,
        status: { in: ['Pending', 'Accepted'] }
      },
      orderBy: { requested_at: 'desc' }
    })

    // Stale state check - client expects no active assignment but there is one
    if (expectedStatus === 'unassigned' && activeAssignment) {
      return NextResponse.json({
        error: 'Assignment has been updated by another staff member',
        code: 'STALE_STATE'
      }, { status: 409 })
    }

    if (activeAssignment?.status === 'Pending') {
      return NextResponse.json({ error: 'There is already a pending assignment request for this ticket' }, { status: 400 })
    }

    if (activeAssignment?.status === 'Accepted') {
      return NextResponse.json({ error: 'This ticket already has an assigned staff member' }, { status: 400 })
    }

    // Check if this is a self-assignment
    const isSelfAssignment = staff.id === assignedId

    // Get current ticket status to avoid duplicate status changes
    const currentStatus = await prisma.ticket_statuses.findFirst({
      where: { ticket_id: ticketId },
      orderBy: { created_at: 'desc' }
    })

    // Create assignment request and notification in transaction
    const result = await prisma.$transaction(async tx => {
      // Create assignment request
      // Note: Database trigger auto-accepts self-assignments
      const assignment = await tx.ticket_assignments.create({
        data: {
          ticket_id: ticketId,
          assigner_id: staff.id,
          assigned_id: assignedId,
          status: 'Pending'
        }
      })

      // If self-assignment, also update ticket status to In_Progress (if not already)
      if (isSelfAssignment && currentStatus?.state !== 'In_Progress') {
        await tx.ticket_statuses.create({
          data: {
            ticket_id: ticketId,
            state: 'In_Progress',
            performer_type: 'system',
            performer_id: null
          }
        })
      }

      // Only create notification if NOT self-assignment
      if (!isSelfAssignment) {
        await tx.notifications.create({
          data: {
            organization_id: ticket.organization_id,
            user_id: assignedId,
            title: 'New Ticket Assignment Request',
            message: `has requested you to handle ticket #${ticket.reference_id}: "${ticket.title}"`,
            reference_id: ticketId,
            reference_type: 'tickets',
            performer_id: staff.id,
            performer_type: 'staff',
            page: 'tickets'
          }
        })
      }

      return assignment
    })

    // Build event data for optimistic UI update
    const assignerName = `${staff.first_name} ${staff.last_name || ''}`.trim()
    const assignedName = `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()

    const events: any[] = [
      {
        type: 'assignment_sent',
        assignerName,
        assignedName,
        createdAt: result.requested_at.toISOString()
      }
    ]

    // If self-assignment, trigger auto-accepts it, so add accepted event
    if (isSelfAssignment) {
      events.push({
        type: 'assignment_accepted',
        performerName: assignedName,
        performerAvatar: assignedStaff.profile_pic || undefined,
        createdAt: result.requested_at.toISOString()
      })

      // If status changed to In_Progress, add that event too
      if (currentStatus?.state !== 'In_Progress') {
        events.push({
          type: 'status_changed',
          performerType: 'system',
          newStatus: 'In Progress',
          createdAt: new Date().toISOString()
        })
      }
    }

    return NextResponse.json({
      success: true,
      assignment: result,
      isSelfAssignment,
      events
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating assignment request:', error)
    return NextResponse.json({ error: 'Failed to create assignment request' }, { status: 500 })
  }
}
