'use client'

import { useTask } from '@/contexts/tasks-context'
import TaskTimeline from '@/components/task-ui/task-timeline'
import TaskSidebar from '@/components/task-ui/task-sidebar'
import FlowTaskSidebar from '@/components/task-ui/flow-task-sidebar'
import { PendingAssignmentBanner } from '@/components/task-ui/task-actions'
import AddCommentSection from '@/components/task-ui/add-comment-section'
import {
  CompleteInspectionDialog,
  CompletePreparationDialog,
  SubmitRefundDecisionDialog,
  ReviewRefundDialog
} from '@/components/task-ui/dialogs'
import {
  getPriorityColor,
  getStatusColor,
  formatDate
} from '@/components/task-ui/types'
import { cn } from '@/lib/utils'

export default function TaskDetailsPage () {
  const {
    // Core state
    task,
    taskId,
    staffList,
    currentStaff,
    actionLoading,

    // Computed values
    isFlowTask,
    hasPendingForMe,

    // Core task handlers
    handleTypeChange,
    handlePriorityChange,
    handleAssign,
    handleAcceptAssignment,
    handleRejectAssignment,
    handleUnassign,
    handleCancelAssignment,
    handleResolve,
    handleCommentAdded,

    // Due date handlers
    handleDueDateSet,
    handleDueDateChange,
    handleDueDateRemove,

    // Flow task handlers
    handleCompleteInspection,
    handleCompletePreparation,
    handleSubmitRefundDecision,
    handleReviewRefund,

    // Dialog states
    showInspectionDialog,
    setShowInspectionDialog,
    showPreparationDialog,
    setShowPreparationDialog,
    showRefundDecisionDialog,
    setShowRefundDecisionDialog,
    showReviewRefundDialog,
    setShowReviewRefundDialog
  } = useTask()

  // Task and currentStaff are guaranteed by layout, but TypeScript doesn't know
  if (!task || !currentStaff) return null

  const flowInfo = task.flowInfo

  return (
    <>
      {/* Header */}
      <div className='mb-2'>
        <h1 className='texts-heading-h2 text-(--text-primary)'>
          {task.title}{' '}
          <span className='text-(--text-secondary) font-normal'>
            #{task.referenceId}
          </span>
        </h1>
      </div>

      {/* Status Badge & Info */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-6 sm:mb-8'>
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full texts-body-small-medium w-fit',
            getStatusColor(task.status)
          )}
        >
          {task.status}
        </div>
        <div className='flex items-center gap-2'>
          <span
            className={cn(
              'px-2 py-0.5 rounded texts-label-small',
              getPriorityColor(task.priority)
            )}
          >
            {task.priority}
          </span>
          <span className='text-(--text-muted)'>•</span>
          <span className='texts-label-small bg-purple-50 text-purple-600 px-2 py-0.5 rounded'>
            {task.type}
          </span>
        </div>
        <span className='texts-body-small sm:texts-body-medium text-(--text-secondary)'>
          <span className='texts-body-small-medium sm:texts-body-medium-medium text-(--text-primary)'>
            {task.createdByName}
          </span>{' '}
          created this task on {formatDate(task.createdAt)}
        </span>
      </div>

      {/* Pending Assignment Banner */}
      {hasPendingForMe && task.pendingAssignment && (
        <PendingAssignmentBanner
          assignerName={task.pendingAssignment.assignerName}
          assignerAvatar={task.pendingAssignment.assignerAvatar}
          onAccept={handleAcceptAssignment}
          onReject={handleRejectAssignment}
          actionLoading={actionLoading}
        />
      )}

      {/* Main Content */}
      <div className='flex flex-col lg:flex-row gap-6 lg:gap-10'>
        {/* Timeline */}
        <div className='flex-1'>
          <TaskTimeline events={task.timeline} />

          {/* Add Comment Section */}
          <AddCommentSection
            currentUserName={currentStaff.name}
            currentUserAvatar={currentStaff.avatar}
            taskId={taskId}
            disabled={task.status === 'Resolved'}
            onCommentAdded={handleCommentAdded}
          />
        </div>

        {/* Sidebar - Use flow sidebar for flow tasks */}
        {isFlowTask && flowInfo ? (
          <FlowTaskSidebar
            task={task}
            staffList={staffList}
            currentStaff={currentStaff}
            flowInfo={flowInfo}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
            onCancelAssignment={handleCancelAssignment}
            onCompleteInspection={() => setShowInspectionDialog(true)}
            onCompletePreparation={() => setShowPreparationDialog(true)}
            onSubmitRefundDecision={() => setShowRefundDecisionDialog(true)}
            onReviewRefund={() => setShowReviewRefundDialog(true)}
            actionLoading={actionLoading}
          />
        ) : (
          <TaskSidebar
            task={task}
            staffList={staffList}
            currentStaff={currentStaff}
            onTypeChange={handleTypeChange}
            onPriorityChange={handlePriorityChange}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
            onCancelAssignment={handleCancelAssignment}
            onResolve={handleResolve}
            onDueDateSet={handleDueDateSet}
            onDueDateChange={handleDueDateChange}
            onDueDateRemove={handleDueDateRemove}
            actionLoading={actionLoading}
          />
        )}
      </div>

      {/* Flow Task Dialogs */}
      {isFlowTask && (
        <>
          {/* Complete Inspection Dialog */}
          <CompleteInspectionDialog
            open={showInspectionDialog}
            onOpenChange={setShowInspectionDialog}
            onSubmit={handleCompleteInspection}
            loading={actionLoading === 'completing_inspection'}
          />

          {/* Complete Preparation Dialog */}
          <CompletePreparationDialog
            open={showPreparationDialog}
            onOpenChange={setShowPreparationDialog}
            onSubmit={handleCompletePreparation}
            loading={actionLoading === 'completing_preparation'}
            taskTitle={task.title}
          />

          {/* Submit Refund Decision Dialog */}
          <SubmitRefundDecisionDialog
            open={showRefundDecisionDialog}
            onOpenChange={setShowRefundDecisionDialog}
            onSubmit={handleSubmitRefundDecision}
            loading={actionLoading === 'submitting_refund_decision'}
            depositAmount={flowInfo?.leaseInfo?.depositAmount || 0}
            isResubmit={task.status === 'Needs Modification'}
          />

          {/* Review Refund Dialog - needs refund decision data */}
          {flowInfo?.leaseInfo && (
            <ReviewRefundDialog
              open={showReviewRefundDialog}
              onOpenChange={setShowReviewRefundDialog}
              onSubmit={handleReviewRefund}
              loading={actionLoading === 'reviewing_refund'}
              depositAmount={flowInfo.leaseInfo.depositAmount}
              refundDecision={{
                decision: 'full',
                originalDeposit: flowInfo.leaseInfo.depositAmount,
                charges: [],
                totalCharges: 0,
                finalRefundAmount: flowInfo.leaseInfo.depositAmount
              }}
              submitterName={task.createdByName}
            />
          )}
        </>
      )}
    </>
  )
}