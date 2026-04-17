'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { task_type } from '@prisma/client'

// Flow task types (cannot be set or changed via this API)
const flowTaskTypes: task_type[] = [
  'Inspection',
  'Preparation',
  'Refund_Request',
  'Refund_Finalization'
]

// Regular task types (can be set/changed via this API)
const validTypes: task_type[] = [
  'Maintenance',
  'Renovation',
  'Cleaning',
  'Administrative',
  'Documentation',
  'Data_Entry',
  'Accounting',
  'Legal',
  'IT_Support',
  'Follow_Up',
  'Complaint_Handling',
  'Miscellaneous_Others'
]

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { type } = body

    // Block flow task types
    if (flowTaskTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Flow task types cannot be set directly' },
        { status: 400 }
      )
    }

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid task type' },
        { status: 400 }
      )
    }

    const { staff: baseStaff, permissions, error } = await getUserAndStaff()
    if (error) return error
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
        task_types: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const oldType = task.task_types[0]?.type

    // Prevent changing type of flow tasks
    if (oldType && flowTaskTypes.includes(oldType)) {
      return NextResponse.json(
        { error: 'Cannot change type of flow tasks' },
        { status: 400 }
      )
    }

    // Create new type entry
    const newTypeEntry = await prisma.task_types.create({
      data: {
        task_id: taskId,
        type: type,
        created_by: staff.id
      }
    })

    const staffName = `${staff.first_name} ${staff.last_name || ''}`.trim()

    return NextResponse.json({
      success: true,
      event: {
        id: `evt-type-${newTypeEntry.id}`,
        type: 'type_changed',
        performerId: staff.id,
        performerName: staffName,
        performerAvatar: staff.profile_pic,
        timestamp: newTypeEntry.created_at.toISOString(),
        oldValue: oldType,
        newValue: type
      }
    })
  } catch (error: any) {
    console.error('Error updating task type:', error)
    return NextResponse.json(
      { error: 'Failed to update task type' },
      { status: 500 }
    )
  }
}