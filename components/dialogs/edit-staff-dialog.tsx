'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import EditStaff from '../edit-staff'

interface StaffData {
  id: string
  firstName: string
  lastName: string | null
  phoneNumber: string
  roleId: string
  isOwner: boolean
}

interface EditStaffDialogProps {
  staff: StaffData
  onOpenChange?: (open: boolean) => void
}

export default function EditStaffDialog({ staff, onOpenChange }: EditStaffDialogProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen)
    onOpenChange?.(isOpen)
  }

  return (
    <Dialog
      title={`Edit Staff — ${staff.firstName}${staff.lastName ? ` ${staff.lastName}` : ''}`}
      saveButtonLabel={loading ? 'Saving...' : 'Save'}
      loading={loading}
      className='max-w-150!'
      open={open}
      onOpenChange={handleClose}
    >
      <EditStaff
        staffId={staff.id}
        firstName={staff.firstName}
        lastName={staff.lastName}
        phoneNumber={staff.phoneNumber}
        roleId={staff.roleId}
        isOwner={staff.isOwner}
        onLoadingChange={setLoading}
        onSuccess={() => handleClose(false)}
      />
    </Dialog>
  )
}
