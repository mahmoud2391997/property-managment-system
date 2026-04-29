'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import EditProject from '../edit-project'

type Props = {
  projectId: string
  projectName?: string
  trigger: React.ReactNode
  onSuccess?: () => void
}

export default function EditProjectDialog({ projectId, projectName, trigger, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog
      openDialogButton={trigger}
      title={`Edit Project: ${projectName || 'Loading...'}`}
      saveButtonLabel={loading ? 'Updating...' : 'Update'}
      loading={loading}
      open={open}
      onOpenChange={setOpen}
    >
      <EditProject
        projectId={projectId}
        onLoadingChange={setLoading}
        onSuccess={handleSuccess}
      />
    </Dialog>
  )
}
