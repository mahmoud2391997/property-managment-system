'use client'
import { cn } from '@/lib/utils'
import Button from './button'
import { Funnel } from 'lucide-react'

type TabGroupProps = {
  className?: string
  children: React.ReactNode
  showButton?: boolean
}
function TabGroup ({ className = '', children, showButton }: TabGroupProps) {
  return (
    <div
      className={cn(
        'flex justify-between items-start',
        'border-b border-(--border-default)',
        className
      )}
    >
      <div className={`flex md:gap-2.5 w-full`}>{children}</div>
      {showButton && (
        <Button
          icon={<Funnel className='text-neutral-400' />}
          variant='secondary'
          label='Filter'

        />
      )}
    </div>
  )
}

type TabProps = {
  label: string
  isSelected: boolean
  className?: string
} & React.ComponentProps<'button'>

function Tab ({ label, isSelected, className = '', ...props }: TabProps) {
  return (
    <button
      className={cn(
        'relative p-5 py-3',
        'texts-tab-primary border-(--success-dark)',
        'transition-all duration-100',
        'overflow-hidden',
        isSelected
          ? 'text-(--success-dark)'
          : 'text-(--text-secondary) hover:text-neutral-600 cursor-pointer',
        'select-none',
        className
      )}
      {...props}
    >
      {label}
      <span
        className={cn(
          'transition-all duration-200',
          'absolute bottom-0 left-0 w-full bg-(--success-dark)',
          'rounded-t-full',
          isSelected ? 'h-[2]' : 'h-0'
        )}
      />
    </button>
  )
}

export { TabGroup, Tab }
