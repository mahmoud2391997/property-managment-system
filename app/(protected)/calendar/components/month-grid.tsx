import { useMemo, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Chip, ChipPopover } from './chip'

interface EventItem {
  id: string
  title: string
  timestamp: string
  description: string | null
}

interface MonthGridProps {
  currentDate: Date
  selectedDate: Date
  onDayClick: (date: Date) => void
  onEventClick?: (event: { id: string }) => void
}

interface ChipData {
  type: 'payment' | 'expense' | 'task' | 'manual_event' | 'info' | 'lease_start' | 'lease_end' | 'expiry_reminder' | 'rent_change' | 'assignment_request' | 'booking'
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

export default function MonthGrid({ currentDate, selectedDate, onDayClick, onEventClick }: MonthGridProps) {
  const [chips, setChips] = useState<ChipsByDate>({})
  const [selectedChip, setSelectedChip] = useState<ChipData | null>(null)
  const [selectedChipDate, setSelectedChipDate] = useState<Date | null>(null)
  const [eventList, setEventList] = useState<EventItem[]>([])
  const [showEventList, setShowEventList] = useState(false)
  const [eventListDate, setEventListDate] = useState<string>('')

  useEffect(() => {
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

  const getDateStr = (date: Date | null) => {
    if (!date) return null
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleChipClick = (e: React.MouseEvent, chip: ChipData, date: Date | null) => {
    e.stopPropagation()
    if (chip.type === 'manual_event') {
      if (date && onEventClick) {
        const dateStr = getDateStr(date) || ''
        fetch(`/api/calendar/events?date=${dateStr}`)
          .then(r => r.json())
          .then(data => {
            const events = data.events || []
            if (events.length === 1) {
              onEventClick(events[0])
            } else if (events.length > 1) {
              setEventList(events)
              setEventListDate(dateStr)
              setShowEventList(true)
            }
          })
          .catch(() => {})
      }
      return
    }
    setSelectedChip(chip)
    setSelectedChipDate(date)
  }

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
                  chips={dayChips}
                  onClick={() => date && onDayClick(date)}
                  onChipClick={handleChipClick}
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

      {showEventList && (
        <>
          <div
            className='fixed inset-0 z-40 bg-black/20'
            onClick={() => setShowEventList(false)}
          />
          <div
            className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-(--background-primary) rounded-lg shadow-xl border border-(--border-default) p-4 w-72 max-h-[80vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-start justify-between mb-3'>
              <h3 className='font-semibold text-sm'>
                {eventList.length} Events on {new Date(eventListDate + 'T00:00:00').toLocaleDateString()}
              </h3>
              <button
                onClick={() => setShowEventList(false)}
                className='text-(--text-secondary) hover:text-(--text-primary) p-1'
              >
                ×
              </button>
            </div>
            <div className='space-y-2'>
              {eventList.map((event) => (
                <div
                  key={event.id}
                  className='text-xs py-2 px-3 bg-(--background-secondary) rounded cursor-pointer hover:bg-(--border-default) transition-colors'
                  onClick={() => {
                    if (onEventClick) {
                      onEventClick({ id: event.id })
                      setShowEventList(false)
                    }
                  }}
                >
                  <div className='font-medium'>{event.title}</div>
                  {event.description && (
                    <div className='text-[10px] text-(--text-secondary) mt-0.5 truncate'>
                      {event.description}
                    </div>
                  )}
                  <div className='text-[10px] text-(--text-secondary) mt-0.5'>
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DayCellWithChips({ date, isToday, isSelected, chips, onClick, onChipClick }: {
  date: Date | null
  isToday: boolean
  isSelected: boolean
  chips: ChipData[]
  onClick: () => void
  onChipClick: (e: React.MouseEvent, chip: ChipData, date: Date | null) => void
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
        isSelected && 'bg-(--background-secondary) ring-2 ring-inset ring-(--primary-main)',
        'min-h-[80px] overflow-visible'
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
        
        <div className='flex flex-wrap gap-0.5 w-full'>
          {chips.map((chip, index) => (
            <Chip 
              key={index} 
              chip={chip} 
              onClick={(e, clickedChip) => onChipClick(e, clickedChip, date)} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}
