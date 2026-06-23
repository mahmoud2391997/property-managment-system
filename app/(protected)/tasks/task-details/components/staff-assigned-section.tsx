'use client'

import { useState } from 'react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import Combobox from '@/components/costume-ui/combobox'
import { X, Send } from 'lucide-react'
import type { StaffMember } from '../types'

type AssignmentState = 'assigned' | 'pending_request' | 'unassigned'

type Props = {
  assignedStaff?: StaffMember | null
  pendingStaff?: StaffMember | null
  staffList: StaffMember[]
  currentStaffId: string
  onAssign: (staffId: string, isSelfAssign: boolean) => void
  onUnassign: (reason: string) => void
  onCancelAssignment: (reason: string) => void
  disabled?: boolean
}

export default function StaffAssignedSection({
  assignedStaff,
  pendingStaff,
  staffList,
  currentStaffId,
  onAssign,
  onUnassign,
  onCancelAssignment,
  disabled = false
}: Props) {
  // Derive state directly from props - this updates when props change
  const getAssignmentState = (): AssignmentState => {
    if (assignedStaff) return 'assigned'
    if (pendingStaff) return 'pending_request'
    return 'unassigned'
  }

  const assignmentState = getAssignmentState()
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showUnassignConfirmation, setShowUnassignConfirmation] = useState(false)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [unassignReason, setUnassignReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [loading, setLoading] = useState(false)

  const staffItems = staffList.map((s: any) => ({
    id: s.id,
    label: s.name,
    subtitle: s.role
  }))

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaffId(staffId)
    const staff = staffList.find(s => s.id === staffId)
    if (staff) {
      setShowConfirmation(true)
    }
  }

  const handleSendRequest = () => {
    const isSelfAssign = selectedStaffId === currentStaffId
    onAssign(selectedStaffId, isSelfAssign)
    setShowConfirmation(false)
    setSelectedStaffId('')
  }

  const handleConfirmUnassign = () => {
    if (!unassignReason.trim()) return
    onUnassign(unassignReason)
    setShowUnassignConfirmation(false)
    setUnassignReason('')
  }

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) return
    onCancelAssignment(cancelReason)
    setShowCancelConfirmation(false)
    setCancelReason('')
  }

  // Assigned State
  if (assignmentState === 'assigned' && assignedStaff) {
    return (
      <div className='pb-5 border-b border-(--border-light)'>
        <div className='flex items-center justify-between mb-3'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide'>
            Assigned To
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
                onClick={() => setShowUnassignConfirmation(true)}
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
              from this task?
            </p>
            <textarea
              value={unassignReason}
              onChange={e => setUnassignReason(e.target.value)}
              placeholder='Reason for unassigning...'
              className='w-full p-2 mb-3 texts-body-small bg-white border border-red-200 rounded-md resize-none min-h-[60px] focus:outline-none focus:ring-1 focus:ring-red-300'
            />
            <div className='flex items-center gap-2'>
              <button
                onClick={handleConfirmUnassign}
                disabled={loading || !unassignReason.trim()}
                className='px-3 py-1.5 bg-red-600 text-white texts-body-small-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50'
              >
                Unassign
              </button>
              <button
                onClick={() => {
                  setShowUnassignConfirmation(false)
                  setUnassignReason('')
                }}
                disabled={loading}
                className='px-3 py-1.5 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-red-100 transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Pending Request State
  if (assignmentState === 'pending_request' && pendingStaff) {
    const isPendingForMe = pendingStaff.id === currentStaffId

    return (
      <div className='pb-5 border-b border-(--border-light)'>
        <div className='flex items-center justify-between mb-3'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide'>
            Assigned To
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
              {!disabled && !isPendingForMe && (
                <button
                  onClick={() => setShowCancelConfirmation(true)}
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
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder='Reason for cancelling...'
              className='w-full p-2 mb-3 texts-body-small bg-white border border-red-200 rounded-md resize-none min-h-[60px] focus:outline-none focus:ring-1 focus:ring-red-300'
            />
            <div className='flex items-center gap-2'>
              <button
                onClick={handleConfirmCancel}
                disabled={loading || !cancelReason.trim()}
                className='px-3 py-1.5 bg-red-600 text-white texts-body-small-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50'
              >
                Yes, Cancel
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirmation(false)
                  setCancelReason('')
                }}
                disabled={loading}
                className='px-3 py-1.5 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-red-100 transition-colors'
              >
                No, Keep
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Unassigned State - Show Combobox
  return (
    <div className='pb-5 border-b border-(--border-light)'>
      <div className='flex items-center justify-between mb-3'>
        <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide'>
          Assigned To
        </span>
      </div>

      {!showConfirmation ? (
        <Combobox
          items={staffItems}
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
            {selectedStaffId === currentStaffId ? (
              <>
                Assign yourself to this task?
                <span className='block texts-caption-large text-blue-600 mt-1'>
                  This will auto-accept the assignment.
                </span>
              </>
            ) : (
              <>
                Send assignment request to{' '}
                <span className='texts-body-small-medium'>
                  {staffList.find(s => s.id === selectedStaffId)?.name}
                </span>
                ?
              </>
            )}
          </p>
          <div className='flex items-center gap-2'>
            <button
              onClick={handleSendRequest}
              disabled={loading}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              <Send size={13} />
              {selectedStaffId === currentStaffId ? 'Assign Myself' : 'Send Request'}
            </button>
            <button
              onClick={() => {
                setShowConfirmation(false)
                setSelectedStaffId('')
              }}
              disabled={loading}
              className='px-3 py-1.5 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
