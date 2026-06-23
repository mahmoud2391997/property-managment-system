'use client'

import { useState, useEffect } from 'react'
import Select from '@/components/costume-ui/select'
import { Calendar, Building2, DoorOpen, MapPin, Home, Pencil, X, Loader2 } from 'lucide-react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import TaskStaffAssignedSection from './task-staff-assigned-section'
import { ResolveTaskDialog } from './task-actions'
import type { TaskDetail, StaffMember, TaskType, PriorityLevel, TimelineEvent } from './types'
import { TASK_TYPES, REGULAR_TASK_TYPES, PRIORITY_LEVELS, getStatusColor, formatDateTime } from './types'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'

type Props = {
  task: TaskDetail
  staffList: StaffMember[]
  currentStaff: StaffMember
  onTypeChange: (newType: TaskType, event: TimelineEvent) => void
  onPriorityChange: (newPriority: PriorityLevel, event: TimelineEvent) => void
  onAssign: (staffId: string, isSelfAssign: boolean) => void
  onUnassign: (reason: string) => void
  onCancelAssignment: (reason: string) => void
  onResolve: (report: string, attachmentFile?: File) => Promise<void>
  onDueDateSet: (dueDate: string, event: TimelineEvent) => void
  onDueDateChange: (newDueDate: string, reason: string, event: TimelineEvent) => void
  onDueDateRemove: (reason: string, event: TimelineEvent) => void
  actionLoading?: string | null
}

