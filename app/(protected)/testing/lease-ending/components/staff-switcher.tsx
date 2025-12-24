'use client'

import { useState } from 'react'
import { StaffMember } from '../types'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { ChevronDown, Check } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type Props = {
  staffList: StaffMember[]
  currentStaff: StaffMember
  onStaffChange: (staff: StaffMember) => void
}

export default function StaffSwitcher({
  staffList,
  currentStaff,
  onStaffChange
}: Props) {
  const [open, setOpen] = useState(false)

  const handleSelect = (staff: StaffMember) => {
    onStaffChange(staff)
    setOpen(false)
  }

  return (
    <div className='fixed bottom-6 right-6 z-50'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className='flex items-center gap-3 px-4 py-3 bg-white border border-(--border-default) rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:border-blue-300'>
            <div className='flex items-center gap-3'>
              <UserAvatar
                name={currentStaff.name}
                imgSrc={currentStaff.avatar}
                size={36}
              />
              <div className='text-left'>
                <p className='texts-body-small-medium text-(--text-primary)'>
                  Viewing as
                </p>
                <p className='texts-body-medium-medium text-blue-600'>
                  {currentStaff.name}
                </p>
              </div>
            </div>
            <ChevronDown
              size={18}
              className={cn(
                'text-(--text-secondary) transition-transform duration-200',
                open && 'rotate-180'
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className='w-72 p-2'
          align='end'
          side='top'
          sideOffset={8}
        >
          <div className='mb-2 px-2 py-1'>
            <p className='texts-label-small text-(--text-secondary) uppercase tracking-wide'>
              Switch Staff View
            </p>
          </div>
          <div className='space-y-1'>
            {staffList.map(staff => {
              const isSelected = staff.id === currentStaff.id
              return (
                <button
                  key={staff.id}
                  onClick={() => handleSelect(staff)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isSelected
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-neutral-50'
                  )}
                >
                  <UserAvatar
                    name={staff.name}
                    imgSrc={staff.avatar}
                    size={32}
                  />
                  <div className='flex-1 text-left'>
                    <p
                      className={cn(
                        'texts-body-small-medium',
                        isSelected
                          ? 'text-blue-700'
                          : 'text-(--text-primary)'
                      )}
                    >
                      {staff.name}
                    </p>
                    <p className='texts-label-small text-(--text-secondary)'>
                      {staff.role}
                    </p>
                  </div>
                  {isSelected && (
                    <Check size={16} className='text-blue-600' />
                  )}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
