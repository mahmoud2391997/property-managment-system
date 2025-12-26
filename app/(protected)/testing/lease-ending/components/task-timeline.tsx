'use client'

import { UserAvatar } from '@/components/costume-ui/name-avatar'
import HoverTooltip from '@/components/costume-ui/tooltip'
import FileAttachment from '@/components/costume-ui/file-attachment'
import {
  Clock,
  Info,
  GitPullRequestArrow,
  CheckCircle2,
  XCircle,
  Zap,
  FileText,
  Plus,
  DollarSign,
  AlertCircle,
  RotateCcw
} from 'lucide-react'
import { TaskTimelineEvent } from '../types'

// Timeline Event Wrapper
export function TimelineEventWrapper({
  children,
  isLast,
  hasLeftElement = true
}: {
  children: React.ReactNode
  isLast: boolean
  hasLeftElement?: boolean
}) {
  return (
    <div className='relative'>
      {!isLast && (
        <div
          className={`absolute left-[15px] sm:left-[19px] top-0 bottom-0 w-0.5 bg-neutral-200 ${hasLeftElement ? '' : 'hidden sm:block'}`}
        />
      )}
      {children}
    </div>
  )
}

// Task Created Event
export function TaskCreatedEvent({
  performerName,
  performerAvatar,
  date,
  message
}: {
  performerName: string
  performerAvatar?: string
  date: string
  message?: string
}) {
  return (
    <div className='flex gap-2 sm:gap-4'>
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar name={performerName} imgSrc={performerAvatar} size={40} />
      </div>
      <div className='flex-1 min-w-0 border border-(--border-default) rounded-lg overflow-hidden bg-white'>
        <div className='bg-amber-50/80 border-b border-amber-200/60 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center gap-1 sm:gap-2'>
          <span className='texts-body-small-medium sm:texts-body-medium-medium text-(--text-primary)'>
            {performerName}
          </span>
          <span className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            created this task on {date}
          </span>
        </div>
        {message && (
          <div className='px-3 sm:px-4 py-3 sm:py-4'>
            <p className='texts-body-small sm:texts-body-medium text-(--text-primary) leading-relaxed'>
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Assignment Sent Event
export function AssignmentSentEvent({
  assignerName,
  assigneeName,
  date
}: {
  assignerName: string
  assigneeName: string
  date: string
}) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <GitPullRequestArrow size={12} className='text-neutral-500 sm:hidden' />
          <GitPullRequestArrow size={13} className='text-neutral-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={assignerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {assignerName}
        </span>{' '}
        sent assignment request to{' '}
        <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
          {assigneeName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

// Assignment Accepted Event
export function AssignmentAcceptedEvent({
  performerName,
  date
}: {
  performerName: string
  date: string
}) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <CheckCircle2 size={12} className='text-green-500 sm:hidden' />
          <CheckCircle2 size={13} className='text-green-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        accepted assignment request on {date}
      </p>
    </div>
  )
}

// Assignment Rejected Event
export function AssignmentRejectedEvent({
  performerName,
  assignerName,
  date,
  reason
}: {
  performerName: string
  assignerName: string
  date: string
  reason?: string
}) {
  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <XCircle size={12} className='text-red-500 sm:hidden' />
          <XCircle size={13} className='text-red-500 hidden sm:block' />
        </div>
      </div>
      <div className='flex-1 min-w-0'>
        <p className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
          <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
            {performerName}
          </span>{' '}
          rejected assignment from{' '}
          <span className='text-blue-600'>{assignerName}</span> on {date}
        </p>
        {reason && (
          <div className='mt-2 p-2 bg-red-50 border border-red-100 rounded-lg'>
            <p className='texts-body-small text-(--text-secondary)'>
              <span className='texts-body-small-medium text-red-600'>Reason:</span> {reason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Self Assigned Event
export function AssignmentSelfAssignedEvent({
  performerName,
  date
}: {
  performerName: string
  date: string
}) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <CheckCircle2 size={12} className='text-green-500 sm:hidden' />
          <CheckCircle2 size={13} className='text-green-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        assigned themselves to this task on {date}
      </p>
    </div>
  )
}

// Assignment Cancelled Event (also used for unassign)
export function AssignmentCancelledEvent({
  performerName,
  assigneeName,
  date,
  unassignReason,
  isSelfUnassign
}: {
  performerName: string
  assigneeName: string
  date: string
  unassignReason?: string
  isSelfUnassign?: boolean
}) {
  // Determine if this is an unassign action (has reason) or cancel pending request
  const isUnassign = !!unassignReason

  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <XCircle size={12} className='text-neutral-500 sm:hidden' />
          <XCircle size={13} className='text-neutral-500 hidden sm:block' />
        </div>
      </div>
      <div className='flex-1 min-w-0'>
        <p className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
          <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
            {performerName}
          </span>{' '}
          {isUnassign ? (
            isSelfUnassign ? (
              <>unassigned themselves from this task</>
            ) : (
              <>
                unassigned <span className='text-blue-600'>{assigneeName}</span> from this task
              </>
            )
          ) : (
            <>
              cancelled assignment request to <span className='text-blue-600'>{assigneeName}</span>
            </>
          )}{' '}
          on {date}
        </p>
        {unassignReason && (
          <div className='mt-2 p-2 bg-neutral-50 border border-neutral-200 rounded-lg'>
            <p className='texts-body-small text-(--text-secondary)'>
              <span className='texts-body-small-medium text-neutral-600'>Reason:</span> {unassignReason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Status Changed Event
export function StatusChangedEvent({
  performerName,
  newStatus,
  date,
  isSystem = false
}: {
  performerName: string
  newStatus: string
  date: string
  isSystem?: boolean
}) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    'In Progress': { bg: 'bg-blue-100', text: 'text-blue-600' },
    Completed: { bg: 'bg-green-100', text: 'text-green-600' },
    'Revision Requested': { bg: 'bg-amber-100', text: 'text-amber-600' },
    Cancelled: { bg: 'bg-neutral-100', text: 'text-neutral-600' }
  }

  const colors = statusColors[newStatus] || { bg: 'bg-neutral-100', text: 'text-neutral-600' }

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <Zap size={12} className='text-blue-500 sm:hidden' />
          <Zap size={13} className='text-blue-500 hidden sm:block' />
        </div>
      </div>
      {!isSystem && (
        <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      )}
      <div className='texts-label-small sm:texts-body-small text-(--text-secondary) flex items-center gap-1 sm:gap-1.5 flex-wrap flex-1 min-w-0'>
        {isSystem ? (
          <>
            Status updated to{' '}
            <span className={`texts-label-small sm:texts-body-small-medium ${colors.text} ${colors.bg} px-1.5 sm:px-2 py-0.5 rounded`}>
              {newStatus}
            </span>{' '}
            on {date}
            <HoverTooltip content='Status was automatically updated by the system' variant='description'>
              <Info size={14} className='text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors ml-0.5' />
            </HoverTooltip>
          </>
        ) : (
          <>
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
              {performerName}
            </span>{' '}
            updated status to{' '}
            <span className={`texts-label-small sm:texts-body-small-medium ${colors.text} ${colors.bg} px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]`}>
              {newStatus}
            </span>{' '}
            on {date}
          </>
        )}
      </div>
    </div>
  )
}

// Report Submitted Event
export function ReportSubmittedEvent({
  performerName,
  performerAvatar,
  date,
  message,
  attachment
}: {
  performerName: string
  performerAvatar?: string
  date: string
  message: string
  attachment?: { name: string; url: string }
}) {
  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar name={performerName} imgSrc={performerAvatar} size={40} className='text-xs' />
      </div>
      <div className='flex-1 min-w-0 border border-(--border-default) rounded-lg overflow-hidden bg-white'>
        <div className='bg-green-50/80 border-b border-green-200/60 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center gap-1 sm:gap-2'>
          <FileText size={14} className='text-green-600' />
          <span className='texts-body-small-medium sm:texts-body-medium-medium text-(--text-primary)'>
            {performerName}
          </span>
          <span className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            submitted a report on {date}
          </span>
        </div>
        <div className='px-3 sm:px-4 py-3 sm:py-4'>
          <p className='texts-body-small sm:texts-body-medium text-(--text-primary) whitespace-pre-line leading-relaxed'>
            {message}
          </p>
          {attachment && (
            <FileAttachment url={attachment.url} fileName={attachment.name} className='mt-3 sm:mt-4' />
          )}
        </div>
      </div>
    </div>
  )
}

// Comment Event
export function CommentEvent({
  performerName,
  performerAvatar,
  date,
  message,
  attachment
}: {
  performerName: string
  performerAvatar?: string
  date: string
  message: string
  attachment?: { name: string; url: string }
}) {
  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar name={performerName} imgSrc={performerAvatar} size={40} className='text-xs' />
      </div>
      <div className='flex-1 min-w-0 border border-(--border-default) rounded-lg overflow-hidden bg-white'>
        <div className='bg-neutral-50 border-b border-(--border-default) px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center gap-1 sm:gap-2'>
          <span className='texts-body-small-medium sm:texts-body-medium-medium text-(--text-primary)'>
            {performerName}
          </span>
          <span className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            {date}
          </span>
        </div>
        <div className='px-3 sm:px-4 py-3 sm:py-4'>
          <p className='texts-body-small sm:texts-body-medium text-(--text-primary) whitespace-pre-line leading-relaxed'>
            {message}
          </p>
          {attachment && (
            <FileAttachment url={attachment.url} fileName={attachment.name} className='mt-3 sm:mt-4' />
          )}
        </div>
      </div>
    </div>
  )
}

// Preparation Tasks Created Event
export function PreparationTasksCreatedEvent({
  performerName,
  date,
  taskCount
}: {
  performerName: string
  date: string
  taskCount: number
}) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <Plus size={12} className='text-purple-500 sm:hidden' />
          <Plus size={13} className='text-purple-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        created{' '}
        <span className='texts-label-small sm:texts-body-small-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded'>
          {taskCount} preparation task{taskCount > 1 ? 's' : ''}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

// Refund Decision Event
export function RefundDecisionEvent({
  performerName,
  date,
  decision,
  amount,
  originalDeposit
}: {
  performerName: string
  date: string
  decision: 'full' | 'partial' | 'burn'
  amount?: number
  originalDeposit: number
}) {
  const decisionText = {
    full: 'Full Refund',
    partial: 'Partial Refund',
    burn: 'Deposit Forfeited'
  }

  const decisionColors = {
    full: { bg: 'bg-green-100', text: 'text-green-600' },
    partial: { bg: 'bg-amber-100', text: 'text-amber-600' },
    burn: { bg: 'bg-red-100', text: 'text-red-600' }
  }

  const colors = decisionColors[decision]

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${colors.bg} border-2 border-white shadow-sm flex items-center justify-center`}>
          <DollarSign size={12} className={`${colors.text} sm:hidden`} />
          <DollarSign size={13} className={`${colors.text} hidden sm:block`} />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <div className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        set refund decision to{' '}
        <span className={`texts-label-small sm:texts-body-small-medium ${colors.text} ${colors.bg} px-1.5 py-0.5 rounded`}>
          {decisionText[decision]}
        </span>
        {amount !== undefined && decision !== 'burn' && (
          <span className='ml-1'>
            (RM {amount.toFixed(2)} of RM {originalDeposit.toFixed(2)})
          </span>
        )}
        {' '}on {date}
      </div>
    </div>
  )
}

// Revision Requested Event
export function RevisionRequestedEvent({
  performerName,
  date,
  reason
}: {
  performerName: string
  date: string
  reason: string
}) {
  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar name={performerName} size={40} className='text-xs' />
      </div>
      <div className='flex-1 min-w-0 border border-red-200 rounded-lg overflow-hidden bg-white'>
        <div className='bg-red-50 border-b border-red-200 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center gap-1 sm:gap-2'>
          <RotateCcw size={14} className='text-red-600' />
          <span className='texts-body-small-medium sm:texts-body-medium-medium text-(--text-primary)'>
            {performerName}
          </span>
          <span className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            requested revision on {date}
          </span>
        </div>
        <div className='px-3 sm:px-4 py-3 sm:py-4'>
          <p className='texts-body-small sm:texts-body-medium text-(--text-primary) whitespace-pre-line leading-relaxed'>
            {reason}
          </p>
        </div>
      </div>
    </div>
  )
}

// Main Timeline Component
type Props = {
  events: TaskTimelineEvent[]
  showAddComment?: boolean
}

export default function TaskTimeline({ events }: Props) {
  const totalEvents = events.length

  const renderEvent = (event: TaskTimelineEvent) => {
    switch (event.type) {
      case 'task_created':
        return (
          <div className='pb-2'>
            <TaskCreatedEvent
              performerName={event.performerName}
              performerAvatar={event.performerAvatar}
              date={event.date}
              message={event.data?.message}
            />
          </div>
        )
      case 'assignment_sent':
        return (
          <AssignmentSentEvent
            assignerName={event.performerName}
            assigneeName={event.data?.assigneeName || 'Unknown'}
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
      case 'assignment_rejected':
        return (
          <AssignmentRejectedEvent
            performerName={event.performerName}
            assignerName={event.data?.assignerName || 'Unknown'}
            date={event.date}
            reason={event.data?.rejectionReason}
          />
        )
      case 'assignment_self_assigned':
        return (
          <AssignmentSelfAssignedEvent
            performerName={event.performerName}
            date={event.date}
          />
        )
      case 'assignment_cancelled':
        return (
          <AssignmentCancelledEvent
            performerName={event.performerName}
            assigneeName={event.data?.assigneeName || 'Unknown'}
            date={event.date}
            unassignReason={event.data?.unassignReason}
            isSelfUnassign={event.data?.isSelfUnassign}
          />
        )
      case 'status_changed':
        return (
          <StatusChangedEvent
            performerName={event.performerName}
            newStatus={event.data?.newStatus || 'Unknown'}
            date={event.date}
            isSystem={event.performerId === 'system'}
          />
        )
      case 'report_submitted':
        return (
          <div className='py-2'>
            <ReportSubmittedEvent
              performerName={event.performerName}
              performerAvatar={event.performerAvatar}
              date={event.date}
              message={event.data?.message || ''}
              attachment={event.data?.attachment}
            />
          </div>
        )
      case 'comment':
        return (
          <div className='py-2'>
            <CommentEvent
              performerName={event.performerName}
              performerAvatar={event.performerAvatar}
              date={event.date}
              message={event.data?.message || ''}
              attachment={event.data?.attachment}
            />
          </div>
        )
      case 'preparation_tasks_created':
        return (
          <PreparationTasksCreatedEvent
            performerName={event.performerName}
            date={event.date}
            taskCount={event.data?.preparationTaskCount || 0}
          />
        )
      case 'refund_decision':
        return (
          <RefundDecisionEvent
            performerName={event.performerName}
            date={event.date}
            decision={event.data?.refundDecision || 'full'}
            amount={event.data?.refundAmount}
            originalDeposit={3000} // This should come from workflow
          />
        )
      case 'revision_requested':
        return (
          <div className='py-2'>
            <RevisionRequestedEvent
              performerName={event.performerName}
              date={event.date}
              reason={event.data?.rejectionReason || ''}
            />
          </div>
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
          const hasLeftElement =
            event.type !== 'task_created' &&
            event.type !== 'comment' &&
            event.type !== 'report_submitted' &&
            event.type !== 'revision_requested'

          return (
            <TimelineEventWrapper
              key={event.id}
              isLast={isLast}
              hasLeftElement={hasLeftElement}
            >
              {renderEvent(event)}
            </TimelineEventWrapper>
          )
        })}
      </div>
    </div>
  )
}
