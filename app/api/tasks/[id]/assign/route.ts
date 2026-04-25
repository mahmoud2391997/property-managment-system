'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { staffId, isSelfAssign } = body

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    const { staff: baseStaff, permissions, error } = await getUserAndStaff()
    if (error) return error as NextResponse
    if (!hasPermission(permissions, 'tasks.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current staff info
    const currentStaff = await prisma.staff.findUnique({
      where: { id: baseStaff.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!currentStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Verify task belongs to organization
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: currentStaff.organization_id
      },
      include: {
        task_assignments: {
          where: {
            OR: [
              { status: 'Pending' },
              { status: 'Accepted', unassigned_at: null }
            ]
          }
        },
        task_statuses: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if there's already an active assignment
    if (task.task_assignments.length > 0) {
      return NextResponse.json(
        { error: 'Task already has an active assignment' },
        { status: 400 }
      )
    }

    // Get assignee info
    const assignee = await prisma.staff.findFirst({
      where: {
        id: staffId,
        organization_id: currentStaff.organization_id
      },
      select: { id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!assignee) {
      return NextResponse.json({ error: 'Assignee not found' }, { status: 404 })
    }

    const now = new Date()
    const currentStaffName = `${currentStaff.first_name} ${currentStaff.last_name || ''}`.trim()
    const assigneeName = `${assignee.first_name} ${assignee.last_name || ''}`.trim()

    if (isSelfAssign) {
      // Self-assign: immediately accepted, also update status to In Progress
      const [assignment, statusEntry] = await prisma.$transaction([
        prisma.task_assignments.create({
          data: {
            task_id: taskId,
            assigner_id: currentStaff.id,
            assigned_id: staffId,
            status: 'Accepted',
            requested_at: now,
            responded_at: now,
            responded_by: staffId
          }
        }),
        prisma.task_statuses.create({
          data: {
            task_id: taskId,
            state: 'In_Progress'
          }
        })
      ])

      const currentStatus = task.task_statuses[0]?.state || 'Open'
      const statusMap: Record<string, string> = {
        Open: 'Open',
        In_Progress: 'In Progress',
        Resolved: 'Resolved'
      }

      return NextResponse.json({
        success: true,
        assignment: {
          id: assignment.id,
          staffId: assignee.id,
          staffName: assigneeName,
          staffAvatar: assignee.profile_pic,
          status: 'accepted',
          assignerId: currentStaff.id,
          assignerName: currentStaffName,
          assignerAvatar: currentStaff.profile_pic,
          requestedAt: now.toISOString(),
          respondedAt: now.toISOString()
        },
        events: [
          {
            id: `evt-assign-${assignment.id}`,
            type: 'assignment_self_assigned',
            performerId: assignee.id,
            performerName: assigneeName,
            performerAvatar: assignee.profile_pic,
            timestamp: now.toISOString()
          },
          {
            id: `evt-status-${statusEntry.id}`,
            type: 'status_changed',
            performerId: assignee.id,
            performerName: assigneeName,
            performerAvatar: assignee.profile_pic,
            timestamp: now.toISOString(),
            oldValue: statusMap[currentStatus] || currentStatus,
            newValue: 'In Progress'
          }
        ],
        newStatus: 'In Progress'
      })
    } else {
      // Assign to someone else: pending
      const assignment = await prisma.task_assignments.create({
        data: {
          task_id: taskId,
          assigner_id: currentStaff.id,
          assigned_id: staffId,
          status: 'Pending',
          requested_at: now
        }
      })

      return NextResponse.json({
        success: true,
        pendingAssignment: {
          id: assignment.id,
          staffId: assignee.id,
          staffName: assigneeName,
          staffAvatar: assignee.profile_pic,
          status: 'pending',
          assignerId: currentStaff.id,
          assignerName: currentStaffName,
          assignerAvatar: currentStaff.profile_pic,
          requestedAt: now.toISOString()
        },
        events: [
          {
            id: `evt-assign-sent-${assignment.id}`,
            type: 'assignment_sent',
            performerId: currentStaff.id,
            performerName: currentStaffName,
            performerAvatar: currentStaff.profile_pic,
            assignerName: currentStaffName,
            assignerAvatar: currentStaff.profile_pic,
            assignedName: assigneeName,
            assignedAvatar: assignee.profile_pic,
            timestamp: now.toISOString()
          }
        ]
      })
    }
  } catch (error: any) {
    console.error('Error assigning task:', error)
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    )
  }
}
