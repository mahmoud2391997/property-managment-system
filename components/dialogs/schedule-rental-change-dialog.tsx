'use client'

import { useState, useEffect, useMemo } from 'react'
import Dialog from '../costume-ui/dialog'
import Input from '../costume-ui/input'
import InputGroup from '../costume-ui/input-group'
import Select from '../costume-ui/select'
import { FeedbackToasts } from '../costume-ui/feedback-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

type PendingPaymentInfo = {
  id: string
  dueDate: string
  totalAmount: number
  totalPaid: number
}

type ExistingScheduledChange = {
  id: string
  newRent: number
  effectiveFrom: string
}

type RentalChangeInfo = {
  currentRent: number
  paymentDay: number
  propertyId: string
  roomId: string | null
  pendingPayment: PendingPaymentInfo | null
  existingScheduledChange: ExistingScheduledChange | null
}

type CycleOption = {
  value: string
  label: string
  month: number
  year: number
  isNextCycle: boolean
}

type Props = {
  leaseId: string
  trigger: React.ReactElement
  onSuccess?: () => void
}

export default function ScheduleRentalChangeDialog({
  leaseId,
  trigger,
  onSuccess
}: Props) {
  // Dialog state
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)

  // Form state
  const [newRent, setNewRent] = useState<string>('')
  const [selectedCycle, setSelectedCycle] = useState<string>('')
  const [updatePendingPayment, setUpdatePendingPayment] = useState(false)

  // Data from API
  const [rentalInfo, setRentalInfo] = useState<RentalChangeInfo | null>(null)

  // Fetch rental change info when dialog opens
  useEffect(() => {
    if (open) {
      fetchRentalChangeInfo()
    } else {
      // Reset form when dialog closes
      setNewRent('')
      setSelectedCycle('')
      setUpdatePendingPayment(false)
      setRentalInfo(null)
    }
  }, [open])

  const fetchRentalChangeInfo = async () => {
    setFetchingData(true)
    try {
      const response = await fetch(`/api/leases/${leaseId}/rental-change-info`)
      if (!response.ok) {
        throw new Error('Failed to fetch rental change info')
      }
      const data = await response.json()
      setRentalInfo(data)
    } catch (error) {
      console.error('Error fetching rental change info:', error)
      FeedbackToasts.error('Failed to load rental information')
      setOpen(false)
    } finally {
      setFetchingData(false)
    }
  }

  // Generate valid cycle options
  const cycleOptions = useMemo<CycleOption[]>(() => {
    if (!rentalInfo) return []

    const cycles: CycleOption[] = []
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]

    // Determine the first valid cycle
    let startDate: Date
    if (rentalInfo.pendingPayment?.dueDate) {
      // Next cycle is month after pending payment
      const pendingDue = new Date(rentalInfo.pendingPayment.dueDate)
      startDate = new Date(
        pendingDue.getFullYear(),
        pendingDue.getMonth() + 1,
        rentalInfo.paymentDay
      )
    } else {
      // No pending payment - start from next month
      const today = new Date()
      startDate = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        rentalInfo.paymentDay
      )
    }

    // Generate cycles for next 24 months
    for (let i = 0; i < 24; i++) {
      const cycleDate = new Date(startDate)
      cycleDate.setMonth(cycleDate.getMonth() + i)

      cycles.push({
        value: `${cycleDate.getFullYear()}-${cycleDate.getMonth()}`,
        label: `${monthNames[cycleDate.getMonth()]} ${cycleDate.getFullYear()}`,
        month: cycleDate.getMonth(),
        year: cycleDate.getFullYear(),
        isNextCycle: i === 0
      })
    }

    return cycles
  }, [rentalInfo])

  // Get selected cycle info
  const selectedCycleInfo = useMemo(() => {
    return cycleOptions.find(c => c.value === selectedCycle)
  }, [cycleOptions, selectedCycle])

  // Check if pending payment update option should be shown
  const showPendingPaymentOption = useMemo(() => {
    return (
      selectedCycleInfo?.isNextCycle &&
      rentalInfo?.pendingPayment &&
      rentalInfo.pendingPayment.totalPaid === 0
    )
  }, [selectedCycleInfo, rentalInfo])

  // Check if pending payment is partially paid (cannot be changed)
  const pendingPaymentPartiallyPaid = useMemo(() => {
    return (
      rentalInfo?.pendingPayment &&
      rentalInfo.pendingPayment.totalPaid > 0 &&
      rentalInfo.pendingPayment.totalPaid < rentalInfo.pendingPayment.totalAmount
    )
  }, [rentalInfo])

  // Calculate percentage change
  const percentChange = useMemo(() => {
    if (!rentalInfo || !newRent) return null
    const newRentNum = parseFloat(newRent.replace(/[^0-9.]/g, ''))
    if (isNaN(newRentNum) || newRentNum === 0) return null

    const change =
      ((newRentNum - rentalInfo.currentRent) / rentalInfo.currentRent) * 100
    return change
  }, [rentalInfo, newRent])

  // Check if new rent is the same as current rent
  const isSameAsCurrentRent = useMemo(() => {
    if (!rentalInfo || !newRent) return false
    const newRentNum = parseFloat(newRent.replace(/[^0-9.]/g, ''))
    if (isNaN(newRentNum)) return false
    return Math.abs(newRentNum - rentalInfo.currentRent) < 0.01
  }, [rentalInfo, newRent])

  // Form validation
  const canSubmit = useMemo(() => {
    if (!rentalInfo || !newRent || !selectedCycle) return false

    const newRentNum = parseFloat(newRent.replace(/[^0-9.]/g, ''))
    if (isNaN(newRentNum) || newRentNum <= 0) return false

    // Don't allow same amount as current rent
    if (Math.abs(newRentNum - rentalInfo.currentRent) < 0.01) return false

    // Check if trying to update a partially paid pending payment with amount less than paid
    if (
      updatePendingPayment &&
      rentalInfo.pendingPayment &&
      newRentNum < rentalInfo.pendingPayment.totalPaid
    ) {
      return false
    }

    return true
  }, [rentalInfo, newRent, selectedCycle, updatePendingPayment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !selectedCycleInfo || !rentalInfo) return

    setLoading(true)
    try {
      const newRentNum = parseFloat(newRent.replace(/[^0-9.]/g, ''))

      const response = await fetch(
        `/api/leases/${leaseId}/schedule-rental-change`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newMonthlyRent: newRentNum,
            effectiveMonth: selectedCycleInfo.month,
            effectiveYear: selectedCycleInfo.year,
            updatePendingPayment:
              updatePendingPayment && selectedCycleInfo.isNextCycle
          })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to schedule rental change')
      }

      FeedbackToasts.created('Rental change')
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Error scheduling rental change:', error)
      FeedbackToasts.createFailed('rental change', error.message)
    } finally {
      setLoading(false)
    }
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`
  }

  return (
    <Dialog
      openDialogButton={trigger}
      title='Schedule Rental Change'
      sub_title='Schedule a future change to the monthly rent amount'
      saveButtonLabel={loading ? 'Scheduling...' : 'Schedule Change'}
      cancelButtonLabel='Cancel'
      loading={loading}
      disabled={!canSubmit}
      className='max-w-[450px]!'
      open={open}
      onOpenChange={setOpen}
    >
      <form id='dialog-form' onSubmit={handleSubmit} className='space-y-5'>
        {fetchingData ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin h-6 w-6 border-2 border-(--primary-color) border-t-transparent rounded-full' />
          </div>
        ) : rentalInfo?.existingScheduledChange ? (
          // Show existing scheduled change warning
          <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-amber-600 mt-0.5' />
              <div>
                <p className='font-medium text-amber-800'>
                  Scheduled Change Already Exists
                </p>
                <p className='text-sm text-amber-700 mt-1'>
                  A rental change to{' '}
                  {formatCurrency(rentalInfo.existingScheduledChange.newRent)}{' '}
                  is already scheduled for{' '}
                  {new Date(
                    rentalInfo.existingScheduledChange.effectiveFrom
                  ).toLocaleDateString('en-GB', {
                    month: 'long',
                    year: 'numeric'
                  })}
                  .
                </p>
                <p className='text-sm text-amber-700 mt-2'>
                  Please cancel the existing change before scheduling a new one.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Current Rent (Read-only) */}
            <InputGroup label='Current Monthly Rent'>
              <Input
                value={formatCurrency(rentalInfo?.currentRent || 0)}
                disabled
                className='bg-neutral-100!'
              />
            </InputGroup>

            {/* New Rent Input */}
            <InputGroup label='New Monthly Rent' isRequired>
              <Input
                currency
                value={newRent}
                onValueChange={value => setNewRent(value || '')}
                placeholder='Enter new rent amount'
                required
              />
              {isSameAsCurrentRent && (
                <p className='text-xs text-red-600 mt-1'>
                  New rent must be different from the current rent
                </p>
              )}
            </InputGroup>

            {/* Effective Cycle Picker */}
            <InputGroup label='Effective From' isRequired>
              <Select
                label='Select Cycle'
                items={cycleOptions.map(c => ({
                  value: c.value,
                  label: c.isNextCycle ? `${c.label} (Next Cycle)` : c.label
                }))}
                placeholder='Select effective cycle'
                value={selectedCycle}
                onChange={value => {
                  setSelectedCycle(value)
                  setUpdatePendingPayment(false)
                }}
              />
            </InputGroup>

            {/* Pending Payment Update Option */}
            {showPendingPaymentOption && (
              <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <Checkbox
                    id='update-pending'
                    checked={updatePendingPayment}
                    onCheckedChange={checked =>
                      setUpdatePendingPayment(checked === true)
                    }
                    className='mt-0.5'
                  />
                  <div>
                    <label
                      htmlFor='update-pending'
                      className='text-sm text-blue-800 cursor-pointer'
                    >
                      Also update the current pending payment (
                      {formatCurrency(rentalInfo?.pendingPayment?.totalAmount || 0)}
                      ) to the new amount
                    </label>
                    {updatePendingPayment && (
                      <p className='text-xs text-blue-600 mt-2'>
                        This will apply the rental change immediately. The new rent amount will be used for both the current pending payment and all future payments.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Warning for partially paid pending payment */}
            {selectedCycleInfo?.isNextCycle && pendingPaymentPartiallyPaid && (
              <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='h-5 w-5 text-amber-600 mt-0.5' />
                  <div className='text-sm text-amber-700'>
                    <p className='font-medium'>
                      Cannot Update Current Pending Payment
                    </p>
                    <p className='mt-1'>
                      The current pending payment has been partially paid (
                      {formatCurrency(rentalInfo?.pendingPayment?.totalPaid || 0)}{' '}
                      of{' '}
                      {formatCurrency(
                        rentalInfo?.pendingPayment?.totalAmount || 0
                      )}
                      ). The new rent will apply from the next cycle.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Summary */}
            {percentChange !== null && (
              <div className='p-4 bg-(--background-secondary) border border-(--border-strong) rounded-lg'>
                <p className='texts-label-large mb-3'>Change Summary</p>
                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-(--text-secondary)'>
                      Current Rent
                    </span>
                    <span className='texts-body-medium'>
                      {formatCurrency(rentalInfo?.currentRent || 0)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-(--text-secondary)'>
                      New Rent
                    </span>
                    <span className='texts-body-medium'>
                      {formatCurrency(
                        parseFloat(newRent.replace(/[^0-9.]/g, '')) || 0
                      )}
                    </span>
                  </div>
                  <div className='border-t border-(--border-strong) pt-2 mt-2'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-(--text-secondary)'>
                        Change
                      </span>
                      <div
                        className={`flex items-center gap-1.5 ${
                          percentChange > 0
                            ? 'text-green-600'
                            : percentChange < 0
                              ? 'text-red-600'
                              : 'text-(--text-secondary)'
                        }`}
                      >
                        {percentChange > 0 ? (
                          <TrendingUp className='h-4 w-4' />
                        ) : percentChange < 0 ? (
                          <TrendingDown className='h-4 w-4' />
                        ) : null}
                        <span className='font-medium'>
                          {percentChange > 0 ? '+' : ''}
                          {percentChange.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </form>
    </Dialog>
  )
}
