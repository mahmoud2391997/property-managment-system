'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle } from 'lucide-react'
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
import UploadFile from '../costume-ui/upload-file'
import { FeedbackToasts } from '../costume-ui/feedback-toast'
import { cn } from '@/lib/utils'
import { PRIORITY_LEVELS } from '../task-ui/types'

type StaffMember = {
  id: string
  name: string
  avatar?: string
  role?: string
}

type Props = {
  leaseId: string
  propertyName: string
  unitName?: string
  tenantName: string
  onSuccess?: () => void
  trigger: React.ReactNode
}

export default function InitiateLeaseEndingDrawer({
  leaseId,
  propertyName,
  unitName,
  tenantName,
  onSuccess,
  trigger
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)

  // Staff list state
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)

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
    setTitle('')
    setDescription('')
    setPriority('')
    setAttachmentFile(null)
    setSelectedStaffId(null)
    setError('')
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!selectedStaffId) {
      setError('Please assign a staff member')
      setLoading(false)
      return
    }

    try {
      // Upload attachment if present
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

      // Call the initiate-ending-flow API
      const response = await fetch(`/api/leases/initiate-ending-flow/${leaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          attachment: attachmentUrl,
          assignedStaffId: selectedStaffId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate lease ending flow')
      }

      FeedbackToasts.created(
        'Lease Ending Flow',
        'Inspection task created and assigned. Lease has been ended.'
      )

      handleClose()
      onSuccess?.()

      // Navigate to the inspection task
      router.push(`/tasks/${data.inspectionTaskId}`)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initiate lease ending flow'
      setError(errorMessage)
      FeedbackToasts.createFailed('lease ending flow', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const locationDisplay = unitName ? `${propertyName} - ${unitName}` : propertyName

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        fullScreen
        className={cn('px-0 pb-0', 'flex flex-col')}
      >
        {/* Header */}
        <DrawerHeader className='px-4 pb-4 border-b border-(--border-default) shrink-0'>
          <div className='flex items-center justify-between'>
            <DrawerTitle className='text-left text-lg'>End Lease</DrawerTitle>
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
                  You are about to end the lease and initiate the lease ending flow.
                </p>
                <p className='texts-body-small text-amber-700 mt-1'>
                  This will:
                </p>
                <ul className='texts-body-small text-amber-700 mt-1 list-disc list-inside space-y-0.5'>
                  <li>Change lease status to "Ended"</li>
                  <li>Cancel all pending payments</li>
                  <li>Close all open tickets</li>
                  <li>Create an inspection task</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Lease Info */}
          <div className='mb-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='texts-label-small text-(--text-secondary)'>Property</p>
                <p className='texts-body-small-medium text-(--text-primary)'>{locationDisplay}</p>
              </div>
              <div>
                <p className='texts-label-small text-(--text-secondary)'>Tenant</p>
                <p className='texts-body-small-medium text-(--text-primary)'>{tenantName}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form id='lease-ending-form' onSubmit={handleSubmit} className='flex flex-col gap-6'>
            <p className='texts-body-medium-medium text-(--text-primary)'>
              Inspection Task Details
            </p>

            <InputGroup label='Title' isRequired>
              <Input
                placeholder='E.g. End of Lease Inspection'
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
                className={cn(
                  'flex items-center',
                  'bg-(--background-secondary) border border-(--border-strong)',
                  'placeholder:text-(--text-placeholder) disabled:opacity-60',
                  'focus:placeholder:text-(--text-secondary) hover:bg-neutral-100 focus:hover:bg-neutral-50',
                  'transition-colors duration-200',
                  'texts-body-small shadows-xs',
                  'w-full p-2.5',
                  'rounded-[5]',
                  'min-h-[120px] resize-none'
                )}
                placeholder='Describe what needs to be inspected...'
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                minLength={10}
                maxLength={2000}
                disabled={loading}
              />
            </InputGroup>

            <InputGroup label='Priority' isRequired>
              <Select
                label='Priority'
                items={priorityItems}
                placeholder='Select priority'
                value={priority}
                onChange={setPriority}
                required
                disabled={loading}
              />
            </InputGroup>

            <InputGroup label='Assign To' isRequired>
              <Combobox
                items={staffItems}
                variant='single'
                searchPlaceholder='Search staff'
                placeholder={loadingStaff ? 'Loading staff...' : 'Select staff member'}
                onValueChange={value => {
                  setSelectedStaffId(value || null)
                }}
                isLoading={loadingStaff}
                loadingMessage='Fetching staff...'
                required
                disabled={loading}
              />
            </InputGroup>

            <InputGroup label='Attachment'>
              <UploadFile onFileChange={setAttachmentFile} maxSizeMB={2} />
            </InputGroup>

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
              form='lease-ending-form'
              disabled={loading}
              className={cn(
                'flex-1 py-3 rounded-lg font-medium text-white',
                'bg-amber-600 hover:bg-amber-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              {loading ? 'Processing...' : 'End Lease & Create Task'}
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
