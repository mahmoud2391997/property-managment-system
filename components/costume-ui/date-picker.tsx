'use client'

import * as React from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  onValueChange?: (date: Date | undefined) => void
  value?: Date
} & Omit<React.ComponentProps<'button'>, 'value'>

export default function DatePicker ({ className, onValueChange, value, ...props }: Props) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value)

  React.useEffect(() => {
    if (value !== undefined) {
      setDate(value)
    }
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          id='date-picker'
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
          {date ? date.toLocaleDateString() : 'Select date'}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
        <Calendar
          mode='single'
          selected={date}
          captionLayout='dropdown'
          startMonth={new Date(new Date().getFullYear() - 5, 0)}
          endMonth={new Date(new Date().getFullYear() + 10, 11)}
          onSelect={date => {
            setDate(date)
            onValueChange?.(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
