'use client'

import { useState } from 'react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import Button from '@/components/costume-ui/button'
import HoverTooltip from '@/components/costume-ui/tooltip'
import Select from '@/components/costume-ui/select'
import Combobox from '@/components/costume-ui/combobox'
import {
  Clock,
  Paperclip,
  Download,
  Info,
  GitPullRequestArrow,
  Zap,
  FileText,
  CheckCircle2,
  XCircle,
  X,
  Send,
  Loader2
} from 'lucide-react'

// Dummy Data
const dummyTicket = {
  id: 'xxx',
  reference_id: 'TK-20250003',
  title: 'Kitchen Sink Leaking',
  description:
    "The kitchen sink has been leaking under the cabinet for the past two days. Water is pooling and I'm concerned about potential water damage to the cabinet floor.",
  attachment: { name: 'sink_leak_photo.jpg', size: '2.4 MB' },
  created_at: 'Oct 15',
  created_by: { name: 'Ahmed Ali', avatar: '' },
  current_status: 'Pending Tenant Confirmation',
  assigned_to: { name: 'Mohammed Hafiz', avatar: '' },
  type: 'Maintenance'
}

const dummyTimeline = [
  { type: 'opened', performer: 'Ahmed Ali', date: 'Oct 15' },
  {
    type: 'assignment_sent',
    assigner: 'Ahmed Ali',
    assigned: 'Hamza Ahmed',
    date: 'Oct 19'
  },
  {
    type: 'assignment_rejected',
    performer: 'Hamza Ahmed',
    from: 'Ahmed Ali',
    date: 'Oct 19'
  },
  {
    type: 'assignment_sent',
    assigner: 'Ahmed Ali',
    assigned: 'Mohammed Ahmed',
    date: 'Oct 19'
  },
  {
    type: 'assignment_accepted',
    performer: 'Mohammed Ahmed',
    date: 'Oct 19'
  },
  {
    type: 'status_changed',
    new_status: 'In Progress',
    performer_type: 'system',
    date: 'Oct 19'
  },
  {
    type: 'comment',
    performer: 'Mohammed Ahmed',
    date: '3 days ago',
    message:
      "Hi Ahmed,\n\nThank you for reporting this issue. We'll arrange for maintenance to inspect the leak and assess any water damage under the sink. Please avoid using the kitchen sink until it's checked to prevent further damage. We'll update you once a technician is scheduled."
  },
  {
    type: 'status_changed',
    new_status: 'Marked As Complete',
    performer: 'Mohammed Ahmed',
    performer_type: 'user',
    note: 'pending tenant confirmation',
    date: 'Oct 19'
  }
]

// Dummy staff list for combobox
const dummyStaffList = [
  { id: '1', label: 'Mohammed Hafiz', subtitle: 'Maintenance' },
  { id: '2', label: 'Hamza Ahmed', subtitle: 'Maintenance' },
  { id: '3', label: 'Mohammed Ahmed', subtitle: 'Technician' },
  { id: '4', label: 'Ali Hassan', subtitle: 'Electrician' },
  { id: '5', label: 'Omar Farooq', subtitle: 'Plumber' }
]

