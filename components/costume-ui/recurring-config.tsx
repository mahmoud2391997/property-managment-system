import { useState, useEffect } from 'react'
import InnerSection from './collapsible-inner-section'
import RadioGroup from './radio-group'
import Input from './input'
import Select from './select'
import { cn } from '@/lib/utils'
import InputGroup from './input-group'
import Toggle from './toggle'
import { Info } from 'lucide-react'

// Sub component: unit
const Unit = ({
  value,
  isSelected,
  onSelect,
  canDeselect = true
}: {
  value: string
  isSelected: boolean
  onSelect?: (value: string, isSelected: boolean) => void
  canDeselect?: boolean
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        // If already selected and cannot deselect, do nothing
        if (isSelected && !canDeselect) {
          return
        }
        const next = !isSelected
        onSelect?.(value, next)
      }}
      className={cn(
        'flex items-center justify-center',
        'h-9.5 w-9.5',
        'transition-colors duration-100',
        isSelected
          ? 'bg-(--secondary-color)! text-(--text-inverse)!'
          : 'border border-(--border-default) hover:bg-neutral-100',
        'texts-body-medium',
        'select-none cursor-pointer rounded-full',
        isSelected && !canDeselect && 'cursor-not-allowed opacity-75'
      )}
    >
      {value}
    </button>
  )
}

export interface RecurringConfigData {
  enabled: boolean
  title: string
  every: number
  time_unit: string
  event_on: string
  is_payment_fixed: boolean
}

interface RecurringConfigProps {
  onConfigChange?: (config: RecurringConfigData | null) => void
  defaultIsPaymentFixed?: boolean
}

const RecurringConfig = ({ onConfigChange, defaultIsPaymentFixed = false }: RecurringConfigProps) => {
  const options: string[] = ['Enable', 'Disable']
  const [disableRecurring, setDisableRecurring] = useState<boolean>(true)
  const [title, setTitle] = useState<string>('')
  const [isPaymentFixed, setIsPaymentFixed] = useState<boolean>(defaultIsPaymentFixed)
  const timeUnits: string[] = ['Day', 'Week', 'Month', 'Year']
  const [timeUnit, setTimeUnit] = useState<string>(timeUnits[0])
  const [every, setEvery] = useState<number>(1)
  const [show, setShow] = useState<{ weekDays: boolean; monthDays: boolean }>({
    weekDays: false,
    monthDays: false
  })
  const weekDays: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const monthDays = Array.from({ length: 28 }, (_, i) => i + 1)

  const [selectedDays, setSelectedDays] = useState<string[]>([])

  const handleSelect = (day: string, isSelected: boolean) => {
    setSelectedDays(prev => {
      if (isSelected) {
        return [...prev, day]
      } else {
        // Prevent deselecting if it's the last selected item
        if (prev.length === 1) {
          return prev
        }
        return prev.filter(d => d !== day)
      }
    })
  }

  // Update isPaymentFixed when defaultIsPaymentFixed prop changes
  useEffect(() => {
    setIsPaymentFixed(defaultIsPaymentFixed)
  }, [defaultIsPaymentFixed])

  // Notify parent when config changes
  useEffect(() => {
    if (disableRecurring) {
      onConfigChange?.(null)
    } else {
      onConfigChange?.({
        enabled: true,
        title,
        every,
        time_unit: timeUnit,
        event_on: selectedDays.join(','),
        is_payment_fixed: isPaymentFixed
      })
    }
  }, [disableRecurring, title, every, timeUnit, selectedDays, isPaymentFixed, onConfigChange])
  return (
    <InnerSection
      title='Recurring Pattern'
      subtitle='Set how often this notice repeats'
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
          disableRecurring ? 'max-h-0 opacity-0' : `opacity-100`
        )}
      >
        <InputGroup label='Event Title' className='w-100' isRequired>
          <Input
            type='text'
            value={title}
            placeholder='e.g. Monthly Internet Bill'
            note='This title will be displayed in the recurring payments section.'
            maxLength={50}
            required={!disableRecurring}
            onChange={(e) => setTitle(e.target.value)}
          />
        </InputGroup>
        <div className='flex items-center'>
          <span className='texts-body-medium w-13'>Every</span>
          <div className='flex gap-3'>
            <Input
              type='number'
              value={every}
              min={1}
              className='w-24'
              onChange={(e) => setEvery(Number(e.target.value) || 1)}
            />
            <Select
              value={timeUnit}
              items={timeUnits}
              label='Time Units'
              className='w-24'
              placeholder='Select a time unit'
              onChange={(value: string) => {
                setTimeUnit(value)
                if (value === timeUnits[1]) {
                  // Week selected - default to first day (Sunday)
                  setShow({
                    weekDays: true,
                    monthDays: false
                  })
                  setSelectedDays(['Su'])
                } else if (value === timeUnits[2]) {
                  // Month selected - default to first day (1)
                  setShow({
                    weekDays: false,
                    monthDays: true
                  })
                  setSelectedDays(['1'])
                } else {
                  // Day or Year selected - no days needed
                  setShow({
                    weekDays: false,
                    monthDays: false
                  })
                  setSelectedDays([])
                }
              }}
            />
          </div>
        </div>

        <div
          className={cn(
            'flex items-start',
            'transition-all duration-300',
            show.weekDays || show.monthDays
              ? `${show.weekDays ? 'max-h-10' : 'max-h-60'} opacity-100`
              : 'max-h-0 opacity-0 -mb-4'
          )}
        >
          <span className='flex items-center texts-body-medium w-13 h-9.5'>On</span>
          <div className='grid grid-cols-8 gap-2.5'>
            {show.weekDays &&
              weekDays.map((wd, index) => {
                const isSelected = selectedDays.includes(wd)
                const canDeselect = selectedDays.length > 1 || !isSelected
                return (
                  <Unit
                    key={index}
                    value={wd}
                    isSelected={isSelected}
                    canDeselect={canDeselect}
                    onSelect={handleSelect}
                  />
                )
              })}
            {show.monthDays &&
              monthDays.map((md, index) => {
                const mdString = String(md)
                const isSelected = selectedDays.includes(mdString)
                const canDeselect = selectedDays.length > 1 || !isSelected
                return (
                  <Unit
                    key={index}
                    value={mdString}
                    isSelected={isSelected}
                    canDeselect={canDeselect}
                    onSelect={handleSelect}
                  />
                )
              })}
          </div>
        </div>

        {/* Fixed Payment Toggle */}
        <div className='flex flex-col gap-2'>
          <Toggle
            checked={isPaymentFixed}
            onChange={setIsPaymentFixed}
            label='Fixed Payment Amount'
            subtitle={isPaymentFixed
              ? 'Amount will remain the same for each generated bill'
              : 'Staff will need to set the amount for each generated bill'
            }
          />
          <div className='flex items-start gap-2 p-2 rounded-md bg-amber-50 border border-amber-200'>
            <Info strokeWidth={1.5} size={16} className='mt-0.5 shrink-0 text-amber-700' />
            <p className='texts-caption-large text-amber-800'>
              {isPaymentFixed
                ? 'The payment amount will be automatically applied to each generated bill based on the charges you set.'
                : 'Each generated bill will be created with pending status, requiring staff to manually enter the amount before sending to the tenant.'
              }
            </p>
          </div>
        </div>
      </div>
    </InnerSection>
  )
}

export default RecurringConfig
