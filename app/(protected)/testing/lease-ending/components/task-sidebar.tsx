'use client'

import { useState } from 'react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import Combobox from '@/components/costume-ui/combobox'
import Button from '@/components/costume-ui/button'
import { X, Clock, CheckCircle2 } from 'lucide-react'
import {
  StaffMember,
  LeaseEndingTask,
  PreparationTask,
  Assignment,
  TaskStatus
} from '../types'
import { cn } from '@/lib/utils'
import {
  CloseTaskDialog,
  AssignStaffDialog,
  RefundDecisionDialog,
  ReviewRefundDialog
} from './task-actions'

type Props = {
  task: LeaseEndingTask | PreparationTask
  staffList: StaffMember[]
  currentStaff: StaffMember
  workflow: {
    depositAmount: number
    preparationTasks: PreparationTask[]
  }
  onAssign: (staffId: string, isSelfAssign: boolean) => void
  onCancelAssignment: () => void
  onUnassign: () => void
  onCloseTask: (
    finding: 'ready' | 'needs_preparation',
    report: string,
    preparationTasks?: { title: string; description: string }[]
  ) => void
  onRefundDecision?: (
    decision: 'full' | 'partial' | 'burn',
    charges: { id: string; description: string; amount: number }[],
    note: string
  ) => void
  onRefundApprove?: (report: string) => void
  onRefundReject?: (reason: string) => void
}

