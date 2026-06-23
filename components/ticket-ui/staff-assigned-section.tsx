'use client'

import { useState, useEffect } from 'react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import Combobox from '@/components/costume-ui/combobox'
import Alert from '@/components/costume-ui/alert'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { X, Send, Loader2 } from 'lucide-react'

type StaffMember = {
  id: string
  name: string
  avatar?: string
  role?: string
}

type AssignmentState = 'assigned' | 'pending_request' | 'unassigned'

type AssignmentEvent = {
  type: string
  performerName?: string
  performerAvatar?: string
  assignerName?: string
  assignedName?: string
  fromName?: string
  newStatus?: string
  performerType?: string
  createdAt: string
}

type Props = {
  ticketId: string
  assignedStaff?: StaffMember | null
  pendingStaff?: StaffMember | null
  staffList: { id: string; label: string; subtitle?: string }[]
  onAssignmentChange?: (events?: AssignmentEvent[], statusChange?: string) => void
  disabled?: boolean
  currentUserId?: string
}

export default function StaffAssignedSection({
  ticketId,
  assignedStaff: initialAssignedStaff,
  pendingStaff: initialPendingStaff,
  staffList,
  onAssignmentChange,
  disabled = false,
  currentUserId
}: Props) {
  const getInitialState = (): AssignmentState => {
    if (initialAssignedStaff) return 'assigned'
    if (initialPendingStaff) return 'pending_request'
    return 'unassigned'
  }

  const [assignmentState, setAssignmentState] =
    useState<AssignmentState>(getInitialState)
  const [assignedStaff, setAssignedStaff] = useState<StaffMember | null>(
    initialAssignedStaff || null
  )
  const [pendingStaff, setPendingStaff] = useState<StaffMember | null>(
    initialPendingStaff || null
  )
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showUnassignConfirmation, setShowUnassignConfirmation] = useState(false)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showStaleAlert, setShowStaleAlert] = useState(false)

  const handleStaleAlertClose = () => {
    setShowStaleAlert(false)
    window.location.reload()
  }

  // Sync state when props change (e.g., after router.refresh())
  useEffect(() => {
    if (initialAssignedStaff) {
      setAssignmentState('assigned')
      setAssignedStaff(initialAssignedStaff)
      setPendingStaff(null)
    } else if (initialPendingStaff) {
      setAssignmentState('pending_request')
      setPendingStaff(initialPendingStaff)
      setAssignedStaff(null)
    } else {
      setAssignmentState('unassigned')
      setAssignedStaff(null)
      setPendingStaff(null)
    }
  }, [initialAssignedStaff, initialPendingStaff])

  const handleUnassignClick = () => {
    setShowUnassignConfirmation(true)
  }

  const handleConfirmUnassign = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tickets/assignments/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, expectedStatus: 'Accepted' })
      })

      if (response.ok) {
        const data = await response.json()
        setAssignedStaff(null)
        setAssignmentState('unassigned')
        setShowUnassignConfirmation(false)
        FeedbackToasts.updated('Assignment', 'Staff has been unassigned from this ticket')
        onAssignmentChange?.(data.events, 'Open')
      } else {
        const data = await response.json()
        if (response.status === 409 && data.code === 'STALE_STATE') {
          setShowStaleAlert(true)
          setShowUnassignConfirmation(false)
        } else {
          FeedbackToasts.operationFailed('Unassign staff', data.error)
        }
      }
    } catch (error) {
      console.error('Error unassigning staff:', error)
      FeedbackToasts.operationFailed('Unassign staff')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelUnassign = () => {
    setShowUnassignConfirmation(false)
  }

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaffId(staffId)
    const staff = staffList.find(s => s.id === staffId)
    if (staff) {
      setShowConfirmation(true)
    }
  }

  const handleSendRequest = async () => {
    const staff = staffList.find(s => s.id === selectedStaffId)
    if (!staff) return

    setLoading(true)
    try {
      const response = await fetch('/api/tickets/assignments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          assignedId: selectedStaffId,
          expectedStatus: 'unassigned'
        })
      })

      if (response.ok) {
        const data = await response.json()

        // If self-assignment, trigger auto-accepts so go directly to assigned state
        if (data.isSelfAssignment) {
          setAssignedStaff({ id: staff.id, name: staff.label })
          setAssignmentState('assigned')
          FeedbackToasts.updated('Assignment', 'You have assigned yourself to this ticket')
          // Pass status change if it happened
          const statusEvent = data.events?.find((e: any) => e.type === 'status_changed')
          onAssignmentChange?.(data.events, statusEvent ? 'In Progress' : undefined)
        } else {
          setPendingStaff({ id: staff.id, name: staff.label })
          setAssignmentState('pending_request')
          FeedbackToasts.created('Assignment request', `Request sent to ${staff.label}`)
          onAssignmentChange?.(data.events)
        }

        setShowConfirmation(false)
        setSelectedStaffId('')
      } else {
        const data = await response.json()
        if (response.status === 409 && data.code === 'STALE_STATE') {
          setShowStaleAlert(true)
          setShowConfirmation(false)
          setSelectedStaffId('')
        } else {
          FeedbackToasts.operationFailed('Send assignment request', data.error)
        }
      }
    } catch (error) {
      console.error('Error sending assignment request:', error)
      FeedbackToasts.operationFailed('Send assignment request')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelClick = () => {
    setShowCancelConfirmation(true)
  }

  const handleConfirmCancel = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tickets/assignments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, expectedStatus: 'Pending' })
      })

      if (response.ok) {
        const data = await response.json()
        setPendingStaff(null)
        setAssignmentState('unassigned')
        setShowCancelConfirmation(false)
        FeedbackToasts.info('Request cancelled', 'Assignment request has been cancelled')
        onAssignmentChange?.(data.events)
      } else {
        const data = await response.json()
        if (response.status === 409 && data.code === 'STALE_STATE') {
          setShowStaleAlert(true)
          setShowCancelConfirmation(false)
        } else {
          FeedbackToasts.operationFailed('Cancel request', data.error)
        }
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
      FeedbackToasts.operationFailed('Cancel request')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelCancelConfirmation = () => {
    setShowCancelConfirmation(false)
  }

  // Shared Alert for stale state
  const staleAlert = (
    <Alert
      open={showStaleAlert}
      onClose={handleStaleAlertClose}
      title="Assignment Updated"
      message="The assignment status has changed since you opened this page. Refreshing to show the current status."
      type="warning"
    />
  )

  // Assigned State
  if (assignmentState === 'assigned' && assignedStaff) {
    return (
      <>
        {staleAlert}
        <div className='pb-5 border-b border-(--border-light)'>
        <div className='flex items-center justify-between mb-3'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide'>
            Staff Assigned
          </span>
        </div>
        {!showUnassignConfirmation ? (
          <div className='flex items-center justify-between p-2 rounded-lg bg-(--background-secondary) border border-(--border-default)'>
            <div className='flex items-center gap-3'>
              <UserAvatar name={assignedStaff.name} imgSrc={assignedStaff.avatar} size={32} />
              <span className='texts-body-medium-medium text-(--text-primary)'>
                {assignedStaff.name}
              </span>
            </div>
            {!disabled && (
              <button
                onClick={handleUnassignClick}
                disabled={loading}
                className='p-1.5 rounded-md hover:bg-red-50 text-(--text-muted) hover:text-red-500 transition-colors disabled:opacity-50'
                title='Unassign staff'
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className='p-3 rounded-lg bg-red-50 border border-red-200'>
            <p className='texts-body-small text-(--text-primary) mb-3'>
              Unassign{' '}
              <span className='texts-body-small-medium'>{assignedStaff.name}</span>{' '}
              from this ticket?
            </p>
            <div className='flex items-center gap-2'>
              <button
                onClick={handleConfirmUnassign}
                disabled={loading}
                className='px-3 py-1.5 bg-red-600 text-white texts-body-small-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50'
              >
                {loading ? 'Unassigning...' : 'Unassign'}
              </button>
              <button
                onClick={handleCancelUnassign}
                disabled={loading}
                className='px-3 py-1.5 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50'
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }

  // Pending Request State
  if (assignmentState === 'pending_request' && pendingStaff) {
    return (
      <>
        {staleAlert}
        <div className='pb-5 border-b border-(--border-light)'>
        <div className='flex items-center justify-between mb-3'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide'>
            Staff Assigned
          </span>
        </div>
        {!showCancelConfirmation ? (
          <div className='p-3 rounded-lg bg-amber-50 border border-amber-200'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='texts-body-small-medium text-amber-700'>
                Awaiting Response
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <UserAvatar name={pendingStaff.name} imgSrc={pendingStaff.avatar} size={28} />
                <div>
                  <span className='texts-body-small-medium text-(--text-primary) block'>
                    {pendingStaff.name}
                  </span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    Request sent
                  </span>
                </div>
              </div>
              {!disabled && currentUserId !== pendingStaff.id && (
                <button
                  onClick={handleCancelClick}
                  disabled={loading}
                  className='texts-body-small text-red-500 hover:text-red-600 hover:underline transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className='p-3 rounded-lg bg-red-50 border border-red-200'>
            <p className='texts-body-small text-(--text-primary) mb-3'>
              Cancel assignment request for{' '}
              <span className='texts-body-small-medium'>{pendingStaff.name}</span>?
            </p>
            <div className='flex items-center gap-2'>
              <button
                onClick={handleConfirmCancel}
                disabled={loading}
                className='px-3 py-1.5 bg-red-600 text-white texts-body-small-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50'
              >
                {loading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button
                onClick={handleCancelCancelConfirmation}
                disabled={loading}
                className='px-3 py-1.5 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50'
              >
                No, Keep
              </button>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }

  // Unassigned State - Show Combobox
  return (
    <>
      {staleAlert}
      <div className='pb-5 border-b border-(--border-light)'>
        <div className='flex items-center justify-between mb-3'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide'>
            Staff Assigned
          </span>
        </div>

        {!showConfirmation ? (
        <Combobox
          items={staffList}
          placeholder='Select staff member'
          searchPlaceholder='Search staff...'
          showAvatar
          value={selectedStaffId}
          onValueChange={handleSelectStaff}
          NotFoundMessage='No staff found'
          disabled={disabled || loading}
        />
      ) : (
        <div className='p-3 rounded-lg bg-blue-50 border border-blue-200'>
          <p className='texts-body-small text-(--text-primary) mb-3'>
            Send assignment request to{' '}
            <span className='texts-body-small-medium'>
              {staffList.find(s => s.id === selectedStaffId)?.label}
            </span>
            ?
          </p>
          <div className='flex items-center gap-2'>
            <button
              onClick={handleSendRequest}
              disabled={loading}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              <Send size={13} />
              {loading ? 'Sending...' : 'Send Request'}
            </button>
            <button
              onClick={() => {
                setShowConfirmation(false)
                setSelectedStaffId('')
              }}
              disabled={loading}
              className='px-3 py-1.5 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
          </div>
        </div>
        )}
      </div>
    </>
  )
}
