'use client'

import { CalendarX2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { formatDate } from '@/utils/formatTime'

type ScheduledLeaseEndData = {
  id: string
  scheduled_date: string
  is_lapsed?: boolean
  days_until_dismissed?: number | null
}

type Props = {
  leaseId: string
  scheduledEnd: ScheduledLeaseEndData
  onCancelSuccess?: () => void
  showCancelButton?: boolean
  endLeaseAction?: React.ReactNode
}

export default function ScheduledLeaseEndBanner({
  leaseId,
  scheduledEnd,
  onCancelSuccess,
  showCancelButton = true,
  endLeaseAction
}: Props) {
  const isLapsed = scheduledEnd.is_lapsed ?? false
  const daysUntilDismissed = scheduledEnd.days_until_dismissed ?? null

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/cancel-lease-end-schedule`, {
        method: 'POST'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel')
      }
      FeedbackToasts.deleted('Scheduled lease end')
      onCancelSuccess?.()
    } catch (error: any) {
      FeedbackToasts.deleteFailed('scheduled lease end', error.message)
      throw error
    }
  }

  if (isLapsed) {
    return (
      <div className='p-4 rounded-[12px] border bg-red-50 border-red-200'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center rounded-full h-10 w-10 bg-red-100 text-red-700 shrink-0'>
              <AlertTriangle size={20} />
            </div>
            <div className='flex flex-col'>
              <span className='texts-body-medium-medium text-red-800'>
                Planned Checkout Lapsed
              </span>
              <span className='texts-body-small text-red-700'>
                The planned checkout date ({formatDate(scheduledEnd.scheduled_date)}) has passed
              </span>
              {daysUntilDismissed !== null && (
                <span className='texts-caption-large text-red-600 mt-0.5'>
                  This notice will be dismissed in {daysUntilDismissed} day{daysUntilDismissed !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {showCancelButton && (
              <ConfirmationDialog
                title='Cancel Scheduled Lease End'
                description={`Are you sure you want to cancel the planned checkout scheduled for ${formatDate(scheduledEnd.scheduled_date)}?`}
                variant='warning'
                inputLabel='Type Cancel to Confirm'
                confirmationText='CANCEL'
                confirmButtonLabel='Cancel Schedule'
                confirmButtonLoadingLabel='Cancelling...'
                confirmButtonClassName='bg-amber-600! hover:bg-amber-700!'
                onConfirm={handleCancel}
                openDialogButton={
                  <Button
                    variant='ghost'
                    className='h-8 px-3 text-red-700 hover:text-red-800 hover:bg-red-100'
                  >
                    Dismiss
                  </Button>
                }
              />
            )}
            {endLeaseAction}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-4 rounded-[12px] border bg-amber-50 border-amber-200'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center rounded-full h-10 w-10 bg-amber-100 text-amber-700 shrink-0'>
            <CalendarX2 size={20} />
          </div>
          <div className='flex flex-col'>
            <span className='texts-body-medium-medium text-amber-800'>
              Lease End Scheduled
            </span>
            <span className='texts-body-small text-amber-700'>
              Planned checkout on {formatDate(scheduledEnd.scheduled_date)}
            </span>
          </div>
        </div>
        {showCancelButton && (
          <ConfirmationDialog
            title='Cancel Scheduled Lease End'
            description={`Are you sure you want to cancel the planned checkout scheduled for ${formatDate(scheduledEnd.scheduled_date)}?`}
            variant='warning'
            inputLabel='Type Cancel to Confirm'
            confirmationText='CANCEL'
            confirmButtonLabel='Cancel Schedule'
            confirmButtonLoadingLabel='Cancelling...'
            confirmButtonClassName='bg-amber-600! hover:bg-amber-700!'
            onConfirm={handleCancel}
            openDialogButton={
              <Button
                variant='ghost'
                className='h-8 px-3 text-amber-700 hover:text-amber-800 hover:bg-amber-100'
              >
                Cancel
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}
