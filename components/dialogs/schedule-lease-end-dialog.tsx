'use client'

import { useState, useEffect, useMemo } from 'react'
import Dialog from '../costume-ui/dialog'
import InputGroup from '../costume-ui/input-group'
import DatePicker from '../costume-ui/date-picker'
import { FeedbackToasts } from '../costume-ui/feedback-toast'
import { AlertTriangle } from 'lucide-react'
import { formatDate } from '@/utils/formatTime'

type ExistingSchedule = {
  id: string
  scheduledDate: string
}

type LeaseEndInfo = {
  existingSchedule: ExistingSchedule | null
}

type Props = {
  leaseId: string
  trigger?: React.ReactElement
  onSuccess?: () => void
  controlledOpen?: boolean
  onControlledOpenChange?: (open: boolean) => void
}

export default function ScheduleLeaseEndDialog({
  leaseId,
  trigger,
  onSuccess,
  controlledOpen,
  onControlledOpenChange,
}: Props) {
  const [_open, _setOpen] = useState(false)
  const open = controlledOpen ?? _open
  const setOpen = (v: boolean) => {
    if (onControlledOpenChange) onControlledOpenChange(v)
    else _setOpen(v)
  }
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)

  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [info, setInfo] = useState<LeaseEndInfo | null>(null)

  useEffect(() => {
    if (open) {
      fetchInfo()
    } else {
      setScheduledDate(undefined)
      setInfo(null)
    }
  }, [open])

  const fetchInfo = async () => {
    setFetchingData(true)
    try {
      const response = await fetch(`/api/leases/${leaseId}/lease-end-info`)
      if (!response.ok) {
        throw new Error('Failed to fetch lease end info')
      }
      const data = await response.json()
      setInfo(data)
    } catch (error) {
      console.error('Error fetching lease end info:', error)
      FeedbackToasts.error('Failed to load lease end information')
      setOpen(false)
    } finally {
      setFetchingData(false)
    }
  }

  // Compare date portions only (no timezone issues)
  const isDateInFuture = useMemo(() => {
    if (!scheduledDate) return false
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const selectedStr = `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}-${String(scheduledDate.getDate()).padStart(2, '0')}`
    return selectedStr > todayStr
  }, [scheduledDate])

  const canSubmit = useMemo(() => {
    return scheduledDate && isDateInFuture && !info?.existingSchedule
  }, [scheduledDate, isDateInFuture, info])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/leases/${leaseId}/schedule-lease-end`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledDate: `${scheduledDate!.getFullYear()}-${String(scheduledDate!.getMonth() + 1).padStart(2, '0')}-${String(scheduledDate!.getDate()).padStart(2, '0')}`
          })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to schedule lease end')
      }

      FeedbackToasts.created('Lease end schedule')
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Error scheduling lease end:', error)
      FeedbackToasts.createFailed('lease end schedule', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      openDialogButton={trigger}
      title='Schedule Lease End'
      sub_title='Schedule a planned checkout date for awareness'
      saveButtonLabel={loading ? 'Scheduling...' : 'Schedule'}
      cancelButtonLabel='Cancel'
      loading={loading}
      disabled={!canSubmit}
      className='max-w-[420px]!'
      open={open}
      onOpenChange={setOpen}
    >
      <form id='dialog-form' onSubmit={handleSubmit} className='space-y-5'>
        {fetchingData ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin h-6 w-6 border-2 border-(--primary-color) border-t-transparent rounded-full' />
          </div>
        ) : info?.existingSchedule ? (
          <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-amber-600 mt-0.5' />
              <div>
                <p className='font-medium text-amber-800'>
                  Lease End Already Scheduled
                </p>
                <p className='text-sm text-amber-700 mt-1'>
                  A planned checkout is already scheduled for{' '}
                  {formatDate(info.existingSchedule.scheduledDate)}.
                </p>
                <p className='text-sm text-amber-700 mt-2'>
                  Please cancel the existing schedule before creating a new one.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <InputGroup label='Planned Checkout Date' isRequired>
              <DatePicker
                value={scheduledDate}
                onValueChange={setScheduledDate}
              />
              {scheduledDate && !isDateInFuture && (
                <p className='text-xs text-red-600 mt-1'>
                  Date must be in the future
                </p>
              )}
            </InputGroup>

            <div className='p-4 bg-(--background-secondary) border border-(--border-strong) rounded-lg'>
              <p className='texts-body-small text-(--text-secondary)'>
                This schedule is for awareness only. The lease will not be
                automatically ended on this date. Staff will be notified of
                the planned checkout.
              </p>
            </div>
          </>
        )}
      </form>
    </Dialog>
  )
}
