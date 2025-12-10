'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import EditView from '../edit-view'
import { ViewWithProperty } from '@/types'

type Props = {
  view: ViewWithProperty
  onSuccess?: () => void
  trigger: React.ReactNode
}

export default function EditViewDialog({ view, onSuccess, trigger }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog
      openDialogButton={trigger}
      title='Edit View'
      saveButtonLabel={loading ? 'Saving...' : 'Save'}
      loading={loading}
      className='max-w-150!'
      open={open}
      onOpenChange={setOpen}
    >
      <EditView
        view={view}
        onLoadingChange={setLoading}
        onSuccess={handleSuccess}
      />
    </Dialog>
  )
}
