'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  StaffMember,
  LeaseEndingWorkflow,
  LeaseEndingTask,
  PreparationTask,
  TaskTimelineEvent,
  RefundCharge
} from './types'
import {
  staffMembers,
  initialWorkflowData,
  createPreparationTask,
  createRefundRequestTask,
  createRefundFinalizationTask
} from './data'
import StaffSwitcher from './components/staff-switcher'
import WorkflowProgress from './components/workflow-progress'
import TaskTimeline from './components/task-timeline'
import TaskSidebar from './components/task-sidebar'
import AddCommentSection from './components/add-comment-section'
import { PendingAssignmentBanner } from './components/task-actions'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import Breadcrumb from '@/components/costume-ui/breadcrumb'

export default function LeaseEndingTestPage() {
  // Current staff (for testing different perspectives)
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(staffMembers[0])

  // Workflow state
  const [workflow, setWorkflow] = useState<LeaseEndingWorkflow>(initialWorkflowData)

  // Currently viewed task
  const [currentTaskId, setCurrentTaskId] = useState<string>(workflow.inspectionTask.id)
  const [currentTaskType, setCurrentTaskType] = useState<string>('inspection')

  // Track who becomes the workflow manager (inspector who completes inspection)
  const [workflowManagerId, setWorkflowManagerId] = useState<string | undefined>(undefined)

  // Get current task based on selection
  const currentTask = useMemo(() => {
    if (currentTaskType === 'inspection') {
      return workflow.inspectionTask
    }
    if (currentTaskType === 'preparation') {
      return workflow.preparationTasks.find(t => t.id === currentTaskId)
    }
    if (currentTaskType === 'refund_request') {
      return workflow.refundRequestTask
    }
    if (currentTaskType === 'refund_finalization') {
      return workflow.refundFinalizationTask
    }
    return workflow.inspectionTask
  }, [currentTaskId, currentTaskType, workflow])

  // Handle task selection from workflow progress
  const handleTaskSelect = useCallback((taskId: string, taskType: string) => {
    setCurrentTaskId(taskId)
    setCurrentTaskType(taskType)
  }, [])

  // Handle staff switch
  const handleStaffChange = useCallback((staff: StaffMember) => {
    setCurrentStaff(staff)
    FeedbackToasts.info('Staff Switched', `Now viewing as ${staff.name}`)
  }, [])

  // Format date helper
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle assignment
  const handleAssign = useCallback(
    (staffId: string, isSelfAssign: boolean) => {
      const assignedStaff = staffMembers.find(s => s.id === staffId)
      if (!assignedStaff) return

      const now = new Date()
      const dateStr = formatDate(now)

      if (currentTaskType === 'inspection') {
        setWorkflow(prev => {
          const newEvents: TaskTimelineEvent[] = [...prev.inspectionTask.timelineEvents]

          if (isSelfAssign) {
            newEvents.push({
              id: `event-${Date.now()}`,
              type: 'assignment_self_assigned',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              performerAvatar: currentStaff.avatar,
              date: dateStr,
              timestamp: now.getTime()
            })
            newEvents.push({
              id: `event-${Date.now() + 1}`,
              type: 'status_changed',
              performerId: 'system',
              performerName: 'System',
              date: dateStr,
              timestamp: now.getTime() + 1,
              data: { newStatus: 'In Progress' }
            })

            return {
              ...prev,
              inspectionTask: {
                ...prev.inspectionTask,
                status: 'in_progress',
                assignment: {
                  id: `assign-${Date.now()}`,
                  assignerId: currentStaff.id,
                  assigneeId: staffId,
                  status: 'accepted',
                  requestedAt: dateStr,
                  respondedAt: dateStr
                },
                timelineEvents: newEvents
              }
            }
          } else {
            newEvents.push({
              id: `event-${Date.now()}`,
              type: 'assignment_sent',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              performerAvatar: currentStaff.avatar,
              date: dateStr,
              timestamp: now.getTime(),
              data: {
                assigneeName: assignedStaff.name,
                assigneeId: assignedStaff.id
              }
            })

            return {
              ...prev,
              inspectionTask: {
                ...prev.inspectionTask,
                status: 'awaiting_response',
                assignment: {
                  id: `assign-${Date.now()}`,
                  assignerId: currentStaff.id,
                  assigneeId: staffId,
                  status: 'pending',
                  requestedAt: dateStr
                },
                timelineEvents: newEvents
              }
            }
          }
        })
      } else if (currentTaskType === 'preparation') {
        setWorkflow(prev => {
          const updatedTasks = prev.preparationTasks.map(task => {
            if (task.id !== currentTaskId) return task

            const newEvents: TaskTimelineEvent[] = [...task.timelineEvents]

            if (isSelfAssign) {
              newEvents.push({
                id: `event-${Date.now()}`,
                type: 'assignment_self_assigned',
                performerId: currentStaff.id,
                performerName: currentStaff.name,
                date: dateStr,
                timestamp: now.getTime()
              })
              newEvents.push({
                id: `event-${Date.now() + 1}`,
                type: 'status_changed',
                performerId: 'system',
                performerName: 'System',
                date: dateStr,
                timestamp: now.getTime() + 1,
                data: { newStatus: 'In Progress' }
              })

              return {
                ...task,
                status: 'in_progress' as const,
                assignment: {
                  id: `assign-${Date.now()}`,
                  assignerId: currentStaff.id,
                  assigneeId: staffId,
                  status: 'accepted' as const,
                  requestedAt: dateStr,
                  respondedAt: dateStr
                },
                timelineEvents: newEvents
              }
            } else {
              newEvents.push({
                id: `event-${Date.now()}`,
                type: 'assignment_sent',
                performerId: currentStaff.id,
                performerName: currentStaff.name,
                date: dateStr,
                timestamp: now.getTime(),
                data: {
                  assigneeName: assignedStaff.name,
                  assigneeId: assignedStaff.id
                }
              })

              return {
                ...task,
                status: 'awaiting_response' as const,
                assignment: {
                  id: `assign-${Date.now()}`,
                  assignerId: currentStaff.id,
                  assigneeId: staffId,
                  status: 'pending' as const,
                  requestedAt: dateStr
                },
                timelineEvents: newEvents
              }
            }
          })

          return { ...prev, preparationTasks: updatedTasks }
        })
      } else if (currentTaskType === 'refund_request') {
        setWorkflow(prev => {
          if (!prev.refundRequestTask) return prev

          const newEvents: TaskTimelineEvent[] = [...prev.refundRequestTask.timelineEvents]

          if (isSelfAssign) {
            newEvents.push({
              id: `event-${Date.now()}`,
              type: 'assignment_self_assigned',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime()
            })
            newEvents.push({
              id: `event-${Date.now() + 1}`,
              type: 'status_changed',
              performerId: 'system',
              performerName: 'System',
              date: dateStr,
              timestamp: now.getTime() + 1,
              data: { newStatus: 'In Progress' }
            })

            return {
              ...prev,
              refundRequestTask: {
                ...prev.refundRequestTask,
                status: 'in_progress',
                assignment: {
                  id: `assign-${Date.now()}`,
                  assignerId: currentStaff.id,
                  assigneeId: staffId,
                  status: 'accepted',
                  requestedAt: dateStr,
                  respondedAt: dateStr
                },
                timelineEvents: newEvents
              }
            }
          } else {
            newEvents.push({
              id: `event-${Date.now()}`,
              type: 'assignment_sent',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime(),
              data: {
                assigneeName: assignedStaff.name,
                assigneeId: assignedStaff.id
              }
            })

            return {
              ...prev,
              refundRequestTask: {
                ...prev.refundRequestTask,
                status: 'awaiting_response',
                assignment: {
                  id: `assign-${Date.now()}`,
                  assignerId: currentStaff.id,
                  assigneeId: staffId,
                  status: 'pending',
                  requestedAt: dateStr
                },
                timelineEvents: newEvents
              }
            }
          }
        })
      } else if (currentTaskType === 'refund_finalization') {
        setWorkflow(prev => {
          if (!prev.refundFinalizationTask) return prev

          const newEvents: TaskTimelineEvent[] = [...prev.refundFinalizationTask.timelineEvents]

          if (isSelfAssign) {
            newEvents.push({
              id: `event-${Date.now()}`,
              type: 'assignment_self_assigned',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime()
            })
            newEvents.push({
              id: `event-${Date.now() + 1}`,
              type: 'status_changed',
              performerId: 'system',
              performerName: 'System',
              date: dateStr,
              timestamp: now.getTime() + 1,
              data: { newStatus: 'In Progress' }
            })

            return {
              ...prev,
              refundFinalizationTask: {
                ...prev.refundFinalizationTask,
                status: 'in_progress',
                assignment: {
                  id: `assign-${Date.now()}`,
                  assignerId: currentStaff.id,
                  assigneeId: staffId,
                  status: 'accepted',
                  requestedAt: dateStr,
                  respondedAt: dateStr
                },
                timelineEvents: newEvents
              }
            }
          } else {
            newEvents.push({
              id: `event-${Date.now()}`,
              type: 'assignment_sent',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime(),
              data: {
                assigneeName: assignedStaff.name,
                assigneeId: assignedStaff.id
              }
            })

            return {
              ...prev,
              refundFinalizationTask: {
                ...prev.refundFinalizationTask,
                status: 'awaiting_response',
                assignment: {
                  id: `assign-${Date.now()}`,
                  assignerId: currentStaff.id,
                  assigneeId: staffId,
                  status: 'pending',
                  requestedAt: dateStr
                },
                timelineEvents: newEvents
              }
            }
          }
        })
      }

      FeedbackToasts.updated(
        'Assignment',
        isSelfAssign ? 'You assigned yourself to this task' : `Assignment request sent to ${assignedStaff.name}`
      )
    },
    [currentStaff, currentTaskId, currentTaskType]
  )

  // Handle accept assignment
  const handleAcceptAssignment = useCallback(() => {
    const now = new Date()
    const dateStr = formatDate(now)

    if (currentTaskType === 'inspection') {
      setWorkflow(prev => {
        const newEvents: TaskTimelineEvent[] = [
          ...prev.inspectionTask.timelineEvents,
          {
            id: `event-${Date.now()}`,
            type: 'assignment_accepted',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            date: dateStr,
            timestamp: now.getTime()
          },
          {
            id: `event-${Date.now() + 1}`,
            type: 'status_changed',
            performerId: 'system',
            performerName: 'System',
            date: dateStr,
            timestamp: now.getTime() + 1,
            data: { newStatus: 'In Progress' }
          }
        ]

        return {
          ...prev,
          inspectionTask: {
            ...prev.inspectionTask,
            status: 'in_progress',
            assignment: {
              ...prev.inspectionTask.assignment!,
              status: 'accepted',
              respondedAt: dateStr
            },
            timelineEvents: newEvents
          }
        }
      })
    } else if (currentTaskType === 'preparation') {
      setWorkflow(prev => {
        const updatedTasks = prev.preparationTasks.map(task => {
          if (task.id !== currentTaskId) return task

          const newEvents: TaskTimelineEvent[] = [
            ...task.timelineEvents,
            {
              id: `event-${Date.now()}`,
              type: 'assignment_accepted',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime()
            },
            {
              id: `event-${Date.now() + 1}`,
              type: 'status_changed',
              performerId: 'system',
              performerName: 'System',
              date: dateStr,
              timestamp: now.getTime() + 1,
              data: { newStatus: 'In Progress' }
            }
          ]

          return {
            ...task,
            status: 'in_progress' as const,
            assignment: {
              ...task.assignment!,
              status: 'accepted' as const,
              respondedAt: dateStr
            },
            timelineEvents: newEvents
          }
        })

        return { ...prev, preparationTasks: updatedTasks }
      })
    } else if (currentTaskType === 'refund_finalization') {
      setWorkflow(prev => {
        if (!prev.refundFinalizationTask) return prev

        const newEvents: TaskTimelineEvent[] = [
          ...prev.refundFinalizationTask.timelineEvents,
          {
            id: `event-${Date.now()}`,
            type: 'assignment_accepted',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            date: dateStr,
            timestamp: now.getTime()
          },
          {
            id: `event-${Date.now() + 1}`,
            type: 'status_changed',
            performerId: 'system',
            performerName: 'System',
            date: dateStr,
            timestamp: now.getTime() + 1,
            data: { newStatus: 'In Progress' }
          }
        ]

        return {
          ...prev,
          refundFinalizationTask: {
            ...prev.refundFinalizationTask,
            status: 'in_progress',
            assignment: {
              ...prev.refundFinalizationTask.assignment!,
              status: 'accepted',
              respondedAt: dateStr
            },
            timelineEvents: newEvents
          }
        }
      })
    }

    FeedbackToasts.updated('Assignment', 'You accepted the assignment')
  }, [currentStaff, currentTaskId, currentTaskType])

  // Handle reject assignment
  const handleRejectAssignment = useCallback(
    (reason: string) => {
      const now = new Date()
      const dateStr = formatDate(now)

      // Get assigner name based on task type
      let assignerName = 'Unknown'
      if (currentTaskType === 'inspection') {
        assignerName = staffMembers.find(s => s.id === workflow.inspectionTask.assignment?.assignerId)?.name || 'Unknown'
      } else if (currentTaskType === 'preparation') {
        assignerName = staffMembers.find(s => s.id === workflow.preparationTasks.find(t => t.id === currentTaskId)?.assignment?.assignerId)?.name || 'Unknown'
      } else if (currentTaskType === 'refund_finalization') {
        assignerName = staffMembers.find(s => s.id === workflow.refundFinalizationTask?.assignment?.assignerId)?.name || 'Unknown'
      }

      if (currentTaskType === 'inspection') {
        setWorkflow(prev => {
          const newEvents: TaskTimelineEvent[] = [
            ...prev.inspectionTask.timelineEvents,
            {
              id: `event-${Date.now()}`,
              type: 'assignment_rejected',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime(),
              data: { assignerName, rejectionReason: reason }
            }
          ]

          return {
            ...prev,
            inspectionTask: {
              ...prev.inspectionTask,
              status: 'pending',
              assignment: {
                ...prev.inspectionTask.assignment!,
                status: 'rejected',
                respondedAt: dateStr
              },
              timelineEvents: newEvents
            }
          }
        })
      } else if (currentTaskType === 'preparation') {
        setWorkflow(prev => {
          const updatedTasks = prev.preparationTasks.map(task => {
            if (task.id !== currentTaskId) return task

            const newEvents: TaskTimelineEvent[] = [
              ...task.timelineEvents,
              {
                id: `event-${Date.now()}`,
                type: 'assignment_rejected',
                performerId: currentStaff.id,
                performerName: currentStaff.name,
                date: dateStr,
                timestamp: now.getTime(),
                data: { assignerName, rejectionReason: reason }
              }
            ]

            return {
              ...task,
              status: 'pending' as const,
              assignment: {
                ...task.assignment!,
                status: 'rejected' as const,
                respondedAt: dateStr
              },
              timelineEvents: newEvents
            }
          })

          return { ...prev, preparationTasks: updatedTasks }
        })
      } else if (currentTaskType === 'refund_finalization') {
        setWorkflow(prev => {
          if (!prev.refundFinalizationTask) return prev

          const newEvents: TaskTimelineEvent[] = [
            ...prev.refundFinalizationTask.timelineEvents,
            {
              id: `event-${Date.now()}`,
              type: 'assignment_rejected',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime(),
              data: { assignerName, rejectionReason: reason }
            }
          ]

          return {
            ...prev,
            refundFinalizationTask: {
              ...prev.refundFinalizationTask,
              status: 'pending',
              assignment: {
                ...prev.refundFinalizationTask.assignment!,
                status: 'rejected',
                respondedAt: dateStr
              },
              timelineEvents: newEvents
            }
          }
        })
      }

      FeedbackToasts.info('Assignment', 'You rejected the assignment')
    },
    [currentStaff, currentTaskId, currentTaskType, workflow]
  )

  // Handle cancel assignment
  const handleCancelAssignment = useCallback(() => {
    const now = new Date()
    const dateStr = formatDate(now)

    if (currentTaskType === 'inspection') {
      const assigneeName =
        staffMembers.find(s => s.id === workflow.inspectionTask.assignment?.assigneeId)?.name || 'Unknown'

      setWorkflow(prev => {
        const newEvents: TaskTimelineEvent[] = [
          ...prev.inspectionTask.timelineEvents,
          {
            id: `event-${Date.now()}`,
            type: 'assignment_cancelled',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            date: dateStr,
            timestamp: now.getTime(),
            data: { assigneeName }
          }
        ]

        return {
          ...prev,
          inspectionTask: {
            ...prev.inspectionTask,
            status: 'pending',
            assignment: {
              ...prev.inspectionTask.assignment!,
              status: 'cancelled',
              cancelledAt: dateStr
            },
            timelineEvents: newEvents
          }
        }
      })

      FeedbackToasts.info('Assignment', 'Assignment request cancelled')
    }
  }, [currentStaff, currentTaskType, workflow])

  // Handle unassign
  const handleUnassign = useCallback(
    (reason: string) => {
      const now = new Date()
      const dateStr = formatDate(now)

      if (currentTaskType === 'inspection') {
        const assigneeName =
          staffMembers.find(s => s.id === workflow.inspectionTask.assignment?.assigneeId)?.name || 'Unknown'
        const isSelf = workflow.inspectionTask.assignment?.assigneeId === currentStaff.id

        setWorkflow(prev => {
          const newEvents: TaskTimelineEvent[] = [
            ...prev.inspectionTask.timelineEvents,
            {
              id: `event-${Date.now()}`,
              type: 'assignment_cancelled',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime(),
              data: {
                assigneeName,
                unassignReason: reason,
                isSelfUnassign: isSelf
              }
            }
          ]

          return {
            ...prev,
            inspectionTask: {
              ...prev.inspectionTask,
              status: 'pending',
              assignment: undefined,
              timelineEvents: newEvents
            }
          }
        })

        FeedbackToasts.info('Unassign', isSelf ? 'You unassigned yourself' : `${assigneeName} has been unassigned`)
      } else if (currentTaskType === 'preparation') {
        setWorkflow(prev => {
          const updatedTasks = prev.preparationTasks.map(task => {
            if (task.id !== currentTaskId) return task

            const assigneeName = staffMembers.find(s => s.id === task.assignment?.assigneeId)?.name || 'Unknown'
            const isSelf = task.assignment?.assigneeId === currentStaff.id

            const newEvents: TaskTimelineEvent[] = [
              ...task.timelineEvents,
              {
                id: `event-${Date.now()}`,
                type: 'assignment_cancelled',
                performerId: currentStaff.id,
                performerName: currentStaff.name,
                date: dateStr,
                timestamp: now.getTime(),
                data: {
                  assigneeName,
                  unassignReason: reason,
                  isSelfUnassign: isSelf
                }
              }
            ]

            return {
              ...task,
              status: 'pending' as const,
              assignment: undefined,
              timelineEvents: newEvents
            }
          })

          return { ...prev, preparationTasks: updatedTasks }
        })

        FeedbackToasts.info('Unassign', 'Staff has been unassigned')
      } else if (currentTaskType === 'refund_request') {
        setWorkflow(prev => {
          if (!prev.refundRequestTask) return prev

          const assigneeName =
            staffMembers.find(s => s.id === prev.refundRequestTask?.assignment?.assigneeId)?.name || 'Unknown'
          const isSelf = prev.refundRequestTask.assignment?.assigneeId === currentStaff.id

          const newEvents: TaskTimelineEvent[] = [
            ...prev.refundRequestTask.timelineEvents,
            {
              id: `event-${Date.now()}`,
              type: 'assignment_cancelled',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime(),
              data: {
                assigneeName,
                unassignReason: reason,
                isSelfUnassign: isSelf
              }
            }
          ]

          return {
            ...prev,
            refundRequestTask: {
              ...prev.refundRequestTask,
              status: 'pending',
              assignment: undefined,
              timelineEvents: newEvents
            }
          }
        })

        FeedbackToasts.info('Unassign', 'Staff has been unassigned')
      } else if (currentTaskType === 'refund_finalization') {
        setWorkflow(prev => {
          if (!prev.refundFinalizationTask) return prev

          const assigneeName =
            staffMembers.find(s => s.id === prev.refundFinalizationTask?.assignment?.assigneeId)?.name || 'Unknown'
          const isSelf = prev.refundFinalizationTask.assignment?.assigneeId === currentStaff.id

          const newEvents: TaskTimelineEvent[] = [
            ...prev.refundFinalizationTask.timelineEvents,
            {
              id: `event-${Date.now()}`,
              type: 'assignment_cancelled',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime(),
              data: {
                assigneeName,
                unassignReason: reason,
                isSelfUnassign: isSelf
              }
            }
          ]

          return {
            ...prev,
            refundFinalizationTask: {
              ...prev.refundFinalizationTask,
              status: 'pending',
              assignment: undefined,
              timelineEvents: newEvents
            }
          }
        })

        FeedbackToasts.info('Unassign', 'Staff has been unassigned')
      }
    },
    [currentStaff, currentTaskId, currentTaskType, workflow]
  )

  // Handle close task (inspection or preparation)
  const handleCloseTask = useCallback(
    (
      finding: 'ready' | 'needs_preparation',
      report: string,
      attachment: { name: string; url: string } | undefined,
      preparationTasksData?: { title: string; description: string }[]
    ) => {
      const now = new Date()
      const dateStr = formatDate(now)

      if (currentTaskType === 'inspection') {
        // Set the current staff as workflow manager when completing inspection
        setWorkflowManagerId(currentStaff.id)

        setWorkflow(prev => {
          const newEvents: TaskTimelineEvent[] = [
            ...prev.inspectionTask.timelineEvents,
            {
              id: `event-${Date.now()}`,
              type: 'report_submitted',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              performerAvatar: currentStaff.avatar,
              date: dateStr,
              timestamp: now.getTime(),
              data: { message: report || 'Inspection completed.', attachment }
            }
          ]

          let newPreparationTasks: PreparationTask[] = []
          let newRefundRequestTask: LeaseEndingTask | undefined

          if (finding === 'needs_preparation' && preparationTasksData) {
            // Create preparation tasks
            newPreparationTasks = preparationTasksData.map(taskData =>
              createPreparationTask(taskData.title, taskData.description, currentStaff.id, currentStaff.name)
            )

            newEvents.push({
              id: `event-${Date.now() + 1}`,
              type: 'preparation_tasks_created',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime() + 1,
              data: { preparationTaskCount: newPreparationTasks.length }
            })
          } else {
            // Property is ready, create refund request task
            newRefundRequestTask = createRefundRequestTask(
              currentStaff.id,
              currentStaff.name,
              prev.depositAmount
            )
            // Auto-assign to the inspector who completed inspection (the flow manager)
            newRefundRequestTask.assignment = {
              id: `assign-${Date.now()}`,
              assignerId: 'system',
              assigneeId: currentStaff.id,
              status: 'accepted',
              requestedAt: dateStr,
              respondedAt: dateStr
            }
            newRefundRequestTask.status = 'in_progress'
            newRefundRequestTask.timelineEvents.push({
              id: `event-${Date.now() + 2}`,
              type: 'assignment_self_assigned',
              performerId: currentStaff.id,
              performerName: currentStaff.name,
              date: dateStr,
              timestamp: now.getTime() + 2
            })
          }

          newEvents.push({
            id: `event-${Date.now() + 3}`,
            type: 'status_changed',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            date: dateStr,
            timestamp: now.getTime() + 3,
            data: { newStatus: 'Completed' }
          })

          return {
            ...prev,
            inspectionTask: {
              ...prev.inspectionTask,
              status: 'completed',
              inspectionFinding: finding,
              inspectionReport: {
                message: report || 'Inspection completed.',
                attachment,
                submittedAt: dateStr,
                submittedBy: currentStaff.id
              },
              completedAt: dateStr,
              timelineEvents: newEvents
            },
            preparationTasks: [...prev.preparationTasks, ...newPreparationTasks],
            refundRequestTask: newRefundRequestTask || prev.refundRequestTask,
            completedTasksCount: prev.completedTasksCount + 1,
            totalTasksCount: prev.totalTasksCount + newPreparationTasks.length + (newRefundRequestTask ? 1 : 0)
          }
        })

        FeedbackToasts.updated('Inspection', 'Inspection completed successfully')

        // If preparation tasks were created, show a message
        if (finding === 'needs_preparation' && preparationTasksData) {
          FeedbackToasts.info(
            'Preparation Tasks',
            `${preparationTasksData.length} preparation task(s) created`
          )
        }
      } else if (currentTaskType === 'preparation') {
        setWorkflow(prev => {
          const updatedTasks = prev.preparationTasks.map(task => {
            if (task.id !== currentTaskId) return task

            const newEvents: TaskTimelineEvent[] = [
              ...task.timelineEvents,
              {
                id: `event-${Date.now()}`,
                type: 'report_submitted',
                performerId: currentStaff.id,
                performerName: currentStaff.name,
                performerAvatar: currentStaff.avatar,
                date: dateStr,
                timestamp: now.getTime(),
                data: { message: report || 'Task completed.', attachment }
              },
              {
                id: `event-${Date.now() + 1}`,
                type: 'status_changed',
                performerId: currentStaff.id,
                performerName: currentStaff.name,
                date: dateStr,
                timestamp: now.getTime() + 1,
                data: { newStatus: 'Completed' }
              }
            ]

            return {
              ...task,
              status: 'completed' as const,
              report: {
                message: report || 'Task completed.',
                attachment,
                submittedAt: dateStr,
                submittedBy: currentStaff.id
              },
              completedAt: dateStr,
              timelineEvents: newEvents
            }
          })

          // Check if all preparation tasks are completed
          const allCompleted = updatedTasks.every(t => t.status === 'completed')

          let newRefundRequestTask = prev.refundRequestTask

          if (allCompleted && !prev.refundRequestTask && workflowManagerId) {
            // All prep tasks done, create refund request - assign to flow manager
            const flowManager = staffMembers.find(s => s.id === workflowManagerId)
            newRefundRequestTask = createRefundRequestTask(currentStaff.id, currentStaff.name, prev.depositAmount)
            newRefundRequestTask.assignment = {
              id: `assign-${Date.now()}`,
              assignerId: 'system',
              assigneeId: workflowManagerId,
              status: 'accepted',
              requestedAt: dateStr,
              respondedAt: dateStr
            }
            newRefundRequestTask.status = 'in_progress'
            newRefundRequestTask.timelineEvents.push({
              id: `event-${Date.now() + 2}`,
              type: 'assignment_self_assigned',
              performerId: workflowManagerId,
              performerName: flowManager?.name || 'Unknown',
              date: dateStr,
              timestamp: now.getTime() + 2
            })
          }

          return {
            ...prev,
            preparationTasks: updatedTasks,
            refundRequestTask: newRefundRequestTask,
            completedTasksCount: prev.completedTasksCount + 1,
            totalTasksCount: prev.totalTasksCount + (allCompleted && !prev.refundRequestTask ? 1 : 0)
          }
        })

        FeedbackToasts.updated('Preparation', 'Task completed successfully')
      }
    },
    [currentStaff, currentTaskId, currentTaskType, workflowManagerId]
  )

  // Handle refund decision
  const handleRefundDecision = useCallback(
    (
      decision: 'full' | 'partial' | 'burn',
      charges: RefundCharge[],
      note: string,
      attachment: { name: string; url: string } | undefined
    ) => {
      const now = new Date()
      const dateStr = formatDate(now)

      setWorkflow(prev => {
        if (!prev.refundRequestTask) return prev

        const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0)
        const finalAmount = decision === 'burn' ? 0 : prev.depositAmount - totalCharges

        const newEvents: TaskTimelineEvent[] = [
          ...prev.refundRequestTask.timelineEvents,
          {
            id: `event-${Date.now()}`,
            type: 'refund_decision',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            date: dateStr,
            timestamp: now.getTime(),
            data: {
              refundDecision: decision,
              refundAmount: finalAmount,
              charges
            }
          },
          {
            id: `event-${Date.now() + 1}`,
            type: 'report_submitted',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            performerAvatar: currentStaff.avatar,
            date: dateStr,
            timestamp: now.getTime() + 1,
            data: {
              message: note || `Refund decision: ${decision === 'full' ? 'Full refund' : decision === 'partial' ? 'Partial refund' : 'Deposit forfeited'}. Amount: RM ${finalAmount.toFixed(2)}`,
              attachment
            }
          },
          {
            id: `event-${Date.now() + 2}`,
            type: 'status_changed',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            date: dateStr,
            timestamp: now.getTime() + 2,
            data: { newStatus: 'Completed' }
          }
        ]

        // Create finalization task
        const finalizationTask = createRefundFinalizationTask(currentStaff.id, currentStaff.name)

        return {
          ...prev,
          refundRequestTask: {
            ...prev.refundRequestTask,
            status: 'completed',
            refundDecision: decision,
            refundCharges: charges,
            finalRefundAmount: finalAmount,
            tenantNote: note,
            completedAt: dateStr,
            timelineEvents: newEvents
          },
          refundFinalizationTask: finalizationTask,
          completedTasksCount: prev.completedTasksCount + 1,
          totalTasksCount: prev.totalTasksCount + 1
        }
      })

      FeedbackToasts.updated('Refund Request', 'Refund decision submitted')
    },
    [currentStaff]
  )

  // Handle refund approval
  const handleRefundApprove = useCallback(
    (report: string, attachment: { name: string; url: string } | undefined) => {
      const now = new Date()
      const dateStr = formatDate(now)

      setWorkflow(prev => {
        if (!prev.refundFinalizationTask) return prev

        const newEvents: TaskTimelineEvent[] = [
          ...prev.refundFinalizationTask.timelineEvents,
          {
            id: `event-${Date.now()}`,
            type: 'report_submitted',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            performerAvatar: currentStaff.avatar,
            date: dateStr,
            timestamp: now.getTime(),
            data: { message: report || 'Refund approved.', attachment }
          },
          {
            id: `event-${Date.now() + 1}`,
            type: 'status_changed',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            date: dateStr,
            timestamp: now.getTime() + 1,
            data: { newStatus: 'Completed' }
          }
        ]

        return {
          ...prev,
          refundFinalizationTask: {
            ...prev.refundFinalizationTask,
            status: 'completed',
            reviewReport: {
              message: report || 'Refund approved.',
              attachment,
              submittedAt: dateStr,
              submittedBy: currentStaff.id,
              approved: true
            },
            completedAt: dateStr,
            timelineEvents: newEvents
          },
          status: 'completed',
          completedTasksCount: prev.completedTasksCount + 1
        }
      })

      FeedbackToasts.updated('Refund', 'Refund approved and workflow completed!')
    },
    [currentStaff]
  )

  // Handle refund rejection
  const handleRefundReject = useCallback(
    (reason: string) => {
      const now = new Date()
      const dateStr = formatDate(now)

      setWorkflow(prev => {
        if (!prev.refundFinalizationTask || !prev.refundRequestTask) return prev

        // Update finalization task
        const finalizationEvents: TaskTimelineEvent[] = [
          ...prev.refundFinalizationTask.timelineEvents,
          {
            id: `event-${Date.now()}`,
            type: 'revision_requested',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            date: dateStr,
            timestamp: now.getTime(),
            data: { rejectionReason: reason }
          }
        ]

        // Update refund request task
        const refundEvents: TaskTimelineEvent[] = [
          ...prev.refundRequestTask.timelineEvents,
          {
            id: `event-${Date.now() + 1}`,
            type: 'revision_requested',
            performerId: currentStaff.id,
            performerName: currentStaff.name,
            date: dateStr,
            timestamp: now.getTime() + 1,
            data: { rejectionReason: reason }
          },
          {
            id: `event-${Date.now() + 2}`,
            type: 'status_changed',
            performerId: 'system',
            performerName: 'System',
            date: dateStr,
            timestamp: now.getTime() + 2,
            data: { newStatus: 'Revision Requested' }
          }
        ]

        return {
          ...prev,
          refundRequestTask: {
            ...prev.refundRequestTask,
            status: 'revision_requested',
            timelineEvents: refundEvents
          },
          refundFinalizationTask: {
            ...prev.refundFinalizationTask,
            status: 'pending',
            timelineEvents: finalizationEvents
          }
        }
      })

      FeedbackToasts.warning('Revision Requested', 'Refund request sent back for revision')

      // Switch to refund request task
      if (workflow.refundRequestTask) {
        setCurrentTaskId(workflow.refundRequestTask.id)
        setCurrentTaskType('refund_request')
      }
    },
    [currentStaff, workflow]
  )

  // Handle add comment
  const handleAddComment = useCallback(
    (event: TaskTimelineEvent) => {
      if (currentTaskType === 'inspection') {
        setWorkflow(prev => ({
          ...prev,
          inspectionTask: {
            ...prev.inspectionTask,
            timelineEvents: [...prev.inspectionTask.timelineEvents, event]
          }
        }))
      } else if (currentTaskType === 'preparation') {
        setWorkflow(prev => ({
          ...prev,
          preparationTasks: prev.preparationTasks.map(task =>
            task.id === currentTaskId
              ? { ...task, timelineEvents: [...task.timelineEvents, event] }
              : task
          )
        }))
      } else if (currentTaskType === 'refund_request') {
        setWorkflow(prev => ({
          ...prev,
          refundRequestTask: prev.refundRequestTask
            ? { ...prev.refundRequestTask, timelineEvents: [...prev.refundRequestTask.timelineEvents, event] }
            : prev.refundRequestTask
        }))
      } else if (currentTaskType === 'refund_finalization') {
        setWorkflow(prev => ({
          ...prev,
          refundFinalizationTask: prev.refundFinalizationTask
            ? { ...prev.refundFinalizationTask, timelineEvents: [...prev.refundFinalizationTask.timelineEvents, event] }
            : prev.refundFinalizationTask
        }))
      }
    },
    [currentTaskId, currentTaskType]
  )

  // Check if current user has pending assignment for current task
  const hasPendingAssignment = useMemo(() => {
    if (!currentTask) return false
    return (
      currentTask.assignment?.status === 'pending' &&
      currentTask.assignment?.assigneeId === currentStaff.id
    )
  }, [currentTask, currentStaff])

  const assignerInfo = useMemo(() => {
    if (!hasPendingAssignment || !currentTask?.assignment) return null
    const assigner = staffMembers.find(s => s.id === currentTask.assignment?.assignerId)
    return assigner ? { name: assigner.name, avatar: assigner.avatar } : null
  }, [hasPendingAssignment, currentTask])

  if (!currentTask) {
    return <div>Task not found</div>
  }

  // Check if task is completed (disable comments)
  const isTaskCompleted = currentTask.status === 'completed'

  return (
    <div className='min-h-screen bg-(--background-secondary)'>
      {/* Header */}
      <div className='bg-white border-b border-(--border-default) px-6 py-4'>
        <div className='max-w-7xl mx-auto'>
          <Breadcrumb
            items={[
              { label: 'Testing', href: '/testing' },
              { label: 'Lease Ending Workflow' }
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-6 py-6'>
        {/* Workflow Progress */}
        <WorkflowProgress
          workflow={workflow}
          currentTaskId={currentTaskId}
          onTaskSelect={handleTaskSelect}
        />

        {/* Pending Assignment Banner */}
        {hasPendingAssignment && assignerInfo && (
          <PendingAssignmentBanner
            assignerName={assignerInfo.name}
            assignerAvatar={assignerInfo.avatar}
            onAccept={handleAcceptAssignment}
            onReject={handleRejectAssignment}
          />
        )}

        {/* Task Content */}
        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Timeline */}
          <div className='flex-1'>
            <div className='bg-white border border-(--border-default) rounded-xl p-6'>
              <h3 className='texts-body-large-medium text-(--text-primary) mb-6'>
                {currentTask.title}
              </h3>
              <TaskTimeline events={currentTask.timelineEvents} />

              {/* Add Comment Section */}
              <AddCommentSection
                currentStaff={currentStaff}
                disabled={isTaskCompleted}
                onCommentAdded={handleAddComment}
              />
            </div>
          </div>

          {/* Sidebar */}
          <TaskSidebar
            task={currentTask}
            staffList={staffMembers}
            currentStaff={currentStaff}
            workflow={{
              depositAmount: workflow.depositAmount,
              preparationTasks: workflow.preparationTasks
            }}
            onAssign={handleAssign}
            onCancelAssignment={handleCancelAssignment}
            onUnassign={handleUnassign}
            onCloseTask={handleCloseTask}
            onRefundDecision={
              currentTaskType === 'refund_request' ? handleRefundDecision : undefined
            }
            onRefundApprove={
              currentTaskType === 'refund_finalization' ? handleRefundApprove : undefined
            }
            onRefundReject={
              currentTaskType === 'refund_finalization' ? handleRefundReject : undefined
            }
          />
        </div>
      </div>

      {/* Staff Switcher */}
      <StaffSwitcher
        staffList={staffMembers}
        currentStaff={currentStaff}
        onStaffChange={handleStaffChange}
      />
    </div>
  )
}
