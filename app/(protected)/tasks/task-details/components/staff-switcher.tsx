'use client'

import { UserAvatar } from '@/components/costume-ui/name-avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { StaffMember } from '../types'

type Props = {
  staffList: StaffMember[]
  currentStaff: StaffMember
  onStaffChange: (staff: StaffMember) => void
}

export default function StaffSwitcher({ staffList, currentStaff, onStaffChange }: Props) {
  const handleChange = (staffId: string) => {
    const staff = staffList.find(s => s.id === staffId)
    if (staff) {
      onStaffChange(staff)
    }
  }

  return (
    <div className='mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div>
          <p className='texts-body-small-medium text-amber-800'>Testing Mode</p>
          <p className='texts-body-small text-amber-700'>
            Switch staff to test different perspectives
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <UserAvatar name={currentStaff.name} imgSrc={currentStaff.avatar} size={36} />
          <Select value={currentStaff.id} onValueChange={handleChange}>
            <SelectTrigger className='w-[200px] bg-white'>
              <SelectValue placeholder='Select staff' />
            </SelectTrigger>
            <SelectContent>
              {staffList.map(staff => (
                <SelectItem key={staff.id} value={staff.id}>
                  <div className='flex items-center gap-2'>
                    <span>{staff.name}</span>
                    {staff.role && (
                      <span className='texts-label-small text-(--text-secondary)'>
                        ({staff.role})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
