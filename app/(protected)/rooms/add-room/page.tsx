'use client'
import React, { useState } from 'react'
import CollapsibleSection from '@/components/costume-ui/collapsible-section'
import InputGroup from '@/components/costume-ui/input-group'
import Input from '@/components/costume-ui/input'
import Select from '@/components/costume-ui/select'
import { propertiesData } from '@/utils/data'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import ReminderSection from '@/components/costume-ui/reminder-section'
import PaymentSection from '@/components/costume-ui/payment-section'
import AddPageHead from '@/components/costume-ui/add-page-head'

// Main compoennt
const AddRoom = () => {
  const propertyCode: string[] = propertiesData.map(property => property.code)
  const [isRoomReady, setIsRoomReady] = useState<boolean>(false)

  return (
    <div className='flex flex-col gap-5'>
      {/* Head section */}
      <AddPageHead
        crumb_items={[
          { label: 'Rooms', href: '/rooms' },
          { label: 'Add Room' }
        ]}
        title='Add a room'
        subtitle='Add a new room under an existing property'
      />

      {/* Rooms Details Section */}
      <CollapsibleSection number={1} title='Room Details'>
        {/* Basic Details */}
        <InnerSection title='Basic Details' subtitle='Enter the room details'>
          <div className='inputs-container'>
            <InputGroup label='Title' isRequired>
              <Input placeholder='E.g. Master' maxLength={20} required />
            </InputGroup>
            <InputGroup label='Property' isRequired>
              <Select
                items={propertyCode}
                label='Properties'
                placeholder='Select a property'
              />
            </InputGroup>
          </div>
        </InnerSection>

        {/* Status */}
        <InnerSection title='Status' subtitle='Set availability of the room'>
          <div className='relative border border-(--border-strong) rounded-md overflow-hidden'>
            <Checkbox
              checked={isRoomReady}
              className={cn(
                'absolute top-1/2 left-3 -translate-y-1/2',
                'h-6 w-6 border-(--border-strong)'
              )}
            />
            <button
              onClick={() => setIsRoomReady(prev => !prev)}
              className={cn(
                'flex flex-col justify-center gap-[3]',
                'hover:bg-neutral-50',
                'h-20 w-full px-5 pl-11',
                'cursor-pointer'
              )}
            >
              <div className='flex items-center gap-[5]'>
                <Check
                  size={17}
                  className={cn(
                    isRoomReady ? 'text-(--success-main)' : 'text-neutral-400'
                  )}
                />
                <span className='texts-body-medium'>
                  Room is ready for occupancy
                </span>
              </div>
              <span className='texts-caption-large text-left text-(--text-secondary)'>
                Check this if the room is move-in ready
              </span>
            </button>
          </div>
        </InnerSection>
      </CollapsibleSection>

      {/* Default Payment Details */}
      <PaymentSection
        sectionNumber={2}
        title='Default Payment Details (Optional)'
        defaultCollapse
        defaultPayment
      />

      {/* Default Reminder */}
      <ReminderSection sectionNumber={3} title='Default Reminders (Optional)' defaultCollapse isOptional />
    </div>
  )
}

export default AddRoom
