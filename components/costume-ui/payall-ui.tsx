'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingDown, Receipt, ChevronUp } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { LoadingOverlay } from './page-loader'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/formatCurrency'

interface PaymentDetail {
  id: string
  reference_id: string
  due_date: string | null
  remaining_amount: number
  is_overdue: boolean
  charges_titles: string
}

interface PaymentsData {
  overdue_payments: PaymentDetail[]
  upcoming_payments: PaymentDetail[]
  overdue_count: number
  upcoming_count: number
  overdue_total: number
  upcoming_total: number
  total_count: number
  total_amount: number
}

const FPX_FEE = 1.20

export function PaymentSummary() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [data, setData] = useState<PaymentsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [loadingState, setLoadingState] = useState<'checking' | 'redirecting' | null>(null)

  // Selection state
  const [isSelectionExpanded, setIsSelectionExpanded] = useState(false)
  const [selectedUpcomingIds, setSelectedUpcomingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPaymentsData()
  }, [])

  const fetchPaymentsData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/payments/pending-details')

      if (!response.ok) {
        throw new Error('Failed to fetch payment details')
      }

      const result = await response.json()

      if (result.success && result.data.total_count > 0) {
        setData(result.data)
        setTimeout(() => {
          setIsVisible(true)
        }, 100)
      } else {
        setData(null)
      }
    } catch (err: any) {
      console.error('Error fetching payment details:', err)
      setError(err.message)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = () => {
    setIsOpen(true)
  }

  const toggleUpcomingPayment = (paymentId: string) => {
    setSelectedUpcomingIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId)
      } else {
        newSet.add(paymentId)
      }
      return newSet
    })
  }

  const getSelectedPaymentIds = () => {
    if (!data) return []
    return [
      ...data.overdue_payments.map(p => p.id),
      ...Array.from(selectedUpcomingIds)
    ]
  }

  const calculateSummary = () => {
    if (!data) return null

    const overdueTotal = data.overdue_total
    const upcomingTotal = Array.from(selectedUpcomingIds).reduce((sum, id) => {
      const payment = data.upcoming_payments.find(p => p.id === id)
      return sum + (payment?.remaining_amount || 0)
    }, 0)

    const subtotal = overdueTotal + upcomingTotal
    const totalCount = data.overdue_count + selectedUpcomingIds.size
    const feeSavings = totalCount > 1 ? (totalCount - 1) * FPX_FEE : 0
    // Only add fee if there's at least one payment
    const total = totalCount > 0 ? subtotal + FPX_FEE : 0

    return {
      subtotal,
      totalCount,
      feeSavings,
      total
    }
  }

  const handlePayAll = async () => {
    try {
      setIsProcessingPayment(true)
      setLoadingState('checking')

      const selectedIds = getSelectedPaymentIds()

      const response = await fetch('/api/payments/create-group-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_ids: selectedIds })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'No pending payments found') {
          window.location.reload()
          return
        }
        throw new Error(result.error || 'Failed to create group payment bill')
      }

      if (result.redirect_to_check) {
        setIsProcessingPayment(false)
        setLoadingState(null)
        handleCheckGroupStatus()
        return
      }

      setLoadingState('redirecting')

      if (result.payment_url) {
        window.location.href = result.payment_url
      } else {
        throw new Error('Payment URL not received')
      }
    } catch (error: any) {
      console.error('Error creating payment:', error)
      toast.error('Failed to create payment')
      setIsProcessingPayment(false)
      setLoadingState(null)
    }
  }

  const handleCheckGroupStatus = async () => {
    try {
      setIsProcessingPayment(true)
      setLoadingState('checking')

      const response = await fetch('/api/payments/check-group-status', {
        method: 'POST'
      })

      const result = await response.json()

      setLoadingState(null)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check payment status')
      }

      if (result.success) {
        window.location.reload()
      } else if (result.no_payment_made) {
        toast.info('No group payment has been made yet.')
      } else if (result.payment_not_completed) {
        toast.info('Payment not completed yet. Please complete your payment.')
      } else if (result.payment_failed) {
        toast.error(result.message || 'Payment failed. Please try again.')
      }
    } catch (error: any) {
      console.error('Error checking group payment status:', error)
      toast.error('Failed to check payment status')
    } finally {
      setIsProcessingPayment(false)
      setLoadingState(null)
    }
  }

  if (isLoading || error || !data) {
    return null
  }

  const summary = calculateSummary()
  if (!summary) return null

  // Combine all payments into a single list
  const allPayments = [
    ...data.overdue_payments.map(p => ({ ...p, type: 'overdue' as const })),
    ...data.upcoming_payments.map(p => ({ ...p, type: 'upcoming' as const }))
  ]

  return (
    <>
      {loadingState && <LoadingOverlay state={loadingState} />}

      {/* Desktop View */}
      <div
        className={`hidden md:block sticky -bottom-4 inset-x-4 z-50 transition-all duration-500 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className='mx-auto max-w-4xl relative'>
          {/* Expandable Selection Panel - ABSOLUTE positioned above the bar */}
          {isSelectionExpanded && (
            <div className='absolute bottom-full left-0 right-0 mb-3 rounded-2xl border bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300'>
              <div className='bg-linear-to-r from-gray-50 to-white px-5 py-3.5 border-b'>
                <h3 className='text-sm font-semibold text-(--text-primary)'>Select Payments</h3>
                <p className='text-xs text-(--text-secondary) mt-0.5'>
                  Overdue payments are required • Choose optional pending payments
                </p>
              </div>

              {/* Beautiful card-based list */}
              <div className='max-h-[420px] overflow-y-auto p-4 space-y-2.5'>
                {allPayments.map(payment => {
                  const isOverdue = payment.type === 'overdue'
                  const isSelected = isOverdue || selectedUpcomingIds.has(payment.id)

                  return (
                    <div
                      key={payment.id}
                      className={cn(
                        'flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all duration-200',
                        isSelected
                          ? isOverdue
                            ? 'bg-red-50 border-red-200 shadow-sm'
                            : 'bg-blue-50 border-blue-200 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm',
                        !isOverdue && 'cursor-pointer active:scale-[0.99]'
                      )}
                      onClick={() => !isOverdue && toggleUpcomingPayment(payment.id)}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        disabled={isOverdue}
                        onCheckedChange={() => !isOverdue && toggleUpcomingPayment(payment.id)}
                        className={cn(
                          'shrink-0',
                          isOverdue
                            ? 'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600'
                            : 'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                        )}
                      />

                      {/* Payment Info */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2.5 mb-1'>
                          <span className='text-sm font-semibold text-(--text-primary)'>
                            {payment.reference_id}
                          </span>
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-xs font-medium',
                              isOverdue
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            )}
                          >
                            {isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                        <p className='text-xs text-(--text-secondary) truncate'>
                          {payment.charges_titles}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className='text-right shrink-0'>
                        <div className='text-lg font-bold text-(--text-primary)'>
                          {formatCurrency(payment.remaining_amount)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer with summary */}
              <div className='bg-gray-50 px-5 py-3.5 border-t flex items-center justify-between'>
                <div className='text-xs text-(--text-secondary)'>
                  {data.overdue_count > 0 && (
                    <span className='font-medium text-red-700'>
                      {data.overdue_count} overdue (required)
                    </span>
                  )}
                  {data.overdue_count > 0 && selectedUpcomingIds.size > 0 && <span className='mx-2'>•</span>}
                  {selectedUpcomingIds.size > 0 && (
                    <span className='font-medium text-blue-700'>
                      {selectedUpcomingIds.size} pending selected
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsSelectionExpanded(false)}
                  className='text-xs font-medium text-(--text-secondary) hover:text-(--text-primary) transition-colors'
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Main Summary Bar - STAYS THE SAME */}
          <div className='rounded-2xl border bg-(--background-primary) shadow-lg relative'>
            {/* Small collapse button - top center */}
            <button
              onClick={() => setIsSelectionExpanded(!isSelectionExpanded)}
              className='absolute -top-3 left-1/2 -translate-x-1/2 bg-white border-2 border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all hover:scale-110'
              aria-label={isSelectionExpanded ? 'Hide payments' : 'Select payments'}
            >
              <ChevronUp
                className={cn(
                  'w-4 h-4 text-(--text-secondary) transition-transform duration-300',
                  isSelectionExpanded && 'rotate-180'
                )}
              />
            </button>

            <div className='flex items-center justify-between p-3 lg:p-4'>
              {/* Left side */}
              <div className='flex items-center gap-3 lg:gap-5'>
                {summary.totalCount > 0 ? (
                  <>
                    <span className='rounded-full px-3 py-1.5 text-sm font-semibold bg-(--info-light) text-(--info-dark)'>
                      {summary.totalCount} {summary.totalCount === 1 ? 'payment' : 'payments'}
                    </span>

                    <div className='h-8 w-px bg-border' />

                    <div className='flex flex-col lg:flex-row lg:items-center lg:gap-4'>
                      <div className='flex items-center gap-3 text-sm'>
                        <span className='text-(--text-secondary)'>
                          Subtotal{' '}
                          <span className='font-semibold text-foreground'>
                            {formatCurrency(summary.subtotal)}
                          </span>
                        </span>
                        <span className='text-(--text-secondary)'>
                          + Fee{' '}
                          <span className='font-semibold text-foreground'>
                            {formatCurrency(FPX_FEE)}
                          </span>
                        </span>
                      </div>

                      {summary.feeSavings > 0 && (
                        <div className='flex items-center gap-1 text-(--success-main)'>
                          <TrendingDown className='size-3.5' />
                          <span className='text-xs lg:text-sm font-medium'>
                            Saving {formatCurrency(summary.feeSavings)}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className='flex items-center gap-2'>
                    <span className='rounded-full px-3 py-1.5 text-sm font-semibold bg-gray-100 text-gray-500'>
                      0 payments
                    </span>
                    <span className='text-sm text-(--text-secondary)'>
                      Click the arrow above to select payments
                    </span>
                  </div>
                )}
              </div>

              {/* Right side */}
              <div className='flex items-center gap-3 lg:gap-4'>
                <div className='text-right'>
                  <p className='text-xs text-(--text-secondary)'>Total</p>
                  <p className='text-xl font-bold lg:text-2xl'>
                    {formatCurrency(summary.total)}
                  </p>
                </div>

                <Button
                  className='h-10 px-5 lg:h-11 lg:px-6'
                  onClick={handlePayAll}
                  disabled={isProcessingPayment || summary.totalCount === 0}
                >
                  {isProcessingPayment
                    ? (loadingState === 'checking' ? 'Processing...' : 'Redirecting...')
                    : summary.totalCount === 0
                      ? 'No payments selected'
                      : `Pay ${summary.totalCount === 1 ? '' : 'All'}`
                  }
                  {!isProcessingPayment && summary.totalCount > 0 && <ArrowRight className='size-4' />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating button */}
      <Button
        onClick={handleOpenDialog}
        className={`md:hidden sticky bottom-0 left-160 z-100 flex size-16 items-center bg-(--secondary-color) hover:bg-(--secondary-color)/90 justify-center rounded-full shadow-lg hover:/90 active:scale-95 transition-all pointer-events-auto touch-manipulation ${
          isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}
        aria-label={`View ${summary.totalCount} due payments`}
      >
        <div className='relative'>
          <Receipt className='size-6' />
          <span className='absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background text-xs font-bold text-foreground border border-accent'>
            {summary.totalCount}
          </span>
        </div>
      </Button>

      {/* Mobile Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='md:hidden max-h-[90vh] flex flex-col'>
          <DialogHeader className='shrink-0'>
            <DialogTitle>Select Payments</DialogTitle>
            <DialogDescription>
              Choose which payments to pay now
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 overflow-y-auto space-y-3 -mx-6 px-6'>
            {/* Payment Cards */}
            {allPayments.map(payment => {
              const isOverdue = payment.type === 'overdue'
              const isSelected = isOverdue || selectedUpcomingIds.has(payment.id)

              return (
                <div
                  key={payment.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border-2 transition-all',
                    isSelected
                      ? isOverdue
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200',
                    !isOverdue && 'active:scale-[0.98]'
                  )}
                  onClick={() => !isOverdue && toggleUpcomingPayment(payment.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={isOverdue}
                    onCheckedChange={() => !isOverdue && toggleUpcomingPayment(payment.id)}
                    className={cn(
                      'mt-1 shrink-0',
                      isOverdue
                        ? 'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600'
                        : 'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                    )}
                  />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='text-sm font-semibold text-(--text-primary)'>
                        {payment.reference_id}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          isOverdue
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {isOverdue ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                    <p className='text-xs text-(--text-secondary) mb-2'>
                      {payment.charges_titles}
                    </p>
                    <p className='text-lg font-bold text-(--text-primary)'>
                      {formatCurrency(payment.remaining_amount)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary Footer */}
          <div className='shrink-0 border-t pt-4 space-y-3'>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-(--text-secondary)'>
                  {summary.totalCount} payment{summary.totalCount !== 1 ? 's' : ''}
                </span>
                <span className='font-medium'>{formatCurrency(summary.subtotal)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-(--text-secondary)'>Transaction Fee</span>
                <span className='font-medium'>{formatCurrency(FPX_FEE)}</span>
              </div>
              {summary.feeSavings > 0 && (
                <div className='flex justify-between text-(--success-main) bg-(--success-main)/10 p-2 rounded'>
                  <span className='font-medium'>Saving</span>
                  <span className='font-bold'>{formatCurrency(summary.feeSavings)}</span>
                </div>
              )}
              <div className='flex justify-between items-center pt-2 border-t'>
                <span className='font-semibold text-lg'>Total</span>
                <span className='text-xl font-bold'>{formatCurrency(summary.total)}</span>
              </div>
            </div>

            <Button
              size='lg'
              className='w-full gap-2'
              onClick={handlePayAll}
              disabled={isProcessingPayment || summary.totalCount === 0}
            >
              {isProcessingPayment ? (loadingState === 'checking' ? 'Processing...' : 'Redirecting...') : `Pay ${formatCurrency(summary.total)}`}
              {!isProcessingPayment && <ArrowRight className='size-4' />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
