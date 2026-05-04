'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Clock, Trash2 } from 'lucide-react'
import Button from '@/components/costume-ui/button'
import { cn } from '@/lib/utils'

interface Attendee {
  id: string
  first_name: string
  last_name: string | null
}

interface CalendarEvent {
  id: string
  title: string
  timestamp: string
  duration_minutes: number | null
  description: string | null
  is_for_all_staff: boolean
  calendar_event_attendees?: { staff: Attendee }[]
}

interface EventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSuccess?: () => void
  editEvent?: CalendarEvent | null
  canEdit?: boolean
}

export default function EventModal({ open, onOpenChange, selectedDate, onSuccess, editEvent, canEdit = true }: EventModalProps) {
  const [title, setTitle] = useState('')
  const [timestamp, setTimestamp] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [description, setDescription] = useState('')
  const [isForAllStaff, setIsForAllStaff] = useState(false)
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const isMounting = useRef(true)

  useEffect(() => {
    if (open) {
      fetchAttendees()
      if (editEvent) {
        setTitle(editEvent.title)
        const d = new Date(editEvent.timestamp)
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        setTimestamp(local)
        setDurationMinutes(editEvent.duration_minutes?.toString() || '')
        setDescription(editEvent.description || '')
        setIsForAllStaff(editEvent.is_for_all_staff)
        setSelectedAttendees(editEvent.calendar_event_attendees?.map(a => a.staff.id) || [])
      } else {
        setTitle('')
        setTimestamp('')
        setDurationMinutes('')
        setDescription('')
        setIsForAllStaff(false)
        setSelectedAttendees([])
      }
      isMounting.current = false
    }
  }, [open, editEvent])

  const isAllManuallySelected = attendees.length > 0 && selectedAttendees.length === attendees.length

  const fetchAttendees = async () => {
    try {
      const response = await fetch('/api/staff')
      if (response.ok) {
        const data = await response.json()
        setAttendees(data.staff || [])
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTitle('')
      setTimestamp('')
      setDurationMinutes('')
      setDescription('')
      setIsForAllStaff(false)
      setSelectedAttendees([])
      setAttendeeSearch('')
      setShowAttendeeDropdown(false)
    }
    onOpenChange(isOpen)
  }

  const formatDefaultTimestamp = (date: Date) => {
    const d = new Date(date)
    d.setHours(9, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalTimestamp = timestamp || formatDefaultTimestamp(selectedDate)
    if (!title || !finalTimestamp) return

    setLoading(true)
    try {
      const url = editEvent ? `/api/calendar/events/${editEvent.id}` : '/api/calendar/events'
      const method = editEvent ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          timestamp: finalTimestamp,
          duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
          description: description || null,
          is_for_all_staff: isForAllStaff,
          attendee_ids: isForAllStaff ? [] : selectedAttendees
        })
      })

      if (response.ok) {
        handleOpenChange(false)
        onSuccess?.()
      }
    } catch (error) {
      console.error('Failed to save event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editEvent) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/calendar/events/${editEvent.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        handleOpenChange(false)
        onSuccess?.()
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
    } finally {
      setDeleting(false)
    }
  }

  const toggleAttendee = (id: string) => {
    setSelectedAttendees(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const filteredAttendees = attendees.filter(a => {
    const name = `${a.first_name} ${a.last_name || ''}`.toLowerCase()
    return name.includes(attendeeSearch.toLowerCase())
  })

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-(--background-primary) rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-auto'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-(--border-default)'>
          <h2 className='text-lg font-semibold'>{editEvent ? (canEdit ? 'Edit Event' : 'View Event') : 'Create Event'}</h2>
          <div className='flex items-center gap-2'>
            {editEvent && canEdit && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className='p-1.5 rounded-lg hover:bg-(--danger-light) transition-colors text-(--danger-main)'
                title='Delete event'
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={() => handleOpenChange(false)}
              className='p-1 rounded-lg hover:bg-(--background-secondary) transition-colors'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Title *</label>
            <input
              type='text'
              value={title}
              onChange={e => setTitle(e.target.value)}
              readOnly={editEvent && !canEdit}
              className={cn(
                'w-full px-3 py-2 rounded-lg border border-(--border-default) focus:outline-none focus:ring-2 focus:ring-(--primary-main)',
                editEvent && !canEdit ? 'bg-(--background-secondary) text-(--text-secondary) cursor-not-allowed' : 'bg-(--background-primary)'
              )}
              placeholder='Meeting, Reminder, etc.'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Date & Time *</label>
            <input
              type='datetime-local'
              value={timestamp || formatDefaultTimestamp(selectedDate)}
              onChange={e => setTimestamp(e.target.value)}
              readOnly={editEvent && !canEdit}
              className={cn(
                'w-full px-3 py-2 rounded-lg border border-(--border-default) focus:outline-none focus:ring-2 focus:ring-(--primary-main)',
                editEvent && !canEdit ? 'bg-(--background-secondary) text-(--text-secondary) cursor-not-allowed' : 'bg-(--background-primary)'
              )}
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>
              <span className='flex items-center gap-1'>
                <Clock size={14} />
                Duration (minutes)
              </span>
            </label>
            <input
              type='number'
              value={durationMinutes}
              onChange={e => setDurationMinutes(e.target.value)}
              readOnly={editEvent && !canEdit}
              className={cn(
                'w-full px-3 py-2 rounded-lg border border-(--border-default) focus:outline-none focus:ring-2 focus:ring-(--primary-main)',
                editEvent && !canEdit ? 'bg-(--background-secondary) text-(--text-secondary) cursor-not-allowed' : 'bg-(--background-primary)'
              )}
              placeholder='30'
              min='1'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              readOnly={editEvent && !canEdit}
              className={cn(
                'w-full px-3 py-2 rounded-lg border border-(--border-default) focus:outline-none focus:ring-2 focus:ring-(--primary-main) resize-none',
                editEvent && !canEdit ? 'bg-(--background-secondary) text-(--text-secondary) cursor-not-allowed' : 'bg-(--background-primary)'
              )}
              rows={3}
              placeholder='Optional details...'
            />
          </div>

          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='allStaff'
              checked={isForAllStaff}
              onChange={e => {
                setIsForAllStaff(e.target.checked)
                if (e.target.checked) setSelectedAttendees([])
              }}
              disabled={editEvent && !canEdit}
              className='rounded border-(--border-default)'
            />
            <label htmlFor='allStaff' className='text-sm'>All staff (includes future staff)</label>
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>Attendees</label>
            <button
              type='button'
              onClick={() => canEdit && setShowAttendeeDropdown(!showAttendeeDropdown)}
              className={cn(
                'w-full px-3 py-2 rounded-lg border border-(--border-default) text-left text-sm focus:outline-none focus:ring-2 focus:ring-(--primary-main)',
                editEvent && !canEdit ? 'bg-(--background-secondary) text-(--text-secondary) cursor-not-allowed' : 'bg-(--background-primary)'
              )}
            >
              {isForAllStaff
                ? 'All staff (includes future staff)'
                : selectedAttendees.length === 0
                  ? 'Select attendees...'
                  : `${selectedAttendees.length} attendee(s) selected`}
            </button>
            {showAttendeeDropdown && (
              <div className='mt-1 w-full bg-(--background-primary) border border-(--border-default) rounded-lg shadow-lg max-h-48 overflow-auto'>
                <div className='p-2 border-b border-(--border-default) sticky top-0 bg-(--background-primary) space-y-1'>
                  <input
                    type='text'
                    value={attendeeSearch}
                    onChange={e => setAttendeeSearch(e.target.value)}
                    placeholder='Search staff...'
                    className='w-full px-2 py-1 text-sm rounded border border-(--border-default) bg-(--background-primary) focus:outline-none'
                  />
                  <label className='flex items-center gap-2 px-1 py-1 cursor-pointer text-sm font-medium text-(--primary-main)'>
                    <input
                      type='checkbox'
                      checked={isAllManuallySelected}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedAttendees(attendees.map(s => s.id))
                        } else {
                          setSelectedAttendees([])
                        }
                      }}
                      disabled={!canEdit}
                      className='rounded border-(--border-default)'
                    />
                    Select all ({attendees.length})
                  </label>
                </div>
                {filteredAttendees.map(a => (
                  <label
                    key={a.id}
                    className='flex items-center gap-2 px-3 py-2 hover:bg-(--background-secondary) cursor-pointer text-sm'
                  >
                    <input
                      type='checkbox'
                      checked={isForAllStaff || selectedAttendees.includes(a.id)}
                      onChange={() => {
                        if (isForAllStaff) {
                          setIsForAllStaff(false)
                          setSelectedAttendees(attendees.filter(s => s.id !== a.id).map(s => s.id))
                        } else {
                          toggleAttendee(a.id)
                        }
                      }}
                      disabled={!canEdit}
                      className='rounded border-(--border-default)'
                    />
                    <span>{a.first_name} {a.last_name || ''}</span>
                  </label>
                ))}
              </div>
            )}
            {!isForAllStaff && selectedAttendees.length > 0 && (
              <div className='flex flex-wrap gap-1 mt-2'>
                {selectedAttendees.map(id => {
                  const attendee = attendees.find(a => a.id === id)
                  return attendee ? (
                    <span
                      key={id}
                      className='inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-(--background-secondary) rounded-full'
                    >
                      {attendee.first_name} {attendee.last_name || ''}
                      {canEdit && (
                        <button
                          type='button'
                          onClick={() => toggleAttendee(id)}
                          className='text-(--text-secondary) hover:text-(--text-primary)'
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ) : null
                })}
              </div>
            )}
            {isForAllStaff && (
              <div className='flex flex-wrap gap-1 mt-2'>
                <span className='inline-flex items-center px-2 py-0.5 text-xs bg-(--primary-light) text-(--primary-main) rounded-full'>
                  All staff (dynamic)
                </span>
              </div>
            )}
          </div>

          <div className='flex gap-2 pt-2'>
            <Button
              type='button'
              variant='secondary'
              label={editEvent && !canEdit ? 'Close' : 'Cancel'}
              onClick={() => handleOpenChange(false)}
              className='flex-1'
            />
            {!editEvent || (editEvent && canEdit) ? (
              <Button
                type='submit'
                label={editEvent ? 'Update' : 'Create'}
                loading={loading}
                disabled={!title || loading}
                className='flex-1'
              />
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}
