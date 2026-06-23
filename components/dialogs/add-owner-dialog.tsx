'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import AddOwner from '../add-owner'
import Button from '../costume-ui/button'
import { AddButtonIcon } from '../costume-ui/icon'

export default function AddOwnerDialog() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      openDialogButton={
        <Button
          icon={<AddButtonIcon className='text-neutral-300' />}
          label='Add Owner'
          type='button'
        />
      }
      title='Add Owner'
      saveButtonLabel={loading ? 'Saving...' : 'Save'}
      loading={loading}
      className='max-w-150!'
    >
      <AddOwner
        onLoadingChange={setLoading}
        onSuccess={() => setOpen(false)}
      />
    </Dialog>
  )
}
