'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingDown, Receipt } from 'lucide-react'
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

interface PaymentSummaryData {
  payment_count: number
  subtotal: number
  transaction_fee: number
  fee_savings: number
  total_amount: number
}

interface PaymentDetail {
  id: string
  reference_id: string
  due_date: string | null
  remaining_amount: number
  is_overdue: boolean
  charges_titles: string
}

interface PaymentSummaryProps {
  selectedPaymentIds?: string[]
}

export function PaymentSummary({ selectedPaymentIds }: PaymentSummaryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [data, setData] = useState<PaymentSummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [loadingState, setLoadingState] = useState<'checking' | 'redirecting' | null>(null)

  // Payment selection state
  const [isSelectionExpanded, setIsSelectionExpanded] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<{
    overdue_payments: PaymentDetail[]
    upcoming_payments: PaymentDetail[]
  } | null>(null)
  const [selectedUpcomingIds, setSelectedUpcomingIds] = useState<Set<string>>(new Set())
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(true)
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(true)

  useEffect(() => {
    const fetchPendingSummary = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/payments/pending-summary')

        if (!response.ok) {
          throw new Error('Failed to fetch pending payments')
        }

        const result = await response.json()

        if (result.success && result.data.payment_count > 0) {
          setData(result.data)
          // Wait a bit before making it visible for animation
          setTimeout(() => {
            setIsVisible(true)
          }, 100)
        } else {
          // No pending payments, don't show component
          setData(null)
        }
      } catch (err: any) {
        console.error('Error fetching pending summary:', err)
        setError(err.message)
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingSummary()
  }, [])

  const handleOpenDialog = () => {
    setIsOpen(true)
  }

  const handlePayAll = async () => {
    try {
      setIsProcessingPayment(true)
      setLoadingState('checking')

      // Call API to create group payment bill
      // If selectedPaymentIds provided, only pay those specific payments
      const response = await fetch('/api/payments/create-group-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: selectedPaymentIds && selectedPaymentIds.length > 0
          ? JSON.stringify({ payment_ids: selectedPaymentIds })
          : undefined
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle specific error: already fully paid
        if (result.error === 'No pending payments found') {
          // Refresh page to update UI
          window.location.reload()
          return
        }
        throw new Error(result.error || 'Failed to create group payment bill')
      }

      // Check if API wants us to check payment status instead
      if (result.redirect_to_check) {
        // Trigger check status
        setIsProcessingPayment(false)
        setLoadingState(null)
        handleCheckGroupStatus()
        return
      }

      // Change to redirecting state
      setLoadingState('redirecting')

      // Redirect user to Billplz payment page
      if (result.payment_url) {
        window.location.href = result.payment_url
      } else {
        throw new Error('Payment URL not received')
      }
    } catch (error: any) {
      console.error('Error creating group payment:', error)
      toast.error('Failed to create group payment')
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
        // Payment successful - reload page
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

  // Don't render anything if loading, error, or no data
  if (isLoading || error || !data) {
    return null
  }

  const { payment_count, subtotal, transaction_fee, fee_savings, total_amount } = data

  return (
    <>
      {loadingState && <LoadingOverlay state={loadingState} />}

      {/* Desktop Summary Bar */}
      <div
        className={`hidden md:block sticky -bottom-4 inset-x-4 z-50 transition-all duration-500 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className='mx-auto max-w-4xl rounded-2xl border bg-(--background-primary) shadow-lg'>
          <div className='flex items-center justify-between p-3 lg:p-4'>
            {/* Left side */}
            <div className='flex items-center gap-3 lg:gap-5'>
              <span className='rounded-full px-3 py-1.5 text-sm font-semibold bg-(--info-light) text-(--info-dark)'>
                {payment_count} {payment_count === 1 ? 'payment' : 'payments'}
              </span>

              <div className='h-8 w-px bg-border' />

              <div className='flex flex-col lg:flex-row lg:items-center lg:gap-4'>
                <div className='flex items-center gap-3 text-sm'>
                  <span className='text-(--text-secondary)'>
                    Subtotal{' '}
                    <span className='font-semibold text-foreground'>
                      RM{subtotal.toFixed(2)}
                    </span>
                  </span>
                  <span className='text-(--text-secondary)'>
                    + Fee{' '}
                    <span className='font-semibold text-foreground'>
                      RM{transaction_fee.toFixed(2)}
                    </span>
                  </span>
                </div>

                {fee_savings > 0 && (
                  <div className='flex items-center gap-1 text-(--success-main)'>
                    <TrendingDown className='size-3.5' />
                    <span className='text-xs lg:text-sm font-medium'>
                      Saving RM{fee_savings.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className='flex items-center gap-3 lg:gap-4'>
              <div className='text-right'>
                <p className='text-xs text-(--text-secondary)'>Total</p>
                <p className='text-xl font-bold lg:text-2xl'>
                  RM{total_amount.toFixed(2)}
                </p>
              </div>

              <Button
                className='h-10 px-5 lg:h-11 lg:px-6'
                onClick={handlePayAll}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (loadingState === 'checking' ? 'Processing...' : 'Redirecting...') : 'Pay All'}
                {!isProcessingPayment && <ArrowRight className='size-4' />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleOpenDialog}
        className={`md:hidden sticky bottom-0 left-160 z-100 flex size-16 items-center bg-(--secondary-color) hover:bg-(--secondary-color)/90 justify-center rounded-full shadow-lg hover:/90 active:scale-95 transition-all pointer-events-auto touch-manipulation ${
          isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}
        aria-label={`View ${payment_count} due payments`}
      >
        <div className='relative'>
          <Receipt className='size-6' />
          <span className='absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background text-xs font-bold text-foreground border border-accent'>
            {payment_count}
          </span>
        </div>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='md:hidden'>
          <DialogHeader>
            <DialogTitle>Payment Summary</DialogTitle>
            <DialogDescription>
              Review your due payments before completing the transaction
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {/* Items count */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-(--text-secondary)'>
                Due payments
              </span>
              <span className='rounded-full /10 px-3 py-1 text-sm font-medium bg-(--info-light) text-(--info-dark)'>
                {payment_count} {payment_count === 1 ? 'payment' : 'payments'}
              </span>
            </div>

            {/* Subtotal */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-(--text-secondary)'>Subtotal</span>
              <span className='font-semibold text-foreground'>
                RM{subtotal.toFixed(2)}
              </span>
            </div>

            {/* Transaction fee */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-(--text-secondary)'>
                Transaction fee
              </span>
              <span className='font-semibold text-foreground'>
                RM{transaction_fee.toFixed(2)}
              </span>
            </div>

            {/* Savings */}
            {fee_savings > 0 && (
              <div className='flex items-center justify-between rounded-md bg-(--success-main)/10 p-3'>
                <div className='flex items-center gap-2'>
                  <TrendingDown className='size-4 text-(--success-main)' />
                  <span className='text-sm font-medium text-(--success-main)'>
                    You're saving
                  </span>
                </div>
                <span className='text-lg font-bold text-(--success-main)'>
                  RM{fee_savings.toFixed(2)}
                </span>
              </div>
            )}

            {/* Divider */}
            <div className='border-t border-border' />

            {/* Total */}
            <div className='flex items-center justify-between'>
              <span className='text-lg font-medium text-foreground'>Total</span>
              <span className='text-2xl font-bold text-foreground'>
                RM{total_amount.toFixed(2)}
              </span>
            </div>

            {/* Pay button */}
            <Button
              size='lg'
              className='w-full gap-2'
              onClick={handlePayAll}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (loadingState === 'checking' ? 'Processing...' : 'Redirecting...') : 'Pay Now'}
              {!isProcessingPayment && <ArrowRight className='size-4' />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
