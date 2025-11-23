import * as React from 'react'

import {
  Select as ShadcnSelect,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type SelectOption = {
  value: string
  label: string
}

type Props = {
  label: string
  items: string[] | SelectOption[]
  placeholder: string
  className?: string
  onChange?: (value: string) => void
} & React.ComponentProps<typeof ShadcnSelect>
export default function Select ({
  label,
  items,
  placeholder,
  className,
  onChange,
  ...props
}: Props) {
  const isOptionArray = items.length > 0 && typeof items[0] === 'object'

  return (
    <ShadcnSelect onValueChange={onChange} {...props}>
      <SelectTrigger
        className={cn(
          'w-full h-10!',
          'hover:bg-neutral-100',
          'texts-body-medium',
          'transition-colors duration-200',
          'rounded-[5]',
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {isOptionArray
            ? (items as SelectOption[]).map((item, index) => (
                <SelectItem key={index} value={item.value}>
                  {item.label}
                </SelectItem>
              ))
            : (items as string[]).map((item, index) => (
                <SelectItem key={index} value={item}>
                  {item}
                </SelectItem>
              ))}
        </SelectGroup>
      </SelectContent>
    </ShadcnSelect>
  )
}
