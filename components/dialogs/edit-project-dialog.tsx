'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import EditProject from '../edit-project'
import Button from '../costume-ui/button'
import { SettingsIcon } from '../costume-ui/icon'

type Props = {
  projectId: string
  projectName?: string
}

export default function EditProjectDialog({ projectId, projectName }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      openDialogButton={
        <Button
          icon={<SettingsIcon className='text-neutral-300' />}
          label='Edit project'
          type='button'
          className='w-full justify-start'
        />
      }
      title={`Edit Project: ${projectName || 'Loading...'}`}
      saveButtonLabel={loading ? 'Updating...' : 'Update'}
      loading={loading}
    >
      <EditProject
        projectId={projectId}
        onLoadingChange={setLoading}
        onSuccess={() => setOpen(false)}
      />
    </Dialog>
  )
}
