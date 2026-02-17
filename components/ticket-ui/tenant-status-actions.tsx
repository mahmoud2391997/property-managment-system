'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Button from '@/components/costume-ui/button'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import Alert from '@/components/costume-ui/alert'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'

type StatusChangeEvent = {
  type: 'status_changed'
  performerType: 'user' | 'system'
  performerName?: string
  newStatus: string
  createdAt: string
}

type Props = {
  ticketId: string
  rawStatus: string
  currentUserName?: string
  onStatusChange?: (newStatus: string, event?: StatusChangeEvent) => void
}

export default function TenantStatusActions({
  ticketId,
  rawStatus,
  currentUserName,
  onStatusChange
}: Props) {
  const [loading, setLoading] = useState(false)
  const [showStaleAlert, setShowStaleAlert] = useState(false)

  // Determine available actions based on status
  const isTicketClosed = rawStatus === 'Resolved' || rawStatus === 'Closed'
  const canCloseAsResolved = rawStatus === 'Open' || rawStatus === 'In_Progress'
  const isPendingConfirmation = rawStatus === 'Pending_Tenant'

  const handleStaleAlertClose = () => {
    setShowStaleAlert(false)
    window.location.reload()
  }

  const handleStatusAction = async (
    action: 'confirm_resolution' | 'reject_resolution' | 'close_as_resolved'
  ) => {
    setLoading(true)
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
          FeedbackToasts.operationFailed(
            'Status update',
            data.error || 'Failed to update status'
          )
        }
        return
      }

      // Success messages
      const actionMessages = {
        confirm_resolution: 'Ticket marked as resolved',
        reject_resolution: 'Resolution rejected - ticket reopened',
        close_as_resolved: 'Ticket closed as resolved'
      }
      FeedbackToasts.updated('Ticket status', actionMessages[action])

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
      setLoading(false)
    }
  }

  // Don't render anything if ticket is closed
  if (isTicketClosed) {
    return null
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

      <div className='mb-6'>
        {/* Pending Tenant Confirmation UI */}
        {isPendingConfirmation && (
          <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='w-5 h-5 text-amber-600 mt-0.5 shrink-0' />
              <div className='flex-1'>
                <h3 className='texts-body-medium-medium text-(--text-primary) mb-1'>
                  Confirmation Required
                </h3>
                <p className='texts-body-small text-(--text-secondary) mb-4'>
                  The assigned staff has marked this ticket as complete. Please
                  confirm if the issue has been resolved or reject if it still
                  needs attention.
                </p>
                <div className='flex gap-3'>
                  <ConfirmationDialog
                    variant='confirm'
                    openDialogButton={
                      <Button
                        variant='primary'
                        label='Confirm Resolved'
                        icon={<CheckCircle2 size={16} />}
                        disabled={loading}
                        isResponsive
                      />
                    }
                    title='Confirm Resolution'
                    description='This will close the ticket and mark it as resolved. Are you satisfied that the issue has been fixed?'
                    confirmButtonLabel='Yes, Issue Resolved'
                    confirmButtonLoadingLabel='Confirming...'
                    confirmButtonClassName='bg-green-600! hover:bg-green-700!'
                    onConfirm={() => handleStatusAction('confirm_resolution')}
                    loading={loading}
                  />
                  <ConfirmationDialog
                    variant='confirm'
                    openDialogButton={
                      <Button
                        variant='secondary'
                        label='Reject Resolution'
                        icon={<XCircle size={16} />}
                        disabled={loading}
                        isResponsive
                      />
                    }
                    title='Reject Resolution'
                    description='This will reopen the ticket for further attention. The assigned staff will be notified that the issue is not resolved.'
                    confirmButtonLabel='Reopen Ticket'
                    confirmButtonLoadingLabel='Reopening...'
                    confirmButtonClassName='bg-amber-600! hover:bg-amber-700!'
                    onConfirm={() => handleStatusAction('reject_resolution')}
                    loading={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Close as Resolved button - shown when status is Open or In Progress */}
        {canCloseAsResolved && (
          <div className='flex items-center gap-3'>
            <ConfirmationDialog
              variant='confirm'
              openDialogButton={
                <Button
                  variant='secondary'
                  label='Close as Resolved'
                  icon={<CheckCircle2 size={16} />}
                  disabled={loading}
                />
              }
              title='Close Ticket as Resolved'
              description='This will close the ticket and mark it as resolved. Only do this if the issue has been fixed or is no longer relevant.'
              confirmButtonLabel='Close as Resolved'
              confirmButtonLoadingLabel='Closing...'
              confirmButtonClassName='bg-green-600! hover:bg-green-700!'
              onConfirm={() => handleStatusAction('close_as_resolved')}
              loading={loading}
            />
            <span className='texts-body-small text-(--text-secondary)'>
              Close this ticket if the issue is resolved
            </span>
          </div>
        )}
      </div>
    </>
  )
}
