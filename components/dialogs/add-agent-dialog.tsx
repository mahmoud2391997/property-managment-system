'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import AddAgent from '../add-agent'
import Button from '../costume-ui/button'
import { AddButtonIcon } from '../costume-ui/icon'

export default function AddAgentDialog() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      openDialogButton={
        <Button
          icon={<AddButtonIcon className='text-neutral-300' />}
          label='Add Agent'
          type='button'
        />
      }
      title='Add Agent'
      saveButtonLabel={loading ? 'Saving...' : 'Save'}
      loading={loading}
      className='max-w-150!'
    >
      <AddAgent
        onLoadingChange={setLoading}
        onSuccess={() => setOpen(false)}
      />
    </Dialog>
  )
}
