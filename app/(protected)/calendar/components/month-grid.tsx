import { useMemo, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Chip, ChipPopover } from './chip'

interface MonthGridProps {
  currentDate: Date
  selectedDate: Date
  onDayClick: (date: Date) => void
}

interface ChipData {
  type: 'payment' | 'expense' | 'task' | 'manual_event' | 'info' | 'lease_start' | 'lease_end' | 'expiry_reminder' | 'rent_change' | 'assignment_request'
  count: number
  total?: number
  urgentCount?: number
  label: string
  status?: 'due' | 'overdue'
  hasViewAll?: boolean
  viewAllUrl?: string
}

interface ChipsByDate {
  [dateStr: string]: ChipData[]
}

export default function MonthGrid({ currentDate, selectedDate, onDayClick }: MonthGridProps) {
  const [chips, setChips] = useState<ChipsByDate>({})
  const [selectedChip, setSelectedChip] = useState<ChipData | null>(null)
  const [selectedChipDate, setSelectedChipDate] = useState<Date | null>(null)
  const [expandedDate, setExpandedDate] = useState<Date | null>(null)

  useEffect(() => {
    // Load chips for current month
    const fetchChips = async () => {
      try {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        
        const fromStr = firstDay.toISOString()
        const toStr = lastDay.toISOString()
        
        const response = await fetch(`/api/calendar/month?from=${fromStr}&to=${toStr}`)
        if (response.ok) {
          const data = await response.json()
          setChips(data.chips || {})
        }
      } catch (error) {
        console.error('Failed to fetch chips', error)
      }
    }
    fetchChips()
  }, [currentDate])

  const days = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay()
    
    const days: (Date | null)[] = []
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }
    
    while (days.length < 42) {
      days.push(null)
    }
    
    return days
  }, [currentDate])

  const weeks = useMemo(() => {
    const result: (Date | null)[][] = []
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7))
    }
    return result
  }, [days])

  const today = new Date()
  const isToday = (date: Date | null) => {
    if (!date) return false
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date | null) => {
    if (!date) return false
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear()
  }

  const isExpanded = (date: Date | null) => {
    if (!date || !expandedDate) return false
    return date.getDate() === expandedDate.getDate() &&
           date.getMonth() === expandedDate.getMonth() &&
           date.getFullYear() === expandedDate.getFullYear()
  }

  const getDateStr = (date: Date | null) => {
    if (!date) return null
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleChipClick = (e: React.MouseEvent, chip: ChipData, date: Date | null) => {
    e.stopPropagation()
    if (chip.type === 'manual_event') {
      if (date) onDayClick(date)
      return
    }
    setSelectedChip(chip)
    setSelectedChipDate(date)
  }

  const handleMoreClick = useCallback((e: React.MouseEvent, date: Date | null) => {
    e.stopPropagation()
    setExpandedDate(date)
  }, [])

  return (
    <div className='flex flex-col h-full relative'>
      {/* Weekday headers */}
      <div className='grid grid-cols-7 border-b border-(--border-default)'>
        {weekdays.map(day => (
          <div
            key={day}
            className='py-2 text-center text-xs font-medium text-(--text-secondary)'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className='flex-1 grid grid-rows-6'>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className='grid grid-cols-7'>
            {week.map((date, dayIndex) => {
              const dateStr = getDateStr(date)
              const dayChips = dateStr ? chips[dateStr] || [] : []
              
              return (
                <DayCellWithChips
                  key={`${weekIndex}-${dayIndex}`}
                  date={date}
                  isToday={isToday(date)}
                  isSelected={isSelected(date)}
                  isExpanded={isExpanded(date)}
                  chips={dayChips}
                  onClick={() => date && onDayClick(date)}
                  onChipClick={handleChipClick}
                  onMoreClick={handleMoreClick}
                  onCollapseClick={() => setExpandedDate(null)}
                />
              )
            })}
          </div>
        ))}
      </div>

      <ChipPopover
        chip={selectedChip}
        date={selectedChipDate}
        onClose={() => setSelectedChip(null)}
      />
    </div>
  )
}

function DayCellWithChips({ date, isToday, isSelected, isExpanded, chips, onClick, onChipClick, onMoreClick, onCollapseClick }: {
  date: Date | null
  isToday: boolean
  isSelected: boolean
  isExpanded: boolean
  chips: ChipData[]
  onClick: () => void
  onChipClick: (e: React.MouseEvent, chip: ChipData, date: Date | null) => void
  onMoreClick: (e: React.MouseEvent, date: Date | null) => void
  onCollapseClick: () => void
}) {
  if (!date) {
    return (
      <div className='border border-(--border-default) bg-(--background-secondary)/30 min-h-[80px]' />
    )
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'border border-(--border-default) p-1 text-left transition-colors hover:bg-(--background-secondary) cursor-pointer flex flex-col',
        (isSelected || isExpanded) && 'bg-(--background-secondary) ring-2 ring-inset ring-(--primary-main)',
        isExpanded ? 'max-h-[200px]' : 'min-h-[80px]'
      )}
    >
      <div className='flex flex-col gap-0.5'>
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 text-sm rounded-full mb-0.5',
            isToday && 'bg-(--primary-main) text-white font-semibold'
          )}
        >
          {date.getDate()}
        </span>
        
        {isExpanded ? (
          <div className='flex flex-col gap-0.5 overflow-y-auto flex-1 w-full'>
            {chips.map((chip, index) => (
              <Chip 
                key={index} 
                chip={chip} 
                onClick={(e, clickedChip) => onChipClick(e, clickedChip, date)} 
              />
            ))}
            <button 
              className='text-[10px] text-(--text-secondary) px-0.5 text-left hover:text-(--primary-main) transition-colors'
              onClick={(e) => { e.stopPropagation(); onCollapseClick() }}
            >
              Show less
            </button>
          </div>
        ) : (
          <div className='flex flex-col gap-0.5 overflow-hidden w-full'>
            {chips.slice(0, 3).map((chip, index) => (
              <Chip 
                key={index} 
                chip={chip} 
                onClick={(e, clickedChip) => onChipClick(e, clickedChip, date)} 
              />
            ))}
            {chips.length > 3 && (
              <button 
                className='text-[10px] text-(--text-secondary) px-0.5 text-left hover:text-(--primary-main) transition-colors'
                onClick={(e) => onMoreClick(e, date)}
              >
                +{chips.length - 3} more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
