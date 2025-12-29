'use client'

import { useState } from 'react'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import { FeedbackToasts, showFeedbackToast } from '@/components/costume-ui/feedback-toast'
import TaskTimeline from './components/task-timeline'
import TaskSidebar from './components/task-sidebar'
import StaffSwitcher from './components/staff-switcher'
import { PendingAssignmentBanner, AddCommentSection } from './components/task-actions'
import { MOCK_TASK, MOCK_STAFF, generateId } from './data'
import type { Task, StaffMember, TaskType, PriorityLevel, TimelineEvent } from './types'
import { getPriorityColor, getStatusColor, formatDate } from './types'
import { cn } from '@/lib/utils'

export default function TaskDetailsPage() {
  // Current staff perspective (for testing)
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(MOCK_STAFF[0])

  // Task state
  const [task, setTask] = useState<Task>({ ...MOCK_TASK })

  // Check if current user has pending assignment
  const hasPendingForMe = task.pendingAssignment?.staffId === currentStaff.id

  // Handle type change
  const handleTypeChange = (newType: TaskType, event: TimelineEvent) => {
    setTask(prev => ({
      ...prev,
      type: newType,
      timeline: [...prev.timeline, event]
    }))
  }

  // Handle priority change
  const handlePriorityChange = (newPriority: PriorityLevel, event: TimelineEvent) => {
    setTask(prev => ({
      ...prev,
      priority: newPriority,
      timeline: [...prev.timeline, event]
    }))
  }

  // Handle assignment
  const handleAssign = (staffId: string, isSelfAssign: boolean) => {
    const staff = MOCK_STAFF.find(s => s.id === staffId)
    if (!staff) return

    const assignmentId = generateId('assign')
    const now = new Date().toISOString()

    if (isSelfAssign) {
      // Self-assign: immediately accepted
      const assignment = {
        id: assignmentId,
        staffId: staff.id,
        staffName: staff.name,
        staffAvatar: staff.avatar,
        status: 'accepted' as const,
        assignerId: currentStaff.id,
        assignerName: currentStaff.name,
        assignerAvatar: currentStaff.avatar,
        requestedAt: now,
        respondedAt: now
      }

      const event: TimelineEvent = {
        id: generateId('evt'),
        type: 'assignment_self_assigned',
        performerId: staff.id,
        performerName: staff.name,
        performerAvatar: staff.avatar,
        timestamp: now
      }

      // Also change status to In Progress
      const statusEvent: TimelineEvent = {
        id: generateId('evt'),
        type: 'status_changed',
        performerId: staff.id,
        performerName: staff.name,
        performerAvatar: staff.avatar,
        timestamp: now,
        oldValue: task.status,
        newValue: 'In Progress'
      }

      setTask(prev => ({
        ...prev,
        assignment,
        pendingAssignment: undefined,
        status: 'In Progress',
        timeline: [...prev.timeline, event, statusEvent]
      }))

      showFeedbackToast({ title: 'Assignment', description: 'You assigned yourself to this task', type: 'success' })
    } else {
      // Assign to someone else: pending
      const pendingAssignment = {
        id: assignmentId,
        staffId: staff.id,
        staffName: staff.name,
        staffAvatar: staff.avatar,
        status: 'pending' as const,
        assignerId: currentStaff.id,
        assignerName: currentStaff.name,
        assignerAvatar: currentStaff.avatar,
        requestedAt: now
      }

      const event: TimelineEvent = {
        id: generateId('evt'),
        type: 'assignment_sent',
        performerId: currentStaff.id,
        performerName: currentStaff.name,
        performerAvatar: currentStaff.avatar,
        assignerName: currentStaff.name,
        assignerAvatar: currentStaff.avatar,
        assignedName: staff.name,
        assignedAvatar: staff.avatar,
        timestamp: now
      }

      setTask(prev => ({
        ...prev,
        pendingAssignment,
        timeline: [...prev.timeline, event]
      }))

      showFeedbackToast({ title: 'Assignment', description: `Assignment request sent to ${staff.name}`, type: 'success' })
    }
  }

  // Handle accept assignment
  const handleAcceptAssignment = () => {
    if (!task.pendingAssignment) return

    const now = new Date().toISOString()
    const assignment = {
      ...task.pendingAssignment,
      status: 'accepted' as const,
      respondedAt: now
    }

    const acceptEvent: TimelineEvent = {
      id: generateId('evt'),
      type: 'assignment_accepted',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      timestamp: now
    }

    const statusEvent: TimelineEvent = {
      id: generateId('evt'),
      type: 'status_changed',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      timestamp: now,
      oldValue: task.status,
      newValue: 'In Progress'
    }

    setTask(prev => ({
      ...prev,
      assignment,
      pendingAssignment: undefined,
      status: 'In Progress',
      timeline: [...prev.timeline, acceptEvent, statusEvent]
    }))

    showFeedbackToast({ title: 'Assignment', description: 'You accepted the assignment', type: 'success' })
  }

  // Handle reject assignment
  const handleRejectAssignment = (reason: string) => {
    if (!task.pendingAssignment) return

    const now = new Date().toISOString()

    const event: TimelineEvent = {
      id: generateId('evt'),
      type: 'assignment_rejected',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      rejectionReason: reason,
      timestamp: now
    }

    setTask(prev => ({
      ...prev,
      pendingAssignment: undefined,
      timeline: [...prev.timeline, event]
    }))

    showFeedbackToast({ title: 'Assignment', description: 'You rejected the assignment', type: 'success' })
  }

  // Handle unassign
  const handleUnassign = (reason: string) => {
    if (!task.assignment) return

    const now = new Date().toISOString()
    const isUnassigningSelf = task.assignment.staffId === currentStaff.id

    const event: TimelineEvent = {
      id: generateId('evt'),
      type: 'assignment_unassigned',
      performerId: task.assignment.staffId,
      performerName: task.assignment.staffName,
      performerAvatar: task.assignment.staffAvatar,
      unassignedByName: isUnassigningSelf ? undefined : currentStaff.name,
      unassignReason: reason,
      timestamp: now
    }

    // Status goes back to Open
    const statusEvent: TimelineEvent = {
      id: generateId('evt'),
      type: 'status_changed',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      timestamp: now,
      oldValue: task.status,
      newValue: 'Open'
    }

    setTask(prev => ({
      ...prev,
      assignment: undefined,
      status: 'Open',
      timeline: [...prev.timeline, event, statusEvent]
    }))

    showFeedbackToast({
      title: 'Unassignment',
      description: isUnassigningSelf ? 'You unassigned yourself' : `${task.assignment.staffName} has been unassigned`,
      type: 'success'
    })
  }

  // Handle cancel assignment request
  const handleCancelAssignment = (reason: string) => {
    if (!task.pendingAssignment) return

    const now = new Date().toISOString()

    const event: TimelineEvent = {
      id: generateId('evt'),
      type: 'assignment_cancelled',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      cancelledByName: currentStaff.name,
      assignedName: task.pendingAssignment.staffName,
      cancelReason: reason,
      timestamp: now
    }

    setTask(prev => ({
      ...prev,
      pendingAssignment: undefined,
      timeline: [...prev.timeline, event]
    }))

    showFeedbackToast({ title: 'Assignment', description: 'Assignment request cancelled', type: 'success' })
  }

  // Handle resolve task
  const handleResolve = (report: string, attachment?: { name: string; url: string }) => {
    const now = new Date().toISOString()

    const reportEvent: TimelineEvent = {
      id: generateId('evt'),
      type: 'report_submitted',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      message: report,
      attachment,
      timestamp: now
    }

    const statusEvent: TimelineEvent = {
      id: generateId('evt'),
      type: 'status_changed',
      performerId: currentStaff.id,
      performerName: currentStaff.name,
      performerAvatar: currentStaff.avatar,
      timestamp: now,
      oldValue: task.status,
      newValue: 'Resolved'
    }

    setTask(prev => ({
      ...prev,
      status: 'Resolved',
      report: {
        content: report,
        attachment,
        submittedAt: now,
        submittedById: currentStaff.id,
        submittedByName: currentStaff.name
      },
      timeline: [...prev.timeline, reportEvent, statusEvent]
    }))

    showFeedbackToast({ title: 'Task', description: 'Task has been resolved', type: 'success' })
  }

  // Handle add comment
  const handleCommentAdded = (comment: { id: string; message: string; attachment: string | null; createdAt: string; senderName: string; senderAvatar?: string }) => {
    // Build attachment object if present
    const attachment: { name: string; url: string } | undefined = comment.attachment
      ? {
          name: getFileNameFromUrl(comment.attachment),
          url: comment.attachment
        }
      : undefined

    // Add new comment to timeline
    const newEvent: TimelineEvent = {
      id: `evt-comment-${comment.id}`,
      type: 'comment',
      performerId: currentStaff.id,
      performerName: comment.senderName,
      performerAvatar: comment.senderAvatar,
      message: comment.message,
      attachment,
      timestamp: comment.createdAt
    }
    setTask(prev => ({
      ...prev,
      timeline: [...prev.timeline, newEvent]
    }))
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
  const handleDueDateSet = (dueDate: string, event: TimelineEvent) => {
    setTask(prev => ({
      ...prev,
      dueDate,
      timeline: [...prev.timeline, event]
    }))
  }

  // Handle change due date
  const handleDueDateChange = (newDueDate: string, reason: string, event: TimelineEvent) => {
    setTask(prev => ({
      ...prev,
      dueDate: newDueDate,
      timeline: [...prev.timeline, event]
    }))
  }

  // Handle remove due date
  const handleDueDateRemove = (reason: string, event: TimelineEvent) => {
    setTask(prev => ({
      ...prev,
      dueDate: undefined,
      timeline: [...prev.timeline, event]
    }))
  }

  return (
    <div className='p-6'>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Tasks', href: '/tasks' },
          { label: `#${task.referenceId}` }
        ]}
      />

      {/* Staff Switcher (Testing Mode) */}
      <StaffSwitcher
        staffList={MOCK_STAFF}
        currentStaff={currentStaff}
        onStaffChange={setCurrentStaff}
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
            disabled={task.status === 'Resolved'}
            onAddComment={handleCommentAdded}
          />
        </div>

        {/* Sidebar */}
        <TaskSidebar
          task={task}
          staffList={MOCK_STAFF}
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
        />
      </div>
    </div>
  )
}
