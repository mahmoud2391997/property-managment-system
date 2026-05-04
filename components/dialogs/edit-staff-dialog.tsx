'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import EditStaff from '../edit-staff'
import Button from '../costume-ui/button'
import { Pencil } from 'lucide-react'

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
}

export default function EditStaffDialog({ staff }: EditStaffDialogProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      openDialogButton={
        <Button
          icon={<Pencil size={16} />}
          label='Edit Staff'
          type='button'
          variant='secondary'
        />
      }
      title={`Edit Staff — ${staff.firstName}${staff.lastName ? ` ${staff.lastName}` : ''}`}
      saveButtonLabel={loading ? 'Saving...' : 'Save'}
      loading={loading}
      className='max-w-150!'
    >
      <EditStaff
        staffId={staff.id}
        firstName={staff.firstName}
        lastName={staff.lastName}
        phoneNumber={staff.phoneNumber}
        roleId={staff.roleId}
        isOwner={staff.isOwner}
        onLoadingChange={setLoading}
        onSuccess={() => setOpen(false)}
      />
    </Dialog>
  )
}
