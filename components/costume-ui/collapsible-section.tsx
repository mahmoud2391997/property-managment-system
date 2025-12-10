import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import React, { useState } from 'react'

type Props = {
  children: React.ReactNode
  number: number
  title: string
  defaultCollapse?: boolean
}

const CollapsibleSection = ({
  children,
  number,
  title,
  defaultCollapse = false
}: Props) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapse)
  return (
    <section className='border border-(--border-default) rounded-[10px] overflow-hidden'>
      <button
        type='button'
        onClick={() => setIsCollapsed(prev => !prev)}
        className={cn(
          'flex items-center justify-between',
          'w-full p-5',
          'bg-neutral-50 hover:bg-neutral-100',
          !isCollapsed && 'border-b border-(--border-strong)',
          'transition-colors'
        )}
      >
        <div className='flex items-center gap-3'>
          <span
            className={cn(
              'grid items-center justify-center',
              'text-[11px] font-medium text-(--text-inverse) bg-(--primary-color)',
              'min-w-5.5 min-h-5.5 px-[5]',
              'rounded-full'
            )}
          >
            {number}
          </span>
          <div className='flex flex-col items-start'>
            <span className='texts-body-large-medium'>{title}</span>

            <span
              className={cn(
                isCollapsed ? 'h-5' : 'h-0 opacity-0',
                'transition-all duration-300',
                'texts-body-medium text-(--text-secondary)'
              )}
            >
              Click to expand the section
            </span>
          </div>
        </div>

        <ChevronDown
          className={cn(
            isCollapsed ? '' : 'transform rotate-180',
            'transition-transform duration-100'
          )}
        />
      </button>
      {/* Property Details Section */}
      <div
        className={cn(
          'flex flex-col gap-5 overflow-hidden px-5',
          'transition-all duration-300',
          isCollapsed ? 'max-h-0' : 'max-h-[2000px] py-5'
        )}
      >
        {children}
      </div>
    </section>
  )
}

export default CollapsibleSection
