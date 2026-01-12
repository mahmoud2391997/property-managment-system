'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, Clock, TrendingDown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'
import { toast } from 'sonner'
import { LoadingOverlay } from './page-loader'

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

export function SelectPaymentsUI() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<PaymentsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(true)
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(true)
  const [selectedUpcomingIds, setSelectedUpcomingIds] = useState<Set<string>>(new Set())
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)

  // Payment processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [loadingState, setLoadingState] = useState<'checking' | 'redirecting' | null>(null)

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

  const calculateSummary = () => {
    if (!data) return null

    const selectedUpcoming = data.upcoming_payments.filter(p =>
      selectedUpcomingIds.has(p.id)
    )

    const overdueCount = data.overdue_count
    const upcomingCount = selectedUpcoming.length
    const totalCount = overdueCount + upcomingCount

    const overdueTotal = data.overdue_total
    const upcomingTotal = selectedUpcoming.reduce((sum, p) => sum + p.remaining_amount, 0)
    const subtotal = overdueTotal + upcomingTotal

    const feeSavings = totalCount > 1 ? (totalCount - 1) * FPX_FEE : 0
    const total = subtotal + FPX_FEE

    return {
      overdueCount,
      upcomingCount,
      totalCount,
      overdueTotal,
      upcomingTotal,
      subtotal,
      feeSavings,
      total
    }
  }

  const handlePayNow = async () => {
    if (!data) return

    const selectedIds = [
      ...data.overdue_payments.map(p => p.id),
      ...Array.from(selectedUpcomingIds)
    ]

    if (selectedIds.length === 0) {
      toast.error('Please select at least one payment')
      return
    }

    try {
      setIsProcessing(true)
      setLoadingState('checking')

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
        throw new Error(result.error || 'Failed to create payment bill')
      }

      if (result.redirect_to_check) {
        setIsProcessing(false)
        setLoadingState(null)
        // Handle check status scenario
        toast.info('Checking existing payment...')
        window.location.reload()
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
      setIsProcessing(false)
      setLoadingState(null)
    }
  }

  if (isLoading || error || !data || data.total_count === 0) {
    return null
  }

  const summary = calculateSummary()
  if (!summary) return null

  const hasOverdue = data.overdue_count > 0
  const hasUpcoming = data.upcoming_count > 0

  return (
    <>
      {loadingState && <LoadingOverlay state={loadingState} />}

      {/* Desktop View */}
      <div className='hidden md:block sticky -bottom-4 inset-x-4 z-50'>
        <div className='mx-auto max-w-6xl rounded-2xl border bg-(--background-primary) shadow-lg'>
          <div className='p-4'>
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-(--text-primary)'>
                Select Payments
              </h3>
              <div className='text-sm text-(--text-secondary)'>
                {summary.totalCount} payment{summary.totalCount !== 1 ? 's' : ''} selected
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {/* Left: Payment Selection */}
              <div className='space-y-3'>
                {/* Overdue Section */}
                {hasOverdue && (
                  <div className='rounded-lg border-2 border-red-200 bg-red-50 overflow-hidden'>
                    <button
                      onClick={() => setIsOverdueExpanded(!isOverdueExpanded)}
                      className='w-full flex items-center justify-between p-3 hover:bg-red-100 transition-colors'
                    >
                      <div className='flex items-center gap-2'>
                        <AlertTriangle className='w-5 h-5 text-red-600' />
                        <span className='font-medium text-red-900'>
                          Overdue - Must Pay ({data.overdue_count})
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-semibold text-red-700'>
                          {formatCurrency(data.overdue_total)}
                        </span>
                        {isOverdueExpanded ? (
                          <ChevronUp className='w-4 h-4 text-red-600' />
                        ) : (
                          <ChevronDown className='w-4 h-4 text-red-600' />
                        )}
                      </div>
                    </button>

                    {isOverdueExpanded && (
                      <div className='p-3 pt-0 space-y-2'>
                        {data.overdue_payments.map(payment => (
                          <div
                            key={payment.id}
                            className='flex items-center gap-3 p-2 bg-white rounded border border-red-200'
                          >
                            <Checkbox
                              checked={true}
                              disabled
                              className='data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600'
                            />
                            <div className='flex-1 min-w-0'>
                              <div className='text-sm font-medium text-(--text-primary) truncate'>
                                #{payment.reference_id}
                              </div>
                              <div className='text-xs text-(--text-secondary) truncate'>
                                {payment.charges_titles} • Due {formatDate(payment.due_date || '')}
                              </div>
                            </div>
                            <div className='text-sm font-semibold text-(--text-primary) whitespace-nowrap'>
                              {formatCurrency(payment.remaining_amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upcoming Section */}
                {hasUpcoming && (
                  <div className='rounded-lg border-2 border-blue-200 bg-blue-50 overflow-hidden'>
                    <button
                      onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
                      className='w-full flex items-center justify-between p-3 hover:bg-blue-100 transition-colors'
                    >
                      <div className='flex items-center gap-2'>
                        <Clock className='w-5 h-5 text-blue-600' />
                        <span className='font-medium text-blue-900'>
                          Pending - Optional ({summary.upcomingCount}/{data.upcoming_count} selected)
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-semibold text-blue-700'>
                          {formatCurrency(summary.upcomingTotal)}
                        </span>
                        {isUpcomingExpanded ? (
                          <ChevronUp className='w-4 h-4 text-blue-600' />
                        ) : (
                          <ChevronDown className='w-4 h-4 text-blue-600' />
                        )}
                      </div>
                    </button>

                    {isUpcomingExpanded && (
                      <div className='p-3 pt-0 space-y-2'>
                        {data.upcoming_payments.map(payment => (
                          <div
                            key={payment.id}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded border transition-colors cursor-pointer',
                              selectedUpcomingIds.has(payment.id)
                                ? 'bg-blue-100 border-blue-300'
                                : 'bg-white border-blue-200 hover:bg-blue-50'
                            )}
                            onClick={() => toggleUpcomingPayment(payment.id)}
                          >
                            <Checkbox
                              checked={selectedUpcomingIds.has(payment.id)}
                              onCheckedChange={() => toggleUpcomingPayment(payment.id)}
                              className='data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                            />
                            <div className='flex-1 min-w-0'>
                              <div className='text-sm font-medium text-(--text-primary) truncate'>
                                #{payment.reference_id}
                              </div>
                              <div className='text-xs text-(--text-secondary) truncate'>
                                {payment.charges_titles} • Due {formatDate(payment.due_date || '')}
                              </div>
                            </div>
                            <div className='text-sm font-semibold text-(--text-primary) whitespace-nowrap'>
                              {formatCurrency(payment.remaining_amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Summary */}
              <div className='flex flex-col'>
                <div className='rounded-lg border bg-(--background-secondary) p-4 space-y-3 flex-1'>
                  <h4 className='font-semibold text-(--text-primary)'>Payment Summary</h4>

                  {hasOverdue && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-(--text-secondary)'>
                        Overdue ({summary.overdueCount})
                      </span>
                      <span className='font-medium text-(--text-primary)'>
                        {formatCurrency(summary.overdueTotal)}
                      </span>
                    </div>
                  )}

                  {summary.upcomingCount > 0 && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-(--text-secondary)'>
                        Pending ({summary.upcomingCount} selected)
                      </span>
                      <span className='font-medium text-(--text-primary)'>
                        {formatCurrency(summary.upcomingTotal)}
                      </span>
                    </div>
                  )}

                  <div className='border-t border-(--border-default) pt-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-(--text-secondary)'>Subtotal</span>
                      <span className='font-medium text-(--text-primary)'>
                        {formatCurrency(summary.subtotal)}
                      </span>
                    </div>

                    <div className='flex justify-between text-sm mt-1'>
                      <span className='text-(--text-secondary)'>Transaction Fee</span>
                      <span className='font-medium text-(--text-primary)'>
                        {formatCurrency(FPX_FEE)}
                      </span>
                    </div>
                  </div>

                  {summary.feeSavings > 0 && (
                    <div className='flex items-center justify-between rounded-md bg-(--success-main)/10 p-2'>
                      <div className='flex items-center gap-1.5'>
                        <TrendingDown className='w-4 h-4 text-(--success-main)' />
                        <span className='text-sm font-medium text-(--success-main)'>
                          You're saving
                        </span>
                      </div>
                      <span className='text-sm font-bold text-(--success-main)'>
                        {formatCurrency(summary.feeSavings)}
                      </span>
                    </div>
                  )}

                  <div className='border-t border-(--border-default) pt-2'>
                    <div className='flex justify-between items-center'>
                      <span className='font-semibold text-(--text-primary)'>Total</span>
                      <span className='text-2xl font-bold text-(--text-primary)'>
                        {formatCurrency(summary.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  size='lg'
                  className='w-full mt-3 gap-2'
                  onClick={handlePayNow}
                  disabled={isProcessing || summary.totalCount === 0}
                >
                  {isProcessing
                    ? (loadingState === 'checking' ? 'Processing...' : 'Redirecting...')
                    : `Pay ${formatCurrency(summary.total)}`
                  }
                  {!isProcessing && <ArrowRight className='w-4 h-4' />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View - Floating Button */}
      <Button
        onClick={() => setIsMobileModalOpen(true)}
        className='md:hidden sticky bottom-0 left-160 z-100 flex size-16 items-center bg-(--secondary-color) hover:bg-(--secondary-color)/90 justify-center rounded-full shadow-lg hover:/90 active:scale-95 transition-all pointer-events-auto touch-manipulation'
        aria-label={`Select from ${data.total_count} payments`}
      >
        <div className='relative flex items-center justify-center flex-col'>
          <div className='text-xs font-bold'>{summary.totalCount}</div>
          <div className='text-[10px]'>selected</div>
        </div>
      </Button>

      {/* Mobile Modal */}
      <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
        <DialogContent className='md:hidden max-h-[90vh] flex flex-col'>
          <DialogHeader>
            <DialogTitle>Select Payments</DialogTitle>
            <DialogDescription>
              Choose which payments to pay now
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 overflow-y-auto space-y-3 -mx-6 px-6'>
            {/* Overdue Section */}
            {hasOverdue && (
              <div className='rounded-lg border-2 border-red-200 bg-red-50 overflow-hidden'>
                <button
                  onClick={() => setIsOverdueExpanded(!isOverdueExpanded)}
                  className='w-full flex items-center justify-between p-3 hover:bg-red-100 transition-colors'
                >
                  <div className='flex items-center gap-2'>
                    <AlertTriangle className='w-5 h-5 text-red-600' />
                    <span className='font-medium text-red-900 text-sm'>
                      Overdue ({data.overdue_count})
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold text-red-700'>
                      {formatCurrency(data.overdue_total)}
                    </span>
                    {isOverdueExpanded ? (
                      <ChevronUp className='w-4 h-4 text-red-600' />
                    ) : (
                      <ChevronDown className='w-4 h-4 text-red-600' />
                    )}
                  </div>
                </button>

                {isOverdueExpanded && (
                  <div className='p-3 pt-0 space-y-2'>
                    {data.overdue_payments.map(payment => (
                      <div
                        key={payment.id}
                        className='flex items-start gap-3 p-2 bg-white rounded border border-red-200'
                      >
                        <Checkbox
                          checked={true}
                          disabled
                          className='mt-1 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600'
                        />
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-(--text-primary)'>
                            #{payment.reference_id}
                          </div>
                          <div className='text-xs text-(--text-secondary) mt-0.5'>
                            {payment.charges_titles}
                          </div>
                          <div className='text-xs text-(--text-secondary) mt-0.5'>
                            Due {formatDate(payment.due_date || '')}
                          </div>
                          <div className='text-sm font-semibold text-(--text-primary) mt-1'>
                            {formatCurrency(payment.remaining_amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Section */}
            {hasUpcoming && (
              <div className='rounded-lg border-2 border-blue-200 bg-blue-50 overflow-hidden'>
                <button
                  onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
                  className='w-full flex items-center justify-between p-3 hover:bg-blue-100 transition-colors'
                >
                  <div className='flex items-center gap-2'>
                    <Clock className='w-5 h-5 text-blue-600' />
                    <span className='font-medium text-blue-900 text-sm'>
                      Pending ({summary.upcomingCount}/{data.upcoming_count})
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold text-blue-700'>
                      {formatCurrency(summary.upcomingTotal)}
                    </span>
                    {isUpcomingExpanded ? (
                      <ChevronUp className='w-4 h-4 text-blue-600' />
                    ) : (
                      <ChevronDown className='w-4 h-4 text-blue-600' />
                    )}
                  </div>
                </button>

                {isUpcomingExpanded && (
                  <div className='p-3 pt-0 space-y-2'>
                    {data.upcoming_payments.map(payment => (
                      <div
                        key={payment.id}
                        className={cn(
                          'flex items-start gap-3 p-2 rounded border transition-colors',
                          selectedUpcomingIds.has(payment.id)
                            ? 'bg-blue-100 border-blue-300'
                            : 'bg-white border-blue-200'
                        )}
                        onClick={() => toggleUpcomingPayment(payment.id)}
                      >
                        <Checkbox
                          checked={selectedUpcomingIds.has(payment.id)}
                          onCheckedChange={() => toggleUpcomingPayment(payment.id)}
                          className='mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                        />
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-(--text-primary)'>
                            #{payment.reference_id}
                          </div>
                          <div className='text-xs text-(--text-secondary) mt-0.5'>
                            {payment.charges_titles}
                          </div>
                          <div className='text-xs text-(--text-secondary) mt-0.5'>
                            Due {formatDate(payment.due_date || '')}
                          </div>
                          <div className='text-sm font-semibold text-(--text-primary) mt-1'>
                            {formatCurrency(payment.remaining_amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary Footer */}
          <div className='border-t pt-4 space-y-3'>
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
              onClick={handlePayNow}
              disabled={isProcessing || summary.totalCount === 0}
            >
              {isProcessing
                ? (loadingState === 'checking' ? 'Processing...' : 'Redirecting...')
                : `Pay ${formatCurrency(summary.total)}`
              }
              {!isProcessing && <ArrowRight className='w-4 h-4' />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
