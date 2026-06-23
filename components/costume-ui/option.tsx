import { cn } from '@/lib/utils'
import React from 'react'

type Props = {
  Icon: any
  label: string
  isSelected: boolean
  disabled?: boolean
} & React.ComponentProps<'button'>

const Option = ({ Icon, label, isSelected, disabled, ...props }: Props) => {
  return (
    <button
      type='button'
      disabled={disabled}
      className={cn(
        'group flex items-center gap-2.5',
        'w-full h-20 px-2.5 border',
        'transition-colors duration-200',
        'rounded-lg',
        disabled
          ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed opacity-60'
          : isSelected
            ? 'bg-(--secondary-color)/4 border-(--secondary-color)'
            : 'border-(--border-strong) hover:bg-neutral-50 hover:border-neutral-400 cursor-pointer'
      )}
      {...props}
    >
      <div
        className={cn(
          'grid justify-center items-center',
          'h-10 w-10',
          'transition-colors duration-200',
          'rounded-md',
          disabled
            ? 'bg-neutral-100 text-neutral-400'
            : isSelected
              ? 'bg-(--secondary-color)/10 text-(--secondary-color)'
              : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200'
        )}
      >
        <Icon size={17} />
      </div>
      <span
        className={cn(
          'texts-body-medium-medium',
          disabled
            ? 'text-neutral-400'
            : isSelected && 'text-(--secondary-color)'
        )}
      >
        {label}
      </span>
    </button>
  )
}

export default Option
