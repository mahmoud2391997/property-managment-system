'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { task_priority } from '@prisma/client'

const validPriorities: task_priority[] = ['Low', 'Medium', 'High', 'Urgent']

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { priority } = body

    if (!priority || !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid task priority' },
        { status: 400 }
      )
    }

    const { staff: baseStaff, permissions, error } = await getUserAndStaff()
    if (error) return error as NextResponse
    if (!hasPermission(permissions, 'tasks.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get staff info
    const staff = await prisma.staff.findUnique({
      where: { id: baseStaff.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Verify task belongs to organization
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: staff.organization_id
      },
      include: {
        task_priorities: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const oldPriority = task.task_priorities[0]?.priority

    // Create new priority entry
    const newPriorityEntry = await prisma.task_priorities.create({
      data: {
        task_id: taskId,
        priority: priority,
        created_by: staff.id
      }
    })

    const staffName = `${staff.first_name} ${staff.last_name || ''}`.trim()

    return NextResponse.json({
      success: true,
      event: {
        id: `evt-priority-${newPriorityEntry.id}`,
        type: 'priority_changed',
        performerId: staff.id,
        performerName: staffName,
        performerAvatar: staff.profile_pic,
        timestamp: newPriorityEntry.created_at.toISOString(),
        oldValue: oldPriority,
        newValue: priority
      }
    })
  } catch (error: any) {
    console.error('Error updating task priority:', error)
    return NextResponse.json(
      { error: 'Failed to update task priority' },
      { status: 500 }
    )
  }
}
