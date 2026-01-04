'use client'

import { Calendar, Building2, DoorOpen, MapPin, Home } from 'lucide-react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import TaskStaffAssignedSection from './task-staff-assigned-section'
import type { TaskDetail, StaffMember, TimelineEvent, FlowTaskType } from './types'
import { cn } from '@/lib/utils'
import { getStatusColor, formatDateTime } from './types'
import { useEffect } from 'react'

// Format currency for Malaysia
const formatCurrency = (amount: number): string => {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Flow-specific info types
type FlowLeaseInfo = {
  id: string
  depositAmount: number
  propertyCode?: string
  roomTitle?: string
  tenantName: string
}

type FlowInfo = {
  flowInstanceId: string
  flowType: string
  flowStatus: 'In Progress' | 'Completed'
  relatedTasks: any[]
  leaseInfo?: FlowLeaseInfo
}

type Props = {
  task: TaskDetail
  staffList: StaffMember[]
  currentStaff: StaffMember
  flowInfo: FlowInfo
  onAssign: (staffId: string, isSelfAssign: boolean) => void
  onUnassign: (reason: string) => void
  onCancelAssignment: (reason: string) => void
  // Flow-specific action handlers
  onCompleteInspection?: () => void
  onCompletePreparation?: () => void
  onSubmitRefundDecision?: () => void
  onReviewRefund?: () => void
  actionLoading?: string | null
}

export default function FlowTaskSidebar({
  task,
  staffList,
  currentStaff,
  flowInfo,
  onAssign,
  onUnassign,
  onCancelAssignment,
  onCompleteInspection,
  onCompletePreparation,
  onSubmitRefundDecision,
  onReviewRefund,
  actionLoading = null
}: Props) {
  const isResolved = task.status === 'Resolved'
  const isNeedsModification = task.status === 'Needs Modification'
  const isAssignee = task.assignment?.staffId === currentStaff.id
  const isInProgress = task.status === 'In Progress'

  // Determine task type for showing appropriate action
  const taskType = task.type as FlowTaskType

  // Get readable type name
  const getTypeDisplayName = (type: FlowTaskType): string => {
    const typeMap: Record<FlowTaskType, string> = {
      Inspection: 'Inspection',
      Preparation: 'Preparation',
      'Refund_Request': 'Refund Request',
      'Refund_Finalization': 'Refund Finalization'
    }
    return typeMap[type] || type
  }


  useEffect(() => {
    console.log("Typeeeeeee: ", taskType);
  }, [taskType])

  // Can perform action: only assignee when In Progress (or Needs Modification for refund request)
  const canAct = isAssignee && (isInProgress || (isNeedsModification && taskType === 'Refund_Request'))

  return (
    <div className='w-full lg:w-[260px] lg:shrink-0 order-first lg:order-last'>
      <div className='lg:sticky lg:top-6 space-y-4 lg:space-y-6 p-4 lg:p-0 bg-(--background-secondary) lg:bg-transparent rounded-xl lg:rounded-none mb-4 lg:mb-0'>
        {/* Staff Assigned Section */}
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

        {/* Type (Read-only for flow tasks) */}
        <div className='pb-5 border-b border-(--border-light)'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
            Type
          </span>
          <div className='px-3 py-2 rounded-lg bg-(--background-secondary) border border-(--border-default)'>
            <span className='texts-body-small text-(--text-primary)'>
              {getTypeDisplayName(taskType)}
            </span>
          </div>
          <p className='texts-label-small text-(--text-muted) mt-1'>
            Flow task types cannot be changed
          </p>
        </div>

        {/* Priority (Read-only for flow tasks) */}
        <div className='pb-5 border-b border-(--border-light)'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
            Priority
          </span>
          <div className='px-3 py-2 rounded-lg bg-(--background-secondary) border border-(--border-default)'>
            <span className='texts-body-small text-(--text-primary)'>
              {task.priority}
            </span>
          </div>
        </div>

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

          {/* Flow-specific Actions */}
          <div className='space-y-2'>
            {/* Inspection Task Actions */}
            {taskType === 'Inspection' && canAct && onCompleteInspection && (
              <button
                onClick={onCompleteInspection}
                className='w-full py-2.5 px-4 bg-green-600 text-white texts-body-small-medium rounded-lg hover:bg-green-700 transition-colors'
              >
                Complete Inspection
              </button>
            )}

            {/* Preparation Task Actions */}
            {taskType === 'Preparation' && canAct && onCompletePreparation && (
              <button
                onClick={onCompletePreparation}
                className='w-full py-2.5 px-4 bg-green-600 text-white texts-body-small-medium rounded-lg hover:bg-green-700 transition-colors'
              >
                Complete Preparation
              </button>
            )}

            {/* Refund Request Actions */}
            {taskType === 'Refund_Request' && canAct && onSubmitRefundDecision && (
              <button
                onClick={onSubmitRefundDecision}
                className='w-full py-2.5 px-4 bg-blue-600 text-white texts-body-small-medium rounded-lg hover:bg-blue-700 transition-colors'
              >
                {isNeedsModification ? 'Resubmit Refund Decision' : 'Submit Refund Decision'}
              </button>
            )}

            {/* Refund Finalization Actions */}
            {taskType === 'Refund_Finalization' && canAct && onReviewRefund && (
              <button
                onClick={onReviewRefund}
                className='w-full py-2.5 px-4 bg-blue-600 text-white texts-body-small-medium rounded-lg hover:bg-blue-700 transition-colors'
              >
                Review & Finalize
              </button>
            )}

            {/* Info when task is resolved */}
            {isResolved && (
              <p className='texts-body-small text-(--text-secondary)'>
                This task has been completed.
              </p>
            )}

            {/* Info when needs modification but not assignee */}
            {isNeedsModification && !isAssignee && (
              <p className='texts-body-small text-amber-600'>
                This task requires modification by the assignee.
              </p>
            )}
          </div>
        </div>

        {/* Deposit Info (for refund tasks) */}
        {(taskType === 'Refund_Request' || taskType === 'Refund_Finalization') && flowInfo.leaseInfo && (
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Refundable Amount
            </span>
            <div className='p-3 rounded-lg bg-blue-50 border border-blue-200'>
              <p className='texts-body-large-medium text-blue-700'>
                {formatCurrency(flowInfo.leaseInfo.depositAmount)}
              </p>
              <p className='texts-label-small text-blue-600 mt-1'>
                Original deposit from lease
              </p>
            </div>
          </div>
        )}

        {/* Due Date (Read-only display if exists) */}
        {task.dueDate && (
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Due Date
            </span>
            <div className='flex items-center gap-2 p-2 rounded-lg bg-(--background-secondary) border border-(--border-default)'>
              <Calendar size={16} className='text-(--text-secondary)' />
              <span className='texts-body-small text-(--text-primary)'>
                {formatDateTime(task.dueDate)}
              </span>
            </div>
          </div>
        )}

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

        {/* Tenant Info (for flow tasks) */}
        {flowInfo.leaseInfo && (
          <div className='pb-5 border-b border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Tenant
            </span>
            <div className='flex items-center gap-3'>
              <UserAvatar
                name={flowInfo.leaseInfo.tenantName}
                size={32}
              />
              <span className='texts-body-small-medium text-(--text-primary)'>
                {flowInfo.leaseInfo.tenantName}
              </span>
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
