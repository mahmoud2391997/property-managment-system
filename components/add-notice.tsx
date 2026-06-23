'use client'

import { ComboBoxitemsType } from '@/types'
import Combobox from './costume-ui/combobox'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import RadioGroup from './costume-ui/radio-group'
import Select from './costume-ui/select'
import TextArea from './costume-ui/text-area'
import { noticeTypes, staffData, tenantsData } from '@/utils/data'
import RecurringConfig from './costume-ui/recurring-config'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Toggle from './costume-ui/toggle'

const AddNotice = () => {
  const noticeOptions: string[] = [
    'All Staff & Tenants',
    'All Staff',
    'All Tenants',
    'Specific Recipients'
  ]
  const staffItems: ComboBoxitemsType[] = staffData.map(staff => ({
    avatar: staff.staff_picture,
    label: staff.staff_name,
    subtitle: staff.email
  }))
  const tenantItems: ComboBoxitemsType[] = tenantsData.map(tenant => ({
    avatar: tenant.tenant_picture,
    label: tenant.tenant_name,
    subtitle: tenant.email
  }))
  const [isLimitTenants, setIsLimitTenants] = useState(false)
  const [selectedType, setSelectedType] = useState<string>(noticeTypes[0])
  const [selectedAudience, setSelectedAudience] = useState<number>(0)

  return (
    <div className='flex flex-col gap-7.5'>
      <InputGroup label='Title' isRequired>
        <Input
          placeholder='E.g. Maintenance Scheduled'
          maxLength={50}
          required
        />
      </InputGroup>
      <InputGroup label='Description' isRequired>
        <TextArea placeholder='Type description here' />
      </InputGroup>
      <InputGroup label='Type' className='w-fit!'>
        <Select
          label='Types'
          items={noticeTypes}
          placeholder='Select type'
          className='bg-(--background-primary)'
          value={selectedType}
          onChange={value => {
            setSelectedType(value)
          }}
          required
        />
      </InputGroup>
      <div>
        <InputGroup label='Target Audience' className='gap-3'>
          <RadioGroup
            defaultOption={selectedAudience}
            options={noticeOptions}
            onChange={value => {
              setSelectedAudience(value)
            }}
          />
        </InputGroup>
        <div
          className={cn(
            'flex flex-col',
            'transition-all duration-200 overflow-hidden',
            selectedAudience === 3
              ? 'max-h-40 gap-5 mt-5'
              : 'max-h-0 opacity-0 gap-0'
          )}
        >
          <InputGroup label='Staff' isRequired>
            <Combobox
              items={staffItems}
              searchPlaceholder='Search staff'
              variant='multiple'
              placeholder='Select staff'
              showAvatar
            />
          </InputGroup>
          <InputGroup label='Tenants' isRequired>
            <Combobox
              items={tenantItems}
              searchPlaceholder='Search tenants'
              variant='multiple'
              placeholder='Select tenants'
              showAvatar
            />
          </InputGroup>
        </div>
        <div
          className={cn(
            'transition-all duration-200 overflow-hidden',
            selectedAudience === 2 && selectedType === noticeTypes[2] ? 'max-h-40 gap-5 mt-5' : 'max-h-0 opacity-0 gap-0'
          )}
        >
          <Toggle
            label='Only tenants with late charges'
            subtitle='Send to tenants with overdue payments'
            checked={isLimitTenants}
            onChange={setIsLimitTenants}
          />
        </div>
      </div>
      <RecurringConfig />
    </div>
  )
}

export default AddNotice
