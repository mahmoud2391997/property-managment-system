'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'

type ScheduledChangeData = {
  id: string
  old_rent: number
  new_rent: number
  effective_from: string
}

type Props = {
  leaseId: string
  scheduledChange: ScheduledChangeData
  currentRent: number
  onCancelSuccess?: () => void
  showCancelButton?: boolean
  isLoading?: boolean
}

export default function ScheduledRentChangeBanner({
  leaseId,
  scheduledChange,
  currentRent,
  onCancelSuccess,
  showCancelButton = true,
  isLoading = false
}: Props) {
  // Don't show if rent has already changed
  if (Math.abs(currentRent - scheduledChange.new_rent) < 0.01) {
    return null
  }

  const isIncrease = scheduledChange.new_rent > scheduledChange.old_rent
  const percentChange = (
    ((scheduledChange.new_rent - scheduledChange.old_rent) / scheduledChange.old_rent) * 100
  ).toFixed(1)

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}/cancel-rental-change`, {
        method: 'POST'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel')
      }
      FeedbackToasts.deleted('Scheduled rent change')
      onCancelSuccess?.()
    } catch (error: any) {
      FeedbackToasts.deleteFailed('scheduled rent change', error.message)
      throw error
    }
  }

  return (
    <div className='p-4 rounded-[12px] border bg-purple-50 border-purple-200'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center rounded-full h-10 w-10 bg-purple-100 text-purple-700 shrink-0'>
            {isIncrease ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div className='flex flex-col'>
            <span className='texts-body-medium-medium text-purple-800'>
              Rent Change Scheduled
            </span>
            <span className='texts-body-small text-purple-700'>
              {formatCurrency(scheduledChange.old_rent)} → {formatCurrency(scheduledChange.new_rent)}
              <span className='ml-1.5 inline-flex items-center gap-0.5'>
                ({isIncrease ? '+' : ''}{percentChange}%)
              </span>
              {' • '}
              Effective {formatDate(scheduledChange.effective_from)}
            </span>
          </div>
        </div>
        {showCancelButton && (
          <ConfirmationDialog
            title='Cancel Scheduled Rent Change'
            description={`Are you sure you want to cancel the scheduled rent change from ${formatCurrency(
              scheduledChange.old_rent
            )} to ${formatCurrency(scheduledChange.new_rent)}?`}
            variant='warning'
            inputLabel='Type Cancel to Confirm'
            confirmationText='CANCEL'
            confirmButtonLabel='Cancel Change'
            confirmButtonLoadingLabel='Cancelling...'
            confirmButtonClassName='bg-amber-600! hover:bg-amber-700!'
            onConfirm={handleCancel}
            openDialogButton={
              <Button
                variant='ghost'
                className='h-8 px-3 text-purple-700 hover:text-purple-800 hover:bg-purple-100'
                disabled={isLoading}
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