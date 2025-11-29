'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import AddView from '../add-view'
import Button from '../costume-ui/button'
import { AddButtonIcon } from '../costume-ui/icon'

type Props = {
  propertyId: string
  onSuccess?: () => void
}

export default function AddViewDialog({ propertyId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog
      openDialogButton={
        <Button
          icon={<AddButtonIcon className='text-neutral-300' />}
          label='Add View'
          type='button'
        />
      }
      title='Add View'
      saveButtonLabel={loading ? 'Saving...' : 'Save'}
      loading={loading}
      className='max-w-150!'
    >
      <AddView
        propertyId={propertyId}
        onLoadingChange={setLoading}
        onSuccess={handleSuccess}
      />
    </Dialog>
  )
}
