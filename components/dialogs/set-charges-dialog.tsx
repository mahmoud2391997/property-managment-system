'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import ChargesSection, { ChargeData } from '../costume-ui/charges-section'
import { FeedbackToasts } from '../costume-ui/feedback-toast'

type Props = {
  paymentId: string
  paymentReferenceId: string
  trigger: React.ReactElement
  onSuccess?: () => void
}

export default function SetChargesDialog({
  paymentId,
  paymentReferenceId,
  trigger,
  onSuccess
}: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [charges, setCharges] = useState<ChargeData[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate charges
    if (charges.length === 0 || charges.some(c => !c.type || !c.amount)) {
      FeedbackToasts.error('Please add at least one valid charge')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/payments/${paymentReferenceId}/set-charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charges })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to set charges')
      }

      FeedbackToasts.updated('Charges', 'Payment charges have been set')
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Error setting charges:', error)
      FeedbackToasts.error(error.message || 'Failed to set charges')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      openDialogButton={trigger}
      title={`Set Charges - ${paymentReferenceId}`}
      saveButtonLabel={loading ? 'Saving...' : 'Save Charges'}
      loading={loading}
      disabled={charges.length === 0}
      className='max-w-200!'
      open={open}
      onOpenChange={setOpen}
    >
      <form id='dialog-form' onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <ChargesSection
          flowType='income'
          selectable={false}
          onChargesChange={setCharges}
        />
      </form>
    </Dialog>
  )
}
