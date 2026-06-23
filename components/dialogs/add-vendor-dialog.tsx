'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import AddVendor from '../add-vendor'
import Button from '../costume-ui/button'
import { AddButtonIcon } from '../costume-ui/icon'

export default function AddVendorDialog() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      openDialogButton={
        <Button
          icon={<AddButtonIcon className='text-neutral-300' />}
          label='Add Vendor'
          type='button'
        />
      }
      title='Add Vendor'
      saveButtonLabel={loading ? 'Saving...' : 'Save'}
      loading={loading}
      className='max-w-150!'
    >
      <AddVendor
        onLoadingChange={setLoading}
        onSuccess={() => setOpen(false)}
      />
    </Dialog>
  )
}
