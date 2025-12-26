'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import AddTask from '../add-task'
import Button from '../costume-ui/button'
import { AddButtonIcon } from '../costume-ui/icon'

type Props = {
  onSuccess?: () => void
}

export default function AddTaskDialog({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      openDialogButton={
        <Button
          icon={<AddButtonIcon className='text-neutral-300' />}
          label='Add Task'
          type='button'
        />
      }
      title='Add Task'
      saveButtonLabel={loading ? 'Creating...' : 'Create Task'}
      loading={loading}
      className='max-w-150!'
    >
      <AddTask onLoadingChange={setLoading} onSuccess={handleSuccess} />
    </Dialog>
  )
}
