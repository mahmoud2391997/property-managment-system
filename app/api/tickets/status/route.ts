'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { ticket_state } from '@prisma/client'

type StatusAction =
  | 'mark_complete' // Staff marks as complete -> Pending_Tenant
  | 'confirm_resolution' // Tenant confirms -> Resolved
  | 'reject_resolution' // Tenant rejects -> In_Progress or Open
  | 'close_as_resolved' // Tenant closes as resolved -> Resolved
  | 'force_close' // Staff force closes -> Closed

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userType = user.user_metadata?.user_type
    const body = await request.json()
    const { ticketId, action, expectedStatus } = body as {
      ticketId: string
      action: StatusAction
      expectedStatus?: string
    }

    if (!ticketId || !action) {
      return NextResponse.json(
        { error: 'ticketId and action are required' },
        { status: 400 }
      )
    }

    // Fetch ticket with current status and assignment info
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        leases: {
          include: {
            tenants: true
          }
        },
        ticket_statuses: {
          orderBy: { created_at: 'desc' },
          take: 1
        },
        ticket_assignments: {
          where: { status: 'Accepted' },
          orderBy: { responded_at: 'desc' },
          take: 1
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const currentStatus = ticket.ticket_statuses[0]?.state || 'Open'
    const tenantId = ticket.leases?.tenants?.id
    const assignedStaffId = ticket.ticket_assignments[0]?.assigned_id

    // Stale state check
    if (expectedStatus && expectedStatus !== currentStatus) {
      return NextResponse.json(
        {
          error: 'Ticket status has been updated by another user',
          code: 'STALE_STATE'
        },
        { status: 409 }
      )
    }

    // Check if ticket is already in terminal state
    if (currentStatus === 'Resolved' || currentStatus === 'Closed') {
      return NextResponse.json(
        { error: 'This ticket has already been closed and cannot be modified' },
        { status: 400 }
      )
    }

    // Validate action based on user type and current status
    let newStatus: ticket_state
    let performerId: string
    let performerType: 'staff' | 'tenant'
    let notificationData: {
      userId: string
      title: string
      message: string
      performerId: string
      performerType: 'staff' | 'tenant'
      affectedId?: string
      affectedType?: 'staff' | 'tenant'
    } | null = null

    if (action === 'mark_complete') {
      // Staff only action
      if (userType === 'tenant') {
        return NextResponse.json(
          { error: 'Only staff can mark tickets as complete' },
          { status: 403 }
        )
      }

      // Verify staff is the assigned staff
      const staff = await prisma.staff.findUnique({
        where: { id: user.id },
        select: { id: true, organization_id: true }
      })

      if (!staff || staff.organization_id !== ticket.organization_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (assignedStaffId !== user.id) {
        return NextResponse.json(
          { error: 'Only the assigned staff can mark the ticket as complete' },
          { status: 403 }
        )
      }

      if (currentStatus !== 'In_Progress') {
        return NextResponse.json(
          { error: 'Can only mark as complete when status is In Progress' },
          { status: 400 }
        )
      }

      newStatus = 'Pending_Tenant'
      performerId = user.id
      performerType = 'staff'

      // Notify tenant
      if (tenantId) {
        notificationData = {
          userId: tenantId,
          title: 'Ticket Pending Your Confirmation',
          message: `marked ticket #${ticket.reference_id} as complete. Please confirm if the issue is resolved.`,
          performerId: user.id,
          performerType: 'staff',
          affectedId: tenantId,
          affectedType: 'tenant'
        }
      }
    } else if (action === 'confirm_resolution') {
      // Tenant only action
      if (userType !== 'tenant') {
        return NextResponse.json(
          { error: 'Only tenants can confirm resolution' },
          { status: 403 }
        )
      }

      if (tenantId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (currentStatus !== 'Pending_Tenant') {
        return NextResponse.json(
          { error: 'Can only confirm resolution when status is Pending Tenant Confirmation' },
          { status: 400 }
        )
      }

      newStatus = 'Resolved'
      performerId = user.id
      performerType = 'tenant'

      // Notify assigned staff if there is one
      if (assignedStaffId) {
        notificationData = {
          userId: assignedStaffId,
          title: 'Ticket Resolution Confirmed',
          message: `confirmed that ticket #${ticket.reference_id} is resolved.`,
          performerId: user.id,
          performerType: 'tenant',
          affectedId: assignedStaffId,
          affectedType: 'staff'
        }
      }
    } else if (action === 'reject_resolution') {
      // Tenant only action
      if (userType !== 'tenant') {
        return NextResponse.json(
          { error: 'Only tenants can reject resolution' },
          { status: 403 }
        )
      }

      if (tenantId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (currentStatus !== 'Pending_Tenant') {
        return NextResponse.json(
          { error: 'Can only reject resolution when status is Pending Tenant Confirmation' },
          { status: 400 }
        )
      }

      // Check if there's still an assigned staff (not unassigned)
      // Get the latest assignment to check its current status
      const latestAssignment = await prisma.ticket_assignments.findFirst({
        where: { ticket_id: ticketId },
        orderBy: { requested_at: 'desc' }
      })

      const hasActiveAssignment = latestAssignment?.status === 'Accepted'

      newStatus = hasActiveAssignment ? 'In_Progress' : 'Open'
      performerId = user.id
      performerType = 'tenant'

      // Notify assigned staff if there is one
      if (hasActiveAssignment && latestAssignment?.assigned_id) {
        notificationData = {
          userId: latestAssignment.assigned_id,
          title: 'Resolution Rejected',
          message: `rejected the resolution for ticket #${ticket.reference_id}. The issue is not resolved.`,
          performerId: user.id,
          performerType: 'tenant',
          affectedId: latestAssignment.assigned_id,
          affectedType: 'staff'
        }
      }
    } else if (action === 'close_as_resolved') {
      // Tenant only action
      if (userType !== 'tenant') {
        return NextResponse.json(
          { error: 'Only tenants can close tickets as resolved' },
          { status: 403 }
        )
      }

      if (tenantId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Can only close as resolved when status is Open or In_Progress
      if (currentStatus !== 'Open' && currentStatus !== 'In_Progress') {
        return NextResponse.json(
          { error: 'Can only close as resolved when status is Open or In Progress' },
          { status: 400 }
        )
      }

      newStatus = 'Resolved'
      performerId = user.id
      performerType = 'tenant'

      // Notify assigned staff if there is one
      if (assignedStaffId) {
        notificationData = {
          userId: assignedStaffId,
          title: 'Ticket Closed by Tenant',
          message: `closed ticket #${ticket.reference_id} as resolved.`,
          performerId: user.id,
          performerType: 'tenant',
          affectedId: assignedStaffId,
          affectedType: 'staff'
        }
      }
    } else if (action === 'force_close') {
      // Staff only action
      if (userType === 'tenant') {
        return NextResponse.json(
          { error: 'Only staff can force close tickets' },
          { status: 403 }
        )
      }

      const staff = await prisma.staff.findUnique({
        where: { id: user.id },
        select: { id: true, organization_id: true }
      })

      if (!staff || staff.organization_id !== ticket.organization_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      newStatus = 'Closed'
      performerId = user.id
      performerType = 'staff'

      // Notify tenant
      if (tenantId) {
        notificationData = {
          userId: tenantId,
          title: 'Ticket Closed',
          message: `closed ticket #${ticket.reference_id}.`,
          performerId: user.id,
          performerType: 'staff',
          affectedId: tenantId,
          affectedType: 'tenant'
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Create status change and notification in transaction
    const result = await prisma.$transaction(async tx => {
      // Create new status
      const statusRecord = await tx.ticket_statuses.create({
        data: {
          ticket_id: ticketId,
          state: newStatus,
          performer_type: performerType,
          performer_id: performerId
        }
      })

      // Create notification if needed
      if (notificationData) {
        await tx.notifications.create({
          data: {
            organization_id: ticket.organization_id,
            user_id: notificationData.userId,
            title: notificationData.title,
            message: notificationData.message,
            reference_id: ticketId,
            reference_type: 'tickets',
            performer_id: notificationData.performerId,
            performer_type: notificationData.performerType,
            affected_id: notificationData.affectedId,
            affected_type: notificationData.affectedType as any,
            page: 'tickets'
          }
        })
      }

      return statusRecord
    })

    // Format status for response
    const statusMap: Record<string, string> = {
      Open: 'Open',
      In_Progress: 'In Progress',
      Pending_Tenant: 'Pending Tenant Confirmation',
      Resolved: 'Resolved',
      Closed: 'Closed'
    }

    return NextResponse.json({
      success: true,
      newStatus: statusMap[newStatus] || newStatus,
      rawStatus: newStatus,
      createdAt: result.created_at.toISOString()
    })
  } catch (error: any) {
    console.error('Error updating ticket status:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket status' },
      { status: 500 }
    )
  }
}
