'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params

    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only staff can access tasks
    const currentStaff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!currentStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const organizationId = currentStaff.organization_id

    // Fetch the task with all related data
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: organizationId
      },
      include: {
        // Creator info
        staff: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_pic: true
          }
        },
        // Location info
        properties: {
          select: {
            id: true,
            code: true,
            city: true,
            projects: {
              select: {
                id: true,
                title: true,
                state: true
              }
            }
          }
        },
        rooms: {
          select: {
            id: true,
            title: true
          }
        },
        // Type history (latest first)
        task_types: {
          orderBy: { created_at: 'desc' },
          include: {
            staff: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_pic: true
              }
            }
          }
        },
        // Priority history (latest first)
        task_priorities: {
          orderBy: { created_at: 'desc' },
          include: {
            staff: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_pic: true
              }
            }
          }
        },
        // Status history (latest first) - no staff relation in task_statuses
        task_statuses: {
          orderBy: { created_at: 'desc' }
        },
        // Due date history (latest first)
        task_due_dates: {
          orderBy: { created_at: 'desc' },
          include: {
            staff: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_pic: true
              }
            }
          }
        },
        // All assignments
        task_assignments: {
          orderBy: { requested_at: 'desc' },
          include: {
            staff_task_assignments_assigner_idTostaff: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_pic: true
              }
            },
            staff_task_assignments_assigned_idTostaff: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_pic: true
              }
            }
          }
        },
        // All comments
        task_comments: {
          orderBy: { created_at: 'asc' },
          include: {
            staff: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_pic: true
              }
            }
          }
        },
        // Reports
        task_reports: {
          include: {
            staff: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                profile_pic: true
              }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Helper to get staff name
    const getStaffName = (s: { first_name: string; last_name: string | null } | null | undefined) => {
      if (!s) return 'Unknown'
      return `${s.first_name} ${s.last_name || ''}`.trim()
    }

    // Build timeline events
    const timelineEvents: any[] = []

    // 1. Task created event
    timelineEvents.push({
      id: `evt-created-${task.id}`,
      type: 'task_created',
      performerId: task.staff?.id || '',
      performerName: getStaffName(task.staff),
      performerAvatar: task.staff?.profile_pic,
      timestamp: task.created_at.toISOString(),
      message: task.description,
      attachment: task.attachment ? { name: getFileNameFromUrl(task.attachment), url: task.attachment } : undefined
    })

    // 2. Type changes (skip the first one as it's part of creation)
    const typeChanges = [...task.task_types].reverse()
    for (let i = 1; i < typeChanges.length; i++) {
      const change = typeChanges[i]
      const prevChange = typeChanges[i - 1]
      timelineEvents.push({
        id: `evt-type-${change.id}`,
        type: 'type_changed',
        performerId: change.staff?.id || '',
        performerName: getStaffName(change.staff),
        performerAvatar: change.staff?.profile_pic,
        timestamp: change.created_at.toISOString(),
        oldValue: prevChange?.type,
        newValue: change.type
      })
    }

    // 3. Priority changes (skip the first one as it's part of creation)
    const priorityChanges = [...task.task_priorities].reverse()
    for (let i = 1; i < priorityChanges.length; i++) {
      const change = priorityChanges[i]
      const prevChange = priorityChanges[i - 1]
      timelineEvents.push({
        id: `evt-priority-${change.id}`,
        type: 'priority_changed',
        performerId: change.staff?.id || '',
        performerName: getStaffName(change.staff),
        performerAvatar: change.staff?.profile_pic,
        timestamp: change.created_at.toISOString(),
        oldValue: prevChange?.priority,
        newValue: change.priority
      })
    }

    // 4. Status changes (skip the first one as it's part of creation)
    const statusChanges = [...task.task_statuses].reverse()
    const statusMap: Record<string, string> = {
      Open: 'Open',
      In_Progress: 'In Progress',
      Resolved: 'Resolved'
    }
    for (let i = 1; i < statusChanges.length; i++) {
      const change = statusChanges[i]
      const prevChange = statusChanges[i - 1]
      timelineEvents.push({
        id: `evt-status-${change.id}`,
        type: 'status_changed',
        performerId: '',
        performerName: 'System',
        performerAvatar: undefined,
        timestamp: change.created_at.toISOString(),
        oldValue: statusMap[prevChange?.state || 'Open'] || prevChange?.state,
        newValue: statusMap[change.state] || change.state
      })
    }

    // 5. Due date events - determine type based on sequence
    const dueDateChanges = [...task.task_due_dates].reverse()
    for (let i = 0; i < dueDateChanges.length; i++) {
      const change = dueDateChanges[i]
      const prevChange = i > 0 ? dueDateChanges[i - 1] : null

      // First entry is a "set", subsequent ones are "changed" or "removed" (if due_date is null)
      if (i === 0) {
        // First due date set
        if (change.due_date) {
          timelineEvents.push({
            id: `evt-duedate-${change.id}`,
            type: 'due_date_set',
            performerId: change.staff?.id || '',
            performerName: getStaffName(change.staff),
            performerAvatar: change.staff?.profile_pic,
            timestamp: change.created_at.toISOString(),
            dueDate: change.due_date?.toISOString()
          })
        }
      } else if (change.due_date === null) {
        // Removed
        timelineEvents.push({
          id: `evt-duedate-${change.id}`,
          type: 'due_date_removed',
          performerId: change.staff?.id || '',
          performerName: getStaffName(change.staff),
          performerAvatar: change.staff?.profile_pic,
          timestamp: change.created_at.toISOString(),
          oldDueDate: prevChange?.due_date?.toISOString(),
          dueDateReason: change.reason
        })
      } else if (prevChange?.due_date === null && change.due_date) {
        // Re-set after removal
        timelineEvents.push({
          id: `evt-duedate-${change.id}`,
          type: 'due_date_set',
          performerId: change.staff?.id || '',
          performerName: getStaffName(change.staff),
          performerAvatar: change.staff?.profile_pic,
          timestamp: change.created_at.toISOString(),
          dueDate: change.due_date?.toISOString()
        })
      } else {
        // Changed
        timelineEvents.push({
          id: `evt-duedate-${change.id}`,
          type: 'due_date_changed',
          performerId: change.staff?.id || '',
          performerName: getStaffName(change.staff),
          performerAvatar: change.staff?.profile_pic,
          timestamp: change.created_at.toISOString(),
          oldDueDate: prevChange?.due_date?.toISOString(),
          dueDate: change.due_date?.toISOString(),
          dueDateReason: change.reason
        })
      }
    }

    // 6. Assignment events
    for (const assignment of task.task_assignments) {
      const requester = assignment.staff_task_assignments_assigner_idTostaff
      const assignee = assignment.staff_task_assignments_assigned_idTostaff

      // Check if self-assign
      const isSelfAssign = requester?.id === assignee?.id

      if (isSelfAssign && assignment.status === 'Accepted') {
        // Self-assigned
        timelineEvents.push({
          id: `evt-assign-${assignment.id}`,
          type: 'assignment_self_assigned',
          performerId: assignee?.id || '',
          performerName: getStaffName(assignee),
          performerAvatar: assignee?.profile_pic,
          timestamp: assignment.requested_at.toISOString()
        })
      } else {
        // Assignment sent
        timelineEvents.push({
          id: `evt-assign-sent-${assignment.id}`,
          type: 'assignment_sent',
          performerId: requester?.id || '',
          performerName: getStaffName(requester),
          performerAvatar: requester?.profile_pic,
          assignerName: getStaffName(requester),
          assignerAvatar: requester?.profile_pic,
          assignedName: getStaffName(assignee),
          assignedAvatar: assignee?.profile_pic,
          timestamp: assignment.requested_at.toISOString()
        })

        // If responded
        if (assignment.responded_at) {
          if (assignment.status === 'Accepted') {
            timelineEvents.push({
              id: `evt-assign-accepted-${assignment.id}`,
              type: 'assignment_accepted',
              performerId: assignee?.id || '',
              performerName: getStaffName(assignee),
              performerAvatar: assignee?.profile_pic,
              timestamp: assignment.responded_at.toISOString()
            })
          } else if (assignment.status === 'Rejected') {
            timelineEvents.push({
              id: `evt-assign-rejected-${assignment.id}`,
              type: 'assignment_rejected',
              performerId: assignee?.id || '',
              performerName: getStaffName(assignee),
              performerAvatar: assignee?.profile_pic,
              rejectionReason: assignment.rejection_reason,
              timestamp: assignment.responded_at.toISOString()
            })
          } else if (assignment.status === 'Cancelled') {
            timelineEvents.push({
              id: `evt-assign-cancelled-${assignment.id}`,
              type: 'assignment_cancelled',
              performerId: requester?.id || '',
              performerName: getStaffName(requester),
              performerAvatar: requester?.profile_pic,
              cancelledByName: getStaffName(requester),
              assignedName: getStaffName(assignee),
              cancelReason: assignment.cancel_reason,
              timestamp: assignment.responded_at.toISOString()
            })
          }
        }

        // If unassigned
        if (assignment.unassigned_at) {
          timelineEvents.push({
            id: `evt-assign-unassigned-${assignment.id}`,
            type: 'assignment_unassigned',
            performerId: assignee?.id || '',
            performerName: getStaffName(assignee),
            performerAvatar: assignee?.profile_pic,
            unassignReason: assignment.unassign_reason,
            timestamp: assignment.unassigned_at.toISOString()
          })
        }
      }
    }

    // 7. Comments
    for (const comment of task.task_comments) {
      timelineEvents.push({
        id: `evt-comment-${comment.id}`,
        type: 'comment',
        performerId: comment.staff?.id || '',
        performerName: getStaffName(comment.staff),
        performerAvatar: comment.staff?.profile_pic,
        message: comment.message,
        attachment: comment.attachment ? { name: getFileNameFromUrl(comment.attachment), url: comment.attachment } : undefined,
        timestamp: comment.created_at.toISOString()
      })
    }

    // 8. Reports
    if (task.task_reports) {
      const report = task.task_reports
      timelineEvents.push({
        id: `evt-report-${report.id}`,
        type: 'report_submitted',
        performerId: report.staff?.id || '',
        performerName: getStaffName(report.staff),
        performerAvatar: report.staff?.profile_pic,
        message: report.content,
        attachment: report.attachment ? { name: getFileNameFromUrl(report.attachment), url: report.attachment } : undefined,
        timestamp: report.created_at.toISOString()
      })
    }

    // Sort timeline by timestamp
    timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Get current values
    const currentType = task.task_types[0]?.type || 'Miscellaneous_Others'
    const currentPriority = task.task_priorities[0]?.priority || 'Medium'
    const rawStatus = task.task_statuses[0]?.state || 'Open'
    const currentStatus = statusMap[rawStatus] || rawStatus
    // Get latest due date that's not null
    const currentDueDate = task.task_due_dates.find(d => d.due_date !== null)?.due_date

    // Get current assignment
    const acceptedAssignment = task.task_assignments.find(a => a.status === 'Accepted' && !a.unassigned_at)
    const pendingAssignment = task.task_assignments.find(a => a.status === 'Pending')

    // Get report
    const report = task.task_reports

    // Build location
    const location = task.properties ? {
      projectId: task.properties.projects?.id,
      projectName: task.properties.projects?.title,
      projectState: task.properties.projects?.state,
      propertyId: task.properties.id,
      propertyCode: task.properties.code,
      propertyCity: task.properties.city,
      roomId: task.rooms?.id,
      roomTitle: task.rooms?.title
    } : undefined

    // Transform to response format
    const response = {
      id: task.id,
      referenceId: task.reference_id,
      title: task.title,
      description: task.description,
      type: currentType,
      priority: currentPriority,
      status: currentStatus,
      createdAt: task.created_at.toISOString(),
      createdById: task.staff?.id || '',
      createdByName: getStaffName(task.staff),
      createdByAvatar: task.staff?.profile_pic,
      dueDate: currentDueDate?.toISOString(),
      location,
      assignment: acceptedAssignment ? {
        id: acceptedAssignment.id,
        staffId: acceptedAssignment.staff_task_assignments_assigned_idTostaff?.id || '',
        staffName: getStaffName(acceptedAssignment.staff_task_assignments_assigned_idTostaff),
        staffAvatar: acceptedAssignment.staff_task_assignments_assigned_idTostaff?.profile_pic,
        status: 'accepted',
        assignerId: acceptedAssignment.staff_task_assignments_assigner_idTostaff?.id || '',
        assignerName: getStaffName(acceptedAssignment.staff_task_assignments_assigner_idTostaff),
        assignerAvatar: acceptedAssignment.staff_task_assignments_assigner_idTostaff?.profile_pic,
        requestedAt: acceptedAssignment.requested_at.toISOString(),
        respondedAt: acceptedAssignment.responded_at?.toISOString()
      } : undefined,
      pendingAssignment: pendingAssignment ? {
        id: pendingAssignment.id,
        staffId: pendingAssignment.staff_task_assignments_assigned_idTostaff?.id || '',
        staffName: getStaffName(pendingAssignment.staff_task_assignments_assigned_idTostaff),
        staffAvatar: pendingAssignment.staff_task_assignments_assigned_idTostaff?.profile_pic,
        status: 'pending',
        assignerId: pendingAssignment.staff_task_assignments_assigner_idTostaff?.id || '',
        assignerName: getStaffName(pendingAssignment.staff_task_assignments_assigner_idTostaff),
        assignerAvatar: pendingAssignment.staff_task_assignments_assigner_idTostaff?.profile_pic,
        requestedAt: pendingAssignment.requested_at.toISOString()
      } : undefined,
      timeline: timelineEvents,
      report: report ? {
        content: report.content,
        attachment: report.attachment ? { name: getFileNameFromUrl(report.attachment), url: report.attachment } : undefined,
        submittedAt: report.created_at.toISOString(),
        submittedById: report.staff?.id || '',
        submittedByName: getStaffName(report.staff)
      } : undefined,
      // Current staff info for the page
      currentStaff: {
        id: currentStaff.id,
        name: getStaffName(currentStaff),
        avatar: currentStaff.profile_pic
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

function getFileNameFromUrl(url: string): string {
  try {
    // Parse URL to handle query parameters properly
    const urlObj = new URL(url)
    // Get the pathname and extract the last segment
    const pathname = urlObj.pathname
    const parts = pathname.split('/')
    let fileName = parts[parts.length - 1] || 'attachment'

    // Decode URL-encoded characters
    fileName = decodeURIComponent(fileName)

    // If the filename doesn't have an extension, try to infer from content-type or default
    if (!fileName.includes('.') || fileName.endsWith('.')) {
      fileName = 'attachment'
    }

    return fileName
  } catch {
    // Fallback to simple split if URL parsing fails
    try {
      const parts = url.split('/')
      let fileName = parts[parts.length - 1] || 'attachment'
      // Remove query parameters if any
      fileName = fileName.split('?')[0]
      return decodeURIComponent(fileName)
    } catch {
      return 'attachment'
    }
  }
}
