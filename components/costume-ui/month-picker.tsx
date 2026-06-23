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
  /** "default" keeps the current look; "compact" is smaller for chart headers */
  variant?: 'default' | 'compact'
} & Omit<React.ComponentProps<'button'>, 'value'>

export default function MonthPicker ({ className, onValueChange, value, variant = 'default', ...props }: Props) {
  const isCompact = variant === 'compact'
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
            isCompact
              ? 'h-8 px-2.5 gap-1.5 texts-caption-large'
              : 'w-full h-10! texts-body-medium',
            'hover:bg-neutral-100',
            !date && 'text-(--text-secondary)',
            'transition-colors duration-200',
            isCompact ? 'rounded-md' : 'rounded-[5]',
            className
          )}
          {...props}
        >
          {date
            ? isCompact
              ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
              : `${MONTH_FULL[date.getMonth()]} ${date.getFullYear()}`
            : isCompact ? 'Month' : 'Select month'}
          <CalendarIcon className={isCompact ? 'w-[13px]! h-[13px]! mb-0.5 text-gray-800' : 'w-[18px]! h-[18px]!'} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(isCompact ? 'w-56 p-2.5' : 'w-64 p-3')} align='start'>
        {/* Year navigation */}
        <div className={cn('flex items-center justify-between', isCompact ? 'mb-2' : 'mb-3')}>
          <button
            type='button'
            onClick={() => setViewYear(prev => prev - 1)}
            className='p-1 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer'
          >
            <ChevronLeft size={isCompact ? 14 : 16} />
          </button>
          <span className={isCompact ? 'texts-label-small font-semibold' : 'texts-body-medium-semibold'}>{viewYear}</span>
          <button
            type='button'
            onClick={() => setViewYear(prev => prev + 1)}
            className='p-1 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer'
          >
            <ChevronRight size={isCompact ? 14 : 16} />
          </button>
        </div>

        {/* Month grid */}
        <div className={cn('grid grid-cols-3', isCompact ? 'gap-1' : 'gap-1.5')}>
          {MONTHS.map((month, index) => {
            const isSelected = selectedMonth === index && selectedYear === viewYear
            return (
              <button
                key={month}
                type='button'
                onClick={() => handleSelect(index)}
                className={cn(
                  'rounded-md transition-colors cursor-pointer',
                  isCompact ? 'py-1.5 texts-caption-large font-medium' : 'py-2 texts-body-small-medium',
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
