import { useState, useEffect } from 'react'
import InnerSection from './collapsible-inner-section'
import RadioGroup from './radio-group'
import Input from './input'
import Select from './select'
import { cn } from '@/lib/utils'

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
  every: number
  time_unit: string
  event_on: string
}

interface RecurringConfigProps {
  onConfigChange?: (config: RecurringConfigData | null) => void
}

const RecurringConfig = ({ onConfigChange }: RecurringConfigProps) => {
  const options: string[] = ['Enable', 'Disable']
  const [disableRecurring, setDisableRecurring] = useState<boolean>(true)
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

  // Notify parent when config changes
  useEffect(() => {
    if (disableRecurring) {
      onConfigChange?.(null)
    } else {
      onConfigChange?.({
        enabled: true,
        every,
        time_unit: timeUnit,
        event_on: selectedDays.join(',')
      })
    }
  }, [disableRecurring, every, timeUnit, selectedDays, onConfigChange])
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
          disableRecurring ? 'max-h-0 opacity-0' : `${show.weekDays ? 'max-h-26' : 'max-h-61'} opacity-100`
        )}
      >
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
              : 'max-h-0 opacity-0'
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
      </div>
    </InnerSection>
  )
}

export default RecurringConfig
