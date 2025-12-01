'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userType = user.user_metadata?.user_type

    // Fetch ticket with all related data
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        tenants: {
          include: {
            individual_tenants: true,
            company_tenants: true
          }
        },
        ticket_statuses: {
          orderBy: { created_at: 'asc' }
        },
        ticket_types: {
          orderBy: { created_at: 'asc' },
          include: {
            staff: {
              select: { first_name: true, last_name: true, profile_pic: true }
            }
          }
        },
        ticket_assignments: {
          orderBy: { requested_at: 'asc' },
          include: {
            staff_ticket_assignments_assigned_idTostaff: true,
            staff_ticket_assignments_assigner_idTostaff: true
          }
        },
        ticket_comments: {
          orderBy: { created_at: 'asc' }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Access check for tenants - can only see tickets they created
    if (userType === 'tenant' && ticket.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Access check for staff - must be in same organization
    if (userType !== 'tenant') {
      const staff = await prisma.staff.findUnique({
        where: { id: user.id },
        select: { organization_id: true }
      })

      if (!staff || staff.organization_id !== ticket.organization_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get tenant name
    const tenantName = ticket.tenants?.individual_tenants
      ? `${ticket.tenants.individual_tenants.first_name} ${ticket.tenants.individual_tenants.last_name || ''}`.trim()
      : ticket.tenants?.company_tenants?.company_name || 'Unknown'

    // Get current status
    const currentStatus =
      ticket.ticket_statuses[ticket.ticket_statuses.length - 1]?.state || 'Open'

    // Get current type (latest one)
    const currentType = ticket.ticket_types[ticket.ticket_types.length - 1]?.type || 'Other'

    // Get current assignment (accepted one)
    const acceptedAssignment = ticket.ticket_assignments.find(
      a => a.status === 'Accepted'
    )
    const pendingAssignment = ticket.ticket_assignments.find(
      a => a.status === 'Pending'
    )

    // Build timeline events
    const timeline: any[] = []

    // 1. Opened event (always first)
    timeline.push({
      type: 'opened',
      performerName: tenantName,
      performerAvatar: ticket.tenants?.profile_pic || undefined,
      date: formatDate(ticket.created_at),
      description: ticket.description,
      attachment: ticket.attachment
        ? {
            name: getFileNameFromUrl(ticket.attachment),
            url: ticket.attachment
          }
        : undefined
    })

    // 2. Assignment events
    for (const assignment of ticket.ticket_assignments) {
      const assignerStaff = assignment.staff_ticket_assignments_assigner_idTostaff
      const assignedStaff = assignment.staff_ticket_assignments_assigned_idTostaff

      const assignerName = assignerStaff
        ? `${assignerStaff.first_name} ${assignerStaff.last_name || ''}`.trim()
        : 'Unknown'
      const assignedName = assignedStaff
        ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
        : 'Unknown'

      // Assignment sent
      timeline.push({
        type: 'assignment_sent',
        assignerName,
        assignedName,
        date: formatDate(assignment.requested_at),
        timestamp: assignment.requested_at.getTime()
      })

      // Assignment cancelled (before response)
      if (assignment.cancelled_at) {
        timeline.push({
          type: 'assignment_cancelled',
          assignerName,
          assignedName,
          date: formatDate(assignment.cancelled_at),
          timestamp: assignment.cancelled_at.getTime()
        })
      }

      // Assignment response (accepted or rejected)
      if (assignment.responded_at) {
        if (assignment.status === 'Accepted' || assignment.status === 'Unassigned') {
          // If status is Accepted or Unassigned (which means it was accepted first)
          timeline.push({
            type: 'assignment_accepted',
            performerName: assignedName,
            date: formatDate(assignment.responded_at),
            timestamp: assignment.responded_at.getTime()
          })
        } else if (assignment.status === 'Rejected') {
          timeline.push({
            type: 'assignment_rejected',
            performerName: assignedName,
            fromName: assignerName,
            date: formatDate(assignment.responded_at),
            timestamp: assignment.responded_at.getTime()
          })
        }
      }

      // Assignment unassigned (after acceptance)
      if (assignment.unassigned_at) {
        timeline.push({
          type: 'assignment_unassigned',
          performerName: assignedName,
          date: formatDate(assignment.unassigned_at),
          timestamp: assignment.unassigned_at.getTime()
        })
      }
    }

    // 3. Status change events (skip the first "Open" status as it's implied by creation)
    for (let i = 1; i < ticket.ticket_statuses.length; i++) {
      const status = ticket.ticket_statuses[i]
      const statusLabel = formatStatus(status.state)

      if (status.performer_type === 'system') {
        timeline.push({
          type: 'status_changed',
          performerType: 'system',
          newStatus: statusLabel,
          date: formatDate(status.created_at),
          timestamp: status.created_at.getTime()
        })
      } else {
        // Get performer name
        let performerName = 'Unknown'
        if (status.performer_id) {
          if (status.performer_type === 'staff') {
            const staff = await prisma.staff.findUnique({
              where: { id: status.performer_id },
              select: { first_name: true, last_name: true }
            })
            if (staff) {
              performerName = `${staff.first_name} ${staff.last_name || ''}`.trim()
            }
          } else if (status.performer_type === 'tenant') {
            const tenant = await prisma.tenants.findUnique({
              where: { id: status.performer_id },
              include: { individual_tenants: true, company_tenants: true }
            })
            if (tenant) {
              performerName = tenant.individual_tenants
                ? `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
                : tenant.company_tenants?.company_name || 'Unknown'
            }
          }
        }

        timeline.push({
          type: 'status_changed',
          performerType: 'user',
          performerName,
          newStatus: statusLabel,
          date: formatDate(status.created_at),
          timestamp: status.created_at.getTime()
        })
      }
    }

    // 4. Type events
    for (let i = 0; i < ticket.ticket_types.length; i++) {
      const typeEntry = ticket.ticket_types[i]
      const isFirstType = i === 0

      // First type is set by tenant when creating ticket
      // Subsequent types are changed by staff
      if (isFirstType) {
        timeline.push({
          type: 'type_set',
          performerName: tenantName,
          performerAvatar: ticket.tenants?.profile_pic || undefined,
          typeName: typeEntry.type,
          date: formatDate(typeEntry.created_at),
          timestamp: typeEntry.created_at.getTime()
        })
      } else {
        // Staff changed the type
        const staffName = typeEntry.staff
          ? `${typeEntry.staff.first_name} ${typeEntry.staff.last_name || ''}`.trim()
          : 'Unknown'
        const staffAvatar = typeEntry.staff?.profile_pic || undefined

        timeline.push({
          type: 'type_changed',
          performerName: staffName,
          performerAvatar: staffAvatar,
          typeName: typeEntry.type,
          date: formatDate(typeEntry.created_at),
          timestamp: typeEntry.created_at.getTime()
        })
      }
    }

    // 5. Comment events
    for (const comment of ticket.ticket_comments) {
      let performerName = 'Unknown'
      let performerAvatar: string | undefined

      if (comment.sender_type === 'staff') {
        const staff = await prisma.staff.findUnique({
          where: { id: comment.sender_id },
          select: { first_name: true, last_name: true, profile_pic: true }
        })
        if (staff) {
          performerName = `${staff.first_name} ${staff.last_name || ''}`.trim()
          performerAvatar = staff.profile_pic || undefined
        }
      } else if (comment.sender_type === 'tenant') {
        const tenant = await prisma.tenants.findUnique({
          where: { id: comment.sender_id },
          include: { individual_tenants: true, company_tenants: true }
        })
        if (tenant) {
          performerName = tenant.individual_tenants
            ? `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
            : tenant.company_tenants?.company_name || 'Unknown'
          performerAvatar = tenant.profile_pic || undefined
        }
      }

      timeline.push({
        type: 'comment',
        performerName,
        performerAvatar,
        date: formatDate(comment.created_at),
        message: comment.message,
        attachment: comment.attachment
          ? {
              name: getFileNameFromUrl(comment.attachment),
              url: comment.attachment
            }
          : undefined,
        timestamp: comment.created_at.getTime()
      })
    }

    // Sort timeline by timestamp (opened event stays first)
    const openedEvent = timeline[0]
    const restEvents = timeline.slice(1).sort((a, b) => a.timestamp - b.timestamp)
    const sortedTimeline = [openedEvent, ...restEvents].map(
      ({ timestamp, ...event }) => event
    )

    // Build response
    const response = {
      id: ticket.id,
      referenceId: ticket.reference_id,
      title: ticket.title,
      description: ticket.description,
      attachment: ticket.attachment,
      createdAt: formatDate(ticket.created_at),
      creatorName: tenantName,
      creatorAvatar: ticket.tenants?.profile_pic || undefined,
      currentStatus: formatStatus(currentStatus),
      currentType,
      assignedStaff: acceptedAssignment?.staff_ticket_assignments_assigned_idTostaff
        ? {
            id: acceptedAssignment.staff_ticket_assignments_assigned_idTostaff.id,
            name: `${acceptedAssignment.staff_ticket_assignments_assigned_idTostaff.first_name} ${acceptedAssignment.staff_ticket_assignments_assigned_idTostaff.last_name || ''}`.trim(),
            avatar:
              acceptedAssignment.staff_ticket_assignments_assigned_idTostaff
                .profile_pic || undefined
          }
        : null,
      pendingStaff: pendingAssignment?.staff_ticket_assignments_assigned_idTostaff
        ? {
            id: pendingAssignment.staff_ticket_assignments_assigned_idTostaff.id,
            name: `${pendingAssignment.staff_ticket_assignments_assigned_idTostaff.first_name} ${pendingAssignment.staff_ticket_assignments_assigned_idTostaff.last_name || ''}`.trim(),
            avatar:
              pendingAssignment.staff_ticket_assignments_assigned_idTostaff
                .profile_pic || undefined
          }
        : null,
      timeline: sortedTimeline
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    Open: 'Open',
    In_Progress: 'In Progress',
    Pending_Tenant: 'Pending Tenant',
    Resolved: 'Resolved',
    Closed: 'Closed'
  }
  return statusMap[status] || status
}

function getFileNameFromUrl(url: string): string {
  try {
    const parts = url.split('/')
    return parts[parts.length - 1] || 'attachment'
  } catch {
    return 'attachment'
  }
}
