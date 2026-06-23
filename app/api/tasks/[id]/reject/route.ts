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
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    if (reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Rejection reason must be at least 10 characters' },
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

    // Reject assignment
    const updatedAssignment = await prisma.task_assignments.update({
      where: { id: pendingAssignment.id },
      data: {
        status: 'Rejected',
        responded_at: now,
        responded_by: currentStaff.id,
        rejection_reason: reason
      }
    })

    return NextResponse.json({
      success: true,
      events: [
        {
          id: `evt-assign-rejected-${updatedAssignment.id}`,
          type: 'assignment_rejected',
          performerId: currentStaff.id,
          performerName: currentStaffName,
          performerAvatar: currentStaff.profile_pic,
          rejectionReason: reason,
          timestamp: now.toISOString()
        }
      ]
    })
  } catch (error: any) {
    console.error('Error rejecting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to reject assignment' },
      { status: 500 }
    )
  }
}
