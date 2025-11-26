'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  onValueChange?: (time: string) => void
  value?: string
} & Omit<React.ComponentProps<'input'>, 'onChange' | 'value'>

export default function TimePicker ({ className, onValueChange, value, ...props }: Props) {
  return (
    <Input
      type='time'
      id='time-picker'
      step='1'
      value={value || '10:30:00'}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        'w-full h-10!',
        'hover:bg-neutral-100',
        'texts-body-medium',
        'transition-colors duration-200',
        'rounded-[5]',
        className
      )}
      {...props}
    />
  )
}
