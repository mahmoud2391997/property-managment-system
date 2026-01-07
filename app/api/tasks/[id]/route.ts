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
        // Reports - singular relation in schema but can have multiple via separate query
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

    // Get current task type (needed for timeline logic)
    const currentType = task.task_types[0]?.type || 'Miscellaneous_Others'

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
      Resolved: 'Resolved',
      Needs_Modification: 'Needs Modification'
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

    // 8. Reports (fetch all reports for this task - can be multiple)
    const allReports = await prisma.task_reports.findMany({
      where: { task_id: taskId },
      include: {
        staff: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_pic: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    })

    for (const report of allReports) {
      timelineEvents.push({
        id: `evt-report-${report.id}`,
        type: 'report_submitted',
        performerId: report.staff?.id || '',
        performerName: getStaffName(report.staff),
        performerAvatar: report.staff?.profile_pic,
        message: report.content,
        attachment: report.attachment ? { name: getFileNameFromUrl(report.attachment), url: report.attachment } : undefined,
        timestamp: report.created_at.toISOString(),
        isRejection: !report.is_resolved // Rejection if is_resolved is false
      })
    }

    // 9. Refund Decisions (for Refund Request tasks)
    const refundDecisions = await prisma.refund_decisions.findMany({
      where: { task_id: taskId },
      include: {
        refunded_charges: true,
        staff_refund_decisions_submitted_byTostaff: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_pic: true
          }
        },
        staff_refund_decisions_reviewed_byTostaff: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_pic: true
          }
        }
      },
      orderBy: { submitted_at: 'asc' }
    })

    for (const refundDecision of refundDecisions) {
      const submitter = refundDecision.staff_refund_decisions_submitted_byTostaff
      const reviewer = refundDecision.staff_refund_decisions_reviewed_byTostaff

      // Submission event
      timelineEvents.push({
        id: `evt-refund-decision-${refundDecision.id}`,
        type: 'refund_decision_submitted',
        performerId: submitter?.id || '',
        performerName: getStaffName(submitter),
        performerAvatar: submitter?.profile_pic,
        timestamp: refundDecision.submitted_at.toISOString(),
        refundData: {
          decision: refundDecision.decision,
          originalDeposit: refundDecision.original_deposit.toNumber(),
          totalCharges: refundDecision.total_charges.toNumber(),
          finalRefundAmount: refundDecision.final_refund_amount.toNumber(),
          charges: refundDecision.refunded_charges.map(charge => ({
            title: charge.title,
            amount: charge.amount.toNumber()
          }))
        }
      })

      // Review event (if reviewed)
      if (refundDecision.reviewed_at && reviewer) {
        timelineEvents.push({
          id: `evt-refund-review-${refundDecision.id}`,
          type: refundDecision.status === 'approved' ? 'refund_approved' : 'refund_rejected',
          performerId: reviewer.id,
          performerName: getStaffName(reviewer),
          performerAvatar: reviewer.profile_pic,
          timestamp: refundDecision.reviewed_at.toISOString()
        })
      }
    }

    // Sort timeline by timestamp
    timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Get current values
    const currentPriority = task.task_priorities[0]?.priority || 'Medium'
    const rawStatus = task.task_statuses[0]?.state || 'Open'
    const currentStatus = statusMap[rawStatus] || rawStatus
    // Get latest due date that's not null
    const currentDueDate = task.task_due_dates.find(d => d.due_date !== null)?.due_date

    // Get current assignment
    const acceptedAssignment = task.task_assignments.find(a => a.status === 'Accepted' && !a.unassigned_at)
    const pendingAssignment = task.task_assignments.find(a => a.status === 'Pending')

    // Get reports (can be multiple)
    const reports = task.task_reports

    // Determine if this is a flow task and get flow info
    const FLOW_TASK_TYPES = ['Inspection', 'Preparation', 'Refund_Request', 'Refund_Finalization']
    const isFlowTask = FLOW_TASK_TYPES.includes(currentType)
    let flowInfo: any = undefined

    if (isFlowTask) {
      // Find the flow instance this task belongs to
      let flowInstance = null

      // Check if task is directly linked via flow_instance_id (preparation tasks)
      if (task.flow_instance_id) {
        flowInstance = await prisma.task_flow_instances.findUnique({
          where: { id: task.flow_instance_id }
        })
      } else {
        // Check if task is referenced in a flow instance
        flowInstance = await prisma.task_flow_instances.findFirst({
          where: {
            OR: [
              { inspection_task_id: taskId },
              { refund_request_task_id: taskId },
              { refund_finalization_task_id: taskId }
            ]
          }
        })
      }

      if (flowInstance) {
        // Get all related tasks for navigation
        const relatedTasks: any[] = []

        // Get inspection task
        if (flowInstance.inspection_task_id) {
          const inspectionTask = await prisma.tasks.findUnique({
            where: { id: flowInstance.inspection_task_id },
            select: {
              id: true,
              reference_id: true,
              title: true,
              task_statuses: { orderBy: { created_at: 'desc' }, take: 1 }
            }
          })
          if (inspectionTask) {
            relatedTasks.push({
              id: inspectionTask.id,
              referenceId: inspectionTask.reference_id,
              title: inspectionTask.title,
              type: 'Inspection',
              status: statusMap[inspectionTask.task_statuses[0]?.state || 'Open'] || 'Open',
              isCurrent: inspectionTask.id === taskId
            })
          }
        }

        // Get preparation tasks
        const preparationTasks = await prisma.tasks.findMany({
          where: { flow_instance_id: flowInstance.id },
          select: {
            id: true,
            reference_id: true,
            title: true,
            task_statuses: { orderBy: { created_at: 'desc' }, take: 1 },
            task_types: { orderBy: { created_at: 'desc' }, take: 1 }
          }
        })
        for (const prepTask of preparationTasks) {
          const taskType = prepTask.task_types[0]?.type || 'Preparation'

          // Skip Refund Request and Finalization tasks - they're fetched separately below
          if (taskType === 'Refund_Request' || taskType === 'Refund_Finalization') {
            continue
          }

          relatedTasks.push({
            id: prepTask.id,
            referenceId: prepTask.reference_id,
            title: prepTask.title,
            type: 'Preparation',
            status: statusMap[prepTask.task_statuses[0]?.state || 'Open'] || 'Open',
            isCurrent: prepTask.id === taskId
          })
        }

        // Get refund request task
        if (flowInstance.refund_request_task_id) {
          const refundRequestTask = await prisma.tasks.findUnique({
            where: { id: flowInstance.refund_request_task_id },
            select: {
              id: true,
              reference_id: true,
              title: true,
              task_statuses: { orderBy: { created_at: 'desc' }, take: 1 }
            }
          })
          if (refundRequestTask) {
            relatedTasks.push({
              id: refundRequestTask.id,
              referenceId: refundRequestTask.reference_id,
              title: refundRequestTask.title,
              type: 'Refund Request',
              status: statusMap[refundRequestTask.task_statuses[0]?.state || 'Open'] || 'Open',
              isCurrent: refundRequestTask.id === taskId
            })
          }
        }

        // Get refund finalization task
        if (flowInstance.refund_finalization_task_id) {
          const finalizationTask = await prisma.tasks.findUnique({
            where: { id: flowInstance.refund_finalization_task_id },
            select: {
              id: true,
              reference_id: true,
              title: true,
              task_statuses: { orderBy: { created_at: 'desc' }, take: 1 }
            }
          })
          if (finalizationTask) {
            relatedTasks.push({
              id: finalizationTask.id,
              referenceId: finalizationTask.reference_id,
              title: finalizationTask.title,
              type: 'Refund Finalization',
              status: statusMap[finalizationTask.task_statuses[0]?.state || 'Open'] || 'Open',
              isCurrent: finalizationTask.id === taskId
            })
          }
        }

        // Get lease info for refund amount
        let leaseInfo = null
        if (flowInstance.lease_id) {
          const lease = await prisma.leases.findUnique({
            where: { id: flowInstance.lease_id },
            include: {
              properties: { select: { code: true } },
              rooms: { select: { title: true } },
              tenants: {
                include: {
                  individual_tenants: { select: { first_name: true, last_name: true } },
                  company_tenants: { select: { company_name: true } }
                }
              }
            }
          })
          if (lease) {
            // Get refundable amount from initial charges (is_refunded = true means these ARE refundable)
            const refundableCharges = await prisma.charges.findMany({
              where: {
                payments: {
                  lease_id: lease.id,
                  type: 'Lease_Initial_Charges',
                  status: 'Paid',
                },
                is_refunded: true
              },
              select: {
                amount: true
              }
            })

            const depositAmount = refundableCharges.reduce((sum, charge) => sum + charge.amount.toNumber(), 0)

            const tenantName = lease.tenants?.individual_tenants
              ? `${lease.tenants.individual_tenants.first_name} ${lease.tenants.individual_tenants.last_name || ''}`.trim()
              : lease.tenants?.company_tenants?.company_name || 'Unknown'
            leaseInfo = {
              id: lease.id,
              depositAmount,
              propertyCode: lease.properties?.code,
              roomTitle: lease.rooms?.title,
              tenantName
            }
          }
        }

        // Get latest refund decision (for Refund Finalization task)
        let latestRefundDecision = null
        if (currentType === 'Refund_Finalization' && flowInstance.refund_request_task_id) {
          const refundDecision = await prisma.refund_decisions.findFirst({
            where: { task_id: flowInstance.refund_request_task_id },
            orderBy: { submitted_at: 'desc' },
            include: {
              refunded_charges: true,
              staff_refund_decisions_submitted_byTostaff: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  profile_pic: true
                }
              }
            }
          })

          // Get the refund decision report from task_reports
          const refundDecisionReport = await prisma.task_reports.findFirst({
            where: { task_id: flowInstance.refund_request_task_id },
            orderBy: { created_at: 'desc' }
          })

          if (refundDecision) {
            const submitter = refundDecision.staff_refund_decisions_submitted_byTostaff
            latestRefundDecision = {
              decision: refundDecision.decision,
              originalDeposit: refundDecision.original_deposit.toNumber(),
              totalCharges: refundDecision.total_charges.toNumber(),
              finalRefundAmount: refundDecision.final_refund_amount.toNumber(),
              charges: refundDecision.refunded_charges.map(charge => ({
                title: charge.title,
                amount: charge.amount.toNumber()
              })),
              report: refundDecisionReport?.content || '',
              attachment: refundDecisionReport?.attachment || undefined,
              submitterId: submitter?.id || '',
              submitterName: getStaffName(submitter),
              submitterAvatar: submitter?.profile_pic
            }
          }
        }

        flowInfo = {
          flowInstanceId: flowInstance.id,
          flowType: flowInstance.flow_type === 'Lease_Ending' ? 'Lease Ending' : flowInstance.flow_type,
          flowStatus: flowInstance.status,
          relatedTasks,
          leaseInfo,
          latestRefundDecision
        }
      }
    }

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
      reports: reports.map(report => ({
        id: report.id,
        content: report.content,
        attachment: report.attachment ? { name: getFileNameFromUrl(report.attachment), url: report.attachment } : undefined,
        submittedAt: report.created_at.toISOString(),
        submittedById: report.staff?.id || '',
        submittedByName: getStaffName(report.staff),
        isResolved: report.is_resolved
      })),
      // Current staff info for the page
      currentStaff: {
        id: currentStaff.id,
        name: getStaffName(currentStaff),
        avatar: currentStaff.profile_pic
      },
      // Flow task info
      isFlowTask,
      flowInfo
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
