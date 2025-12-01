'use client'

import { useState } from 'react'
import Select from '@/components/costume-ui/select'
import StaffAssignedSection from './staff-assigned-section'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { ticketTypes } from '@/utils/data'

type StaffMember = {
  id: string
  name: string
  avatar?: string
  role?: string
}

type TypeChangeEvent = {
  type: 'type_changed'
  performerName: string
  performerAvatar?: string
  typeName: string
  createdAt: string
}

type AssignmentEvent = {
  type: string
  performerName?: string
  performerAvatar?: string
  assignerName?: string
  assignedName?: string
  fromName?: string
  newStatus?: string
  performerType?: string
  createdAt: string
}

type Props = {
  ticketId: string
  currentType: string
  currentStatus: string
  assignedStaff?: StaffMember | null
  pendingStaff?: StaffMember | null
  staffList: { id: string; label: string; subtitle?: string }[]
  onAssignmentChange?: (events?: AssignmentEvent[], statusChange?: string) => void
  onTypeChange?: (type: string, event?: TypeChangeEvent) => void
  onStatusChange?: (status: string) => void
  isStaff?: boolean
  currentUserId?: string
}

const statusOptions = [
  'Open',
  'In Progress',
  'Pending Tenant',
  'Resolved',
  'Closed'
]

export default function TicketSidebar({
  ticketId,
  currentType,
  currentStatus,
  assignedStaff,
  pendingStaff,
  staffList,
  onAssignmentChange,
  onTypeChange,
  onStatusChange,
  isStaff = false,
  currentUserId
}: Props) {
  const [typeLoading, setTypeLoading] = useState(false)
  const [pendingType, setPendingType] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState(currentType)

  // Check if ticket is resolved or closed
  const isTicketClosed = currentStatus === 'Resolved' || currentStatus === 'Closed'

  const handleTypeSelect = (newType: string) => {
    if (!newType || newType === currentType) return
    setSelectedType(newType)
    setPendingType(newType)
  }

  const handleConfirmTypeChange = async () => {
    if (!pendingType) return

    setTypeLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: pendingType })
      })

      if (response.ok) {
        const data = await response.json()
        FeedbackToasts.updated('Ticket type', `Type changed to ${pendingType}`)
        onTypeChange?.(pendingType, data.event)
      } else {
        const data = await response.json()
        FeedbackToasts.updateFailed('ticket type', data.error)
        // Reset on error
        setSelectedType(currentType)
      }
    } catch (error) {
      console.error('Error updating type:', error)
      FeedbackToasts.updateFailed('ticket type')
      // Reset on error
      setSelectedType(currentType)
    } finally {
      setTypeLoading(false)
      setPendingType(null)
    }
  }

  const handleCancelTypeChange = () => {
    setPendingType(null)
    setSelectedType(currentType)
  }

  return (
    <div className='w-[260px] shrink-0'>
      <div className='sticky top-6 space-y-6'>
        {/* Staff Assigned - Only visible to staff */}
        {isStaff && (
          <StaffAssignedSection
            ticketId={ticketId}
            assignedStaff={assignedStaff}
            pendingStaff={pendingStaff}
            staffList={staffList}
            onAssignmentChange={onAssignmentChange}
            disabled={isTicketClosed}
            currentUserId={currentUserId}
          />
        )}

        {/* Type */}
        <div className='pb-5 border-b border-(--border-light)'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
            Type
          </span>
          <Select
            label='Type'
            items={ticketTypes}
            placeholder='Select type'
            value={selectedType}
            className='w-full'
            onChange={handleTypeSelect}
            disabled={!isStaff || isTicketClosed || typeLoading || !!pendingType}
          />
          {/* Confirm type change UI */}
          {pendingType && (
            <div className='mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
              <p className='texts-body-small text-(--text-secondary) mb-2'>
                Change type to{' '}
                <span className='texts-body-small-medium text-(--text-primary)'>
                  {pendingType}
                </span>
                ?
              </p>
              <div className='flex gap-2'>
                <button
                  onClick={handleConfirmTypeChange}
                  disabled={typeLoading}
                  className='flex-1 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                >
                  {typeLoading ? 'Saving...' : 'Confirm'}
                </button>
                <button
                  onClick={handleCancelTypeChange}
                  disabled={typeLoading}
                  className='flex-1 px-3 py-1.5 bg-white border border-(--border-default) text-(--text-primary) texts-body-small-medium rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
            Status
          </span>
          <Select
            label='Status'
            items={statusOptions}
            placeholder='Select status'
            defaultValue={currentStatus}
            className='w-full'
            onChange={onStatusChange}
            disabled={!isStaff}
          />
        </div>
      </div>
    </div>
  )
}
