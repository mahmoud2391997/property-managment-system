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

    const { staff: baseStaff, permissions, error } = await getUserAndStaff()
    if (error) return error
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

    // Verify task belongs to organization and has a pending assignment for this user
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: currentStaff.organization_id
      },
      include: {
        task_assignments: {
          where: {
            assigned_id: currentStaff.id,
            status: 'Pending'
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

    const pendingAssignment = task.task_assignments[0]
    if (!pendingAssignment) {
      return NextResponse.json(
        { error: 'No pending assignment found for you' },
        { status: 400 }
      )
    }

    const now = new Date()
    const currentStaffName = `${currentStaff.first_name} ${currentStaff.last_name || ''}`.trim()
    const currentStatus = task.task_statuses[0]?.state || 'Open'

    // Accept assignment and update status to In Progress
    const [updatedAssignment, statusEntry] = await prisma.$transaction([
      prisma.task_assignments.update({
        where: { id: pendingAssignment.id },
        data: {
          status: 'Accepted',
          responded_at: now,
          responded_by: currentStaff.id
        }
      }),
      prisma.task_statuses.create({
        data: {
          task_id: taskId,
          state: 'In_Progress'
        }
      })
    ])

    const statusMap: Record<string, string> = {
      Open: 'Open',
      In_Progress: 'In Progress',
      Resolved: 'Resolved'
    }

    return NextResponse.json({
      success: true,
      assignment: {
        id: updatedAssignment.id,
        staffId: currentStaff.id,
        staffName: currentStaffName,
        staffAvatar: currentStaff.profile_pic,
        status: 'accepted',
        respondedAt: now.toISOString()
      },
      events: [
        {
          id: `evt-assign-accepted-${updatedAssignment.id}`,
          type: 'assignment_accepted',
          performerId: currentStaff.id,
          performerName: currentStaffName,
          performerAvatar: currentStaff.profile_pic,
          timestamp: now.toISOString()
        },
        {
          id: `evt-status-${statusEntry.id}`,
          type: 'status_changed',
          performerId: currentStaff.id,
          performerName: currentStaffName,
          performerAvatar: currentStaff.profile_pic,
          timestamp: now.toISOString(),
          oldValue: statusMap[currentStatus] || currentStatus,
          newValue: 'In Progress'
        }
      ],
      newStatus: 'In Progress'
    })
  } catch (error: any) {
    console.error('Error accepting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to accept assignment' },
      { status: 500 }
    )
  }
}
