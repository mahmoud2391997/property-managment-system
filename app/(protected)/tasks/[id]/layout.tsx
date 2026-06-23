'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import {
  FeedbackToasts,
  showFeedbackToast
} from '@/components/costume-ui/feedback-toast'
import FlowTaskNavigation from '@/components/task-ui/flow-task-navigation'
import TaskDetailsSkeleton from '@/components/loading-ui/task-details-skeleton'
import { PermissionGuard } from '@/components/permission-guard'
import {
  TaskProvider,
  type TaskContextType,
  type InspectionSubmitData,
  type PreparationSubmitData,
  type RefundDecisionSubmitData,
  type RefundReviewSubmitData,
  type CommentData
} from '@/contexts/tasks-context'
import type {
  TaskDetail,
  StaffMember,
  TaskType,
  PriorityLevel
} from '@/components/task-ui/types'

export default function TaskDetailsLayout ({
  children
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const taskId = params.id as string

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Action loading states for UX
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Task and staff data
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null)

  // Flow dialog states
  const [showInspectionDialog, setShowInspectionDialog] = useState(false)
  const [showPreparationDialog, setShowPreparationDialog] = useState(false)
  const [showRefundDecisionDialog, setShowRefundDecisionDialog] = useState(false)
  const [showReviewRefundDialog, setShowReviewRefundDialog] = useState(false)

  // ============ Data Fetching ============

  const fetchTask = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch task')
      }
      const data = await response.json()
      setTask(data)
      if (data.currentStaff) {
        setCurrentStaff(data.currentStaff)
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching task:', err)
    }
  }, [taskId])

  const fetchStaffList = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks/staff')
      if (response.ok) {
        const data = await response.json()
        setStaffList(data)
      }
    } catch (err) {
      console.error('Error fetching staff list:', err)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      await Promise.all([fetchTask(), fetchStaffList()])
      setLoading(false)
    }
    loadData()
  }, [fetchTask, fetchStaffList])

  // ============ Computed Values ============

  const isFlowTask = task?.isFlowTask ?? false
  const flowInfo = task?.flowInfo
  const hasPendingForMe = task?.pendingAssignment?.staffId === currentStaff?.id

  // ============ Helper Functions ============

  const uploadAttachment = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'tasks')

    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload attachment')
    }

    const uploadData = await uploadResponse.json()
    return uploadData.url
  }

  const getFileNameFromUrl = (url: string): string => {
    try {
      const parts = url.split('/')
      return parts[parts.length - 1] || 'attachment'
    } catch {
      return 'attachment'
    }
  }

  // ============ Core Task Handlers ============

  const handleTypeChange = async (newType: TaskType) => {
    if (!task) return
    setActionLoading('type')
    try {
      const response = await fetch(`/api/tasks/${taskId}/type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update type')
      }
      const data = await response.json()
      setTask(prev =>
        prev
          ? {
              ...prev,
              type: newType,
              timeline: [...prev.timeline, data.event]
            }
          : null
      )
      FeedbackToasts.updated('Task type', `Type changed to ${newType}`)
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handlePriorityChange = async (newPriority: PriorityLevel) => {
    if (!task) return
    setActionLoading('priority')
    try {
      const response = await fetch(`/api/tasks/${taskId}/priority`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update priority')
      }
      const data = await response.json()
      setTask(prev =>
        prev
          ? {
              ...prev,
              priority: newPriority,
              timeline: [...prev.timeline, data.event]
            }
          : null
      )
      FeedbackToasts.updated(
        'Task priority',
        `Priority changed to ${newPriority}`
      )
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleAssign = async (staffId: string, isSelfAssign: boolean) => {
    if (!task || !currentStaff) return
    const staff = staffList.find(s => s.id === staffId)
    if (!staff) return

    setActionLoading(isSelfAssign ? 'assigning' : 'sending_request')
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, isSelfAssign })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign task')
      }
      const data = await response.json()

      if (isSelfAssign) {
        setTask(prev =>
          prev
            ? {
                ...prev,
                assignment: data.assignment,
                pendingAssignment: undefined,
                status: data.newStatus,
                timeline: [...prev.timeline, ...data.events]
              }
            : null
        )
        showFeedbackToast({
          title: 'Assignment',
          description: 'You assigned yourself to this task',
          type: 'success'
        })
      } else {
        setTask(prev =>
          prev
            ? {
                ...prev,
                pendingAssignment: data.pendingAssignment,
                timeline: [...prev.timeline, ...data.events]
              }
            : null
        )
        showFeedbackToast({
          title: 'Assignment',
          description: `Assignment request sent to ${staff.name}`,
          type: 'success'
        })
      }
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcceptAssignment = async () => {
    if (!task?.pendingAssignment || !currentStaff) return

    setActionLoading('accepting')
    try {
      const response = await fetch(`/api/tasks/${taskId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to accept assignment')
      }
      const data = await response.json()

      setTask(prev =>
        prev
          ? {
              ...prev,
              assignment: {
                ...prev.pendingAssignment!,
                ...data.assignment
              },
              pendingAssignment: undefined,
              status: data.newStatus,
              timeline: [...prev.timeline, ...data.events]
            }
          : null
      )

      showFeedbackToast({
        title: 'Assignment',
        description: 'You accepted the assignment',
        type: 'success'
      })
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectAssignment = async (reason: string) => {
    if (!task?.pendingAssignment || !currentStaff) return

    setActionLoading('rejecting')
    try {
      const response = await fetch(`/api/tasks/${taskId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject assignment')
      }
      const data = await response.json()

      setTask(prev =>
        prev
          ? {
              ...prev,
              pendingAssignment: undefined,
              timeline: [...prev.timeline, ...data.events]
            }
          : null
      )

      showFeedbackToast({
        title: 'Assignment',
        description: 'You rejected the assignment',
        type: 'success'
      })
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnassign = async (reason: string) => {
    if (!task?.assignment || !currentStaff) return

    const isUnassigningSelf = task.assignment.staffId === currentStaff.id

    setActionLoading('unassigning')
    try {
      const response = await fetch(`/api/tasks/${taskId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unassign')
      }
      const data = await response.json()

      setTask(prev =>
        prev
          ? {
              ...prev,
              assignment: undefined,
              status: data.newStatus,
              timeline: [...prev.timeline, ...data.events]
            }
          : null
      )

      showFeedbackToast({
        title: 'Unassignment',
        description: isUnassigningSelf
          ? 'You unassigned yourself'
          : `${task.assignment.staffName} has been unassigned`,
        type: 'success'
      })
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelAssignment = async (reason: string) => {
    if (!task?.pendingAssignment || !currentStaff) return

    setActionLoading('cancelling')
    try {
      const response = await fetch(`/api/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel assignment')
      }
      const data = await response.json()

      setTask(prev =>
        prev
          ? {
              ...prev,
              pendingAssignment: undefined,
              timeline: [...prev.timeline, ...data.events]
            }
          : null
      )

      showFeedbackToast({
        title: 'Assignment',
        description: 'Assignment request cancelled',
        type: 'success'
      })
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolve = async (report: string, attachmentFile?: File) => {
    if (!task || !currentStaff) return

    setActionLoading('resolving')
    try {
      let attachment: { name: string; url: string } | undefined
      if (attachmentFile) {
        const url = await uploadAttachment(attachmentFile)
        attachment = { name: attachmentFile.name, url }
      }

      const response = await fetch(`/api/tasks/${taskId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, attachment })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resolve task')
      }
      const data = await response.json()

      setTask(prev =>
        prev
          ? {
              ...prev,
              status: data.newStatus,
              report: data.report,
              timeline: [...prev.timeline, ...data.events]
            }
          : null
      )

      showFeedbackToast({
        title: 'Task',
        description: 'Task has been resolved',
        type: 'success'
      })
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
      throw err
    } finally {
      setActionLoading(null)
    }
  }

  const handleCommentAdded = (comment: CommentData) => {
    if (!task) return

    const attachment: { name: string; url: string } | undefined =
      comment.attachment
        ? {
            name: getFileNameFromUrl(comment.attachment),
            url: comment.attachment
          }
        : undefined

    const newEvent = {
      id: `evt-comment-${comment.id}`,
      type: 'comment' as const,
      performerId: currentStaff?.id || '',
      performerName: comment.senderName,
      performerAvatar: comment.senderAvatar,
      message: comment.message,
      attachment,
      timestamp: comment.createdAt
    }

    setTask(prev =>
      prev
        ? {
            ...prev,
            timeline: [...prev.timeline, newEvent]
          }
        : null
    )
  }

  // ============ Due Date Handlers ============

  const handleDueDateSet = async (dueDate: string) => {
    if (!task) return
    setActionLoading('due_date')
    try {
      const response = await fetch(`/api/tasks/${taskId}/due-date`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to set due date')
      }
      const data = await response.json()

      setTask(prev =>
        prev
          ? {
              ...prev,
              dueDate: data.dueDate,
              timeline: [...prev.timeline, data.event]
            }
          : null
      )

      FeedbackToasts.updated('Due date', 'Due date has been set')
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDueDateChange = async (newDueDate: string, reason: string) => {
    if (!task) return
    setActionLoading('due_date')
    try {
      const response = await fetch(`/api/tasks/${taskId}/due-date`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDueDate, reason })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change due date')
      }
      const data = await response.json()

      setTask(prev =>
        prev
          ? {
              ...prev,
              dueDate: data.dueDate,
              timeline: [...prev.timeline, data.event]
            }
          : null
      )

      FeedbackToasts.updated('Due date', 'Due date has been changed')
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDueDateRemove = async (reason: string) => {
    if (!task) return
    setActionLoading('due_date')
    try {
      const response = await fetch(`/api/tasks/${taskId}/due-date`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove due date')
      }
      const data = await response.json()

      setTask(prev =>
        prev
          ? {
              ...prev,
              dueDate: undefined,
              timeline: [...prev.timeline, data.event]
            }
          : null
      )

      FeedbackToasts.updated('Due date', 'Due date has been removed')
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  // ============ Flow Task Handlers ============

  const handleCompleteInspection = async (data: InspectionSubmitData) => {
    if (!task) return

    setActionLoading('completing_inspection')
    try {
      let attachmentUrl: string | undefined
      if (data.attachment) {
        attachmentUrl = await uploadAttachment(data.attachment)
      }

      const response = await fetch(`/api/tasks/${taskId}/complete-inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding: data.finding,
          report: data.report,
          attachment: attachmentUrl,
          preparationTasks: data.preparationTasks
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete inspection')
      }

      const result = await response.json()

      await fetchTask()

      setShowInspectionDialog(false)
      FeedbackToasts.updated('Inspection', 'Inspection completed successfully')

      if (result.nextTaskId) {
        window.location.href = `/tasks/${result.nextTaskId}`
      }
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
      throw err
    } finally {
      setActionLoading(null)
    }
  }

  const handleCompletePreparation = async (data: PreparationSubmitData) => {
    if (!task) return

    setActionLoading('completing_preparation')
    try {
      let attachmentUrl: string | undefined
      if (data.attachment) {
        attachmentUrl = await uploadAttachment(data.attachment)
      }

      const response = await fetch(
        `/api/tasks/${taskId}/complete-preparation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report: data.report,
            attachment: attachmentUrl
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete preparation')
      }

      const result = await response.json()

      await fetchTask()

      setShowPreparationDialog(false)
      FeedbackToasts.updated(
        'Preparation',
        'Preparation task completed successfully'
      )

      if (result.refundRequestTaskId) {
        showFeedbackToast({
          title: 'All Preparations Complete',
          description: 'A Refund Request task has been created',
          type: 'success'
        })
      }
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
      throw err
    } finally {
      setActionLoading(null)
    }
  }

  const handleSubmitRefundDecision = async (data: RefundDecisionSubmitData) => {
    if (!task) return

    setActionLoading('submitting_refund_decision')
    try {
      let attachmentUrl: string | undefined
      if (data.attachment) {
        attachmentUrl = await uploadAttachment(data.attachment)
      }

      const response = await fetch(
        `/api/tasks/${taskId}/submit-refund-decision`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: data.decision,
            charges: data.charges?.map((c: any) => ({
              ...c,
              amount: parseFloat(c.amount)
            })),
            report: data.report,
            attachment: attachmentUrl
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit refund decision')
      }

      const result = await response.json()

      await fetchTask()

      setShowRefundDecisionDialog(false)

      if (result.flowCompleted) {
        FeedbackToasts.updated(
          'Flow Completed',
          'Deposit forfeited. The lease ending flow has been completed.'
        )
      } else {
        FeedbackToasts.updated(
          'Refund Decision',
          'Refund decision submitted for review'
        )

        if (result.refundFinalizationTaskId) {
          showFeedbackToast({
            title: 'Review Task Created',
            description: 'A Refund Finalization task has been created for review',
            type: 'success'
          })
        }
      }
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
      throw err
    } finally {
      setActionLoading(null)
    }
  }

  const handleReviewRefund = async (data: RefundReviewSubmitData) => {
    if (!task) return

    setActionLoading('reviewing_refund')
    try {
      let attachmentUrl: string | undefined
      if (data.attachment) {
        attachmentUrl = await uploadAttachment(data.attachment)
      }

      const response = await fetch(`/api/tasks/${taskId}/review-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: data.approved,
          report: data.report,
          attachment: attachmentUrl,
          paymentMethod: data.paymentMethod
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit review')
      }

      await fetchTask()

      setShowReviewRefundDialog(false)

      if (data.approved) {
        FeedbackToasts.updated(
          'Refund Approved',
          'The lease ending flow has been completed'
        )
      } else {
        FeedbackToasts.warning(
          'Refund Rejected',
          'The refund request has been sent back for modification'
        )
      }
    } catch (err: any) {
      showFeedbackToast({
        title: 'Error',
        description: err.message,
        type: 'error'
      })
      throw err
    } finally {
      setActionLoading(null)
    }
  }

  // ============ Context Value ============

  const contextValue: TaskContextType = {
    // Core state
    task,
    taskId,
    staffList,
    currentStaff,
    loading,
    error,
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
    setShowReviewRefundDialog,

    // Refresh function
    refreshTask: fetchTask
  }

  // ============ Render ============

  if (loading) {
    return <TaskDetailsSkeleton />
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
          <p className='texts-body-medium text-red-600'>{error}</p>
        </div>
      </div>
    )
  }

  if (!task || !currentStaff) {
    return (
      <div className='p-6'>
        <div className='bg-neutral-50 border border-neutral-200 rounded-lg p-6 text-center'>
          <p className='texts-body-medium text-(--text-secondary)'>
            Task not found
          </p>
        </div>
      </div>
    )
  }

  return (
    <PermissionGuard permission='tasks.access'>
      <TaskProvider value={contextValue}>
        <div>
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Tasks', href: '/tasks' },
              { label: `#${task.referenceId}` }
            ]}
          />

          {/* Task Navigation - Use flow navigation for flow tasks */}
          <div className='mt-4'>
            {isFlowTask && flowInfo && (
              <FlowTaskNavigation flowInfo={flowInfo} currentTaskId={task.id} />
            )}
          </div>

          {children}
        </div>
      </TaskProvider>
    </PermissionGuard>
  )
}