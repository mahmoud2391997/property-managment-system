'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import { FeedbackToasts, showFeedbackToast } from '@/components/costume-ui/feedback-toast'
import TaskTimeline from '@/components/task-ui/task-timeline'
import TaskSidebar from '@/components/task-ui/task-sidebar'
import { PendingAssignmentBanner } from '@/components/task-ui/task-actions'
import AddCommentSection from '@/components/task-ui/add-comment-section'
import type { TaskDetail, StaffMember, TaskType, PriorityLevel, TimelineEvent } from '@/components/task-ui/types'
import { getPriorityColor, getStatusColor, formatDate } from '@/components/task-ui/types'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import TaskDetailsSkeleton from '@/components/loading-ui/task-details-skeleton'

export default function TaskDetailsPage() {
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

  // Fetch task data
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

  // Fetch staff list
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
      await Promise.all([fetchTask(), fetchStaffList()])
      setLoading(false)
    }
    loadData()
  }, [fetchTask, fetchStaffList])

  // Check if current user has pending assignment
  const hasPendingForMe = task?.pendingAssignment?.staffId === currentStaff?.id

  // Handle type change
  const handleTypeChange = async (newType: TaskType, _event: TimelineEvent) => {
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
      setTask(prev => prev ? {
        ...prev,
        type: newType,
        timeline: [...prev.timeline, data.event]
      } : null)
      FeedbackToasts.updated('Task type', `Type changed to ${newType}`)
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle priority change
  const handlePriorityChange = async (newPriority: PriorityLevel, _event: TimelineEvent) => {
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
      setTask(prev => prev ? {
        ...prev,
        priority: newPriority,
        timeline: [...prev.timeline, data.event]
      } : null)
      FeedbackToasts.updated('Task priority', `Priority changed to ${newPriority}`)
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle assignment
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
        setTask(prev => prev ? {
          ...prev,
          assignment: data.assignment,
          pendingAssignment: undefined,
          status: data.newStatus,
          timeline: [...prev.timeline, ...data.events]
        } : null)
        showFeedbackToast({ title: 'Assignment', description: 'You assigned yourself to this task', type: 'success' })
      } else {
        setTask(prev => prev ? {
          ...prev,
          pendingAssignment: data.pendingAssignment,
          timeline: [...prev.timeline, ...data.events]
        } : null)
        showFeedbackToast({ title: 'Assignment', description: `Assignment request sent to ${staff.name}`, type: 'success' })
      }
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle accept assignment
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

      setTask(prev => prev ? {
        ...prev,
        assignment: {
          ...prev.pendingAssignment!,
          ...data.assignment
        },
        pendingAssignment: undefined,
        status: data.newStatus,
        timeline: [...prev.timeline, ...data.events]
      } : null)

      showFeedbackToast({ title: 'Assignment', description: 'You accepted the assignment', type: 'success' })
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle reject assignment
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

      setTask(prev => prev ? {
        ...prev,
        pendingAssignment: undefined,
        timeline: [...prev.timeline, ...data.events]
      } : null)

      showFeedbackToast({ title: 'Assignment', description: 'You rejected the assignment', type: 'success' })
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle unassign
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

      setTask(prev => prev ? {
        ...prev,
        assignment: undefined,
        status: data.newStatus,
        timeline: [...prev.timeline, ...data.events]
      } : null)

      showFeedbackToast({
        title: 'Unassignment',
        description: isUnassigningSelf ? 'You unassigned yourself' : `${task.assignment.staffName} has been unassigned`,
        type: 'success'
      })
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle cancel assignment request
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

      setTask(prev => prev ? {
        ...prev,
        pendingAssignment: undefined,
        timeline: [...prev.timeline, ...data.events]
      } : null)

      showFeedbackToast({ title: 'Assignment', description: 'Assignment request cancelled', type: 'success' })
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle resolve task
  const handleResolve = async (report: string, attachmentFile?: File) => {
    if (!task || !currentStaff) return

    setActionLoading('resolving')
    try {
      // Upload attachment if present
      let attachment: { name: string; url: string } | undefined
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
        attachment = { name: attachmentFile.name, url: uploadData.url }
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

      setTask(prev => prev ? {
        ...prev,
        status: data.newStatus,
        report: data.report,
        timeline: [...prev.timeline, ...data.events]
      } : null)

      showFeedbackToast({ title: 'Task', description: 'Task has been resolved', type: 'success' })
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
      throw err // Re-throw so the dialog knows it failed and stays open
    } finally {
      setActionLoading(null)
    }
  }

  // Handle add comment
  const handleCommentAdded = (comment: { id: string; message: string; attachment: string | null; createdAt: string; senderName: string; senderAvatar?: string }) => {
    if (!task) return

    // Build attachment object if present
    const attachment: { name: string; url: string } | undefined = comment.attachment
      ? {
          name: getFileNameFromUrl(comment.attachment),
          url: comment.attachment
        }
      : undefined

    // Add new comment to timeline
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

    setTask(prev => prev ? {
      ...prev,
      timeline: [...prev.timeline, newEvent]
    } : null)
  }

  function getFileNameFromUrl(url: string): string {
    try {
      const parts = url.split('/')
      return parts[parts.length - 1] || 'attachment'
    } catch {
      return 'attachment'
    }
  }

  // Handle set due date (when task has no due date)
  const handleDueDateSet = async (dueDate: string, _event: TimelineEvent) => {
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

      setTask(prev => prev ? {
        ...prev,
        dueDate: data.dueDate,
        timeline: [...prev.timeline, data.event]
      } : null)

      FeedbackToasts.updated('Due date', 'Due date has been set')
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle change due date
  const handleDueDateChange = async (newDueDate: string, reason: string, _event: TimelineEvent) => {
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

      setTask(prev => prev ? {
        ...prev,
        dueDate: data.dueDate,
        timeline: [...prev.timeline, data.event]
      } : null)

      FeedbackToasts.updated('Due date', 'Due date has been changed')
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  // Handle remove due date
  const handleDueDateRemove = async (reason: string, _event: TimelineEvent) => {
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

      setTask(prev => prev ? {
        ...prev,
        dueDate: undefined,
        timeline: [...prev.timeline, data.event]
      } : null)

      FeedbackToasts.updated('Due date', 'Due date has been removed')
    } catch (err: any) {
      showFeedbackToast({ title: 'Error', description: err.message, type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <TaskDetailsSkeleton />
    )
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
          <p className='texts-body-medium text-(--text-secondary)'>Task not found</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Tasks', href: '/tasks' },
          { label: `#${task.referenceId}` }
        ]}
      />

      {/* Header */}
      <div className='mt-4 mb-2'>
        <h1 className='texts-heading-h2 text-(--text-primary)'>
          {task.title}{' '}
          <span className='text-(--text-secondary) font-normal'>#{task.referenceId}</span>
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

        {/* Sidebar */}
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
      </div>
    </div>
  )
}
