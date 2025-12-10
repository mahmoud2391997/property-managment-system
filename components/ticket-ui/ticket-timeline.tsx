'use client'

import {
  OpenedEvent,
  AssignmentSentEvent,
  AssignmentRejectedEvent,
  AssignmentAcceptedEvent,
  AssignmentUnassignedEvent,
  AssignmentCancelledEvent,
  AssignmentSelfAssignedEvent,
  StatusChangedSystemEvent,
  StatusChangedByUserEvent,
  CommentEvent,
  TypeSetEvent,
  TypeChangedEvent,
  TimelineEventWrapper,
  type TicketAttachment
} from './timeline-events'
import AddCommentSection from './add-comment-section'

// Timeline event types
export type TimelineEvent =
  | {
      type: 'opened'
      performerName: string
      performerAvatar?: string
      date: string
      description: string
      attachment?: TicketAttachment
    }
  | {
      type: 'assignment_sent'
      assignerName: string
      assignedName: string
      date: string
    }
  | {
      type: 'assignment_rejected'
      performerName: string
      fromName: string
      date: string
    }
  | {
      type: 'assignment_accepted'
      performerName: string
      date: string
    }
  | {
      type: 'assignment_unassigned'
      performerName: string
      unassignedByName?: string
      date: string
    }
  | {
      type: 'assignment_cancelled'
      assignerName: string
      assignedName: string
      cancelledByName?: string
      date: string
    }
  | {
      type: 'assignment_self_assigned'
      performerName: string
      date: string
    }
  | {
      type: 'status_changed'
      performerType: 'system' | 'user'
      performerName?: string
      newStatus: string
      note?: string
      date: string
    }
  | {
      type: 'comment'
      performerName: string
      performerAvatar?: string
      date: string
      message: string
      attachment?: TicketAttachment
    }
  | {
      type: 'type_set'
      performerName: string
      performerAvatar?: string
      typeName: string
      date: string
    }
  | {
      type: 'type_changed'
      performerName: string
      performerAvatar?: string
      typeName: string
      date: string
    }

type CommentResult = {
  id: string
  message: string
  attachment: string | null
  createdAt: string
  senderName: string
  senderAvatar?: string
}

type Props = {
  events: TimelineEvent[]
  ticketId: string
  currentUserName: string
  currentUserAvatar?: string
  disabled?: boolean
  onCommentAdded?: (comment: CommentResult) => void
}

export default function TicketTimeline({
  events,
  ticketId,
  currentUserName,
  currentUserAvatar,
  disabled = false,
  onCommentAdded
}: Props) {
  const totalEvents = events.length

  const renderEvent = (event: TimelineEvent) => {
    switch (event.type) {
      case 'opened':
        return (
          <div className='pb-2'>
            <OpenedEvent
              creatorName={event.performerName}
              creatorAvatar={event.performerAvatar}
              date={event.date}
              description={event.description}
              attachment={event.attachment}
            />
          </div>
        )
      case 'assignment_sent':
        return (
          <AssignmentSentEvent
            assignerName={event.assignerName}
            assignedName={event.assignedName}
            date={event.date}
          />
        )
      case 'assignment_rejected':
        return (
          <AssignmentRejectedEvent
            performerName={event.performerName}
            fromName={event.fromName}
            date={event.date}
          />
        )
      case 'assignment_accepted':
        return (
          <AssignmentAcceptedEvent
            performerName={event.performerName}
            date={event.date}
          />
        )
      case 'assignment_unassigned':
        return (
          <AssignmentUnassignedEvent
            performerName={event.performerName}
            unassignedByName={event.unassignedByName}
            date={event.date}
          />
        )
      case 'assignment_cancelled':
        return (
          <AssignmentCancelledEvent
            assignerName={event.assignerName}
            assignedName={event.assignedName}
            cancelledByName={event.cancelledByName}
            date={event.date}
          />
        )
      case 'assignment_self_assigned':
        return (
          <AssignmentSelfAssignedEvent
            performerName={event.performerName}
            date={event.date}
          />
        )
      case 'status_changed':
        if (event.performerType === 'system') {
          return (
            <StatusChangedSystemEvent
              newStatus={event.newStatus}
              date={event.date}
            />
          )
        }
        return (
          <StatusChangedByUserEvent
            performerName={event.performerName || 'Unknown'}
            newStatus={event.newStatus}
            note={event.note}
            date={event.date}
          />
        )
      case 'comment':
        return (
          <div className='py-2'>
            <CommentEvent
              performerName={event.performerName}
              performerAvatar={event.performerAvatar}
              date={event.date}
              message={event.message}
              attachment={event.attachment}
            />
          </div>
        )
      case 'type_set':
        return (
          <TypeSetEvent
            performerName={event.performerName}
            typeName={event.typeName}
            date={event.date}
          />
        )
      case 'type_changed':
        return (
          <TypeChangedEvent
            performerName={event.performerName}
            typeName={event.typeName}
            date={event.date}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className='flex-1'>
      <div>
        {events.map((event, index) => {
          const isLast = index === totalEvents - 1
          // Card-style events (opened, comment) don't have left icons on mobile
          const hasLeftElement = event.type !== 'opened' && event.type !== 'comment'

          return (
            <TimelineEventWrapper key={index} isLast={isLast} hasLeftElement={hasLeftElement}>
              {renderEvent(event)}
            </TimelineEventWrapper>
          )
        })}
      </div>

      <div className='mt-6 pt-2'>
        <AddCommentSection
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          ticketId={ticketId}
          disabled={disabled}
          onCommentAdded={onCommentAdded}
        />
      </div>
    </div>
  )
}
