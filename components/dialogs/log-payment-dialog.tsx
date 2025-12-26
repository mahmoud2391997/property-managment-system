'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import LogPayment from '../log-payment'

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
  const [loading, setLoading] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)

  // Use controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog
      openDialogButton={trigger}
      title='Log Payment'
      saveButtonLabel={loading ? 'Saving...' : 'Save Payment'}
      loading={loading}
      className='max-w-150!'
      open={open}
      onOpenChange={setOpen}
    >
      <LogPayment
        paymentId={paymentId}
        paymentReferenceId={paymentReferenceId}
        maxAmount={maxAmount}
        onLoadingChange={setLoading}
        onSuccess={handleSuccess}
      />
    </Dialog>
  )
}