export default function TaskSidebar({
  task,
  staffList,
  currentStaff,
  workflow,
  onAssign,
  onCancelAssignment,
  onUnassign,
  onCloseTask,
  onRefundDecision,
  onRefundApprove,
  onRefundReject
}: Props) {
  const [loading, setLoading] = useState(false)

  const assignment = task.assignment
  const isAssigned = assignment?.status === 'accepted'
  const isPending = assignment?.status === 'pending'
  const isUnassigned = !assignment || assignment.status === 'cancelled' || assignment.status === 'rejected'

  const isCurrentUserAssigned = assignment?.assigneeId === currentStaff.id
  const isCurrentUserPending = isPending && assignment?.assigneeId === currentStaff.id
  const canCurrentUserCancel = isPending && assignment?.assignerId === currentStaff.id
  const canCurrentUserUnassign = isAssigned && !isCurrentUserAssigned

  const isTaskCompleted = task.status === 'completed'
  const isTaskInProgress = task.status === 'in_progress'

  const assignedStaff = isAssigned
    ? staffList.find(s => s.id === assignment?.assigneeId)
    : null
  const pendingStaff = isPending
    ? staffList.find(s => s.id === assignment?.assigneeId)
    : null

  const staffItems = staffList.map(s => ({
    id: s.id,
    label: s.name,
    subtitle: s.role,
    avatar: s.avatar
  }))

  const getStatusLabel = (status: TaskStatus) => {
    const labels: Record<TaskStatus, { text: string; color: string }> = {
      pending: { text: 'Pending', color: 'text-neutral-600 bg-neutral-100' },
      awaiting_response: { text: 'Awaiting Response', color: 'text-amber-600 bg-amber-100' },
      in_progress: { text: 'In Progress', color: 'text-blue-600 bg-blue-100' },
      completed: { text: 'Completed', color: 'text-green-600 bg-green-100' },
      revision_requested: { text: 'Revision Requested', color: 'text-red-600 bg-red-100' },
      cancelled: { text: 'Cancelled', color: 'text-neutral-600 bg-neutral-100' }
    }
    return labels[status] || labels.pending
  }

  const statusLabel = getStatusLabel(task.status)

  // Determine task type
  const isInspection = task.type === 'inspection'
  const isPreparation = task.type === 'preparation'
  const isRefundRequest = task.type === 'refund_request'
  const isRefundFinalization = task.type === 'refund_finalization'

  // Can close task (inspection or preparation)
  const canCloseTask = isCurrentUserAssigned && isTaskInProgress && (isInspection || isPreparation)

  // Can submit refund decision
  const leaseTask = task as LeaseEndingTask
  const canSubmitRefundDecision = isCurrentUserAssigned && isTaskInProgress && isRefundRequest

  // Can review refund
  const canReviewRefund = isCurrentUserAssigned && isTaskInProgress && isRefundFinalization

  return (
    <div className='w-full lg:w-[280px] lg:shrink-0 order-first lg:order-last'>
      <div className='lg:sticky lg:top-6 space-y-4 lg:space-y-6 p-4 lg:p-0 bg-(--background-secondary) lg:bg-transparent rounded-xl lg:rounded-none mb-4 lg:mb-0'>
        {/* Staff Assignment Section */}
        <div className='pb-5 border-b border-(--border-light)'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
            Assigned To
          </span>

          {/* Assigned State */}
          {isAssigned && assignedStaff && (
            <div className='flex items-center justify-between p-2 rounded-lg bg-white border border-(--border-default)'>
              <div className='flex items-center gap-3'>
                <UserAvatar
                  name={assignedStaff.name}
                  imgSrc={assignedStaff.avatar}
                  size={32}
                />
                <div>
                  <span className='texts-body-small-medium text-(--text-primary) block'>
                    {assignedStaff.name}
                  </span>
                  <span className='texts-label-small text-(--text-secondary)'>
                    {assignedStaff.role}
                  </span>
                </div>
              </div>
              {canCurrentUserUnassign && !isTaskCompleted && (
                <button
                  onClick={onUnassign}
                  disabled={loading}
                  className='p-1.5 rounded-md hover:bg-red-50 text-(--text-muted) hover:text-red-500 transition-colors disabled:opacity-50'
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Pending State */}
          {isPending && pendingStaff && (
            <div className='p-3 rounded-lg bg-amber-50 border border-amber-200'>
              <div className='flex items-center gap-2 mb-2'>
                <Clock size={14} className='text-amber-600' />
                <span className='texts-body-small-medium text-amber-700'>
                  Awaiting Response
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <UserAvatar
                    name={pendingStaff.name}
                    imgSrc={pendingStaff.avatar}
                    size={28}
                  />
                  <div>
                    <span className='texts-body-small-medium text-(--text-primary) block'>
                      {pendingStaff.name}
                    </span>
                    <span className='texts-caption-large text-(--text-secondary)'>
                      Request sent
                    </span>
                  </div>
                </div>
                {canCurrentUserCancel && (
                  <button
                    onClick={onCancelAssignment}
                    disabled={loading}
                    className='texts-body-small text-red-500 hover:text-red-600 hover:underline transition-colors disabled:opacity-50'
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Unassigned State */}
          {isUnassigned && !isTaskCompleted && (
            <AssignStaffDialog
              staffList={staffList}
              currentStaffId={currentStaff.id}
              onAssign={onAssign}
              loading={loading}
            />
          )}

          {isUnassigned && isTaskCompleted && (
            <p className='texts-body-small text-(--text-secondary)'>
              No assignment required
            </p>
          )}
        </div>

        {/* Status Section */}
        <div className='pb-5 border-b border-(--border-light)'>
          <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
            Status
          </span>
          <span className={cn('texts-body-small-medium px-3 py-1.5 rounded-full inline-block', statusLabel.color)}>
            {statusLabel.text}
          </span>
        </div>

        {/* Actions Section */}
        {!isTaskCompleted && (
          <div className='space-y-3'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block'>
              Actions
            </span>

            {/* Close Task (Inspection/Preparation) */}
            {canCloseTask && (
              <CloseTaskDialog
                taskType={isInspection ? 'inspection' : 'preparation'}
                onSubmit={onCloseTask}
                loading={loading}
              />
            )}

            {/* Refund Decision */}
            {canSubmitRefundDecision && onRefundDecision && (
              <RefundDecisionDialog
                originalDeposit={workflow.depositAmount}
                existingCharges={leaseTask.refundCharges || []}
                onSubmit={onRefundDecision}
                loading={loading}
              />
            )}

            {/* Review Refund */}
            {canReviewRefund && onRefundApprove && onRefundReject && (
              <ReviewRefundDialog
                refundAmount={leaseTask.finalRefundAmount || workflow.depositAmount}
                originalDeposit={workflow.depositAmount}
                charges={leaseTask.refundCharges || []}
                decision={leaseTask.refundDecision || 'full'}
                onApprove={onRefundApprove}
                onReject={onRefundReject}
                loading={loading}
              />
            )}

            {/* Message when not assigned */}
            {!isCurrentUserAssigned && !isUnassigned && (
              <p className='texts-body-small text-(--text-secondary)'>
                You must be assigned to this task to perform actions.
              </p>
            )}

            {isUnassigned && (
              <p className='texts-body-small text-(--text-secondary)'>
                Assign someone to this task to enable actions.
              </p>
            )}
          </div>
        )}

        {/* Completed Status */}
        {isTaskCompleted && (
          <div className='flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
            <CheckCircle2 size={18} className='text-green-600' />
            <span className='texts-body-small-medium text-green-700'>
              Task Completed
            </span>
          </div>
        )}

        {/* Related Preparation Tasks (for Inspection) */}
        {isInspection && workflow.preparationTasks.length > 0 && (
          <div className='pt-4 border-t border-(--border-light)'>
            <span className='texts-body-small-medium text-(--text-secondary) uppercase tracking-wide block mb-3'>
              Preparation Tasks
            </span>
            <div className='space-y-2'>
              {workflow.preparationTasks.map(prepTask => {
                const prepStatusLabel = getStatusLabel(prepTask.status)
                return (
                  <div
                    key={prepTask.id}
                    className='p-2 border border-(--border-default) rounded-lg bg-white'
                  >
                    <p className='texts-body-small-medium text-(--text-primary) mb-1'>
                      {prepTask.title}
                    </p>
                    <span className={cn('texts-label-small px-2 py-0.5 rounded-full', prepStatusLabel.color)}>
                      {prepStatusLabel.text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
