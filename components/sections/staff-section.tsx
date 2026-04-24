'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { RoleButtonIcon } from '@/components/costume-ui/icon'
import StaffTable from '@/components/tables/staff-table'
import AddStaffDialog from '@/components/dialogs/add-staff-dialog'
import RolePopupDialog from '@/components/dialogs/role-popup-dialog'
import { Prisma } from '@prisma/client'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'
import { NoAccessCard } from '@/components/no-access-card'

type StaffWithRole = Prisma.staffGetPayload<{
  select: {
    id: true
    staff_id: true
    first_name: true
    last_name: true
    phone_number: true
    profile_thumb: true
    roles: {
      select: {
        title: true
      }
    }
  }
}> & {
  email?: string
  accountStatus?: 'Activated' | 'Pending'
}

interface StaffSectionProps {
  staff: StaffWithRole[]
  currentUserId?: string
}

export default function StaffSection({ staff, currentUserId }: StaffSectionProps) {
  const { can } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [isRolePopupOpen, setIsRolePopupOpen] = useState(false)

  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) {
      return staff
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return staff.filter(member => {
      // Search by staff ID
      const staffIdMatch = member.staff_id?.toLowerCase().includes(lowerSearch)

      // Search by name (first name, last name, or full name)
      const firstName = member.first_name?.toLowerCase() || ''
      const lastName = member.last_name?.toLowerCase() || ''
      const fullName = `${firstName} ${lastName}`.trim()
      const nameMatch = firstName.includes(lowerSearch) ||
                        lastName.includes(lowerSearch) ||
                        fullName.includes(lowerSearch)

      // Search by role
      const roleMatch = member.roles?.title?.toLowerCase().includes(lowerSearch)

      // Search by account status
      const statusMatch = member.accountStatus?.toLowerCase().includes(lowerSearch)

      // Search by phone number
      const phoneMatch = member.phone_number?.toLowerCase().includes(lowerSearch)

      // Search by email
      const emailMatch = member.email?.toLowerCase().includes(lowerSearch)

      return staffIdMatch || nameMatch || roleMatch || statusMatch || phoneMatch || emailMatch
    })
  }, [staff, searchTerm])

  return (
    <PermissionGate 
      permission="staff.access" 
      fallback={
        <NoAccessCard label="Staff" />
      }
    >
      <>
        {/* Actions */}
        <div className={cn('flex justify-between items-center', 'w-full')}>
          <SearchInput
            placeholder='Search staff'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Buttons */}
          <div className={cn('flex items-center gap-2.5', 'py-5')}>
            <Button
              icon={<RoleButtonIcon className='text-neutral-300' />}
              label='Roles'
              className='bg-(--secondary-color)'
              onClick={() => setIsRolePopupOpen(true)}
            />

            <PermissionGate permission="staff.create" fallback={null}>
              <AddStaffDialog />
            </PermissionGate>
          </div>
        </div>
        {/* Table */}
        <StaffTable data={filteredStaff} currentUserId={currentUserId} />
        
        {/* Role Popup Dialog */}
        <RolePopupDialog
          open={isRolePopupOpen}
          onClose={() => setIsRolePopupOpen(false)}
          staff={staff}
          currentUserId={currentUserId}
        />
      </>
    </PermissionGate>
  )
}
