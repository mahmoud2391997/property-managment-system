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
    <button
      type='button'
      className={cn(
        'flex items-center gap-3 p-3 cursor-pointer select-none',
        'transition-all duration-200',
        'hover:bg-neutral-100',
        'rounded-lg',
        className
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div
        className={cn(
          'relative w-12 h-7 rounded-full transition-colors',
          checked ? 'bg-neutral-700' : 'bg-neutral-200',
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        )}
      >
        <span
          className={`absolute left-[3] top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </div>
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
    </button>
  )
}

export default Toggle
