'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

// POST - Set due date (when there's none)
// PUT - Change due date
// DELETE - Remove due date
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { dueDate } = body

    if (!dueDate) {
      return NextResponse.json(
        { error: 'Due date is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: staff.organization_id
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const staffName = `${staff.first_name} ${staff.last_name || ''}`.trim()
    const dueDateObj = new Date(dueDate)

    const dueDateEntry = await prisma.task_due_dates.create({
      data: {
        task_id: taskId,
        due_date: dueDateObj,
        created_by: staff.id
      }
    })

    return NextResponse.json({
      success: true,
      dueDate: dueDateObj.toISOString(),
      event: {
        id: `evt-duedate-${dueDateEntry.id}`,
        type: 'due_date_set',
        performerId: staff.id,
        performerName: staffName,
        performerAvatar: staff.profile_pic,
        timestamp: dueDateEntry.created_at.toISOString(),
        dueDate: dueDateObj.toISOString()
      }
    })
  } catch (error: any) {
    console.error('Error setting due date:', error)
    return NextResponse.json(
      { error: 'Failed to set due date' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { dueDate, reason } = body

    if (!dueDate) {
      return NextResponse.json(
        { error: 'Due date is required' },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason for change is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: staff.organization_id
      },
      include: {
        task_due_dates: {
          where: { due_date: { not: null } },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const oldDueDate = task.task_due_dates[0]?.due_date
    const staffName = `${staff.first_name} ${staff.last_name || ''}`.trim()
    const dueDateObj = new Date(dueDate)

    const dueDateEntry = await prisma.task_due_dates.create({
      data: {
        task_id: taskId,
        due_date: dueDateObj,
        reason: reason,
        created_by: staff.id
      }
    })

    return NextResponse.json({
      success: true,
      dueDate: dueDateObj.toISOString(),
      event: {
        id: `evt-duedate-${dueDateEntry.id}`,
        type: 'due_date_changed',
        performerId: staff.id,
        performerName: staffName,
        performerAvatar: staff.profile_pic,
        timestamp: dueDateEntry.created_at.toISOString(),
        oldDueDate: oldDueDate?.toISOString(),
        dueDate: dueDateObj.toISOString(),
        dueDateReason: reason
      }
    })
  } catch (error: any) {
    console.error('Error changing due date:', error)
    return NextResponse.json(
      { error: 'Failed to change due date' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason for removal is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: staff.organization_id
      },
      include: {
        task_due_dates: {
          where: { due_date: { not: null } },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const oldDueDate = task.task_due_dates[0]?.due_date
    if (!oldDueDate) {
      return NextResponse.json(
        { error: 'Task has no due date to remove' },
        { status: 400 }
      )
    }

    const staffName = `${staff.first_name} ${staff.last_name || ''}`.trim()

    // Create entry with null due_date to indicate removal
    const dueDateEntry = await prisma.task_due_dates.create({
      data: {
        task_id: taskId,
        due_date: null,
        reason: reason,
        created_by: staff.id
      }
    })

    return NextResponse.json({
      success: true,
      event: {
        id: `evt-duedate-${dueDateEntry.id}`,
        type: 'due_date_removed',
        performerId: staff.id,
        performerName: staffName,
        performerAvatar: staff.profile_pic,
        timestamp: dueDateEntry.created_at.toISOString(),
        oldDueDate: oldDueDate.toISOString(),
        dueDateReason: reason
      }
    })
  } catch (error: any) {
    console.error('Error removing due date:', error)
    return NextResponse.json(
      { error: 'Failed to remove due date' },
      { status: 500 }
    )
  }
}
