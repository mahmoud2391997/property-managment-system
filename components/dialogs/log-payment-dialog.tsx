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
}

export default function LogPaymentDialog({
  paymentId,
  paymentReferenceId,
  maxAmount,
  trigger,
  onSuccess
}: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

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
