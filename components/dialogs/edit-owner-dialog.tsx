'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import EditOwner, { OwnerEditData } from '../edit-owner'

type Props = {
  ownerId: string
  initialData?: OwnerEditData
  trigger: React.ReactNode
  onSuccess?: () => void
}

export default function EditOwnerDialog({ ownerId, initialData, trigger, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog
      openDialogButton={trigger}
      title='Edit Owner'
      saveButtonLabel={loading ? 'Saving...' : 'Save Changes'}
      loading={loading}
      disabled={!hasChanges}
      className='max-w-150!'
      open={open}
      onOpenChange={setOpen}
    >
      <EditOwner
        ownerId={ownerId}
        initialData={initialData}
        onLoadingChange={setLoading}
        onSuccess={handleSuccess}
        onHasChanges={setHasChanges}
      />
    </Dialog>
  )
}