// Timeline Event Components
function OpenedEvent({ ticket }: { ticket: typeof dummyTicket }) {
  return (
    <div className='flex gap-4'>
      <div className='relative z-10 shrink-0'>
        <UserAvatar name={ticket.created_by.name} size={40} />
      </div>
      <div className='flex-1 border border-(--border-default) rounded-lg overflow-hidden bg-white'>
        <div className='bg-amber-50/80 border-b border-amber-200/60 px-4 py-3 flex items-center gap-2'>
          <span className='texts-body-medium-medium text-(--text-primary)'>
            {ticket.created_by.name}
          </span>
          <span className='texts-body-small text-(--text-secondary)'>
            opened on {ticket.created_at}
          </span>
        </div>
        <div className='px-4 py-4'>
          <p className='texts-body-medium text-(--text-primary) mb-4 leading-relaxed'>
            {ticket.description}
          </p>
          <div className='flex items-center justify-between bg-(--background-secondary) border border-(--border-default) rounded-lg px-4 py-3 hover:bg-neutral-100 transition-colors cursor-pointer group'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-md bg-white border border-(--border-default) flex items-center justify-center'>
                <FileText size={16} className='text-(--text-secondary)' />
              </div>
              <span className='texts-body-small-medium text-(--text-primary)'>
                {ticket.attachment.name}
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <span className='texts-body-small text-(--text-secondary)'>
                {ticket.attachment.size}
              </span>
              <button className='hover:bg-neutral-200 p-1.5 rounded-md transition-colors'>
                <Download
                  size={16}
                  className='text-(--text-secondary) group-hover:text-(--text-primary)'
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AssignmentSentEvent({
  assigner,
  assigned,
  date
}: {
  assigner: string
  assigned: string
  date: string
}) {
  return (
    <div className='flex items-center gap-4 py-3'>
      <div className='relative z-10 w-10 flex justify-center shrink-0'>
        <div className='w-7 h-7 rounded-full bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <GitPullRequestArrow size={13} className='text-neutral-500' />
        </div>
      </div>
      <UserAvatar name={assigner} size={22} className='text-xs shrink-0' />
      <p className='texts-body-small text-(--text-secondary)'>
        <span className='texts-body-small-medium text-(--text-primary)'>
          {assigner}
        </span>{' '}
        sent assignment request to{' '}
        <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
          {assigned}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

function AssignmentRejectedEvent({
  performer,
  from,
  date
}: {
  performer: string
  from: string
  date: string
}) {
  return (
    <div className='flex items-center gap-4 py-3'>
      <div className='relative z-10 w-10 flex justify-center shrink-0'>
        <div className='w-7 h-7 rounded-full bg-red-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <XCircle size={13} className='text-red-500' />
        </div>
      </div>
      <UserAvatar name={performer} size={22} className='text-xs shrink-0' />
      <p className='texts-body-small text-(--text-secondary)'>
        <span className='texts-body-small-medium text-(--text-primary)'>
          {performer}
        </span>{' '}
        rejected assignment request from{' '}
        <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
          {from}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

function AssignmentAcceptedEvent({
  performer,
  date
}: {
  performer: string
  date: string
}) {
  return (
    <div className='flex items-center gap-4 py-3'>
      <div className='relative z-10 w-10 flex justify-center shrink-0'>
        <div className='w-7 h-7 rounded-full bg-green-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <CheckCircle2 size={13} className='text-green-500' />
        </div>
      </div>
      <UserAvatar name={performer} size={22} className='text-xs shrink-0' />
      <p className='texts-body-small text-(--text-secondary)'>
        <span className='texts-body-small-medium text-(--text-primary)'>
          {performer}
        </span>{' '}
        accepted assignment request on {date}
      </p>
    </div>
  )
}

function StatusChangedSystemEvent({
  new_status,
  date
}: {
  new_status: string
  date: string
}) {
  return (
    <div className='flex items-center gap-4 py-3'>
      <div className='relative z-10 w-10 flex justify-center shrink-0'>
        <div className='w-7 h-7 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <Zap size={13} className='text-blue-500' />
        </div>
      </div>
      <p className='texts-body-small text-(--text-secondary) flex items-center gap-1.5'>
        Status updated to{' '}
        <span className='texts-body-small-medium text-(--text-primary) bg-neutral-100 px-2 py-0.5 rounded'>
          {new_status}
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
      </p>
    </div>
  )
}

function CommentEvent({
  performer,
  date,
  message
}: {
  performer: string
  date: string
  message: string
}) {
  return (
    <div className='flex gap-4'>
      <div className='relative z-10 shrink-0'>
        <UserAvatar name={performer} size={40} className='text-xs' />
      </div>
      <div className='flex-1 border border-(--border-default) rounded-lg overflow-hidden bg-white'>
        <div className='bg-neutral-50 border-b border-(--border-default) px-4 py-3 flex items-center gap-2'>
          <span className='texts-body-medium-medium text-(--text-primary)'>
            {performer}
          </span>
          <span className='texts-body-small text-(--text-secondary)'>{date}</span>
        </div>
        <div className='px-4 py-4'>
          <p className='texts-body-medium text-(--text-primary) whitespace-pre-line leading-relaxed'>
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}

function StatusChangedByUserEvent({
  performer,
  new_status,
  note,
  date
}: {
  performer: string
  new_status: string
  note?: string
  date: string
}) {
  return (
    <div className='flex items-center gap-4 py-3'>
      <div className='relative z-10 w-10 flex justify-center shrink-0'>
        <div className='w-7 h-7 rounded-full bg-amber-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <Clock size={13} className='text-amber-600' />
        </div>
      </div>
      <UserAvatar name={performer} size={22} className='text-xs shrink-0' />
      <p className='texts-body-small text-(--text-secondary) flex items-center gap-1.5 flex-wrap'>
        <span className='texts-body-small-medium text-(--text-primary)'>
          {performer}
        </span>{' '}
        updated status to{' '}
        <span className='texts-body-small-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[12px]'>
          {new_status}
        </span>{' '}
        on {date}
        {note && (
          <span className='text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded text-[12px]'>
            ({note})
          </span>
        )}
        <HoverTooltip
          content='Status change pending tenant confirmation'
          variant='description'
        >
          <Info
            size={13}
            className='text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors'
          />
        </HoverTooltip>
      </p>
    </div>
  )
}

function AddCommentSection() {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className='flex gap-4'>
      <div className='shrink-0'>
        <UserAvatar name='Current User' size={40} />
      </div>
      <div className='flex-1'>
        <div
          className={`border rounded-lg overflow-hidden bg-white transition-all duration-200 ${
            isFocused
              ? 'border-neutral-400 ring-2 ring-neutral-100'
              : 'border-(--border-default)'
          }`}
        >
          <div className='bg-amber-50/80 border-b border-amber-200/60 px-4 py-2.5'>
            <span className='texts-body-small-medium text-(--text-primary)'>
              Add a message
            </span>
          </div>
          <div className='p-3'>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className='w-full min-h-[120px] texts-body-medium resize-none focus:outline-none placeholder:text-(--text-placeholder) bg-transparent'
              placeholder='Write your message here...'
            />
          </div>
          <div className='px-3 pb-3 flex items-center justify-between border-t border-(--border-light) pt-3'>
            <button className='flex items-center gap-2 texts-body-small text-(--text-secondary) hover:text-(--text-primary) transition-colors px-3 py-2 rounded-md hover:bg-neutral-100 border border-dashed border-(--border-default)'>
              <Paperclip size={15} />
              <span>Attach file</span>
            </button>
            <Button
              label='Comment'
              variant='primary'
              isResponsive={false}
              disabled={!message.trim()}
              className={!message.trim() ? 'opacity-50' : ''}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Staff Assignment States
type AssignmentState = 'assigned' | 'pending_request' | 'unassigned'

function StaffAssignedSection() {
  const [assignmentState, setAssignmentState] =
    useState<AssignmentState>('assigned')
  const [assignedStaff, setAssignedStaff] = useState(dummyTicket.assigned_to)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingStaff, setPendingStaff] = useState<{
    name: string
    avatar: string
  } | null>(null)

  const handleUnassign = () => {
    setAssignedStaff({ name: '', avatar: '' })
    setAssignmentState('unassigned')
  }

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaffId(staffId)
    const staff = dummyStaffList.find(s => s.id === staffId)
    if (staff) {
      setShowConfirmation(true)
    }
  }

  const handleSendRequest = () => {
    const staff = dummyStaffList.find(s => s.id === selectedStaffId)
    if (staff) {
      setPendingStaff({ name: staff.label, avatar: '' })
      setAssignmentState('pending_request')
      setShowConfirmation(false)
      setSelectedStaffId('')
    }
  }

  const handleCancelRequest = () => {
    setPendingStaff(null)
    setAssignmentState('unassigned')
  }

  // Assigned State
  if (assignmentState === 'assigned' && assignedStaff.name) {
    return (
      <div className='pb-5 border-b border-(--border-light)'>
        <div className='flex items-center justify-between mb-3'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide'>
            Staff Assigned
          </span>
        </div>
        <div className='flex items-center justify-between p-2 rounded-lg bg-(--background-secondary) border border-(--border-default)'>
          <div className='flex items-center gap-3'>
            <UserAvatar name={assignedStaff.name} size={32} />
            <span className='texts-body-medium-medium text-(--text-primary)'>
              {assignedStaff.name}
            </span>
          </div>
          <button
            onClick={handleUnassign}
            className='p-1.5 rounded-md hover:bg-red-50 text-(--text-muted) hover:text-red-500 transition-colors'
            title='Unassign staff'
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Pending Request State
  if (assignmentState === 'pending_request' && pendingStaff) {
    return (
      <div className='pb-5 border-b border-(--border-light)'>
        <div className='flex items-center justify-between mb-3'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide'>
            Staff Assigned
          </span>
        </div>
        <div className='p-3 rounded-lg bg-amber-50 border border-amber-200'>
          <div className='flex items-center gap-2 mb-2'>
            <Loader2 size={14} className='text-amber-600 animate-spin' />
            <span className='texts-body-small-medium text-amber-700'>
              Awaiting Response
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <UserAvatar name={pendingStaff.name} size={28} />
              <div>
                <span className='texts-body-small-medium text-(--text-primary) block'>
                  {pendingStaff.name}
                </span>
                <span className='texts-caption-large text-(--text-secondary)'>
                  Request sent
                </span>
              </div>
            </div>
            <button
              onClick={handleCancelRequest}
              className='texts-body-small text-red-500 hover:text-red-600 hover:underline transition-colors'
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Unassigned State - Show Combobox
  return (
    <div className='pb-5 border-b border-(--border-light)'>
      <div className='flex items-center justify-between mb-3'>
        <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide'>
          Staff Assigned
        </span>
      </div>

      {!showConfirmation ? (
        <Combobox
          items={dummyStaffList}
          placeholder='Select staff member'
          searchPlaceholder='Search staff...'
          showAvatar
          value={selectedStaffId}
          onValueChange={handleSelectStaff}
          NotFoundMessage='No staff found'
        />
      ) : (
        <div className='p-3 rounded-lg bg-blue-50 border border-blue-200'>
          <p className='texts-body-small text-(--text-primary) mb-3'>
            Send assignment request to{' '}
            <span className='texts-body-small-medium'>
              {dummyStaffList.find(s => s.id === selectedStaffId)?.label}
            </span>
            ?
          </p>
          <div className='flex items-center gap-2'>
            <button
              onClick={handleSendRequest}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors'
            >
              <Send size={13} />
              Send Request
            </button>
            <button
              onClick={() => {
                setShowConfirmation(false)
                setSelectedStaffId('')
              }}
              className='px-3 py-1.5 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-neutral-100 transition-colors'
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Sidebar Component
function Sidebar() {
  return (
    <div className='w-[260px] shrink-0'>
      <div className='sticky top-6 space-y-6'>
        {/* Staff Assigned */}
        <StaffAssignedSection />

        {/* Type */}
        <div className='pb-5 border-b border-(--border-light)'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
            Type
          </span>
          <Select
            label='Type'
            items={['Maintenance', 'Electrical', 'Plumbing', 'HVAC', 'General']}
            placeholder='Select type'
            defaultValue={dummyTicket.type}
            className='w-full'
          />
        </div>

        {/* Status */}
        <div>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
            Status
          </span>
          <Select
            label='Status'
            items={['Mark as Complete', 'In Progress', 'Pending', 'Closed']}
            placeholder='Select status'
            defaultValue='Mark as Complete'
            className='w-full'
          />
        </div>
      </div>
    </div>
  )
}

// Timeline wrapper that adds the connecting line
function TimelineEventWrapper({
  children,
  isLast
}: {
  children: React.ReactNode
  isLast: boolean
}) {
  return (
    <div className='relative'>
      {/* Vertical line connecting to next event */}
      {!isLast && (
        <div className='absolute left-[19px] top-0 bottom-0 w-0.5 bg-neutral-200' />
      )}
      {children}
    </div>
  )
}

// Main Timeline Component
function Timeline() {
  const totalEvents = dummyTimeline.length

  return (
    <div className='flex-1'>
      <div>
        {dummyTimeline.map((event, index) => {
          const isLast = index === totalEvents - 1

          const renderEvent = () => {
            switch (event.type) {
              case 'opened':
                return (
                  <div className='pb-2'>
                    <OpenedEvent ticket={dummyTicket} />
                  </div>
                )
              case 'assignment_sent':
                return (
                  <AssignmentSentEvent
                    assigner={(event as any).assigner}
                    assigned={(event as any).assigned}
                    date={event.date}
                  />
                )
              case 'assignment_rejected':
                return (
                  <AssignmentRejectedEvent
                    performer={(event as any).performer}
                    from={(event as any).from}
                    date={event.date}
                  />
                )
              case 'assignment_accepted':
                return (
                  <AssignmentAcceptedEvent
                    performer={(event as any).performer}
                    date={event.date}
                  />
                )
              case 'status_changed':
                if ((event as any).performer_type === 'system') {
                  return (
                    <StatusChangedSystemEvent
                      new_status={(event as any).new_status}
                      date={event.date}
                    />
                  )
                }
                if ((event as any).performer_type === 'user') {
                  return (
                    <StatusChangedByUserEvent
                      performer={(event as any).performer}
                      new_status={(event as any).new_status}
                      note={(event as any).note}
                      date={event.date}
                    />
                  )
                }
                return null
              case 'comment':
                return (
                  <div className='py-2'>
                    <CommentEvent
                      performer={(event as any).performer}
                      date={event.date}
                      message={(event as any).message}
                    />
                  </div>
                )
              default:
                return null
            }
          }

          return (
            <TimelineEventWrapper key={index} isLast={isLast}>
              {renderEvent()}
            </TimelineEventWrapper>
          )
        })}
      </div>

      <div className='mt-6 pt-2'>
        <AddCommentSection />
      </div>
    </div>
  )
}

// Main Page Component
export default function TicketDetailsPage() {
  return (
    <div className=''>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Tickets', href: '/tickets' },
          { label: `#${dummyTicket.reference_id}` }
        ]}
      />

      {/* Title */}
      <div className='mt-4 mb-2'>
        <h1 className='texts-heading-h2 text-(--text-primary)'>
          {dummyTicket.title}{' '}
          <span className='text-(--text-secondary) font-normal'>
            #{dummyTicket.reference_id}
          </span>
        </h1>
      </div>

      {/* Status Badge & Opener Info */}
      <div className='flex items-center gap-3 mb-8'>
        <div className='flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full texts-body-small-medium'>
          <Clock size={14} />
          <span>{dummyTicket.current_status}</span>
        </div>
        <span className='texts-body-medium text-(--text-secondary)'>
          <span className='texts-body-medium-medium text-(--text-primary)'>
            {dummyTicket.created_by.name}
          </span>{' '}
          opened this ticket on {dummyTicket.created_at}
        </span>
      </div>

      {/* Main Content */}
      <div className='flex gap-10'>
        <Timeline />
        <Sidebar />
      </div>
    </div>
  )
}
