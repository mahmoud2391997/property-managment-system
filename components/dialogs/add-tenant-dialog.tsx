'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import AddTenant from '../add-tenant'
import Button from '../costume-ui/button'
import { AddButtonIcon } from '../costume-ui/icon'

export default function AddTenantDialog() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      openDialogButton={
        <Button
          icon={<AddButtonIcon className='text-neutral-300' />}
          label='Add Tenant'
          type='button'
        />
      }
      title='Add Tenant'
      saveButtonLabel={loading ? 'Saving...' : 'Save'}
      loading={loading}
      className='max-w-150!'
    >
      <AddTenant
        onLoadingChange={setLoading}
        onSuccess={() => setOpen(false)}
      />
    </Dialog>
  )
}
