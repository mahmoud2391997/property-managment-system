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
  UserMinus,
  Ban,
  Tag
} from 'lucide-react'

// Types
export type TicketAttachment = {
  name: string
  url: string
}

export type OpenedEventData = {
  creatorName: string
  creatorAvatar?: string
  date: string
  description: string
  attachment?: TicketAttachment
}

export type AssignmentSentEventData = {
  assignerName: string
  visibleAssignerAvatar?: string
  assignedName: string
  date: string
}

export type AssignmentRejectedEventData = {
  performerName: string
  performerAvatar?: string
  fromName: string
  date: string
}

export type AssignmentAcceptedEventData = {
  performerName: string
  performerAvatar?: string
  date: string
}

export type AssignmentUnassignedEventData = {
  performerName: string
  performerAvatar?: string
  unassignedByName?: string
  date: string
}

export type AssignmentCancelledEventData = {
  assignerName: string
  assignedName: string
  cancelledByName?: string
  date: string
}

export type AssignmentSelfAssignedEventData = {
  performerName: string
  performerAvatar?: string
  date: string
}

export type StatusChangedSystemEventData = {
  newStatus: string
  date: string
}

export type StatusChangedByUserEventData = {
  performerName: string
  performerAvatar?: string
  newStatus: string
  note?: string
  date: string
}

export type CommentEventData = {
  performerName: string
  performerAvatar?: string
  date: string
  message: string
  attachment?: TicketAttachment
}

export type TypeSetEventData = {
  performerName: string
  performerAvatar?: string
  typeName: string
  date: string
}

export type TypeChangedEventData = {
  performerName: string
  performerAvatar?: string
  typeName: string
  date: string
}

// Timeline Event Components
export function OpenedEvent ({
  creatorName,
  creatorAvatar,
  date,
  description,
  attachment
}: OpenedEventData) {
  return (
    <div className='flex gap-2 sm:gap-4'>
      {/* Desktop: user avatar */}
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar name={creatorName} imgSrc={creatorAvatar} size={40} />
      </div>
      <div className='flex-1 min-w-0 border border-(--border-default) rounded-lg overflow-hidden bg-white'>
        <div className='bg-amber-50/80 border-b border-amber-200/60 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center gap-1 sm:gap-2'>
          <span className='texts-body-small-medium sm:texts-body-medium-medium text-(--text-primary)'>
            {creatorName}
          </span>
          <span className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            opened on {date}
          </span>
        </div>
        <div className='px-3 sm:px-4 py-3 sm:py-4'>
          <p className='texts-body-small sm:texts-body-medium text-(--text-primary) mb-3 sm:mb-4 leading-relaxed'>
            {description}
          </p>
          {attachment && (
            <FileAttachment url={attachment.url} fileName={attachment.name} />
          )}
        </div>
      </div>
    </div>
  )
}

