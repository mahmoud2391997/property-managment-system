'use client'

import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface HourGridProps {
  selectedDate: Date
  onEventClick?: (event: FullEvent) => void
  refreshKey?: number
}

interface FullEvent {
  id: string
  title: string
  timestamp: string
  duration_minutes: number | null
  description: string | null
  is_for_all_staff: boolean
  startHour: number
  startMinute: number
}

interface PositionedEvent extends FullEvent {
  column: number
  totalColumns: number
}

function calculateOverlappingEvents(events: FullEvent[]): PositionedEvent[] {
  if (events.length === 0) return []

  const sorted = [...events].sort((a, b) => {
    const startA = a.startHour * 60 + a.startMinute
    const startB = b.startHour * 60 + b.startMinute
    return startA - startB
  })

  const groups: FullEvent[][] = []
  for (const event of sorted) {
    const eventStart = event.startHour * 60 + event.startMinute
    const eventEnd = eventStart + (event.duration_minutes || 60)

    let placedInGroup = false
    for (const group of groups) {
      const overlaps = group.some(e => {
        const existingStart = e.startHour * 60 + e.startMinute
        const existingEnd = existingStart + (e.duration_minutes || 60)
        return eventStart < existingEnd && eventEnd > existingStart
      })
      if (overlaps) {
        group.push(event)
        placedInGroup = true
        break
      }
    }
    if (!placedInGroup) {
      groups.push([event])
    }
  }

  const positionedEvents: Map<string, PositionedEvent> = new Map()

  for (const group of groups) {
    if (group.length === 1) {
      const event = group[0]
      positionedEvents.set(event.id, { ...event, column: 0, totalColumns: 1 })
      continue
    }

    const columns: FullEvent[][] = []
    for (const event of group) {
      const eventStart = event.startHour * 60 + event.startMinute
      const eventEnd = eventStart + (event.duration_minutes || 60)

      let placedInColumn = false
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex]
        const canFit = column.every(e => {
          const existingStart = e.startHour * 60 + e.startMinute
          const existingEnd = existingStart + (e.duration_minutes || 60)
          return eventStart >= existingEnd || eventEnd <= existingStart
        })
        if (canFit) {
          column.push(event)
          positionedEvents.set(event.id, { ...event, column: colIndex, totalColumns: columns.length })
          placedInColumn = true
          break
        }
      }
      if (!placedInColumn) {
        columns.push([event])
        positionedEvents.set(event.id, { ...event, column: columns.length - 1, totalColumns: columns.length })
      }
    }

    const maxCols = columns.length
    for (const event of group) {
      const existing = positionedEvents.get(event.id)!
      positionedEvents.set(event.id, { ...existing, totalColumns: maxCols })
    }
  }

  return sorted.map(e => positionedEvents.get(e.id)!)
}

export default function HourGrid({ selectedDate, onEventClick, refreshKey }: HourGridProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const [events, setEvents] = useState<PositionedEvent[]>([])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        const response = await fetch(`/api/calendar/events?date=${dateStr}`)
        if (response.ok) {
          const data = await response.json()
          const mappedEvents: FullEvent[] = (data.events || []).map((e: any) => {
            const dateObj = new Date(e.timestamp)
            return {
              id: e.id,
              title: e.title,
              timestamp: e.timestamp,
              duration_minutes: e.duration_minutes,
              description: e.description,
              is_for_all_staff: e.is_for_all_staff,
              startHour: dateObj.getHours(),
              startMinute: dateObj.getMinutes()
            }
          })
          const positioned = calculateOverlappingEvents(mappedEvents)
          setEvents(positioned)
        }
      } catch (error) {
        console.error('Failed to fetch events', error)
      }
    }
    fetchEvents()
  }, [selectedDate, refreshKey])
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const HOUR_HEIGHT = 48

  return (
    <div className='flex flex-col h-full'>
      <div className='px-4 py-2 border-b border-(--border-default)'>
        <h3 className='text-sm font-medium'>{formatDate(selectedDate)}</h3>
      </div>

      <div className='flex-1 overflow-auto'>
        <div className='relative' style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
          {hours.map(hour => {
            const hourLabel = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
            const top = hour * HOUR_HEIGHT
            
            return (
              <div
                key={hour}
                className='absolute left-0 right-0 flex border-b border-(--border-default)'
                style={{ top, height: `${HOUR_HEIGHT}px` }}
              >
                <div className='w-16 flex-shrink-0 px-2 py-1 text-xs text-(--text-secondary)'>
                  {hourLabel}
                </div>
                <div className='flex-1' />
              </div>
            )
          })}

          {events.map(event => {
            const top = (event.startHour * 60 + event.startMinute) / 60 * HOUR_HEIGHT
            const height = ((event.duration_minutes || 60) / 60) * HOUR_HEIGHT
            const widthPercent = 100 / event.totalColumns
            const leftPercent = (event.column / event.totalColumns) * 100
            const gap = 2
            const hasDescription = event.description && event.description.trim() !== ''

            return (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className={cn(
                  'absolute rounded-md p-1.5 text-xs border overflow-hidden transition-shadow hover:shadow-md cursor-pointer group',
                  'bg-(--info-light) border-(--info-main) text-(--info-main)'
                )}
                style={{
                  top: `${top + 1}px`,
                  left: `calc(${leftPercent}% + ${gap}px)`,
                  width: `calc(${widthPercent}% - ${gap * 2}px)`,
                  height: `${height - 2}px`,
                  minHeight: hasDescription ? '60px' : '24px'
                }}
                title={hasDescription ? `${event.title}\n${event.description}` : event.title}
              >
                <div className='font-medium truncate'>{event.title}</div>
                {hasDescription && (
                  <div className='text-[10px] opacity-75 line-clamp-2 mt-0.5'>{event.description}</div>
                )}
                <div className='text-[10px] opacity-75 mt-0.5'>
                  {event.startHour % 12 || 12}:{String(event.startMinute).padStart(2, '0')}{event.startHour >= 12 ? 'PM' : 'AM'} — {event.duration_minutes || 60} min
                </div>
              </div>
            )
          })}
          
          <CurrentTimeIndicator selectedDate={selectedDate} hourHeight={HOUR_HEIGHT} />
        </div>
      </div>
    </div>
  )
}

function CurrentTimeIndicator({ selectedDate, hourHeight }: { selectedDate: Date; hourHeight: number }) {
  const now = new Date()
  const isToday = now.getDate() === selectedDate.getDate() &&
                  now.getMonth() === selectedDate.getMonth() &&
                  now.getFullYear() === selectedDate.getFullYear()
  
  if (!isToday) return null
  
  const topPosition = (now.getHours() + now.getMinutes() / 60) * hourHeight
  
  return (
    <div
      className='absolute left-16 right-0 border-t-2 border-(--primary-main) z-10'
      style={{ top: `${topPosition}px` }}
    >
      <div className='absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-(--primary-main)' />
    </div>
  )
}
