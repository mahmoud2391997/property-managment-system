'use client'

import { useState } from 'react'
import Select from '@/components/costume-ui/select'
import StaffAssignedSection from './staff-assigned-section'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import Alert from '@/components/costume-ui/alert'
import { ticketTypes } from '@/utils/data'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import Button from '@/components/costume-ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'

type StaffMember = {
  id: string
  name: string
  avatar?: string
  role?: string
}

type TypeChangeEvent = {
  type: 'type_changed'
  performerName: string
  performerAvatar?: string
  typeName: string
  createdAt: string
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
  createdAt: string
}

type StatusChangeEvent = {
  type: 'status_changed'
  performerType: 'user' | 'system'
  performerName?: string
  newStatus: string
  createdAt: string
}

type Props = {
  ticketId: string
  currentType: string
  currentStatus: string
  rawStatus: string
  assignedStaff?: StaffMember | null
  pendingStaff?: StaffMember | null
  staffList: { id: string; label: string; subtitle?: string }[]
  onAssignmentChange?: (events?: AssignmentEvent[], statusChange?: string) => void
  onTypeChange?: (type: string, event?: TypeChangeEvent) => void
  onStatusChange?: (newStatus: string, event?: StatusChangeEvent) => void
  isStaff?: boolean
  currentUserId?: string
  currentUserName?: string
}

