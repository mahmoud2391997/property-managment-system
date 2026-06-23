'use client'

import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface HourGridProps {
  selectedDate: Date
  onEventClick?: (event: FullEvent) => void
  initialEvents?: any[] | null
  dataVersion?: number
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
    const eventEnd = event.duration_minutes ? eventStart + event.duration_minutes : eventStart + 1

    let placedInGroup = false
    for (const group of groups) {
      const overlaps = group.some(e => {
        const existingStart = e.startHour * 60 + e.startMinute
        const existingEnd = e.duration_minutes ? existingStart + e.duration_minutes : existingStart + 1
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
      const eventEnd = event.duration_minutes ? eventStart + event.duration_minutes : eventStart + 1

      let placedInColumn = false
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex]
        const canFit = column.every(e => {
          const existingStart = e.startHour * 60 + e.startMinute
          const existingEnd = e.duration_minutes ? existingStart + e.duration_minutes : existingStart + 1
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

  return sorted.map((e: any) => positionedEvents.get(e.id)!)
}

export default function HourGrid({ selectedDate, onEventClick, initialEvents, dataVersion }: HourGridProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const [events, setEvents] = useState<PositionedEvent[]>([])

  useEffect(() => {
    if (initialEvents) {
      const mappedEvents: FullEvent[] = (initialEvents || []).map((e: any) => {
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
      setEvents(calculateOverlappingEvents(mappedEvents))
      return
    }

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
  }, [selectedDate, initialEvents, dataVersion])
  
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
        <div className='flex min-w-fit'>
          {/* Time Column */}
          <div className='flex-none w-16 sticky left-0 z-30 bg-(--background-primary) border-r border-(--border-default)'>
            {hours.map(hour => {
              const hourLabel = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
              return (
                <div
                  key={hour}
                  className='h-[48px] px-2 text-xs text-(--text-secondary) flex items-start pt-1'
                >
                  {hourLabel}
                </div>
              )
            })}
          </div>

          {/* Grid Columns */}
          <div className='flex flex-1 relative bg-(--background-primary)'>
            {/* Background Hour Lines */}
            <div className='absolute inset-0 pointer-events-none'>
              {hours.map(hour => (
                <div
                  key={hour}
                  className='border-b border-(--border-default)'
                  style={{ height: `${HOUR_HEIGHT}px` }}
                />
              ))}
            </div>

            {/* Event Columns */}
            {Array.from({ length: Math.max(1, events.length > 0 ? Math.max(...events.map((e: any) => e.totalColumns)) : 1) }).map((_, colIndex) => {
              const colEvents = events.filter((e: any) => e.column === colIndex).sort((a, b) => (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute))
              let lastEndMinutes = 0

              return (
                <div 
                  key={colIndex} 
                  className='relative flex-none w-fit min-w-[150px] border-r border-(--border-default)/30 last:border-r-0 flex flex-col'
                  style={{ minHeight: `${hours.length * HOUR_HEIGHT}px` }}
                >
                  {colEvents.map(event => {
                    const startMinutes = event.startHour * 60 + event.startMinute
                    const spacerMinutes = startMinutes - lastEndMinutes
                    const spacerHeight = (spacerMinutes / 60) * HOUR_HEIGHT
                    
                    const duration = event.duration_minutes || 30
                    const height = (duration / 60) * HOUR_HEIGHT
                    lastEndMinutes = startMinutes + duration

                    const hasDescription = event.description && event.description.trim() !== ''
                    const timeStr = `${event.startHour % 12 || 12}:${String(event.startMinute).padStart(2, '0')}${event.startHour >= 12 ? 'PM' : 'AM'}`
                    const durationStr = !event.duration_minutes ? 'No duration' : `${event.duration_minutes} min`

                    return (
                      <div key={event.id} className='flex flex-col'>
                        <div style={{ height: `${Math.max(0, spacerHeight)}px` }} className='flex-none' />
                        {(() => {
                          const isPointEvent = !event.duration_minutes;
                          return (
                            <div
                              className={cn(
                                'flex-none mx-1 rounded-md text-xs border px-2 py-1 w-fit min-w-[calc(100%-8px)] max-w-[600px] overflow-hidden',
                                isPointEvent
                                  ? 'bg-transparent border-dashed border-(--info-main) text-(--info-main)'
                                  : 'bg-(--info-light) border-(--info-main) text-(--info-main) shadow-sm'
                              )}
                              style={{
                                height: isPointEvent ? '24px' : `${Math.max(24, height - 2)}px`
                              }}
                            >
                              <div className='flex items-center gap-2 h-full whitespace-nowrap'>
                                <span className='font-bold text-[11px]'>{event.title}</span>
                                <span className='text-[10px] opacity-80'>({timeStr} · {durationStr})</span>
                                {hasDescription && (
                                  <>
                                    <span className='text-[10px] opacity-60'>·</span>
                                    <span className='text-[10px] opacity-90 italic'>{event.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )
                  })}
                </div>
              )
            })}
            
            <div className='absolute inset-0 pointer-events-none'>
              <CurrentTimeIndicator selectedDate={selectedDate} hourHeight={HOUR_HEIGHT} />
            </div>
          </div>
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
      className='absolute left-0 right-0 border-t-2 border-(--primary-main) z-10'
      style={{ top: `${topPosition}px` }}
    >
      <div className='absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-(--primary-main)' />
    </div>
  )
}
