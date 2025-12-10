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

    // Only staff can unassign
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Only staff can unassign' }, { status: 403 })
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
          select: { first_name: true, last_name: true, profile_pic: true }
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

    // Check if assignment is still accepted
    if (latestAssignment.status !== 'Accepted') {
      return NextResponse.json({
        error: 'Assignment has been updated by another staff member',
        code: 'STALE_STATE'
      }, { status: 409 })
    }

    // Verify same organization
    if (latestAssignment.tickets.organization_id !== staff.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update assignment status to Unassigned and revert ticket status to Open
    await prisma.$transaction(async tx => {
      // Update assignment status
      await tx.ticket_assignments.update({
        where: { id: latestAssignment.id },
        data: {
          status: 'Unassigned',
          unassigned_at: new Date(),
          unassigned_by: staff.id
        }
      })

      // Revert ticket status to Open (by system)
      await tx.ticket_statuses.create({
        data: {
          ticket_id: ticketId,
          state: 'Open',
          performer_type: 'system',
          performer_id: null
        }
      })
    })

    // Build events for optimistic UI update
    const assignedStaff = latestAssignment.staff_ticket_assignments_assigned_idTostaff
    const assignedName = assignedStaff
      ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
      : 'Unknown'
    const unassignedByName = currentStaff
      ? `${currentStaff.first_name} ${currentStaff.last_name || ''}`.trim()
      : 'Unknown'

    const events: any[] = [
      {
        type: 'assignment_unassigned',
        performerName: assignedName,
        performerAvatar: assignedStaff?.profile_pic || undefined,
        unassignedByName,
        unassignedByAvatar: currentStaff?.profile_pic || undefined,
        createdAt: new Date().toISOString()
      },
      {
        type: 'status_changed',
        performerType: 'system',
        newStatus: 'Open',
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json({ success: true, events })
  } catch (error: any) {
    console.error('Error unassigning staff:', error)
    return NextResponse.json({ error: 'Failed to unassign staff' }, { status: 500 })
  }
}
