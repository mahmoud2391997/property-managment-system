'use client'

import { cn } from '@/lib/utils'

type SectionTabOption = {
  label: string
  icon?: React.ReactNode
}

type SectionTabProps = {
  options: SectionTabOption[]
  selectedIndex: number
  onChange: (index: number) => void
  className?: string
}

export default function SectionTab({
  options,
  selectedIndex,
  onChange,
  className
}: SectionTabProps) {
  return (
    <div
      className={cn(
        'inline-flex p-1 rounded-lg',
        'bg-neutral-100',
        className
      )}
    >
      {options.map((option, index) => {
        const isSelected = index === selectedIndex
        return (
          <button
            key={index}
            onClick={() => onChange(index)}
            className={cn(
              'relative flex items-center gap-1.5',
              'px-3 py-2.5 rounded-md',
              'texts-body-medium-medium',
              'transition-all duration-200 ease-out',
              'select-none cursor-pointer',
              isSelected
                ? 'bg-(--background-primary) text-(--text-primary) shadow-sm'
                : 'text-(--text-secondary) hover:text-(--text-primary)'
            )}
          >
            {option.icon && (
              <span className={cn(
                'transition-colors duration-200',
                isSelected ? 'text-(--success-dark)' : 'text-(--text-tertiary)'
              )}>
                {option.icon}
              </span>
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}