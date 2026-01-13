'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Dialog from '../costume-ui/dialog'
import AddTicket from '../add-ticket'
import Button from '../costume-ui/button'
import { AddButtonIcon } from '../costume-ui/icon'

type Props = {
  onSuccess?: () => void
}

export default function AddTicketDialog({ onSuccess }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSuccess = (ticketId: string) => {
    setOpen(false)
    onSuccess?.()
    router.push(`/tickets/${ticketId}`)
  }
 

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      openDialogButton={
        <Button
          icon={<AddButtonIcon className='text-neutral-300' />}
          label='Add Ticket'
          type='button'
        />
      }
      title='Add Ticket'
      saveButtonLabel={loading ? 'Submitting...' : 'Submit'}
      loading={loading}
      className='max-w-150!'
    >
      <AddTicket
        onLoadingChange={setLoading}
        onSuccess={handleSuccess}
      />
    </Dialog>
  )
}
