'use client'

import { useState, useEffect } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import Select from './costume-ui/select'
import Combobox from './costume-ui/combobox'
import Textarea from './costume-ui/text-area'
import UploadFile from './costume-ui/upload-file'
import DatePicker from './costume-ui/date-picker'
import TimePicker from './costume-ui/time-picker'
import Alert from './costume-ui/alert'
import { FeedbackToasts } from './costume-ui/feedback-toast'

type ComboBoxItem = {
  id: string
  label: string
  subtitle?: string
}

type Props = {
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const taskTypes = [
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Renovation', label: 'Renovation' },
  { value: 'Cleaning', label: 'Cleaning' },
  { value: 'Administrative', label: 'Administrative' },
  { value: 'Documentation', label: 'Documentation' },
  { value: 'Data_Entry', label: 'Data Entry' },
  { value: 'Accounting', label: 'Accounting' },
  { value: 'Legal', label: 'Legal' },
  { value: 'IT_Support', label: 'IT Support' },
  { value: 'Follow_Up', label: 'Follow Up' },
  { value: 'Complaint_Handling', label: 'Complaint Handling' },
  { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
]

const taskPriorities = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' }
]

const AddTask = ({ onSuccess, onLoadingChange }: Props) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [description, setDescription] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [dueTime, setDueTime] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // Property selection state
  const [propertyItems, setPropertyItems] = useState<ComboBoxItem[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null
  )
  const [loadingProperties, setLoadingProperties] = useState(true)

  // Room selection state
  const [roomItems, setRoomItems] = useState<ComboBoxItem[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [loadingRooms, setLoadingRooms] = useState(false)

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch(
          '/api/properties?fields=id,code,street_address&includeProject=true'
        )
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.properties) {
            const items: ComboBoxItem[] = data.properties.map(
              (p: {
                id: string
                code: string
                street_address: string
                projects?: { title: string }
              }) => ({
                id: p.id,
                label: p.code,
                subtitle: p.projects?.title || p.street_address
              })
            )
            setPropertyItems(items)
          }
        }
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoadingProperties(false)
      }
    }

    fetchProperties()
  }, [])

  // Fetch rooms when property changes
  useEffect(() => {
    if (!selectedPropertyId) {
      setRoomItems([])
      setSelectedRoomId(null)
      return
    }

    const fetchRooms = async () => {
      setLoadingRooms(true)
      try {
        const response = await fetch(
          `/api/rooms?propertyId=${selectedPropertyId}`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.rooms && Array.isArray(data.rooms)) {
            const items: ComboBoxItem[] = data.rooms.map(
              (r: { id: string; title: string }) => ({
                id: r.id,
                label: r.title
              })
            )
            setRoomItems(items)
          }
        }
      } catch (error) {
        console.error('Error fetching rooms:', error)
      } finally {
        setLoadingRooms(false)
      }
    }

    fetchRooms()
  }, [selectedPropertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)

    // Validate due date is not in the past
    if (dueDate) {
      const now = new Date()
      const dueDateObj = new Date(dueDate)
      if (dueTime) {
        const [hours, minutes, seconds] = dueTime.split(':').map(Number)
        dueDateObj.setHours(hours || 0, minutes || 0, seconds || 0)
      } else {
        dueDateObj.setHours(23, 59, 59)
      }

      if (dueDateObj < now) {
        setAlertMessage('Due date cannot be in the past')
        setAlertOpen(true)
        setLoading(false)
        onLoadingChange?.(false)
        return
      }
    }

    try {
      // First, upload the attachment if present
      let attachmentUrl: string | null = null

      if (attachmentFile) {
        const formData = new FormData()
        formData.append('file', attachmentFile)
        formData.append('bucket', 'tasks')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload attachment')
        }

        const uploadData = await uploadResponse.json()
        attachmentUrl = uploadData.url
      }

      // Combine date and time for due_date
      let combinedDueDate: string | null = null
      if (dueDate) {
        const dateObj = new Date(dueDate)
        if (dueTime) {
          const [hours, minutes, seconds] = dueTime.split(':').map(Number)
          dateObj.setHours(hours || 0, minutes || 0, seconds || 0)
        } else {
          // Default to end of day if no time specified
          dateObj.setHours(23, 59, 59)
        }
        combinedDueDate = dateObj.toISOString()
      }

      // Create the task
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          type,
          priority,
          description,
          attachment: attachmentUrl,
          property_id: selectedPropertyId,
          room_id: selectedRoomId,
          due_date: combinedDueDate
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task')
      }

      FeedbackToasts.created(
        'Task',
        `Task ${data.task.reference_id} has been created successfully.`
      )

      // Reset form
      setTitle('')
      setType('')
      setPriority('Medium')
      setDescription('')
      setAttachmentFile(null)
      setDueDate(undefined)
      setDueTime('')
      setSelectedPropertyId(null)
      setSelectedRoomId(null)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create task'
      setAlertMessage(errorMessage)
      setAlertOpen(true)
      FeedbackToasts.createFailed('task', errorMessage)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <form
      id='dialog-form'
      onSubmit={handleSubmit}
      className='flex flex-col gap-7.5'
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
        <InputGroup label='Type' isRequired>
          <Select
            label='Type'
            items={taskTypes}
            placeholder='Select task type'
            value={type}
            onChange={setType}
            required
            disabled={loading}
          />
        </InputGroup>

        <InputGroup label='Priority' isRequired>
          <Select
            label='Priority'
            items={taskPriorities}
            placeholder='Select priority'
            value={priority}
            onChange={setPriority}
            required
            disabled={loading}
          />
        </InputGroup>
      </div>

      <InputGroup label='Title' isRequired>
        <Input
          placeholder='E.g. Fix leaking pipe in unit 204'
          className='w-full'
          minLength={5}
          maxLength={200}
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          disabled={loading}
        />
      </InputGroup>

      <InputGroup label='Description' isRequired>
        <Textarea
          placeholder='Please describe the task in detail...'
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          disabled={loading}
        />
      </InputGroup>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
        <InputGroup label='Property'>
          <Combobox
            items={propertyItems}
            variant='single'
            searchPlaceholder='Search properties'
            placeholder={
              loadingProperties ? 'Loading properties...' : 'Select a property'
            }
            value={selectedPropertyId || ''}
            onValueChange={value => {
              setSelectedPropertyId(value || null)
              setSelectedRoomId(null)
            }}
            isLoading={loadingProperties}
            loadingMessage='Fetching properties...'
            disabled={loading}
          />
        </InputGroup>

        <InputGroup label='Room'>
          <Combobox
            items={roomItems}
            variant='single'
            searchPlaceholder='Search rooms'
            placeholder={
              !selectedPropertyId
                ? 'Select property first'
                : loadingRooms
                  ? 'Loading rooms...'
                  : roomItems.length === 0
                    ? 'No rooms available'
                    : 'Select a room'
            }
            value={selectedRoomId || ''}
            onValueChange={value => {
              setSelectedRoomId(value || null)
            }}
            isLoading={loadingRooms}
            loadingMessage='Fetching rooms...'
            disabled={loading || !selectedPropertyId || roomItems.length === 0}
          />
        </InputGroup>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
        <InputGroup label='Due Date'>
          <DatePicker
            value={dueDate}
            onValueChange={setDueDate}
            disabled={loading}
          />
        </InputGroup>

        <InputGroup label='Due Time'>
          <TimePicker
            value={dueTime}
            onValueChange={setDueTime}
            disabled={loading || !dueDate}
            placeholder='Select time'
          />
        </InputGroup>
      </div>

      <InputGroup label='Attachment'>
        <UploadFile onFileChange={setAttachmentFile} maxSizeMB={2} />
      </InputGroup>

      <Alert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type='warning'
      />
    </form>
  )
}

export default AddTask
