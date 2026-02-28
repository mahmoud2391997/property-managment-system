import { useState, useEffect } from 'react'
import InnerSection from './collapsible-inner-section'
import RadioGroup from './radio-group'
import Input from './input'
import Select from './select'
import InputGroup from './input-group'
import Toggle from './toggle'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RecurringExpenseConfigData {
  enabled: boolean
  title: string
  is_payment_fixed: boolean
  event_on: string
  offset_days: number
}

interface RecurringExpenseConfigProps {
  onConfigChange?: (config: RecurringExpenseConfigData | null) => void
  defaultIsPaymentFixed?: boolean
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const dueDayItems = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: getOrdinal(i + 1)
}))
const offsetDayItems = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} day${i + 1 !== 1 ? 's' : ''}`
}))

const RecurringExpenseConfig = ({
  onConfigChange,
  defaultIsPaymentFixed = false
}: RecurringExpenseConfigProps) => {
  const options: string[] = ['Enable', 'Disable']
  const [disableRecurring, setDisableRecurring] = useState<boolean>(true)
  const [title, setTitle] = useState<string>('')
  const [isPaymentFixed, setIsPaymentFixed] = useState<boolean>(defaultIsPaymentFixed)
  const [dueDay, setDueDay] = useState<string>('1')
  const [offsetDays, setOffsetDays] = useState<string>('7')

  useEffect(() => {
    setIsPaymentFixed(defaultIsPaymentFixed)
  }, [defaultIsPaymentFixed])

  useEffect(() => {
    if (disableRecurring) {
      onConfigChange?.(null)
    } else {
      onConfigChange?.({
        enabled: true,
        title,
        is_payment_fixed: isPaymentFixed,
        event_on: dueDay,
        offset_days: parseInt(offsetDays)
      })
    }
  }, [disableRecurring, title, isPaymentFixed, dueDay, offsetDays, onConfigChange])

  return (
    <InnerSection
      title='Recurring Expense'
      subtitle='Configure this expense to recur monthly on a specific day'
    >
      <RadioGroup
        defaultOption={1}
        options={options}
        onChange={(value: number) => {
          if (value === 1) {
            setDisableRecurring(true)
          } else {
            setDisableRecurring(false)
          }
        }}
      />

      <div
        className={cn(
          'flex flex-col gap-5',
          'transition-all duration-200 overflow-hidden',
          disableRecurring ? 'max-h-0 opacity-0' : 'opacity-100'
        )}
      >
        <InputGroup label='Event Title' className='w-100' isRequired>
          <Input
            type='text'
            value={title}
            placeholder='e.g. Internet, Cleaning Service, Office Rent'
            note='Name for this recurring expense'
            maxLength={50}
            required={!disableRecurring}
            onChange={(e) => setTitle(e.target.value)}
          />
        </InputGroup>

        <div className='flex gap-4'>
          <InputGroup label='Due Day of Month' className='flex-1' isRequired>
            <Select
              items={dueDayItems}
              value={dueDay}
              onChange={setDueDay}
              label='Day'
              placeholder='Select day'
            />
          </InputGroup>

          <InputGroup label='Generate Before Due Date' className='flex-1' isRequired>
            <Select
              items={offsetDayItems}
              value={offsetDays}
              onChange={setOffsetDays}
              label='Days'
              placeholder='Select days'
            />
          </InputGroup>
        </div>

        <div className='flex items-start gap-2 p-2 rounded-md bg-blue-50 border border-blue-200'>
          <Info strokeWidth={1.5} size={16} className='mt-0.5 shrink-0 text-blue-700' />
          <p className='texts-caption-large text-blue-800'>
            The expense will be auto-generated <strong>{offsetDays} day{parseInt(offsetDays) !== 1 ? 's' : ''}</strong> before
            the <strong>{getOrdinal(parseInt(dueDay))}</strong> of each month.
          </p>
        </div>

        {/* Fixed Amount Toggle */}
        <div className='flex flex-col gap-2'>
          <Toggle
            checked={isPaymentFixed}
            onChange={setIsPaymentFixed}
            label='Fixed Expense Amount'
            subtitle={isPaymentFixed
              ? 'Same amount will be used for each monthly expense'
              : 'Amount must be manually set for each generated expense'
            }
          />
          <div className='flex items-start gap-2 p-2 rounded-md bg-amber-50 border border-amber-200'>
            <Info strokeWidth={1.5} size={16} className='mt-0.5 shrink-0 text-amber-700' />
            <p className='texts-caption-large text-amber-800'>
              {isPaymentFixed
                ? 'Each recurring expense will be generated with the same charges as the original expense.'
                : 'Each recurring expense will be generated with unset status. Staff must manually set the amount.'
              }
            </p>
          </div>
        </div>
      </div>
    </InnerSection>
  )
}

export default RecurringExpenseConfig
