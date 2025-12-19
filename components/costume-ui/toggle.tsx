import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  subtitle?: string
  disabled?: boolean
  className?: string
}

const Toggle = ({
  checked,
  onChange,
  label,
  subtitle,
  disabled,
  className = ''
}: ToggleProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        'rounded-lg',
        className
      )}
    >
      <button
        type='button'
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-(--secondary-color)' : 'bg-neutral-200 hover:bg-neutral-300',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        )}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span
          className={`absolute left-[3] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
            checked ? 'translate-[21px]' : 'translate-x-0'
          }`}
        />
      </button>
      {label && (
        <div className='flex flex-col items-start'>
          <span className={`texts-body-large ${disabled && 'text-muted'}`}>
            {label}
          </span>
          <span
            className={cn(
              'texts-body-small text-(--text-secondary)',
              disabled && 'text-muted'
            )}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  )
}

export default Toggle
