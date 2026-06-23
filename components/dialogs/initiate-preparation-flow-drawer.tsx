'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerTrigger
} from '@/components/ui/drawer'
import Input from '../costume-ui/input'
import InputGroup from '../costume-ui/input-group'
import Select from '../costume-ui/select'
import Combobox from '../costume-ui/combobox'
import { Textarea } from '../ui/textarea'
import { FeedbackToasts } from '../costume-ui/feedback-toast'
import { cn } from '@/lib/utils'
import { PRIORITY_LEVELS } from '../task-ui/types'

type StaffMember = {
  id: string
  name: string
  avatar?: string
  role?: string
}

type PreparationTask = {
  id: string // Temporary ID for React key
  title: string
  description: string
  priority: string
  assignedStaffId: string | null
}

type Props = {
  propertyId?: string
  roomId?: string
  locationName: string
  onSuccess?: () => void
  trigger: React.ReactNode
}

export default function InitiatePreparationFlowDrawer({
  propertyId,
  roomId,
  locationName,
  onSuccess,
  trigger
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Staff list state
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)

  // Tasks state - start with one task
  const [tasks, setTasks] = useState<PreparationTask[]>([
    {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      priority: '',
      assignedStaffId: null
    }
  ])

  // Fetch staff list when drawer opens
  useEffect(() => {
    if (open) {
      fetchStaffList()
    }
  }, [open])

  const fetchStaffList = async () => {
    setLoadingStaff(true)
    try {
      const response = await fetch('/api/tasks/staff')
      if (response.ok) {
        const data = await response.json()
        setStaffList(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoadingStaff(false)
    }
  }

  // Convert staff to combobox items
  const staffItems = staffList.map(s => ({
    id: s.id,
    label: s.name,
    subtitle: s.role
  }))

  // Convert priority levels to select items
  const priorityItems = PRIORITY_LEVELS.map(p => ({
    value: p,
    label: p
  }))

  const resetForm = () => {
    setTasks([
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        priority: '',
        assignedStaffId: null
      }
    ])
    setError('')
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        priority: '',
        assignedStaffId: null
      }
    ])
  }

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(t => t.id !== id))
    }
  }

  const updateTask = (id: string, field: keyof PreparationTask, value: any) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, [field]: value } : t)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      if (!task.title.trim()) {
        setError(`Task ${i + 1}: Title is required`)
        setLoading(false)
        return
      }
      if (task.title.trim().length < 5) {
        setError(`Task ${i + 1}: Title must be at least 5 characters`)
        setLoading(false)
        return
      }
      if (!task.description.trim()) {
        setError(`Task ${i + 1}: Description is required`)
        setLoading(false)
        return
      }
      if (task.description.trim().length < 10) {
        setError(`Task ${i + 1}: Description must be at least 10 characters`)
        setLoading(false)
        return
      }
      if (!task.priority) {
        setError(`Task ${i + 1}: Priority is required`)
        setLoading(false)
        return
      }
      if (!task.assignedStaffId) {
        setError(`Task ${i + 1}: Assigned staff is required`)
        setLoading(false)
        return
      }
    }

    try {
      const endpoint = propertyId
        ? `/api/properties/initiate-preparation-flow/${propertyId}`
        : `/api/rooms/initiate-preparation-flow/${roomId}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preparationTasks: tasks.map(t => ({
            title: t.title.trim(),
            description: t.description.trim(),
            priority: t.priority,
            assignedStaffId: t.assignedStaffId
          }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate preparation flow')
      }

      FeedbackToasts.created(
        'Preparation Flow',
        `${tasks.length} preparation task${tasks.length > 1 ? 's' : ''} created and assigned.`
      )

      handleClose()
      onSuccess?.()

      // Navigate to the first task
      if (data.tasks && data.tasks.length > 0) {
        router.push(`/tasks/${data.tasks[0].id}`)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initiate preparation flow'
      setError(errorMessage)
      FeedbackToasts.createFailed('preparation flow', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent fullScreen className={cn('px-0 pb-0', 'flex flex-col')}>
        {/* Header */}
        <DrawerHeader className='px-4 pb-4 border-b border-(--border-default) shrink-0'>
          <div className='flex items-center justify-between'>
            <DrawerTitle className='text-left text-lg'>
              Mark as Not Ready
            </DrawerTitle>
            <button
              onClick={handleClose}
              className='p-2 hover:bg-neutral-100 rounded-full transition-colors'
            >
              <X className='w-5 h-5 text-(--text-secondary)' />
            </button>
          </div>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-auto px-4 py-4 min-h-0'>
          {/* Warning Banner */}
          <div className='mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
            <div className='flex gap-3'>
              <AlertTriangle className='w-5 h-5 text-amber-600 shrink-0 mt-0.5' />
              <div>
                <p className='texts-body-small-medium text-amber-800'>
                  You are about to mark this {propertyId ? 'property' : 'room'} as not ready.
                </p>
                <p className='texts-body-small text-amber-700 mt-1'>
                  This will:
                </p>
                <ul className='texts-body-small text-amber-700 mt-1 list-disc list-inside space-y-0.5'>
                  <li>Change status to "Under Preparation"</li>
                  <li>Create preparation tasks</li>
                  <li>Return to "Ready" when all tasks are completed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className='mb-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg'>
            <div>
              <p className='texts-label-small text-(--text-secondary)'>
                {propertyId ? 'Property' : 'Room'}
              </p>
              <p className='texts-body-small-medium text-(--text-primary)'>
                {locationName}
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            id='preparation-flow-form'
            onSubmit={handleSubmit}
            className='flex flex-col gap-6'
          >
            <div className='flex items-center justify-between'>
              <p className='texts-body-medium-medium text-(--text-primary)'>
                Preparation Tasks
              </p>
              <button
                type='button'
                onClick={addTask}
                disabled={loading}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                  'bg-(--background-secondary) border border-(--border-strong)',
                  'texts-body-small-medium text-(--text-primary)',
                  'hover:bg-neutral-100 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Plus className='w-4 h-4' />
                Add Task
              </button>
            </div>

            {/* Task List */}
            <div className='space-y-6'>
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className='p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-4'
                >
                  <div className='flex items-center justify-between'>
                    <p className='texts-body-small-medium text-(--text-primary)'>
                      Task {index + 1}
                    </p>
                    {tasks.length > 1 && (
                      <button
                        type='button'
                        onClick={() => removeTask(task.id)}
                        disabled={loading}
                        className={cn(
                          'p-1.5 rounded hover:bg-red-100 transition-colors',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        <Trash2 className='w-4 h-4 text-red-600' />
                      </button>
                    )}
                  </div>

                  <InputGroup label='Title' isRequired>
                    <Input
                      placeholder='E.g. Repair broken window'
                      className='w-full'
                      minLength={5}
                      maxLength={200}
                      value={task.title}
                      onChange={e => updateTask(task.id, 'title', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </InputGroup>

                  <InputGroup label='Description' isRequired>
                    <Textarea
                      className={cn(
                        'flex items-center',
                        'bg-(--background-secondary) border border-(--border-strong)',
                        'placeholder:text-(--text-placeholder) disabled:opacity-60',
                        'focus:placeholder:text-(--text-secondary) hover:bg-neutral-100 focus:hover:bg-neutral-50',
                        'transition-colors duration-200',
                        'texts-body-small shadows-xs',
                        'w-full p-2.5',
                        'rounded-[5]',
                        'min-h-[100px] resize-none'
                      )}
                      placeholder='Describe what needs to be done...'
                      value={task.description}
                      onChange={e =>
                        updateTask(task.id, 'description', e.target.value)
                      }
                      required
                      minLength={10}
                      maxLength={2000}
                      disabled={loading}
                    />
                  </InputGroup>

                  <div className='grid grid-cols-2 gap-4'>
                    <InputGroup label='Priority' isRequired>
                      <Select
                        label='Priority'
                        items={priorityItems}
                        placeholder='Select priority'
                        value={task.priority}
                        onChange={value => updateTask(task.id, 'priority', value)}
                        required
                        disabled={loading}
                      />
                    </InputGroup>

                    <InputGroup label='Assign To' isRequired>
                      <Combobox
                        items={staffItems}
                        variant='single'
                        searchPlaceholder='Search staff'
                        placeholder={
                          loadingStaff ? 'Loading staff...' : 'Select staff member'
                        }
                        value={task.assignedStaffId || ''}
                        onValueChange={value => {
                          updateTask(task.id, 'assignedStaffId', value || null)
                        }}
                        isLoading={loadingStaff}
                        loadingMessage='Fetching staff...'
                        required
                        disabled={loading}
                      />
                    </InputGroup>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className='text-red-600 text-sm'>{error}</p>}
          </form>
        </div>

        {/* Footer */}
        <DrawerFooter className='border-t border-(--border-default) px-4 py-4 shrink-0'>
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={handleClose}
              disabled={loading}
              className={cn(
                'flex-1 py-3 rounded-lg font-medium',
                'border border-(--border-strong) text-(--text-primary)',
                'hover:bg-neutral-50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              type='submit'
              form='preparation-flow-form'
              disabled={loading}
              className={cn(
                'flex-1 py-3 rounded-lg font-medium text-white',
                'bg-amber-600 hover:bg-amber-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              {loading
                ? 'Processing...'
                : `Create ${tasks.length} Task${tasks.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