export default function TicketSidebar({
  ticketId,
  currentType,
  currentStatus,
  rawStatus,
  assignedStaff,
  pendingStaff,
  staffList,
  onAssignmentChange,
  onTypeChange,
  onStatusChange,
  isStaff = false,
  currentUserId,
  currentUserName
}: Props) {
  const [typeLoading, setTypeLoading] = useState(false)
  const [pendingType, setPendingType] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState(currentType)
  const [statusLoading, setStatusLoading] = useState(false)
  const [showStaleAlert, setShowStaleAlert] = useState(false)

  // Check if ticket is resolved or closed
  const isTicketClosed = currentStatus === 'Resolved' || currentStatus === 'Closed'

  // Check if current user is the assigned staff
  const isAssignedStaff = assignedStaff?.id === currentUserId

  // Determine which status actions are available for staff
  const canMarkComplete = isStaff && isAssignedStaff && rawStatus === 'In_Progress'
  const canForceClose = isStaff && !isTicketClosed

  const handleStaleAlertClose = () => {
    setShowStaleAlert(false)
    window.location.reload()
  }

  const handleTypeSelect = (newType: string) => {
    if (!newType || newType === currentType) return
    setSelectedType(newType)
    setPendingType(newType)
  }

  const handleConfirmTypeChange = async () => {
    if (!pendingType) return

    setTypeLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: pendingType })
      })

      if (response.ok) {
        const data = await response.json()
        FeedbackToasts.updated('Ticket type', `Type changed to ${pendingType}`)
        onTypeChange?.(pendingType, data.event)
      } else {
        const data = await response.json()
        FeedbackToasts.updateFailed('ticket type', data.error)
        // Reset on error
        setSelectedType(currentType)
      }
    } catch (error) {
      console.error('Error updating type:', error)
      FeedbackToasts.updateFailed('ticket type')
      // Reset on error
      setSelectedType(currentType)
    } finally {
      setTypeLoading(false)
      setPendingType(null)
    }
  }

  const handleCancelTypeChange = () => {
    setPendingType(null)
    setSelectedType(currentType)
  }

  const handleStatusAction = async (action: 'mark_complete' | 'force_close') => {
    setStatusLoading(true)
    try {
      const response = await fetch('/api/tickets/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          action,
          expectedStatus: rawStatus
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'STALE_STATE') {
          setShowStaleAlert(true)
        } else {
          FeedbackToasts.operationFailed('Status update', data.error || 'Failed to update status')
        }
        return
      }

      // Success
      const actionLabels = {
        mark_complete: 'marked as complete',
        force_close: 'closed'
      }
      FeedbackToasts.updated('Ticket status', `Ticket ${actionLabels[action]}`)

      // Update parent state
      const event: StatusChangeEvent = {
        type: 'status_changed',
        performerType: 'user',
        performerName: currentUserName,
        newStatus: data.newStatus,
        createdAt: data.createdAt
      }
      onStatusChange?.(data.newStatus, event)
    } catch (error) {
      console.error('Error updating status:', error)
      FeedbackToasts.operationFailed('Status update')
    } finally {
      setStatusLoading(false)
    }
  }

  return (
    <>
      {/* Stale state alert */}
      <Alert
        open={showStaleAlert}
        onClose={handleStaleAlertClose}
        title='Status Updated'
        message='The ticket status has changed since you opened this page. Refreshing to show the current status.'
        type='info'
      />

      <div className='w-full lg:w-[260px] lg:shrink-0 order-first lg:order-last'>
        <div className='lg:sticky lg:top-6 space-y-4 lg:space-y-6 p-4 lg:p-0 bg-(--background-secondary) lg:bg-transparent rounded-xl lg:rounded-none mb-4 lg:mb-0'>
          {/* Staff Assigned - Only visible to staff */}
          {isStaff && (
            <StaffAssignedSection
              ticketId={ticketId}
              assignedStaff={assignedStaff}
              pendingStaff={pendingStaff}
              staffList={staffList}
              onAssignmentChange={onAssignmentChange}
              disabled={isTicketClosed}
              currentUserId={currentUserId}
            />
          )}

          {/* Type */}
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Type
            </span>
            <Select
              label='Type'
              items={ticketTypes}
              placeholder='Select type'
              value={selectedType}
              className='w-full'
              onChange={handleTypeSelect}
              disabled={!isStaff || isTicketClosed || typeLoading || !!pendingType}
            />
            {/* Confirm type change UI */}
            {pendingType && (
              <div className='mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                <p className='texts-body-small text-(--text-secondary) mb-2'>
                  Change type to{' '}
                  <span className='texts-body-small-medium text-(--text-primary)'>
                    {pendingType}
                  </span>
                  ?
                </p>
                <div className='flex gap-2'>
                  <button
                    onClick={handleConfirmTypeChange}
                    disabled={typeLoading}
                    className='flex-1 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                  >
                    {typeLoading ? 'Saving...' : 'Confirm'}
                  </button>
                  <button
                    onClick={handleCancelTypeChange}
                    disabled={typeLoading}
                    className='flex-1 px-3 py-1.5 bg-white border border-(--border-default) text-(--text-primary) texts-body-small-medium rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Section - Staff Actions */}
          {isStaff && (
            <div className='pb-5 border-b border-(--border-light)'>
              <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
                Status
              </span>

              {/* Current status display */}
              <div className='mb-4'>
                <span className='texts-body-medium text-(--text-primary)'>
                  {currentStatus}
                </span>
              </div>

              {/* Status Actions */}
              <div className='space-y-2'>
                {/* Mark as Complete - Only for assigned staff when In Progress */}
                {canMarkComplete && (
                  <ConfirmationDialog
                    variant='confirm'
                    openDialogButton={
                      <Button
                        variant='primary'
                        label='Mark as Complete'
                        icon={<CheckCircle2 size={16} />}
                        className='w-full'
                        disabled={statusLoading}
                      />
                    }
                    title='Mark Ticket as Complete'
                    description='This will notify the tenant to confirm if the issue is resolved. Are you sure you want to mark this ticket as complete?'
                    confirmButtonLabel='Mark Complete'
                    confirmButtonLoadingLabel='Updating...'
                    confirmButtonClassName='bg-green-600! hover:bg-green-700!'
                    onConfirm={() => handleStatusAction('mark_complete')}
                    loading={statusLoading}
                  />
                )}

                {/* Force Close - Available to any staff when not already closed */}
                {canForceClose && (
                  <ConfirmationDialog
                    variant='confirm'
                    openDialogButton={
                      <Button
                        variant='secondary'
                        label='Close Ticket'
                        icon={<XCircle size={16} />}
                        className='w-full'
                        disabled={statusLoading}
                      />
                    }
                    title='Close Ticket'
                    description='This will close the ticket without marking it as resolved. The tenant will be notified. This action cannot be undone.'
                    confirmButtonLabel='Close Ticket'
                    confirmButtonLoadingLabel='Closing...'
                    confirmButtonClassName='bg-neutral-600! hover:bg-neutral-700!'
                    onConfirm={() => handleStatusAction('force_close')}
                    loading={statusLoading}
                  />
                )}

                {/* Info when ticket is closed */}
                {isTicketClosed && (
                  <p className='texts-body-small text-(--text-secondary)'>
                    This ticket has been {currentStatus.toLowerCase()} and cannot be modified.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
