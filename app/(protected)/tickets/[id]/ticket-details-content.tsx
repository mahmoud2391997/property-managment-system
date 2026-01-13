'use client'

import { useCallback, useState, useEffect } from 'react'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import { TicketHeader, TicketTimeline, TicketSidebar, PendingAssignmentBanner, TenantStatusActions } from '@/components/ticket-ui'
import type { TimelineEvent } from '@/components/ticket-ui'
import type { TicketAttachment } from '@/components/ticket-ui/timeline-events'

type TicketData = {
  id: string
  reference_id: string
  title: string
  description: string
  attachment: string | null
  created_at: Date
  leases: {
    id: string
    reference_id: string
    tenants: {
      id: string
      profile_pic: string | null
      individual_tenants: {
        first_name: string
        last_name: string | null
      } | null
      company_tenants: {
        company_name: string
      } | null
    }
    properties: {
      id: string
      code: string
      street_address: string
    }
    rooms: {
      id: string
      title: string
    } | null
  } | null
  ticket_statuses: {
    id: string
    state: string
    performer_type: string
    performer_id: string | null
    created_at: Date
  }[]
  ticket_types: {
    id: string
    type: string
    created_at: Date | string
    staff: {
      first_name: string
      last_name: string | null
      profile_pic: string | null
    } | null
  }[]
  ticket_assignments: {
    id: string
    status: string
    requested_at: Date | string
    responded_at: Date | string | null
    unassigned_at: Date | string | null
    cancelled_at: Date | string | null
    staff_ticket_assignments_assigned_idTostaff: {
      id: string
      first_name: string
      last_name: string | null
      profile_pic: string | null
    } | null
    staff_ticket_assignments_assigner_idTostaff: {
      id: string
      first_name: string
      last_name: string | null
      profile_pic: string | null
    } | null
    staff_ticket_assignments_unassigned_byTostaff: {
      id: string
      first_name: string
      last_name: string | null
      profile_pic: string | null
    } | null
    staff_ticket_assignments_cancelled_byTostaff: {
      id: string
      first_name: string
      last_name: string | null
      profile_pic: string | null
    } | null
  }[]
  ticket_comments: {
    id: string
    message: string
    attachment: string | null
    sender_type: string
    sender_id: string
    created_at: Date
  }[]
}

type AssignmentEvent = {
  type: string
  performerName?: string
  performerAvatar?: string
  assignerName?: string
  assignedName?: string
  fromName?: string
  newStatus?: string
  performerType?: string
  unassignedByName?: string
  unassignedByAvatar?: string
  cancelledByName?: string
  cancelledByAvatar?: string
  createdAt: string
}

type Props = {
  ticket: TicketData
  userType: 'staff' | 'tenant'
  staffList: { id: string; label: string; subtitle?: string }[]
  currentUserName: string
  currentUserAvatar?: string
  currentUserId: string
  statusPerformers: Record<string, { name: string; avatar?: string }>
  commentSenders: Record<string, { name: string; avatar?: string }>
}