export function AssignmentSentEvent ({
  assignerName,
  assignedName,
  date
}: AssignmentSentEventData) {
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
          {assignedName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

export function AssignmentRejectedEvent ({
  performerName,
  fromName,
  date
}: AssignmentRejectedEventData) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <XCircle size={12} className='text-red-500 sm:hidden' />
          <XCircle size={13} className='text-red-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        rejected assignment request from{' '}
        <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
          {fromName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

export function AssignmentAcceptedEvent ({
  performerName,
  date
}: AssignmentAcceptedEventData) {
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

export function AssignmentUnassignedEvent ({
  performerName,
  unassignedByName,
  date
}: AssignmentUnassignedEventData) {
  // Determine if self-unassigned or unassigned by someone else
  const isSelfUnassign = !unassignedByName || unassignedByName === performerName

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <UserMinus size={12} className='text-orange-500 sm:hidden' />
          <UserMinus size={13} className='text-orange-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar
        name={unassignedByName || performerName}
        size={22}
        className='text-xs shrink-0 hidden sm:flex'
      />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        {isSelfUnassign ? (
          <>
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
              {performerName}
            </span>{' '}
            unassigned themselves from this ticket on {date}
          </>
        ) : (
          <>
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
              {unassignedByName}
            </span>{' '}
            unassigned{' '}
            <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
              {performerName}
            </span>{' '}
            from this ticket on {date}
          </>
        )}
      </p>
    </div>
  )
}

export function AssignmentCancelledEvent ({
  assignerName,
  assignedName,
  cancelledByName,
  date
}: AssignmentCancelledEventData) {
  // Determine who cancelled - the assigner or someone else
  const canceller = cancelledByName || assignerName
  const isCancelledByAssigner =
    !cancelledByName || cancelledByName === assignerName

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <Ban size={12} className='text-neutral-500 sm:hidden' />
          <Ban size={13} className='text-neutral-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={canceller} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {canceller}
        </span>{' '}
        cancelled{' '}
        {!isCancelledByAssigner && (
          <>
            <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
              {assignerName}
            </span>
            's{' '}
          </>
        )}
        assignment request to{' '}
        <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
          {assignedName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

export function AssignmentSelfAssignedEvent ({
  performerName,
  date
}: AssignmentSelfAssignedEventData) {
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
        assigned themselves to this ticket on {date}
      </p>
    </div>
  )
}

export function StatusChangedSystemEvent ({
  newStatus,
  date
}: StatusChangedSystemEventData) {
  const isClosed = newStatus === 'Closed'

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        {isClosed ? (
          <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-200 border-2 border-white shadow-sm flex items-center justify-center'>
            <XCircle size={12} className='text-neutral-600 sm:hidden' />
            <XCircle size={13} className='text-neutral-600 hidden sm:block' />
          </div>
        ) : (
          <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center'>
            <Zap size={12} className='text-blue-500 sm:hidden' />
            <Zap size={13} className='text-blue-500 hidden sm:block' />
          </div>
        )}
      </div>
      <div className='texts-label-small sm:texts-body-small text-(--text-secondary) flex items-center gap-1 sm:gap-1.5 flex-wrap flex-1 min-w-0'>
        {isClosed ? (
          <>
            Ticket was closed on {date}
            <HoverTooltip
              content='This ticket was automatically closed because the lease ended'
              variant='description'
            >
              <Info
                size={14}
                className='text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors ml-0.5'
              />
            </HoverTooltip>
          </>
        ) : (
          <>
            Status updated to{' '}
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary) bg-neutral-100 px-1.5 sm:px-2 py-0.5 rounded'>
              {newStatus}
            </span>{' '}
            on {date}
            <HoverTooltip
              content='Status was automatically updated by the system'
              variant='description'
            >
              <Info
                size={14}
                className='text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors ml-0.5'
              />
            </HoverTooltip>
          </>
        )}
      </div>
    </div>
  )
}

export function StatusChangedByUserEvent ({
  performerName,
  newStatus,
  note,
  date
}: StatusChangedByUserEventData) {
  // Determine icon and tooltip based on status
  const isClosed = newStatus.toLowerCase() === 'closed'
  const isPendingConfirmation =
    newStatus.toLowerCase() === 'pending tenant confirmation'

  const getStatusStyle = () => {
    if (isClosed) {
      return {
        bgColor: 'bg-neutral-200',
        iconColor: 'text-neutral-600',
        Icon: XCircle,
        tooltip: 'This ticket was closed by staff'
      }
    }
    if (isPendingConfirmation) {
      return {
        bgColor: 'bg-amber-100',
        iconColor: 'text-amber-600',
        Icon: Clock,
        tooltip: 'Awaiting tenant confirmation to close the ticket'
      }
    }
    return {
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      Icon: Info,
      tooltip: 'Status was updated by user'
    }
  }

  const { bgColor, iconColor, Icon, tooltip } = getStatusStyle()

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${bgColor} border-2 border-white shadow-sm flex items-center justify-center`}
        >
          <Icon size={12} className={`${iconColor} sm:hidden`} />
          <Icon size={13} className={`${iconColor} hidden sm:block`} />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <div className='texts-label-small sm:texts-body-small text-(--text-secondary) flex items-center gap-1 sm:gap-1.5 flex-wrap flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        {isClosed ? 'closed this ticket' : 'updated status to'}{' '}
        {!isClosed && (
          <span className='texts-label-small sm:texts-body-small-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]'>
            {newStatus}
          </span>
        )}{' '}
        on {date}
        {note && (
          <span className='text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]'>
            ({note})
          </span>
        )}
        <HoverTooltip content={tooltip} variant='description'>
          <Info
            size={13}
            className='text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors'
          />
        </HoverTooltip>
      </div>
    </div>
  )
}

export function CommentEvent ({
  performerName,
  performerAvatar,
  date,
  message,
  attachment
}: CommentEventData) {
  return (
    <div className='flex gap-2 sm:gap-4'>
      {/* Desktop: user avatar */}
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar
          name={performerName}
          imgSrc={performerAvatar}
          size={40}
          className='text-xs'
        />
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
            <FileAttachment
              url={attachment.url}
              fileName={attachment.name}
              className='mt-3 sm:mt-4'
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function TypeSetEvent ({
  performerName,
  typeName,
  date
}: TypeSetEventData) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <Tag size={12} className='text-purple-500 sm:hidden' />
          <Tag size={13} className='text-purple-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        set type to{' '}
        <span className='texts-label-small sm:texts-body-small-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]'>
          {typeName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

export function TypeChangedEvent ({
  performerName,
  typeName,
  date
}: TypeChangedEventData) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <Tag size={12} className='text-purple-500 sm:hidden' />
          <Tag size={13} className='text-purple-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        changed type to{' '}
        <span className='texts-label-small sm:texts-body-small-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]'>
          {typeName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

// Timeline wrapper that adds the connecting line
export function TimelineEventWrapper ({
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
      {/* Vertical line connecting to next event - hidden on mobile for card events without left element */}
      {!isLast && (
        <div className={`absolute left-[15px] sm:left-[19px] top-0 bottom-0 w-0.5 bg-neutral-200 ${hasLeftElement ? '' : 'hidden sm:block'}`} />
      )}
      {children}
    </div>
  )
}
