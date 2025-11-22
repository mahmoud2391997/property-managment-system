import { useState } from 'react'
import CollapsibleSection from './collapsible-section'
import InnerSection from './collapsible-inner-section'
import RadioGroup from './radio-group'
import InputGroup from './input-group'
import Input from './input'
import { cn } from '@/lib/utils'
import { CheckAddon } from './payment-section'

type Props = {
  title: string
  sectionNumber: number
  onLeaseExpiryChange?: (enabled: boolean, days: string) => void
  onRentReminderChange?: (enabled: boolean, days: string) => void
  onOverdueReminderChange?: (enabled: boolean, days: string) => void
  defaultCollapse?: boolean
  isOptional?: boolean
}

const ReminderSection = ({
  title = 'Reminders',
  sectionNumber,
  onLeaseExpiryChange,
  onRentReminderChange,
  onOverdueReminderChange,
  defaultCollapse = false,
  isOptional = false
}: Props) => {
  // Enable/disable states for optional mode
  const [enableLeaseExpiry, setEnableLeaseExpiry] = useState(false)
  const [enableRentReminder, setEnableRentReminder] = useState(false)
  const [enableOverdueReminder, setEnableOverdueReminder] = useState(false)

  const [activate, setActivate] = useState<{
    expiry: boolean
    before: boolean
    after: boolean
  }>({
    expiry: false,
    before: false,
    after: false
  })

  const [days, setDays] = useState<{
    expiry: string
    before: string
    after: string
  }>({
    expiry: '',
    before: '',
    after: ''
  })

  const inputGroupEffect = (activate: boolean) => {
    return cn(
      'overflow-hidden transition-all duration-150 ease-out',
      activate ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
    )
  }

  return (
    <CollapsibleSection title={title} number={sectionNumber} defaultCollapse={defaultCollapse}>
      <InnerSection
        title='Reminders'
        subtitle='Set up automated reminders to keep everyone on track with key rental dates'
      >
        <div className='flex'>
          <InputGroup label='Lease expiry'>
            <RadioGroup
              defaultOption={1}
              options={['Yes', 'No']}
              onChange={value => {
                const enabled = value === 0
                setActivate(prev => ({ ...prev, expiry: enabled }))
                onLeaseExpiryChange?.(enabled, days.expiry)
              }}
            />
          </InputGroup>

          <InputGroup
            label='Lease expiry reminder days before'
            className={inputGroupEffect(activate.expiry)}
          >
            <Input
              type='number'
              min={1}
              placeholder='E.g. 30'
              value={days.expiry}
              onChange={e => {
                const value = e.target.value
                setDays(prev => ({ ...prev, expiry: value }))
                onLeaseExpiryChange?.(activate.expiry, value)
              }}
            />
          </InputGroup>
        </div>
        <div className='flex'>
          <InputGroup label='Send rent reminders to tenants'>
            <RadioGroup
              defaultOption={1}
              options={['Yes', 'No']}
              onChange={value => {
                const enabled = value === 0
                setActivate(prev => ({ ...prev, before: enabled }))
                onRentReminderChange?.(enabled, days.before)
              }}
            />
          </InputGroup>
          <InputGroup
            label='Tenant rent reminder days before'
            className={inputGroupEffect(activate.before)}
          >
            <Input
              type='number'
              min={1}
              placeholder='E.g. 7'
              value={days.before}
              onChange={e => {
                const value = e.target.value
                setDays(prev => ({ ...prev, before: value }))
                onRentReminderChange?.(activate.before, value)
              }}
            />
          </InputGroup>
        </div>
        <div className='flex'>
          <InputGroup label='Send rent overdue reminders to tenants'>
            <RadioGroup
              defaultOption={1}
              options={['Yes', 'No']}
              onChange={value => {
                const enabled = value === 0
                setActivate(prev => ({ ...prev, after: enabled }))
                onOverdueReminderChange?.(enabled, days.after)
              }}
            />
          </InputGroup>
          <InputGroup
            label='Tenant rent reminder days after'
            className={inputGroupEffect(activate.after)}
          >
            <Input
              type='number'
              min={1}
              placeholder='E.g. 3'
              value={days.after}
              onChange={e => {
                const value = e.target.value
                setDays(prev => ({ ...prev, after: value }))
                onOverdueReminderChange?.(activate.after, value)
              }}
            />
          </InputGroup>
        </div>
      </InnerSection>
    </CollapsibleSection>
  )
}

export default ReminderSection
