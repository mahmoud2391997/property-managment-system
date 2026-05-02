'use client'

import { cn } from '@/lib/utils'

interface DayCellProps {
  date: Date | null
  isToday: boolean
  isSelected: boolean
  onClick: () => void
}

export default function DayCell({ date, isToday, isSelected, onClick }: DayCellProps) {
  if (!date) {
    return (
      <div className='border border-(--border-default) bg-(--background-secondary)/30 min-h-[80px]' />
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'border border-(--border-default) p-1 min-h-[80px] text-left transition-colors hover:bg-(--background-secondary)',
        isSelected && 'bg-(--background-secondary) ring-2 ring-inset ring-(--primary-main)'
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center w-6 h-6 text-sm rounded-full',
          isToday && 'bg-(--primary-main) text-white font-semibold'
        )}
      >
        {date.getDate()}
      </span>
    </button>
  )
}
