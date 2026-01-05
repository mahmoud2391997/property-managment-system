'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { LoadingOverlay } from './costume-ui/page-loader'

type Props = {
  children: React.ReactNode
}

export function PaymentsPageWrapper({ children }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    const shouldCheck = searchParams.get('payment_check')
    const paymentId = searchParams.get('payment_id')

    // Only check once, even if component re-renders
    if (shouldCheck === 'true' && paymentId && !hasCheckedRef.current) {
      hasCheckedRef.current = true
      // Auto-trigger payment check
      checkPaymentStatus(paymentId)
    }
  }, [searchParams])

  const checkPaymentStatus = async (paymentUuid: string) => {
    try {
      setIsProcessing(true)

      // Get bill ID from localStorage
      const billId = localStorage.getItem(`pending_bill_${paymentUuid}`)

      if (!billId) {
        throw new Error('Payment bill information not found. Please try again.')
      }

      // Call API to check payment status using payment UUID and bill ID
      const response = await fetch('/api/payments/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentUuid,
          bill_id: billId
        })
      })

      const result = await response.json()

      // Handle payment failed (Billplz marked payment as failed)
      if (!response.ok && result.payment_failed) {
        setIsProcessing(false)
        // Clear URL params immediately to prevent re-checking on reload
        clearUrlParams()
        await Swal.fire({
          icon: 'error',
          title: 'Payment Failed',
          text: result.message || 'Payment failed due to an issue with the payment gateway. Please try again.',
          confirmButtonColor: '#ef4444'
        })
        // Clean up localStorage
        localStorage.removeItem(`pending_bill_${paymentUuid}`)
        // Refresh to show current status
        router.refresh()
        return
      }

      // Handle payment not completed (Pending or no payment made yet)
      if (!response.ok && result.payment_not_completed) {
        setIsProcessing(false)
        // Clear URL params immediately to prevent re-checking on reload
        clearUrlParams()
        await Swal.fire({
          icon: 'info',
          title: 'Payment Not Completed',
          text: result.message || 'No successful payment made yet. Please try making payment again.',
          confirmButtonColor: '#3085d6'
        })
        // Clean up localStorage
        localStorage.removeItem(`pending_bill_${paymentUuid}`)
        // Refresh to show current status
        router.refresh()
        return
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check payment status')
      }

      if (result.success) {
        setIsProcessing(false)
        // Clear URL params immediately to prevent re-checking on reload
        clearUrlParams()

        if (result.already_recorded) {
          await Swal.fire({
            icon: 'info',
            title: 'Already Recorded',
            text: 'This payment was already recorded!',
            confirmButtonColor: '#3085d6'
          })
        } else if (result.newly_recorded) {
          await Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            text: `Your payment of RM ${result.amount_paid} has been recorded successfully.`,
            confirmButtonColor: '#10b981'
          })
        }

        // Clean up localStorage after successful payment
        localStorage.removeItem(`pending_bill_${paymentUuid}`)

        // Emit custom event with updated payment data to update the table
        if (result.updated_payment) {
          window.dispatchEvent(
            new CustomEvent('payment-updated', {
              detail: result.updated_payment
            })
          )
        } else {
          // Fallback to reload if no updated data
          window.location.reload()
        }
      } else {
        setIsProcessing(false)
        // Clear URL params immediately to prevent re-checking on reload
        clearUrlParams()
        await Swal.fire({
          icon: 'warning',
          title: 'Payment Not Completed',
          text: `Payment status: ${result.state}. Please complete your payment.`,
          confirmButtonColor: '#f59e0b'
        })
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to check payment status: ${error.message}`,
        confirmButtonColor: '#ef4444'
      })
      clearUrlParams()
      setIsProcessing(false)
    }
  }

  const clearUrlParams = () => {
    router.replace('/payments')
  }

  return (
    <>
      {isProcessing && <LoadingOverlay state='processing' />}
      
      {children}
    </>
  )
}

