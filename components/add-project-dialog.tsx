'use client'

import { useState } from 'react'
import Dialog from './costume-ui/dialog'
import AddProject from './add-project'
import Button from './costume-ui/button'
import { AddButtonIcon } from './costume-ui/icon'

export default function AddProjectDialog() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      openDialogButton={
        <Button
          icon={<AddButtonIcon className='text-neutral-300' />}
          label='Add Project'
          type='button'
        />
      }
      title='Add Project'
      saveButtonLabel='Save'
      loading={loading}
    >
      <AddProject
        onLoadingChange={setLoading}
        onSuccess={() => setOpen(false)}
      />
    </Dialog>
  )
}
