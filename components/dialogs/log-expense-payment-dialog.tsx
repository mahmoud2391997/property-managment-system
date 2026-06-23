'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import LogExpensePayment from '../log-expense-payment'

type Props = {
  expenseId: string
  expenseReferenceId: string
  maxAmount: number
  trigger: React.ReactElement
  onSuccess?: () => void
}

export default function LogExpensePaymentDialog({
  expenseId,
  expenseReferenceId,
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
      <LogExpensePayment
        expenseId={expenseId}
        expenseReferenceId={expenseReferenceId}
        maxAmount={maxAmount}
        onLoadingChange={setLoading}
        onSuccess={handleSuccess}
      />
    </Dialog>
  )
}
