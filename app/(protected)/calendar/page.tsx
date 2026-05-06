'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, RefreshCw } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/costume-ui/button'
import MonthGrid from './components/month-grid'
import HourGrid from './components/hour-grid'
import EventModal from './components/event-modal'
import { PermissionGate } from '@/components/permission-gate'

interface CalendarEvent {
  id: string
  title: string
  timestamp: string
  duration_minutes: number | null
  description: string | null
  is_for_all_staff: boolean
  created_by: string
  calendar_event_attendees?: { staff: { id: string; first_name: string; last_name: string | null } }[]
}

interface MonthCacheData {
  chips: Record<string, any[]>
  lastFetched: number
}

interface DayCacheData {
  events: any[]
  lastFetched: number
}

const MONTH_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const DAY_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

function CalendarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const monthCache = useRef<Map<string, MonthCacheData>>(new Map())
  
  const now = new Date()
  const dueDateParam = searchParams.get('due_date')
  const parsedDate = dueDateParam ? new Date(dueDateParam) : null
  const initialDate = (parsedDate && !isNaN(parsedDate.getTime())) ? parsedDate : now
  const initialMonth = (parsedDate && !isNaN(parsedDate.getTime())) ? new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1) : now
  
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [staffId, setStaffId] = useState<string | null>(null)
  const [refreshingMonth, setRefreshingMonth] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)
  const dayCache = useRef<Map<string, DayCacheData>>(new Map())
  const [cachedDayData, setCachedDayData] = useState<any[] | null>(null)
  const [cachedMonthData, setCachedMonthData] = useState<Record<string, any[]> | null>(null)

  useEffect(() => {
    if (dueDateParam && parsedDate && !isNaN(parsedDate.getTime())) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('due_date')
      const newQuery = params.toString()
      router.replace(`/calendar${newQuery ? `?${newQuery}` : ''}`, { scroll: false })
    }
  }, [dueDateParam, parsedDate, searchParams, router])

  useEffect(() => {
    fetch('/api/user/info')
      .then(r => r.json())
      .then(data => { if (data.staff?.id) setStaffId(data.staff.id) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`
    const cached = monthCache.current.get(monthKey)
    
    if (cached && Date.now() - cached.lastFetched < MONTH_CACHE_TTL) {
      setCachedMonthData(cached.chips)
      return
    }

    const fetchChips = async () => {
      try {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        
        const fromStr = firstDay.toISOString()
        const toStr = lastDay.toISOString()
        
        const response = await fetch(`/api/calendar/month?from=${fromStr}&to=${toStr}`)
        if (response.ok) {
          const data = await response.json()
          const chips = data.chips || {}
          monthCache.current.set(monthKey, { chips, lastFetched: Date.now() })
          setCachedMonthData(chips)
        }
      } catch (error) {
        console.error('Failed to fetch chips', error)
      }
    }
    fetchChips()
  }, [currentMonth])

  useEffect(() => {
    const dayKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
    const cached = dayCache.current.get(dayKey)
    
    if (cached && Date.now() - cached.lastFetched < DAY_CACHE_TTL) {
      setCachedDayData(cached.events)
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
          const events = data.events || []
          dayCache.current.set(dayKey, { events, lastFetched: Date.now() })
          setCachedDayData(events)
        }
      } catch (error) {
        console.error('Failed to fetch events', error)
      }
    }
    fetchEvents()
  }, [selectedDate])

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentMonth(now)
    setSelectedDate(now)
  }

  const refreshMonth = async () => {
    setRefreshingMonth(true)
    const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`
    monthCache.current.delete(monthKey)
    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const fromStr = firstDay.toISOString()
      const toStr = lastDay.toISOString()
      const response = await fetch(`/api/calendar/month?from=${fromStr}&to=${toStr}`)
      if (response.ok) {
        const data = await response.json()
        const chips = data.chips || {}
        monthCache.current.set(monthKey, { chips, lastFetched: Date.now() })
        setCachedMonthData(chips)
      }
    } catch (error) {
      console.error('Failed to refresh month', error)
    } finally {
      setRefreshingMonth(false)
    }
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleEventClick = async (event: { id: string }) => {
    try {
      const response = await fetch(`/api/calendar/events/${event.id}`)
      if (response.ok) {
        const data = await response.json()
        setEditEvent(data.event)
        setIsCreateEventOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch event:', error)
    }
  }

  const handleCreateEvent = () => {
    setEditEvent(null)
    setIsCreateEventOpen(true)
  }

  const handleEventSuccess = async () => {
    const dayKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
    const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`
    dayCache.current.delete(dayKey)
    monthCache.current.delete(monthKey)

    try {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      const response = await fetch(`/api/calendar/events?date=${dateStr}`)
      if (response.ok) {
        const data = await response.json()
        const events = data.events || []
        dayCache.current.set(dayKey, { events, lastFetched: Date.now() })
        setCachedDayData(events)
      }
    } catch (error) {
      console.error('Failed to refresh events', error)
    }

    try {
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      const fromStr = firstDay.toISOString()
      const toStr = lastDay.toISOString()
      const response = await fetch(`/api/calendar/month?from=${fromStr}&to=${toStr}`)
      if (response.ok) {
        const data = await response.json()
        const chips = data.chips || {}
        monthCache.current.set(monthKey, { chips, lastFetched: Date.now() })
        setCachedMonthData(chips)
      }
    } catch (error) {
      console.error('Failed to refresh month chips', error)
    }

    setDataVersion(prev => prev + 1)
  }

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setEditEvent(null)
    }
    setIsCreateEventOpen(open)
  }

  const canEditEvent = (event: CalendarEvent): boolean => {
    if (!staffId) return false
    if (event.created_by !== staffId) return false
    const eventDate = new Date(event.timestamp)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return eventDate >= today
  }

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center justify-between px-4 py-3 border-b border-(--border-default)'>
        <div className='flex items-center gap-2'>
          <CalendarIcon size={20} className='text-(--text-primary)' />
          <h1 className='text-lg font-semibold'>Calendar</h1>
        </div>
        <div className='flex items-center gap-2'>
          <PermissionGate permission='calendar.create'>
            <Button
              variant='secondary'
              icon={<Plus size={16} />}
              label='Create Event'
              onClick={handleCreateEvent}
            />
          </PermissionGate>
        </div>
      </div>

      <div className='flex items-center justify-between px-4 py-3 border-b border-(--border-default)'>
        <div className='flex items-center gap-2'>
          <button
            onClick={goToPrevMonth}
            className='p-1.5 rounded-lg hover:bg-(--background-secondary) transition-colors'
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className='text-base font-medium min-w-[140px] text-center'>{monthYear}</h2>
          <button
            onClick={goToNextMonth}
            className='p-1.5 rounded-lg hover:bg-(--background-secondary) transition-colors'
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='secondary'
            label='Today'
            onClick={goToToday}
          />
          <button
            onClick={refreshMonth}
            disabled={refreshingMonth}
            className='p-2 rounded-lg hover:bg-(--background-secondary) transition-colors disabled:opacity-50'
            title='Refresh month'
          >
            <RefreshCw size={18} className={refreshingMonth ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className='flex-1 overflow-auto bg-(--background-secondary)'>
        <div className='flex flex-col min-h-full p-4 gap-4'>
          <div className='flex-none min-h-[500px] bg-(--background-primary) border border-(--border-default) rounded-xl overflow-hidden shadow-sm'>
            <MonthGrid
              currentDate={currentMonth}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
              initialChips={cachedMonthData}
              dataVersion={dataVersion}
            />
          </div>

          <div className='flex-none min-h-[400px] h-[500px] bg-(--background-primary) border border-(--border-default) rounded-xl overflow-hidden shadow-sm'>
            <HourGrid 
              selectedDate={selectedDate}
              onEventClick={handleEventClick}
              initialEvents={cachedDayData}
              dataVersion={dataVersion}
            />
          </div>
        </div>
      </div>

      <EventModal
        open={isCreateEventOpen}
        onOpenChange={handleModalClose}
        selectedDate={selectedDate}
        onSuccess={handleEventSuccess}
        editEvent={editEvent}
        canEdit={editEvent ? canEditEvent(editEvent as CalendarEvent) : true}
      />
    </div>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className='flex items-center justify-center h-full'>
        <div className='text-(--text-secondary)'>Loading...</div>
      </div>
    }>
      <CalendarContent />
    </Suspense>
  )
}
