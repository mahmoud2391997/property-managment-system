'use client'

import { UserAvatar } from '@/components/costume-ui/name-avatar'
import FileAttachment from '@/components/costume-ui/file-attachment'
import {
  GitPullRequestArrow,
  CheckCircle2,
  XCircle,
  Ban,
  FileText,
  Tag,
  AlertTriangle,
  Info,
  Zap,
  CalendarPlus,
  CalendarClock,
  CalendarX
} from 'lucide-react'
import HoverTooltip from '@/components/costume-ui/tooltip'
import type { TimelineEvent } from '../types'
import { formatDate } from '../types'

type Props = {
  events: TimelineEvent[]
}

// Timeline wrapper that adds the connecting line
function TimelineEventWrapper ({
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
      {/* Vertical line connecting to next event */}
      {!isLast && (
        <div
          className={`absolute left-[15px] sm:left-[19px] top-0 bottom-0 w-0.5 bg-neutral-200 ${
            hasLeftElement ? '' : 'hidden sm:block'
          }`}
        />
      )}
      {children}
    </div>
  )
}

// Task Created Event (card style like OpenedEvent)
function TaskCreatedEvent ({
  performerName,
  performerAvatar,
  date,
  description
}: {
  performerName: string
  performerAvatar?: string
  date: string
  description?: string
}) {
  return (
    <div className='flex gap-2 sm:gap-4 pb-2'>
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar
          name={performerName}
          imgSrc={performerAvatar}
          size={40}
          className='text-md'
        />
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
        {description && (
          <div className='px-3 sm:px-4 py-3 sm:py-4'>
            <p className='texts-body-small sm:texts-body-medium text-(--text-primary) leading-relaxed'>
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Assignment Sent Event
function AssignmentSentEvent ({
  assignerName,
  assignedName,
  date
}: {
  assignerName: string
  assignedName: string
  date: string
}) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <GitPullRequestArrow
            size={12}
            className='text-neutral-500 sm:hidden'
          />
          <GitPullRequestArrow
            size={13}
            className='text-neutral-500 hidden sm:block'
          />
        </div>
      </div>
      <div className='flex items-center gap-1.5'>
        <UserAvatar
          name={assignerName}
          size={23}
          className='text-[10px] shrink-0 hidden sm:flex'
        />
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
    </div>
  )
}

// Assignment Accepted Event
function AssignmentAcceptedEvent ({
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
      <div className='flex items-center gap-1.5'>
        <UserAvatar
          name={performerName}
          size={23}
          className='text-[10px] shrink-0 hidden sm:flex'
        />
        <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
          <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
            {performerName}
          </span>{' '}
          accepted assignment request on {date}
        </p>
      </div>
    </div>
  )
}

// Assignment Rejected Event
function AssignmentRejectedEvent ({
  performerName,
  performerAvatar,
  reason,
  date
}: {
  performerName: string
  performerAvatar?: string
  reason?: string
  date: string
}) {
  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <XCircle size={12} className='text-red-500 sm:hidden' />
          <XCircle size={13} className='text-red-500 hidden sm:block' />
        </div>
      </div>
      <div className='flex-1 mt-0.5 min-w-0'>
        <div className='flex items-center gap-1.5'>
          <UserAvatar
            name={performerName}
            imgSrc={performerAvatar}
            size={24}
            className='text-[10px] shrink-0 hidden sm:flex'
          />
          <p className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
              {performerName}
            </span>{' '}
            rejected assignment request on {date}
          </p>
        </div>
        {reason && (
          <div className='mt-1 ml-5 p-2 bg-red-50 border border-red-100 rounded-lg flex-1 max-w-150'>
            <p className='texts-body-small text-(--text-secondary)'>
              <span className='texts-body-small-medium text-red-600'>
                Reason:
              </span>{' '}
              {reason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Assignment Self-Assigned Event
function AssignmentSelfAssignedEvent ({
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
      <div className='flex items-center gap-1.5'>
        <UserAvatar
          name={performerName}
          size={23}
          className='text-[10px] shrink-0 hidden sm:flex'
        />
        <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
          <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
            {performerName}
          </span>{' '}
          assigned themselves to this task on {date}
        </p>
      </div>
    </div>
  )
}

// Assignment Unassigned Event
function AssignmentUnassignedEvent ({
  performerName,
  performerAvatar,
  unassignedByName,
  unassignedByAvatar,
  reason,
  date
}: {
  performerName: string
  performerAvatar?: string
  unassignedByName?: string
  unassignedByAvatar?: string
  reason?: string
  date: string
}) {
  const isSelfUnassign = !unassignedByName || unassignedByName === performerName
  const reasonAuthorName = isSelfUnassign ? performerName : unassignedByName
  const reasonAuthorAvatar = isSelfUnassign
    ? performerAvatar
    : unassignedByAvatar

  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <XCircle size={12} className='text-neutral-500 sm:hidden' />
          <XCircle size={13} className='text-neutral-500 hidden sm:block' />
        </div>
      </div>
      <div className='flex-1 min-w-0 mt-0.5'>
        <div className='flex items-center gap-1.5'>
          <UserAvatar
            name={reasonAuthorName || performerName}
            imgSrc={reasonAuthorAvatar}
            size={24}
            className='text-[10px] shrink-0 hidden sm:flex'
          />
          <p className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            {isSelfUnassign ? (
              <>
                <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
                  {performerName}
                </span>{' '}
                unassigned themselves from this task on {date}
              </>
            ) : (
              <>
                <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
                  {unassignedByName}
                </span>{' '}
                unassigned{' '}
                <span className='text-blue-600'>{performerName}</span> from this
                task on {date}
              </>
            )}
          </p>
        </div>
        {reason && (
          <div className='mt-1 ml-5 p-2 bg-neutral-50 border border-neutral-200 rounded-lg flex-1 max-w-150'>
            <p className='texts-body-small text-(--text-secondary)'>
              <span className='texts-body-small-medium text-neutral-600'>
                Reason:
              </span>{' '}
              {reason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Assignment Cancelled Event
function AssignmentCancelledEvent ({
  cancelledByName,
  cancelledByAvatar,
  assignedName,
  reason,
  date
}: {
  cancelledByName?: string
  cancelledByAvatar?: string
  assignedName: string
  reason?: string
  date: string
}) {
  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <Ban size={12} className='text-neutral-500 sm:hidden' />
          <Ban size={13} className='text-neutral-500 hidden sm:block' />
        </div>
      </div>
      <div className='flex-1 min-w-0 mt-0.5'>
        <div className='flex items-center gap-1.5'>
          <UserAvatar
            name={cancelledByName || 'System'}
            imgSrc={cancelledByAvatar}
            size={24}
            className='text-[10px] shrink-0 hidden sm:flex'
          />
          <p className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
              {cancelledByName || 'System'}
            </span>{' '}
            cancelled assignment request to{' '}
            <span className='text-blue-600'>{assignedName}</span> on {date}
          </p>
        </div>
        {reason && (
          <div className='mt-1 ml-5 p-2 bg-neutral-50 border border-neutral-200 rounded-lg flex-1 max-w-150'>
            <p className='texts-body-small text-(--text-secondary)'>
              <span className='texts-body-small-medium text-neutral-600'>
                Reason:
              </span>{' '}
              {reason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Status Changed Event (system-triggered)
function StatusChangedEvent ({
  newValue,
  date
}: {
  newValue?: string
  date: string
}) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <Zap size={12} className='text-blue-500 sm:hidden' />
          <Zap size={13} className='text-blue-500 hidden sm:block' />
        </div>
      </div>
      <div className='texts-label-small sm:texts-body-small text-(--text-secondary) flex items-center gap-1 sm:gap-1.5 flex-wrap flex-1 min-w-0'>
        Status updated to{' '}
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary) bg-neutral-100 px-1.5 sm:px-2 py-0.5 rounded'>
          {newValue}
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
      </div>
    </div>
  )
}

// Type Changed Event
function TypeChangedEvent ({
  performerName,
  newValue,
  date
}: {
  performerName: string
  newValue?: string
  date: string
}) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <Tag size={12} className='text-purple-500 sm:hidden' />
          <Tag size={13} className='text-purple-500 hidden sm:block' />
        </div>
      </div>
      <div className='flex items-center gap-1.5'>
        <UserAvatar
          name={performerName}
          size={23}
          className='text-[10px] shrink-0 hidden sm:flex'
        />
        <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
          <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
            {performerName}
          </span>{' '}
          changed type to{' '}
          <span className='texts-label-small sm:texts-body-small-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]'>
            {newValue}
          </span>{' '}
          on {date}
        </p>
      </div>
    </div>
  )
}

// Priority Changed Event
function PriorityChangedEvent ({
  performerName,
  newValue,
  date
}: {
  performerName: string
  newValue?: string
  date: string
}) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <AlertTriangle size={12} className='text-amber-500 sm:hidden' />
          <AlertTriangle size={13} className='text-amber-500 hidden sm:block' />
        </div>
      </div>
      <div className='flex items-center gap-1.5'>
        <UserAvatar
          name={performerName}
          size={23}
          className='text-[10px] shrink-0 hidden sm:flex'
        />
        <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
          <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
            {performerName}
          </span>{' '}
          changed priority to{' '}
          <span className='texts-label-small sm:texts-body-small-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]'>
            {newValue}
          </span>{' '}
          on {date}
        </p>
      </div>
    </div>
  )
}

// Comment Event (card style)
function CommentEventCard ({
  performerName,
  performerAvatar,
  date,
  message,
  attachment
}: {
  performerName: string
  performerAvatar?: string
  date: string
  message?: string
  attachment?: { name: string; url: string }
}) {
  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar
          name={performerName}
          imgSrc={performerAvatar}
          size={40}
          className='text-md'
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
          {message && (
            <p className='texts-body-small sm:texts-body-medium text-(--text-primary) whitespace-pre-line leading-relaxed'>
              {message}
            </p>
          )}
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

// Report Submitted Event (card style like comment but green)
function ReportSubmittedEvent ({
  performerName,
  performerAvatar,
  date,
  message,
  attachment
}: {
  performerName: string
  performerAvatar?: string
  date: string
  message?: string
  attachment?: { name: string; url: string }
}) {
  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar
          name={performerName}
          imgSrc={performerAvatar}
          size={40}
          className='text-md'
        />
      </div>
      <div className='flex-1 min-w-0 border border-green-200 rounded-lg overflow-hidden bg-white'>
        <div className='bg-green-50 border-b border-green-200 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center gap-1 sm:gap-2'>
          <FileText size={14} className='text-green-600' />
          <span className='texts-body-small-medium sm:texts-body-medium-medium text-green-700'>
            {performerName}
          </span>
          <span className='texts-label-small sm:texts-body-small text-green-600'>
            submitted resolution report on {date}
          </span>
        </div>
        <div className='px-3 sm:px-4 py-3 sm:py-4'>
          {message && (
            <p className='texts-body-small sm:texts-body-medium text-(--text-primary) whitespace-pre-line leading-relaxed'>
              {message}
            </p>
          )}
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

// Due Date Set Event
function DueDateSetEvent ({
  performerName,
  dueDate,
  date
}: {
  performerName: string
  dueDate?: string
  date: string
}) {
  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : ''

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <CalendarPlus size={12} className='text-green-500 sm:hidden' />
          <CalendarPlus size={13} className='text-green-500 hidden sm:block' />
        </div>
      </div>
      <div className='flex items-center gap-1.5'>
        <UserAvatar
          name={performerName}
          size={23}
          className='text-[10px] shrink-0 hidden sm:flex'
        />
        <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
          <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
            {performerName}
          </span>{' '}
          set due date to{' '}
          <span className='texts-label-small sm:texts-body-small-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded'>
            {formattedDueDate}
          </span>{' '}
          on {date}
        </p>
      </div>
    </div>
  )
}

// Due Date Changed Event
function DueDateChangedEvent ({
  performerName,
  performerAvatar,
  oldDueDate,
  newDueDate,
  reason,
  date
}: {
  performerName: string
  performerAvatar?: string
  oldDueDate?: string
  newDueDate?: string
  reason?: string
  date: string
}) {
  const formattedNewDueDate = newDueDate
    ? new Date(newDueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : ''

  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <CalendarClock size={12} className='text-blue-500 sm:hidden' />
          <CalendarClock size={13} className='text-blue-500 hidden sm:block' />
        </div>
      </div>
      <div className='flex-1 min-w-0 mt-0.5'>
        <div className='flex items-center gap-1.5'>
          <UserAvatar
            name={performerName}
            imgSrc={performerAvatar}
            size={24}
            className='text-[10px] shrink-0 hidden sm:flex'
          />
          <p className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
              {performerName}
            </span>{' '}
            changed due date to{' '}
            <span className='texts-label-small sm:texts-body-small-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded'>
              {formattedNewDueDate}
            </span>{' '}
            on {date}
          </p>
        </div>
        {reason && (
          <div className='mt-1 ml-5 p-2 bg-blue-50 border border-blue-100 rounded-lg flex-1 max-w-150'>
            <p className='texts-body-small text-(--text-secondary)'>
              <span className='texts-body-small-medium text-blue-600'>
                Reason:
              </span>{' '}
              {reason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Due Date Removed Event
function DueDateRemovedEvent ({
  performerName,
  performerAvatar,
  reason,
  date
}: {
  performerName: string
  performerAvatar?: string
  reason?: string
  date: string
}) {
  return (
    <div className='flex gap-2 sm:gap-4 py-2'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <CalendarX size={12} className='text-neutral-500 sm:hidden' />
          <CalendarX size={13} className='text-neutral-500 hidden sm:block' />
        </div>
      </div>
      <div className='flex-1 min-w-0 mt-0.5'>
        <div className='flex items-center gap-1.5'>
          <UserAvatar
            name={performerName}
            imgSrc={performerAvatar}
            size={24}
            className='text-[10px] shrink-0 hidden sm:flex'
          />
          <p className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
              {performerName}
            </span>{' '}
            removed due date on {date}
          </p>
        </div>
        {reason && (
          <div className='mt-1 ml-5 p-2 bg-neutral-50 border border-neutral-200 rounded-lg flex-1 max-w-150'>
            <p className='texts-body-small text-(--text-secondary)'>
              <span className='texts-body-small-medium text-neutral-600'>
                Reason:
              </span>{' '}
              {reason}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TaskTimeline ({ events }: Props) {
  const totalEvents = events.length

  const renderEvent = (event: TimelineEvent) => {
    const date = formatDate(event.timestamp)

    switch (event.type) {
      case 'task_created':
        return (
          <TaskCreatedEvent
            performerName={event.performerName}
            performerAvatar={event.performerAvatar}
            date={date}
            description={event.message}
          />
        )

      case 'assignment_sent':
        return (
          <AssignmentSentEvent
            assignerName={event.assignerName || event.performerName}
            assignedName={event.assignedName || ''}
            date={date}
          />
        )

      case 'assignment_accepted':
        return (
          <AssignmentAcceptedEvent
            performerName={event.performerName}
            date={date}
          />
        )

      case 'assignment_rejected':
        return (
          <AssignmentRejectedEvent
            performerName={event.performerName}
            performerAvatar={event.performerAvatar}
            reason={event.rejectionReason}
            date={date}
          />
        )

      case 'assignment_self_assigned':
        return (
          <AssignmentSelfAssignedEvent
            performerName={event.performerName}
            date={date}
          />
        )

      case 'assignment_unassigned':
        return (
          <AssignmentUnassignedEvent
            performerName={event.performerName}
            performerAvatar={event.performerAvatar}
            unassignedByName={event.unassignedByName}
            reason={event.unassignReason}
            date={date}
          />
        )

      case 'assignment_cancelled':
        return (
          <AssignmentCancelledEvent
            cancelledByName={event.cancelledByName}
            cancelledByAvatar={event.performerAvatar}
            assignedName={event.assignedName || ''}
            reason={event.cancelReason}
            date={date}
          />
        )

      case 'status_changed':
        return (
          <StatusChangedEvent
            newValue={event.newValue}
            date={date}
          />
        )

      case 'type_changed':
        return (
          <TypeChangedEvent
            performerName={event.performerName}
            newValue={event.newValue}
            date={date}
          />
        )

      case 'priority_changed':
        return (
          <PriorityChangedEvent
            performerName={event.performerName}
            newValue={event.newValue}
            date={date}
          />
        )

      case 'comment':
        return (
          <CommentEventCard
            performerName={event.performerName}
            performerAvatar={event.performerAvatar}
            date={date}
            message={event.message}
            attachment={event.attachment}
          />
        )

      case 'report_submitted':
        return (
          <ReportSubmittedEvent
            performerName={event.performerName}
            performerAvatar={event.performerAvatar}
            date={date}
            message={event.message}
            attachment={event.attachment}
          />
        )

      case 'due_date_set':
        return (
          <DueDateSetEvent
            performerName={event.performerName}
            dueDate={event.dueDate}
            date={date}
          />
        )

      case 'due_date_changed':
        return (
          <DueDateChangedEvent
            performerName={event.performerName}
            performerAvatar={event.performerAvatar}
            oldDueDate={event.oldDueDate}
            newDueDate={event.dueDate}
            reason={event.dueDateReason}
            date={date}
          />
        )

      case 'due_date_removed':
        return (
          <DueDateRemovedEvent
            performerName={event.performerName}
            performerAvatar={event.performerAvatar}
            reason={event.dueDateReason}
            date={date}
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
          // Card-style events (task_created, comment, report_submitted) don't have left icons on mobile
          const hasLeftElement =
            event.type !== 'task_created' &&
            event.type !== 'comment' &&
            event.type !== 'report_submitted'

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
