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
        { error: 'Cancellation reason is required' },
        { status: 400 }
      )
    }

    if (reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Cancellation reason must be at least 10 characters' },
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

    // Verify task belongs to organization and has a pending assignment
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: currentStaff.organization_id
      },
      include: {
        task_assignments: {
          where: {
            status: 'Pending'
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
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const pendingAssignment = task.task_assignments[0]
    if (!pendingAssignment) {
      return NextResponse.json(
        { error: 'No pending assignment to cancel' },
        { status: 400 }
      )
    }

    const now = new Date()
    const currentStaffName = `${currentStaff.first_name} ${currentStaff.last_name || ''}`.trim()
    const assignee = pendingAssignment.staff_task_assignments_assigned_idTostaff
    const assigneeName = assignee ? `${assignee.first_name} ${assignee.last_name || ''}`.trim() : 'Unknown'

    // Cancel assignment
    const updatedAssignment = await prisma.task_assignments.update({
      where: { id: pendingAssignment.id },
      data: {
        status: 'Cancelled',
        responded_at: now,
        cancel_reason: reason
      }
    })

    return NextResponse.json({
      success: true,
      events: [
        {
          id: `evt-assign-cancelled-${updatedAssignment.id}`,
          type: 'assignment_cancelled',
          performerId: currentStaff.id,
          performerName: currentStaffName,
          performerAvatar: currentStaff.profile_pic,
          cancelledByName: currentStaffName,
          assignedName: assigneeName,
          cancelReason: reason,
          timestamp: now.toISOString()
        }
      ]
    })
  } catch (error: any) {
    console.error('Error cancelling assignment:', error)
    return NextResponse.json(
      { error: 'Failed to cancel assignment' },
      { status: 500 }
    )
  }
}
