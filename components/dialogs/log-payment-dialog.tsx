'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Dialog from '../costume-ui/dialog'
import LogPayment from '../log-payment'
import { LoadingOverlay } from '../costume-ui/page-loader'
import Swal from 'sweetalert2'

type Props = {
  paymentId: string
  paymentReferenceId: string
  maxAmount: number
  trigger: React.ReactElement
  onSuccess?: () => void
  // Controlled mode props
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function LogPaymentDialog({
  paymentId,
  paymentReferenceId,
  maxAmount,
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)

  // Use controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  // Check for pending FPX payments before opening dialog
  const handleOpenChange = async (newOpen: boolean) => {
    // If closing, just close
    if (!newOpen) {
      setOpen(false)
      return
    }

    // If opening, check for pending FPX payments first
    try {
      setIsCheckingStatus(true)

      const response = await fetch('/api/payments/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference_id: paymentId })
      })

      const result = await response.json()

      // If payment was already made via FPX, show message and refresh
      if (result.success && result.newly_recorded) {
        await Swal.fire({
          icon: 'success',
          title: 'Payment Already Made',
          text: `A payment of RM ${result.amount_paid} was already made via FPX and has been recorded.`,
          confirmButtonColor: '#10b981'
        })
        router.refresh()
        onSuccess?.()
        return
      }

      // If payment was already recorded before
      if (result.success && result.already_recorded) {
        await Swal.fire({
          icon: 'info',
          title: 'Payment Already Recorded',
          text: 'This FPX payment was already recorded.',
          confirmButtonColor: '#3085d6'
        })
        router.refresh()
        onSuccess?.()
        return
      }

      // No pending FPX payment - open the dialog
      setOpen(true)
    } catch (error) {
      console.error('Error checking payment status:', error)
      // On error, still allow opening the dialog
      setOpen(true)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  return (
    <>
      {isCheckingStatus && <LoadingOverlay state='checking' />}
      <Dialog
        openDialogButton={trigger}
        title='Log Payment'
        saveButtonLabel={loading ? 'Saving...' : 'Save Payment'}
        loading={loading}
        className='max-w-150!'
        open={open}
        onOpenChange={handleOpenChange}
      >
        <LogPayment
          paymentId={paymentId}
          paymentReferenceId={paymentReferenceId}
          maxAmount={maxAmount}
          onLoadingChange={setLoading}
          onSuccess={handleSuccess}
        />
      </Dialog>
    </>
  )
}