function formatDate(date: Date | string): string {
  const now = new Date()
  const dateObj = new Date(date)
  const diffMs = now.getTime() - dateObj.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

export default function TicketDetailsContent({
  ticket,
  userType,
  staffList,
  currentUserName,
  currentUserAvatar,
  currentUserId,
  statusPerformers,
  commentSenders
}: Props) {
  const [currentType, setCurrentType] = useState(
    ticket.ticket_types[ticket.ticket_types.length - 1]?.type || 'Other'
  )
  const [rawStatus, setRawStatus] = useState(
    ticket.ticket_statuses[ticket.ticket_statuses.length - 1]?.state || 'Open'
  )
  const [currentStatus, setCurrentStatus] = useState(
    formatStatus(rawStatus)
  )

  // Get initial assignment data
  const getInitialAcceptedAssignment = () => ticket.ticket_assignments.find(a => a.status === 'Accepted')
  const getInitialPendingAssignment = () => ticket.ticket_assignments.find(a => a.status === 'Pending')

  const [acceptedAssignment, setAcceptedAssignment] = useState(getInitialAcceptedAssignment)
  const [pendingAssignment, setPendingAssignment] = useState(getInitialPendingAssignment)

  // Sync assignments when ticket data changes (e.g., after router.refresh())
  useEffect(() => {
    setAcceptedAssignment(getInitialAcceptedAssignment())
    setPendingAssignment(getInitialPendingAssignment())
  }, [ticket.ticket_assignments])

  // Sync status when ticket data changes (e.g., after router.refresh())
  useEffect(() => {
    const latestStatus = ticket.ticket_statuses[ticket.ticket_statuses.length - 1]?.state || 'Open'
    setRawStatus(latestStatus)
    setCurrentStatus(formatStatus(latestStatus))
  }, [ticket.ticket_statuses])

  // Sync type when ticket data changes
  useEffect(() => {
    setCurrentType(ticket.ticket_types[ticket.ticket_types.length - 1]?.type || 'Other')
  }, [ticket.ticket_types])

  // Get tenant name from lease
  const tenant = ticket.leases?.tenants
  const tenantName = tenant?.individual_tenants
    ? `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
    : tenant?.company_tenants?.company_name || 'Unknown'

  // Check if current user has a pending assignment request
  const hasPendingRequestForMe =
    pendingAssignment?.staff_ticket_assignments_assigned_idTostaff?.id === currentUserId

  // Build timeline events
  const buildTimeline = useCallback((): TimelineEvent[] => {
    const events: (TimelineEvent & { timestamp?: number })[] = []

    // 1. Opened event
    const attachment: TicketAttachment | undefined = ticket.attachment
      ? {
          name: getFileNameFromUrl(ticket.attachment),
          url: ticket.attachment
        }
      : undefined

    events.push({
      type: 'opened',
      performerName: tenantName,
      performerAvatar: tenant?.profile_pic || undefined,
      date: formatDate(ticket.created_at),
      description: ticket.description,
      attachment
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

      // Base timestamp for this assignment
      const requestedTimestamp = new Date(assignment.requested_at).getTime()

      // Check if this is a self-assignment
      const isSelfAssignment = assignerStaff?.id === assignedStaff?.id

      if (isSelfAssignment && (assignment.status === 'Accepted' || assignment.status === 'Unassigned')) {
        // Self-assignment: show single "assigned themselves" event
        events.push({
          type: 'assignment_self_assigned',
          performerName: assignedName,
          date: formatDate(assignment.requested_at),
          timestamp: requestedTimestamp
        })
      } else {
        // Regular assignment: show sent event
        events.push({
          type: 'assignment_sent',
          assignerName,
          assignedName,
          date: formatDate(assignment.requested_at),
          timestamp: requestedTimestamp
        })

        // Assignment cancelled (offset +1 to ensure it comes after sent)
        if (assignment.cancelled_at) {
          const cancelledByStaff = assignment.staff_ticket_assignments_cancelled_byTostaff
          const cancelledByName = cancelledByStaff
            ? `${cancelledByStaff.first_name} ${cancelledByStaff.last_name || ''}`.trim()
            : undefined

          events.push({
            type: 'assignment_cancelled',
            assignerName,
            assignedName,
            cancelledByName,
            date: formatDate(assignment.cancelled_at),
            timestamp: new Date(assignment.cancelled_at).getTime() + 1
          })
        }

        // Assignment response (accepted or rejected)
        // offset +2 to ensure it comes after sent and cancelled
        const hasResponded = assignment.responded_at !== null && assignment.responded_at !== undefined
        const status = assignment.status

        if (hasResponded) {
          const respondedTimestamp = new Date(assignment.responded_at!).getTime()
          // Ensure responded comes after requested even if timestamps are equal
          const safeRespondedTimestamp = Math.max(respondedTimestamp, requestedTimestamp + 1)

          if (status === 'Accepted' || status === 'Unassigned') {
            events.push({
              type: 'assignment_accepted',
              performerName: assignedName,
              date: formatDate(assignment.responded_at!),
              timestamp: safeRespondedTimestamp
            })
          } else if (status === 'Rejected') {
            events.push({
              type: 'assignment_rejected',
              performerName: assignedName,
              fromName: assignerName,
              date: formatDate(assignment.responded_at!),
              timestamp: safeRespondedTimestamp
            })
          }
        }
      }

      // Assignment unassigned (after acceptance)
      if (assignment.unassigned_at) {
        const unassignedTimestamp = new Date(assignment.unassigned_at).getTime()
        // Ensure unassigned comes after responded
        const respondedTimestamp = assignment.responded_at ? new Date(assignment.responded_at).getTime() : requestedTimestamp
        const safeUnassignedTimestamp = Math.max(unassignedTimestamp, respondedTimestamp + 1)

        const unassignedByStaff = assignment.staff_ticket_assignments_unassigned_byTostaff
        const unassignedByName = unassignedByStaff
          ? `${unassignedByStaff.first_name} ${unassignedByStaff.last_name || ''}`.trim()
          : undefined

        events.push({
          type: 'assignment_unassigned',
          performerName: assignedName,
          unassignedByName,
          date: formatDate(assignment.unassigned_at),
          timestamp: safeUnassignedTimestamp
        })
      }
    }

    // 3. Status change events (skip first Open status)
    for (let i = 1; i < ticket.ticket_statuses.length; i++) {
      const status = ticket.ticket_statuses[i]
      const statusLabel = formatStatus(status.state)

      if (status.performer_type === 'system') {
        events.push({
          type: 'status_changed',
          performerType: 'system',
          newStatus: statusLabel,
          date: formatDate(status.created_at),
          timestamp: new Date(status.created_at).getTime()
        })
      } else {
        // Get performer name from statusPerformers lookup
        const performer = status.performer_id ? statusPerformers[status.performer_id] : null
        events.push({
          type: 'status_changed',
          performerType: 'user',
          performerName: performer?.name || 'Unknown',
          newStatus: statusLabel,
          date: formatDate(status.created_at),
          timestamp: new Date(status.created_at).getTime()
        })
      }
    }

    // 4. Type events
    for (let i = 0; i < ticket.ticket_types.length; i++) {
      const typeEntry = ticket.ticket_types[i]
      const isFirstType = i === 0

      if (isFirstType) {
        // First type is set by tenant when creating ticket
        events.push({
          type: 'type_set',
          performerName: tenantName,
          performerAvatar: tenant?.profile_pic || undefined,
          typeName: typeEntry.type,
          date: formatDate(typeEntry.created_at),
          timestamp: new Date(typeEntry.created_at).getTime()
        })
      } else {
        // Staff changed the type
        const staffName = typeEntry.staff
          ? `${typeEntry.staff.first_name} ${typeEntry.staff.last_name || ''}`.trim()
          : 'Unknown'
        const staffAvatar = typeEntry.staff?.profile_pic || undefined

        events.push({
          type: 'type_changed',
          performerName: staffName,
          performerAvatar: staffAvatar,
          typeName: typeEntry.type,
          date: formatDate(typeEntry.created_at),
          timestamp: new Date(typeEntry.created_at).getTime()
        })
      }
    }

    // 5. Comment events
    for (const comment of ticket.ticket_comments) {
      const sender = commentSenders[comment.sender_id]
      events.push({
        type: 'comment',
        performerName: sender?.name || 'Unknown',
        performerAvatar: sender?.avatar,
        date: formatDate(comment.created_at),
        message: comment.message,
        attachment: comment.attachment
          ? {
              name: getFileNameFromUrl(comment.attachment),
              url: comment.attachment
            }
          : undefined,
        timestamp: new Date(comment.created_at).getTime()
      })
    }

    // Sort by timestamp (opened event stays first)
    const openedEvent = events[0]
    const restEvents = events
      .slice(1)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

    return [openedEvent, ...restEvents].map(({ timestamp, ...event }) => event) as TimelineEvent[]
  }, [ticket, tenantName, statusPerformers, commentSenders])

  const [timeline, setTimeline] = useState<TimelineEvent[]>(() => buildTimeline())

  // Sync timeline when ticket data changes (e.g., after router.refresh())
  useEffect(() => {
    setTimeline(buildTimeline())
  }, [buildTimeline])

  const handleTypeChange = (
    newType: string,
    event?: { type: 'type_changed'; performerName: string; performerAvatar?: string; typeName: string; createdAt: string }
  ) => {
    setCurrentType(newType)

    // Add the new event to the timeline if provided
    if (event) {
      const newEvent: TimelineEvent = {
        type: 'type_changed',
        performerName: event.performerName,
        performerAvatar: event.performerAvatar,
        typeName: event.typeName,
        date: formatDate(event.createdAt)
      }
      setTimeline(prev => [...prev, newEvent])
    }
  }

  type StatusChangeEvent = {
    type: 'status_changed'
    performerType: 'user' | 'system'
    performerName?: string
    newStatus: string
    createdAt: string
  }

  const handleStatusChange = (newStatus: string, event?: StatusChangeEvent) => {
    // Update raw status based on new status
    const rawStatusMap: Record<string, string> = {
      'Open': 'Open',
      'In Progress': 'In_Progress',
      'Pending Tenant Confirmation': 'Pending_Tenant',
      'Resolved': 'Resolved',
      'Closed': 'Closed'
    }
    setRawStatus(rawStatusMap[newStatus] || newStatus)
    setCurrentStatus(newStatus)

    // Add the new event to the timeline if provided
    if (event) {
      const newTimelineEvent: TimelineEvent = {
        type: 'status_changed',
        performerType: event.performerType,
        performerName: event.performerName,
        newStatus: event.newStatus,
        date: formatDate(event.createdAt)
      }
      setTimeline(prev => [...prev, newTimelineEvent])
    }
  }

  type CommentResult = {
    id: string
    message: string
    attachment: string | null
    createdAt: string
    senderName: string
    senderAvatar?: string
  }

  const handleCommentAdded = (comment: CommentResult) => {
    // Build attachment object if present
    const attachment: TicketAttachment | undefined = comment.attachment
      ? {
          name: getFileNameFromUrl(comment.attachment),
          url: comment.attachment
        }
      : undefined

    // Add new comment to timeline
    const newEvent: TimelineEvent = {
      type: 'comment',
      performerName: comment.senderName,
      performerAvatar: comment.senderAvatar,
      date: formatDate(comment.createdAt),
      message: comment.message,
      attachment
    }
    setTimeline(prev => [...prev, newEvent])
  }

  const handleAssignmentChange = (events?: AssignmentEvent[], statusChange?: string) => {
    // Update status if changed
    if (statusChange) {
      setCurrentStatus(statusChange)
    }

    // Add events to timeline and update assignment state
    if (events && events.length > 0) {
      const newTimelineEvents: TimelineEvent[] = []

      // Check if this is a self-assignment (has both assignment_sent and assignment_accepted with same name)
      const sentEvent = events.find(e => e.type === 'assignment_sent')
      const acceptedEvent = events.find(e => e.type === 'assignment_accepted')
      const isSelfAssignment = sentEvent && acceptedEvent &&
        sentEvent.assignerName === sentEvent.assignedName

      for (const event of events) {
        switch (event.type) {
          case 'assignment_sent':
            // Skip if self-assignment (will be handled as single event)
            if (isSelfAssignment) break
            newTimelineEvents.push({
              type: 'assignment_sent',
              assignerName: event.assignerName || 'Unknown',
              assignedName: event.assignedName || 'Unknown',
              date: formatDate(event.createdAt)
            })
            break
          case 'assignment_accepted':
            // Move from pending to accepted
            if (pendingAssignment) {
              setAcceptedAssignment(pendingAssignment)
              setPendingAssignment(undefined)
            }
            // For self-assignment, show the combined event
            if (isSelfAssignment) {
              newTimelineEvents.push({
                type: 'assignment_self_assigned',
                performerName: event.performerName || 'Unknown',
                date: formatDate(event.createdAt)
              })
            } else {
              newTimelineEvents.push({
                type: 'assignment_accepted',
                performerName: event.performerName || 'Unknown',
                date: formatDate(event.createdAt)
              })
            }
            break
          case 'assignment_rejected':
            // Clear pending assignment
            setPendingAssignment(undefined)
            newTimelineEvents.push({
              type: 'assignment_rejected',
              performerName: event.performerName || 'Unknown',
              fromName: event.fromName || 'Unknown',
              date: formatDate(event.createdAt)
            })
            break
          case 'assignment_unassigned':
            // Clear accepted assignment
            setAcceptedAssignment(undefined)
            newTimelineEvents.push({
              type: 'assignment_unassigned',
              performerName: event.performerName || 'Unknown',
              unassignedByName: event.unassignedByName,
              date: formatDate(event.createdAt)
            })
            break
          case 'assignment_cancelled':
            // Clear pending assignment
            setPendingAssignment(undefined)
            newTimelineEvents.push({
              type: 'assignment_cancelled',
              assignerName: event.assignerName || 'Unknown',
              assignedName: event.assignedName || 'Unknown',
              cancelledByName: event.cancelledByName,
              date: formatDate(event.createdAt)
            })
            break
          case 'status_changed':
            newTimelineEvents.push({
              type: 'status_changed',
              performerType: (event.performerType || 'system') as 'system' | 'user',
              newStatus: event.newStatus || 'Unknown',
              date: formatDate(event.createdAt)
            })
            break
        }
      }

      setTimeline(prev => [...prev, ...newTimelineEvents])
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Tickets', href: '/tickets' },
          { label: `#${ticket.reference_id}` }
        ]}
      />

      {/* Header */}
      <TicketHeader
        title={ticket.title}
        referenceId={ticket.reference_id}
        status={currentStatus}
        creatorName={tenantName}
        createdAt={formatDate(ticket.created_at)}
      />

      {/* Tenant Status Actions - shown to tenants only */}
      {userType === 'tenant' && (
        <TenantStatusActions
          ticketId={ticket.id}
          rawStatus={rawStatus}
          currentUserName={currentUserName}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Pending Assignment Banner - shown to assigned staff */}
      {hasPendingRequestForMe && pendingAssignment && (
        <PendingAssignmentBanner
          ticketId={ticket.id}
          assignerName={
            pendingAssignment.staff_ticket_assignments_assigner_idTostaff
              ? `${pendingAssignment.staff_ticket_assignments_assigner_idTostaff.first_name} ${pendingAssignment.staff_ticket_assignments_assigner_idTostaff.last_name || ''}`.trim()
              : 'Unknown'
          }
          assignerAvatar={
            pendingAssignment.staff_ticket_assignments_assigner_idTostaff?.profile_pic || undefined
          }
          onRespond={handleAssignmentChange}
        />
      )}

      {/* Main Content */}
      <div className='flex flex-col lg:flex-row gap-6 lg:gap-10'>
        <TicketTimeline
          events={timeline}
          ticketId={ticket.id}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          disabled={rawStatus === 'Resolved' || rawStatus === 'Closed'}
          onCommentAdded={handleCommentAdded}
          userType={userType}
          ticketType={currentType}
        />
        {/* Sidebar - only shown to staff */}
        {userType === 'staff' && (
          <TicketSidebar
            ticketId={ticket.id}
            currentType={currentType}
            currentStatus={currentStatus}
            rawStatus={rawStatus}
            assignedStaff={
            acceptedAssignment?.staff_ticket_assignments_assigned_idTostaff
              ? {
                  id: acceptedAssignment.staff_ticket_assignments_assigned_idTostaff.id,
                  name: `${acceptedAssignment.staff_ticket_assignments_assigned_idTostaff.first_name} ${acceptedAssignment.staff_ticket_assignments_assigned_idTostaff.last_name || ''}`.trim(),
                  avatar:
                    acceptedAssignment.staff_ticket_assignments_assigned_idTostaff
                      .profile_pic || undefined
                }
              : null
          }
          pendingStaff={
            pendingAssignment?.staff_ticket_assignments_assigned_idTostaff
              ? {
                  id: pendingAssignment.staff_ticket_assignments_assigned_idTostaff.id,
                  name: `${pendingAssignment.staff_ticket_assignments_assigned_idTostaff.first_name} ${pendingAssignment.staff_ticket_assignments_assigned_idTostaff.last_name || ''}`.trim(),
                  avatar:
                    pendingAssignment.staff_ticket_assignments_assigned_idTostaff
                      .profile_pic || undefined
                }
              : null
          }
          staffList={staffList}
          onAssignmentChange={handleAssignmentChange}
          onTypeChange={handleTypeChange}
          onStatusChange={handleStatusChange}
          isStaff={userType === 'staff'}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
        )}
      </div>
    </div>
  )
}
