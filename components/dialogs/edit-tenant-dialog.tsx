'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import EditTenant, { TenantEditData } from '../edit-tenant'

type Props = {
  tenantId: string
  initialData?: TenantEditData
  trigger: React.ReactNode
  onSuccess?: () => void
}

export default function EditTenantDialog({ tenantId, initialData, trigger, onSuccess }: Props) {
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
      title='Edit Tenant'
      saveButtonLabel={loading ? 'Saving...' : 'Save Changes'}
      loading={loading}
      disabled={!hasChanges}
      className='max-w-150!'
      open={open}
      onOpenChange={setOpen}
    >
      <EditTenant
        tenantId={tenantId}
        initialData={initialData}
        onLoadingChange={setLoading}
        onSuccess={handleSuccess}
        onHasChanges={setHasChanges}
      />
    </Dialog>
  )
}
