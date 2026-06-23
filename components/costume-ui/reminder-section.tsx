import { useState, useEffect } from 'react'
import CollapsibleSection from './collapsible-section'
import InnerSection from './collapsible-inner-section'
import RadioGroup from './radio-group'
import InputGroup from './input-group'
import Input from './input'
import { cn } from '@/lib/utils'
import { CheckAddon } from './payment-section'

export type DefaultReminderConfig = {
  is_expiry_reminder?: boolean
  expiry_days_before_reminder?: number | null
  is_rent_reminder?: boolean
  rent_reminder_days_before?: number | null
  is_overdue_rent_reminder?: boolean
  overdue_days_after_reminder?: number | null
}

type ReminderLabels = {
  subtitle?: string
  expiryLabel?: string
  expiryDaysLabel?: string
  rentReminderLabel?: string
  rentDaysLabel?: string
  overdueLabel?: string
  overdueDaysLabel?: string
}

type Props = {
  title: string
  sectionNumber: number
  onLeaseExpiryChange?: (enabled: boolean, days: string) => void
  onRentReminderChange?: (enabled: boolean, days: string) => void
  onOverdueReminderChange?: (enabled: boolean, days: string) => void
  defaultCollapse?: boolean
  defaultReminders?: DefaultReminderConfig
  labels?: ReminderLabels
}

const ReminderSection = ({
  title = 'Reminders',
  sectionNumber,
  onLeaseExpiryChange,
  onRentReminderChange,
  onOverdueReminderChange,
  defaultCollapse = false,
  defaultReminders,
  labels
}: Props) => {
  const resolvedLabels = {
    subtitle: labels?.subtitle ?? 'Set up automated reminders to keep everyone on track with key rental dates',
    expiryLabel: labels?.expiryLabel ?? 'Lease expiry',
    expiryDaysLabel: labels?.expiryDaysLabel ?? 'Lease expiry reminder days before',
    rentReminderLabel: labels?.rentReminderLabel ?? 'Send rent reminders to tenants',
    rentDaysLabel: labels?.rentDaysLabel ?? 'Tenant rent reminder days before',
    overdueLabel: labels?.overdueLabel ?? 'Send rent overdue reminders to tenants',
    overdueDaysLabel: labels?.overdueDaysLabel ?? 'Tenant rent reminder days after'
  }
  const [remindersApplied, setRemindersApplied] = useState(false)

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

  // Apply default reminders when they arrive (after async load)
  useEffect(() => {
    if (defaultReminders && !remindersApplied) {
      const newActivate = {
        expiry: defaultReminders.is_expiry_reminder ?? false,
        before: defaultReminders.is_rent_reminder ?? false,
        after: defaultReminders.is_overdue_rent_reminder ?? false
      }
      const newDays = {
        expiry: defaultReminders.expiry_days_before_reminder?.toString() ?? '',
        before: defaultReminders.rent_reminder_days_before?.toString() ?? '',
        after: defaultReminders.overdue_days_after_reminder?.toString() ?? ''
      }

      setActivate(newActivate)
      setDays(newDays)

      // Notify parent of the defaults
      if (newActivate.expiry || newDays.expiry) {
        onLeaseExpiryChange?.(newActivate.expiry, newDays.expiry)
      }
      if (newActivate.before || newDays.before) {
        onRentReminderChange?.(newActivate.before, newDays.before)
      }
      if (newActivate.after || newDays.after) {
        onOverdueReminderChange?.(newActivate.after, newDays.after)
      }

      setRemindersApplied(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultReminders, remindersApplied]) // Don't include callbacks - they're not stable and cause infinite loops

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
        subtitle={resolvedLabels.subtitle}
      >
        <div className='flex'>
          <InputGroup label={resolvedLabels.expiryLabel}>
            <RadioGroup
              defaultOption={1}
              options={['Yes', 'No']}
              value={activate.expiry ? 0 : 1}
              onChange={value => {
                const enabled = value === 0
                setActivate(prev => ({ ...prev, expiry: enabled }))
                onLeaseExpiryChange?.(enabled, days.expiry)
              }}
            />
          </InputGroup>

          <InputGroup
            label={resolvedLabels.expiryDaysLabel}
            className={inputGroupEffect(activate.expiry)}
            isRequired
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
              required={activate.expiry}
            />
          </InputGroup>
        </div>
        <div className='flex'>
          <InputGroup label={resolvedLabels.rentReminderLabel}>
            <RadioGroup
              defaultOption={1}
              options={['Yes', 'No']}
              value={activate.before ? 0 : 1}
              onChange={value => {
                const enabled = value === 0
                setActivate(prev => ({ ...prev, before: enabled }))
                onRentReminderChange?.(enabled, days.before)
              }}
            />
          </InputGroup>
          <InputGroup
            label={resolvedLabels.rentDaysLabel}
            className={inputGroupEffect(activate.before)}
            isRequired
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
              required={activate.before}
            />
          </InputGroup>
        </div>
        <div className='flex'>
          <InputGroup label={resolvedLabels.overdueLabel}>
            <RadioGroup
              defaultOption={1}
              options={['Yes', 'No']}
              value={activate.after ? 0 : 1}
              onChange={value => {
                const enabled = value === 0
                setActivate(prev => ({ ...prev, after: enabled }))
                onOverdueReminderChange?.(enabled, days.after)
              }}
            />
          </InputGroup>
          <InputGroup
            label={resolvedLabels.overdueDaysLabel}
            className={inputGroupEffect(activate.after)}
            isRequired
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
              required={activate.after}
            />
          </InputGroup>
        </div>
      </InnerSection>
    </CollapsibleSection>
  )
}

export default ReminderSection
