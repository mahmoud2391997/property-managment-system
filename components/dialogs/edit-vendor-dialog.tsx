'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import EditVendor, { VendorEditData } from '../edit-vendor'

type Props = {
  vendorId: string
  initialData?: VendorEditData
  trigger: React.ReactNode
  onSuccess?: () => void
}

export default function EditVendorDialog({ vendorId, initialData, trigger, onSuccess }: Props) {
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
      title='Edit Vendor'
      saveButtonLabel={loading ? 'Saving...' : 'Save Changes'}
      loading={loading}
      disabled={!hasChanges}
      className='max-w-150!'
      open={open}
      onOpenChange={setOpen}
    >
      <EditVendor
        vendorId={vendorId}
        initialData={initialData}
        onLoadingChange={setLoading}
        onSuccess={handleSuccess}
        onHasChanges={setHasChanges}
      />
    </Dialog>
  )
}
