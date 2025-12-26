'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Unassign reason is required' },
        { status: 400 }
      )
    }

    if (reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Unassign reason must be at least 10 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current staff info
    const currentStaff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!currentStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Verify task belongs to organization and has an accepted assignment
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: currentStaff.organization_id
      },
      include: {
        task_assignments: {
          where: {
            status: 'Accepted',
            unassigned_at: null
          },
          include: {
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
        task_statuses: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const activeAssignment = task.task_assignments[0]
    if (!activeAssignment) {
      return NextResponse.json(
        { error: 'No active assignment found' },
        { status: 400 }
      )
    }

    const now = new Date()
    const currentStaffName = `${currentStaff.first_name} ${currentStaff.last_name || ''}`.trim()
    const assignee = activeAssignment.staff_task_assignments_assigned_idTostaff
    const assigneeName = assignee ? `${assignee.first_name} ${assignee.last_name || ''}`.trim() : 'Unknown'
    const isUnassigningSelf = activeAssignment.assigned_id === currentStaff.id
    const currentStatus = task.task_statuses[0]?.state || 'Open'

    // Unassign and update status back to Open
    const [updatedAssignment, statusEntry] = await prisma.$transaction([
      prisma.task_assignments.update({
        where: { id: activeAssignment.id },
        data: {
          status: 'Unassigned',
          unassigned_at: now,
          unassigned_by: currentStaff.id,
          unassign_reason: reason
        }
      }),
      prisma.task_statuses.create({
        data: {
          task_id: taskId,
          state: 'Open'
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
      events: [
        {
          id: `evt-assign-unassigned-${updatedAssignment.id}`,
          type: 'assignment_unassigned',
          performerId: assignee?.id || '',
          performerName: assigneeName,
          performerAvatar: assignee?.profile_pic,
          unassignedByName: isUnassigningSelf ? undefined : currentStaffName,
          unassignReason: reason,
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
          newValue: 'Open'
        }
      ],
      newStatus: 'Open'
    })
  } catch (error: any) {
    console.error('Error unassigning task:', error)
    return NextResponse.json(
      { error: 'Failed to unassign task' },
      { status: 500 }
    )
  }
}
