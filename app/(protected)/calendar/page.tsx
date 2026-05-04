'use client'

import { useState, useEffect, Suspense } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react'
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

function CalendarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const now = new Date()
  const dueDateParam = searchParams.get('due_date')
  const parsedDate = dueDateParam ? new Date(dueDateParam) : null
  const initialDate = (parsedDate && !isNaN(parsedDate.getTime())) ? parsedDate : now
  const initialMonth = (parsedDate && !isNaN(parsedDate.getTime())) ? new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1) : now
  
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [staffId, setStaffId] = useState<string | null>(null)

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
        <Button
          variant='secondary'
          label='Today'
          onClick={goToToday}
        />
      </div>

      <div className='flex-1 overflow-auto bg-(--background-secondary)'>
        <div className='flex flex-col min-h-full p-4 gap-4'>
          <div className='flex-none min-h-[500px] bg-(--background-primary) border border-(--border-default) rounded-xl overflow-hidden shadow-sm'>
            <MonthGrid
              key={`month-${refreshKey}`}
              currentDate={currentMonth}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          </div>

          <div className='flex-none min-h-[400px] h-[500px] bg-(--background-primary) border border-(--border-default) rounded-xl overflow-hidden shadow-sm'>
            <HourGrid 
              key={`hour-${refreshKey}`}
              selectedDate={selectedDate}
              onEventClick={handleEventClick}
              refreshKey={refreshKey}
            />
          </div>
        </div>
      </div>

      <EventModal
        open={isCreateEventOpen}
        onOpenChange={handleModalClose}
        selectedDate={selectedDate}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
        editEvent={editEvent}
        canEdit={editEvent ? canEditEvent(editEvent as CalendarEvent) : false}
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
