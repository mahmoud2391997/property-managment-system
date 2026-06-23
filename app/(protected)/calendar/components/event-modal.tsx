'use client'

import { useState, useEffect } from 'react'
import { Clock, Trash2 } from 'lucide-react'
import Dialog from '@/components/costume-ui/dialog'
import Button from '@/components/costume-ui/button'
import Alert from '@/components/costume-ui/alert'
import { cn } from '@/lib/utils'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'

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
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

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
        setSelectedAttendees(editEvent.calendar_event_attendees?.map((a: any) => a.staff.id) || [])
      } else {
        setTitle('')
        setTimestamp('')
        setDurationMinutes('')
        setDescription('')
        setIsForAllStaff(false)
        setSelectedAttendees([])
      }
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

  const resetForm = () => {
    setTitle('')
    setTimestamp('')
    setDurationMinutes('')
    setDescription('')
    setIsForAllStaff(false)
    setSelectedAttendees([])
    setAttendeeSearch('')
    setShowDeleteConfirm(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm()
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

    // Only block past dates when creating a new event.
    // Editing existing events should still be allowed.
    if (!editEvent) {
      const eventDateTime = new Date(finalTimestamp)
      const now = new Date()

      if (eventDateTime < now) {
        setAlertMessage('Cannot create events in the past')
        setAlertOpen(true)
        return
      }
    }

    setLoading(true)
    try {
      const url = editEvent ? `/api/calendar/events/${editEvent.id}` : '/api/calendar/events'
      const method = editEvent ? 'PATCH' : 'POST'

      const payload = {
        title,
        timestamp: finalTimestamp,
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
        description: description || null,
        is_for_all_staff: isForAllStaff,
        attendee_ids: isForAllStaff ? [] : selectedAttendees
      }

      console.log('[EventModal] Submitting:', payload)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      console.log('[EventModal] Response:', response.status, result)

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
    setShowDeleteConfirm(false)
    try {
      const response = await fetch(`/api/calendar/events/${editEvent.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        onOpenChange(false)
        onSuccess?.()
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  const toggleAttendee = (id: string) => {
    setSelectedAttendees(prev =>
      prev.includes(id) ? prev.filter((a: any) => a !== id) : [...prev, id]
    )
  }

  const filteredAttendees = attendees.filter((a: any) => {
    const name = `${a.first_name} ${a.last_name || ''}`.toLowerCase()
    return name.includes(attendeeSearch.toLowerCase())
  })

  const modalTitle = editEvent ? (canEdit ? 'Edit Event' : 'View Event') : 'Create Event'

  return (
    <>
      <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={modalTitle}
      saveButtonLabel={!editEvent || (editEvent && canEdit) ? (editEvent ? 'Update' : 'Create') : undefined}
      cancelButtonLabel={editEvent && !canEdit ? 'Close' : 'Cancel'}
      loading={loading}
      disabled={!title || loading}
      className='max-w-md!'
      extraFooterContent={
        editEvent && canEdit ? (
          <button
            type='button'
            onClick={() => setShowDeleteConfirm(true)}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-(--danger-main) text-white hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-opacity'
          >
            <span className='w-4 h-4 flex items-center justify-center'>
              <Trash2 size={14} />
            </span>
            <span>Delete</span>
          </button>
        ) : null
      }
    >
      <form id='dialog-form' onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>Title *</label>
          <input
            type='text'
            value={title}
            onChange={e => setTitle(e.target.value)}
            readOnly={editEvent ? !canEdit : false}
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
            readOnly={editEvent ? !canEdit : false}
            {...(!editEvent ? { min: new Date().toISOString().slice(0, 16) } : {})}
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
            readOnly={editEvent ? !canEdit : false}
            className={cn(
              'w-full px-3 py-2 rounded-lg border border-(--border-default) focus:outline-none focus:ring-2 focus:ring-(--primary-main)',
              editEvent && !canEdit ? 'bg-(--background-secondary) text-(--text-secondary) cursor-not-allowed' : 'bg-(--background-primary)'
            )}
            placeholder='30'
            min='0'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            readOnly={editEvent ? !canEdit : false}
            className={cn(
              'w-full px-3 py-2 rounded-lg border border-(--border-default) focus:outline-none focus:ring-2 focus:ring-(--primary-main) resize-none',
              editEvent && !canEdit ? 'bg-(--background-secondary) text-(--text-secondary) cursor-not-allowed' : 'bg-(--background-primary)'
            )}
            rows={3}
            placeholder='Optional details...'
          />
        </div>

        {canEdit && (
          <>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => {
                  setIsForAllStaff(!isForAllStaff)
                  if (!isForAllStaff) setSelectedAttendees([])
                }}
                disabled={!canEdit}
                className={cn(
                  'flex items-center gap-2 disabled:cursor-not-allowed cursor-pointer disabled:opacity-50'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                  isForAllStaff
                    ? 'bg-black border-black'
                    : 'border-(--border-default) bg-(--background-primary)'
                )}>
                  {isForAllStaff && (
                    <svg width='10' height='8' viewBox='0 0 10 8' fill='none'>
                      <path d='M1 4L3.5 6.5L9 1' stroke='white' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                    </svg>
                  )}
                </div>
                <span className='text-sm'>All staff (includes future staff)</span>
              </button>
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>Attendees</label>
              <div className='w-full px-3 py-2 rounded-lg border border-(--border-default) bg-(--background-primary)'>
                <input
                  type='text'
                  value={attendeeSearch}
                  onChange={e => setAttendeeSearch(e.target.value)}
                  disabled={!canEdit}
                  placeholder='Search staff...'
                  className='w-full px-2 py-1 text-sm rounded border border-(--border-default) bg-(--background-primary) focus:outline-none mb-2 disabled:opacity-50 disabled:cursor-not-allowed'
                />
                <button
                  type='button'
                  onClick={() => {
                    if (isAllManuallySelected) {
                      setSelectedAttendees([])
                    } else {
                      setSelectedAttendees(attendees.map((s: any) => s.id))
                    }
                  }}
                  disabled={!canEdit}
                  className='flex items-center gap-2 px-1 py-1 w-full cursor-pointer text-sm font-medium text-(--primary-main) disabled:cursor-not-allowed'
                >
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                    isAllManuallySelected
                      ? 'bg-black border-black'
                      : 'border-(--border-default) bg-(--background-primary)'
                  )}>
                    {isAllManuallySelected && (
                      <svg width='10' height='8' viewBox='0 0 10 8' fill='none'>
                        <path d='M1 4L3.5 6.5L9 1' stroke='white' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                      </svg>
                    )}
                  </div>
                  Select all ({attendees.length})
                </button>
                <div className='max-h-32 overflow-auto mt-1 space-y-0.5'>
                  {filteredAttendees.map((a: any) => {
                    const isSelected = isForAllStaff || selectedAttendees.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        type='button'
                        onClick={() => {
                          if (isForAllStaff) {
                            setIsForAllStaff(false)
                            setSelectedAttendees(attendees.filter((s: any) => s.id !== a.id).map((s: any) => s.id))
                          } else {
                            toggleAttendee(a.id)
                          }
                        }}
                        disabled={!canEdit}
                        className='flex items-center gap-2 px-2 py-1.5 w-full text-left hover:bg-(--background-secondary) cursor-pointer text-sm rounded disabled:cursor-not-allowed disabled:opacity-50'
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-black border-black'
                            : 'border-(--border-default) bg-(--background-primary)'
                        )}>
                          {isSelected && (
                            <svg width='10' height='8' viewBox='0 0 10 8' fill='none'>
                              <path d='M1 4L3.5 6.5L9 1' stroke='white' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                            </svg>
                          )}
                        </div>
                        <span>{a.first_name} {a.last_name || ''}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
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
          </>
        )}
      </form>
    </Dialog>

    <Alert
      open={alertOpen}
      onClose={() => setAlertOpen(false)}
      message={alertMessage}
      type='warning'
    />

    {editEvent && canEdit && (
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title='Delete Event'
        description='Are you sure you want to delete this event? This action cannot be undone.'
        variant='confirm'
        confirmButtonLabel='Delete'
        confirmButtonLoadingLabel='Deleting...'
        confirmButtonClassName='bg-(--danger-main)! hover:opacity-90!'
        loading={deleting}
        onConfirm={handleDelete}
      />
    )}
    </>
  )
}
