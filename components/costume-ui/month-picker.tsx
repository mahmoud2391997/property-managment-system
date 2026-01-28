'use client'

import * as React from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

type Props = {
  className?: string
  onValueChange?: (date: Date | undefined) => void
  value?: Date
} & Omit<React.ComponentProps<'button'>, 'value'>

export default function MonthPicker ({ className, onValueChange, value, ...props }: Props) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value)
  const [viewYear, setViewYear] = React.useState(value?.getFullYear() ?? new Date().getFullYear())

  React.useEffect(() => {
    if (value !== undefined) {
      setDate(value)
    }
  }, [value])

  React.useEffect(() => {
    if (open && date) {
      setViewYear(date.getFullYear())
    }
  }, [open])

  const handleSelect = (monthIndex: number) => {
    const selected = new Date(viewYear, monthIndex, 1)
    setDate(selected)
    onValueChange?.(selected)
    setOpen(false)
  }

  const selectedMonth = date?.getMonth()
  const selectedYear = date?.getFullYear()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'flex items-center justify-between',
            'w-full h-10!',
            'hover:bg-neutral-100',
            'texts-body-medium',
            !date && 'text-(--text-secondary)',
            'transition-colors duration-200',
            'rounded-[5]',
            className
          )}
          {...props}
        >
          {date ? `${MONTH_FULL[date.getMonth()]} ${date.getFullYear()}` : 'Select month'}
          <CalendarIcon size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-64 p-3' align='start'>
        {/* Year navigation */}
        <div className='flex items-center justify-between mb-3'>
          <button
            type='button'
            onClick={() => setViewYear(prev => prev - 1)}
            className='p-1 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer'
          >
            <ChevronLeft size={16} />
          </button>
          <span className='texts-body-medium-semibold'>{viewYear}</span>
          <button
            type='button'
            onClick={() => setViewYear(prev => prev + 1)}
            className='p-1 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer'
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Month grid */}
        <div className='grid grid-cols-3 gap-1.5'>
          {MONTHS.map((month, index) => {
            const isSelected = selectedMonth === index && selectedYear === viewYear
            return (
              <button
                key={month}
                type='button'
                onClick={() => handleSelect(index)}
                className={cn(
                  'py-2 rounded-md texts-body-small-medium transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-(--secondary-color) text-white'
                    : 'hover:bg-neutral-100 text-(--text-secondary)'
                )}
              >
                {month}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