export default function TaskSidebar({
  task,
  staffList,
  currentStaff,
  onTypeChange,
  onPriorityChange,
  onAssign,
  onUnassign,
  onCancelAssignment,
  onResolve,
  onDueDateSet,
  onDueDateChange,
  onDueDateRemove,
  actionLoading = null
}: Props) {
  const [pendingType, setPendingType] = useState<TaskType | null>(null)
  const [selectedType, setSelectedType] = useState<TaskType>(task.type)
  const [pendingPriority, setPendingPriority] = useState<PriorityLevel | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>(task.priority)

  const { can } = usePermissions()

  // Derive loading states from actionLoading prop
  const isTypeLoading = actionLoading === 'type'
  const isPriorityLoading = actionLoading === 'priority'
  const isResolving = actionLoading === 'resolving'
  const isDueDateLoading = actionLoading === 'due_date'

  // Reset pending states when task props update (after successful API call)
  useEffect(() => {
    if (pendingType && task.type === pendingType) {
      setPendingType(null)
      setSelectedType(task.type)
    }
  }, [task.type, pendingType])

  useEffect(() => {
    if (pendingPriority && task.priority === pendingPriority) {
      setPendingPriority(null)
      setSelectedPriority(task.priority)
    }
  }, [task.priority, pendingPriority])

  // Reset due date forms when task.dueDate changes
  useEffect(() => {
    setShowDueDateEdit(false)
    setShowDueDateRemove(false)
    setShowAddDueDate(false)
    setNewDueDate('')
    setDueDateReason('')
  }, [task.dueDate])

  // Due date state
  const [showDueDateEdit, setShowDueDateEdit] = useState(false)
  const [showDueDateRemove, setShowDueDateRemove] = useState(false)
  const [newDueDate, setNewDueDate] = useState('')
  const [dueDateReason, setDueDateReason] = useState('')
  const [showAddDueDate, setShowAddDueDate] = useState(false)

  const isResolved = task.status === 'Resolved'
  const isAssignee = task.assignment?.staffId === currentStaff.id
  const isInProgress = task.status === 'In Progress'

  // Can resolve: only with permission, assignee when In Progress
  const canResolve = can('tasks.complete') && isAssignee && isInProgress

  // Type change handlers
  const handleTypeSelect = (newType: string) => {
    if (!newType || newType === task.type) return
    setSelectedType(newType as TaskType)
    setPendingType(newType as TaskType)
  }

  const handleConfirmTypeChange = () => {
    if (!pendingType) return
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      type: 'type_changed',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      timestamp: new Date().toISOString(),
      oldValue: task.type,
      newValue: pendingType
    }
    onTypeChange(pendingType, event)
    // Don't clear pendingType here - it will be cleared when task.type updates via props
  }

  const handleCancelTypeChange = () => {
    setPendingType(null)
    setSelectedType(task.type)
  }

  // Priority change handlers
  const handlePrioritySelect = (newPriority: string) => {
    if (!newPriority || newPriority === task.priority) return
    setSelectedPriority(newPriority as PriorityLevel)
    setPendingPriority(newPriority as PriorityLevel)
  }

  const handleConfirmPriorityChange = () => {
    if (!pendingPriority) return
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      type: 'priority_changed',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      timestamp: new Date().toISOString(),
      oldValue: task.priority,
      newValue: pendingPriority
    }
    onPriorityChange(pendingPriority, event)
    // Don't clear pendingPriority here - it will be cleared when task.priority updates via props
  }

  const handleCancelPriorityChange = () => {
    setPendingPriority(null)
    setSelectedPriority(task.priority)
  }

  // Due date handlers
  const handleSetDueDate = () => {
    if (!newDueDate) return
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      type: 'due_date_set',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      timestamp: new Date().toISOString(),
      dueDate: newDueDate
    }
    onDueDateSet(newDueDate, event)
    // Form will be reset when task.dueDate updates via props
  }

  const handleChangeDueDate = () => {
    if (!newDueDate || !dueDateReason.trim()) return
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      type: 'due_date_changed',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      timestamp: new Date().toISOString(),
      oldDueDate: task.dueDate,
      dueDate: newDueDate,
      dueDateReason: dueDateReason.trim()
    }
    onDueDateChange(newDueDate, dueDateReason.trim(), event)
    // Form will be reset when task.dueDate updates via props
  }

  const handleRemoveDueDate = () => {
    if (!dueDateReason.trim()) return
    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      type: 'due_date_removed',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      timestamp: new Date().toISOString(),
      oldDueDate: task.dueDate,
      dueDateReason: dueDateReason.trim()
    }
    onDueDateRemove(dueDateReason.trim(), event)
    // Form will be reset when task.dueDate updates via props
  }

  const handleCancelDueDateEdit = () => {
    setShowDueDateEdit(false)
    setNewDueDate('')
    setDueDateReason('')
  }

  const handleCancelDueDateRemove = () => {
    setShowDueDateRemove(false)
    setDueDateReason('')
  }

  const handleCancelAddDueDate = () => {
    setShowAddDueDate(false)
    setNewDueDate('')
  }

  // Only show regular task types (not flow types) in the type selector
  const typeItems = REGULAR_TASK_TYPES.map(t => ({ value: t, label: t }))
  const priorityItems = PRIORITY_LEVELS.map(p => ({ value: p, label: p }))

  return (
    <div className='w-full lg:w-[260px] lg:shrink-0 order-first lg:order-last'>
      <div className='lg:sticky lg:top-6 space-y-4 lg:space-y-6 p-4 lg:p-0 bg-(--background-secondary) lg:bg-transparent rounded-xl lg:rounded-none mb-4 lg:mb-0'>
        {/* Staff Assigned Section */}
        <PermissionGate permission='tasks.assign' fallback={
          <TaskStaffAssignedSection
            assignedStaff={task.assignment ? {
              id: task.assignment.staffId,
              name: task.assignment.staffName,
              avatar: task.assignment.staffAvatar
            } : null}
            pendingStaff={task.pendingAssignment ? {
              id: task.pendingAssignment.staffId,
              name: task.pendingAssignment.staffName,
              avatar: task.pendingAssignment.staffAvatar
            } : null}
            staffList={staffList}
            currentStaffId={currentStaff.id}
            onAssign={onAssign}
            onUnassign={onUnassign}
            onCancelAssignment={onCancelAssignment}
            disabled={true}
            actionLoading={actionLoading}
          />
        }>
          <TaskStaffAssignedSection
            assignedStaff={task.assignment ? {
              id: task.assignment.staffId,
              name: task.assignment.staffName,
              avatar: task.assignment.staffAvatar
            } : null}
            pendingStaff={task.pendingAssignment ? {
              id: task.pendingAssignment.staffId,
              name: task.pendingAssignment.staffName,
              avatar: task.pendingAssignment.staffAvatar
            } : null}
            staffList={staffList}
            currentStaffId={currentStaff.id}
            onAssign={onAssign}
            onUnassign={onUnassign}
            onCancelAssignment={onCancelAssignment}
            disabled={isResolved}
            actionLoading={actionLoading}
          />
        </PermissionGate>

        {/* Type */}
        <PermissionGate permission='tasks.update' fallback={
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Type
            </span>
            <div className='texts-body-medium-medium text-(--text-primary)'>
              {task.type}
            </div>
          </div>
        }>
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Type
            </span>
            <Select
              label='Type'
              items={typeItems}
              placeholder='Select type'
              value={selectedType}
              className='w-full'
              onChange={handleTypeSelect}
              disabled={isResolved || !!pendingType}
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
                    disabled={isTypeLoading}
                    className='flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                  >
                    {isTypeLoading ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : null}
                    {isTypeLoading ? 'Updating...' : 'Confirm'}
                  </button>
                  <button
                    onClick={handleCancelTypeChange}
                    disabled={isTypeLoading}
                    className='flex-1 px-3 py-1.5 bg-white border border-(--border-default) text-(--text-primary) texts-body-small-medium rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </PermissionGate>

        {/* Priority */}
        <PermissionGate permission='tasks.update' fallback={
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Priority
            </span>
            <div className='texts-body-medium-medium text-(--text-primary)'>
              {task.priority}
            </div>
          </div>
        }>
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Priority
            </span>
            <Select
              label='Priority'
              items={priorityItems}
              placeholder='Select priority'
              value={selectedPriority}
              className='w-full'
              onChange={handlePrioritySelect}
              disabled={isResolved || !!pendingPriority}
            />
            {/* Confirm priority change UI */}
            {pendingPriority && (
              <div className='mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                <p className='texts-body-small text-(--text-secondary) mb-2'>
                  Change priority to{' '}
                  <span className='texts-body-small-medium text-(--text-primary)'>
                    {pendingPriority}
                  </span>
                  ?
                </p>
                <div className='flex gap-2'>
                  <button
                    onClick={handleConfirmPriorityChange}
                    disabled={isPriorityLoading}
                    className='flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                  >
                    {isPriorityLoading ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : null}
                    {isPriorityLoading ? 'Updating...' : 'Confirm'}
                  </button>
                  <button
                    onClick={handleCancelPriorityChange}
                    disabled={isPriorityLoading}
                    className='flex-1 px-3 py-1.5 bg-white border border-(--border-default) text-(--text-primary) texts-body-small-medium rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </PermissionGate>

        {/* Status Section */}
        <div className='pb-5 border-b border-(--border-light)'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
            Status
          </span>

          {/* Current status display */}
          <div className='mb-4'>
            <span
              className={cn(
                'inline-block px-3 py-1 rounded-full texts-body-small-medium',
                getStatusColor(task.status)
              )}
            >
              {task.status}
            </span>
          </div>

          {/* Status Actions */}
          <div className='space-y-2'>
            {/* Resolve Task - Only for assigned staff when In Progress */}
            {canResolve && (
              <ResolveTaskDialog
                onSubmit={onResolve}
                loading={isResolving}
                disabled={isResolving}
              />
            )}

            {/* Info when task is resolved */}
            {isResolved && (
              <p className='texts-body-small text-(--text-secondary)'>
                This task has been resolved and cannot be modified.
              </p>
            )}
          </div>
        </div>

        {/* Due Date */}
        <PermissionGate permission='tasks.update' fallback={
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Due Date
            </span>
            {task.dueDate ? (
              <div className='flex items-center gap-2 p-2 rounded-lg bg-(--background-secondary) border border-(--border-default)'>
                <Calendar size={16} className='text-(--text-secondary)' />
                <span className='texts-body-small text-(--text-primary)'>
                  {formatDateTime(task.dueDate)}
                </span>
              </div>
            ) : (
              <p className='texts-body-small text-(--text-secondary)'>No due date set</p>
            )}
          </div>
        }>
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Due Date
            </span>

            {/* Has due date - show it with edit/remove options */}
            {task.dueDate && !showDueDateEdit && !showDueDateRemove && (
              <div className='flex items-center justify-between p-2 rounded-lg bg-(--background-secondary) border border-(--border-default)'>
                <div className='flex items-center gap-2'>
                  <Calendar size={16} className='text-(--text-secondary)' />
                  <span className='texts-body-small text-(--text-primary)'>
                    {formatDateTime(task.dueDate)}
                  </span>
                </div>
                {!isResolved && (
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => setShowDueDateEdit(true)}
                      className='p-1.5 rounded-md hover:bg-blue-50 text-(--text-muted) hover:text-blue-500 transition-colors'
                      title='Change due date'
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setShowDueDateRemove(true)}
                      className='p-1.5 rounded-md hover:bg-red-50 text-(--text-muted) hover:text-red-500 transition-colors'
                      title='Remove due date'
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

          {/* Edit due date form */}
          {task.dueDate && showDueDateEdit && (
            <div className='p-3 rounded-lg bg-blue-50 border border-blue-200'>
              <p className='texts-body-small text-(--text-primary) mb-3'>
                Change due date
              </p>
              <input
                type='datetime-local'
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className='w-full p-2 mb-3 texts-body-small bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300'
              />
              <textarea
                value={dueDateReason}
                onChange={e => setDueDateReason(e.target.value)}
                placeholder='Reason for changing due date...'
                className='w-full p-2 mb-3 texts-body-small bg-white border border-blue-200 rounded-md resize-none min-h-[60px] focus:outline-none focus:ring-1 focus:ring-blue-300'
              />
              <div className='flex items-center gap-2'>
                <button
                  onClick={handleChangeDueDate}
                  disabled={!newDueDate || !dueDateReason.trim() || isDueDateLoading}
                  className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                >
                  {isDueDateLoading ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : null}
                  {isDueDateLoading ? 'Changing...' : 'Change'}
                </button>
                <button
                  onClick={handleCancelDueDateEdit}
                  disabled={isDueDateLoading}
                  className='px-3 py-1.5 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Remove due date confirmation */}
          {task.dueDate && showDueDateRemove && (
            <div className='p-3 rounded-lg bg-red-50 border border-red-200'>
              <p className='texts-body-small text-(--text-primary) mb-3'>
                Remove due date?
              </p>
              <textarea
                value={dueDateReason}
                onChange={e => setDueDateReason(e.target.value)}
                placeholder='Reason for removing due date...'
                className='w-full p-2 mb-3 texts-body-small bg-white border border-red-200 rounded-md resize-none min-h-[60px] focus:outline-none focus:ring-1 focus:ring-red-300'
                disabled={isDueDateLoading}
              />
              <div className='flex items-center gap-2'>
                <button
                  onClick={handleRemoveDueDate}
                  disabled={!dueDateReason.trim() || isDueDateLoading}
                  className='flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white texts-body-small-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50'
                >
                  {isDueDateLoading ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : null}
                  {isDueDateLoading ? 'Removing...' : 'Remove'}
                </button>
                <button
                  onClick={handleCancelDueDateRemove}
                  disabled={isDueDateLoading}
                  className='px-3 py-1.5 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-red-100 transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* No due date - show add button */}
          {!task.dueDate && !showAddDueDate && !isResolved && (
            <button
              onClick={() => setShowAddDueDate(true)}
              className='w-full p-2 texts-body-small text-(--text-secondary) border border-dashed border-(--border-default) rounded-lg hover:border-(--border-strong) hover:text-(--text-primary) transition-colors'
            >
              + Add due date
            </button>
          )}

          {/* Add due date form */}
          {!task.dueDate && showAddDueDate && (
            <div className='p-3 rounded-lg bg-blue-50 border border-blue-200'>
              <p className='texts-body-small text-(--text-primary) mb-3'>
                Set due date
              </p>
              <input
                type='datetime-local'
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className='w-full p-2 mb-3 texts-body-small bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300'
              />
              <div className='flex items-center gap-2'>
                <button
                  onClick={handleSetDueDate}
                  disabled={!newDueDate || isDueDateLoading}
                  className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                >
                  {isDueDateLoading ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : null}
                  {isDueDateLoading ? 'Setting...' : 'Set'}
                </button>
                <button
                  onClick={handleCancelAddDueDate}
                  disabled={isDueDateLoading}
                  className='px-3 py-1.5 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Resolved state - no due date */}
          {!task.dueDate && isResolved && (
            <p className='texts-body-small text-(--text-secondary)'>No due date set</p>
          )}
        </div>
        </PermissionGate>

        {/* Location Info */}
        {task.location && (
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Location
            </span>
            <div className='space-y-2'>
              {/* Row 1: Project Name */}
              {task.location.projectName && (
                <div className='flex items-center gap-2'>
                  <Building2 size={16} className='text-(--text-secondary)' />
                  <span className='texts-body-small text-(--text-primary)'>
                    {task.location.projectName}
                  </span>
                </div>
              )}
              {/* Row 2: Location (city, state, Malaysia) */}
              {(task.location.propertyCity || task.location.projectState) && (
                <div className='flex items-center gap-2'>
                  <MapPin size={16} className='text-(--text-secondary)' />
                  <span className='texts-body-small text-(--text-primary)'>
                    {[task.location.propertyCity, task.location.projectState, 'Malaysia']
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
              {/* Row 3: Property or Property (Room) */}
              {task.location.propertyCode && (
                <div className='flex items-center gap-2'>
                  {task.location.roomId ? (
                    <DoorOpen size={16} className='text-(--text-secondary)' />
                  ) : (
                    <Home size={16} className='text-(--text-secondary)' />
                  )}
                  <span className='texts-body-small text-(--text-primary)'>
                    {task.location.propertyCode}
                    {task.location.roomTitle && ` (${task.location.roomTitle})`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Created Info */}
        <div>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
            Created By
          </span>
          <div className='flex items-center gap-3'>
            <UserAvatar
              name={task.createdByName}
              imgSrc={task.createdByAvatar}
              size={32}
            />
            <div>
              <p className='texts-body-small-medium text-(--text-primary)'>{task.createdByName}</p>
              <p className='texts-label-small text-(--text-secondary)'>
                {formatDateTime(task.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
