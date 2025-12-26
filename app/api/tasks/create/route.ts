'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get staff info
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      type,
      priority,
      description,
      attachment,
      property_id,
      room_id,
      due_date
    } = body

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!type || !type.trim()) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    if (!priority || !priority.trim()) {
      return NextResponse.json(
        { error: 'Priority is required' },
        { status: 400 }
      )
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    // Validate type enum
    const validTypes = [
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
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid task type' }, { status: 400 })
    }

    // Validate priority enum
    const validPriorities = ['Low', 'Medium', 'High', 'Urgent']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      )
    }

    // Validate property belongs to organization if provided
    if (property_id) {
      const property = await prisma.properties.findFirst({
        where: {
          id: property_id,
          organization_id: staff.organization_id
        }
      })

      if (!property) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 400 }
        )
      }
    }

    // Validate room belongs to property if provided
    if (room_id) {
      if (!property_id) {
        return NextResponse.json(
          { error: 'Property is required when room is specified' },
          { status: 400 }
        )
      }

      const room = await prisma.rooms.findFirst({
        where: {
          id: room_id,
          property_id: property_id
        }
      })

      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 400 })
      }
    }

    const organizationId = staff.organization_id

    // Generate reference_id: TSK-YYYYNNNNNNN (11 digits after TSK-)
    const currentYear = new Date().getFullYear()
    const yearPrefix = `TSK-${currentYear}`

    // Get the latest task for this year and organization
    const latestTask = await prisma.tasks.findFirst({
      where: {
        organization_id: organizationId,
        reference_id: {
          startsWith: yearPrefix
        }
      },
      orderBy: {
        reference_id: 'desc'
      },
      select: {
        reference_id: true
      }
    })

    let nextSequence = 1
    if (latestTask) {
      // Extract the last 7 digits and increment
      const lastSequence = parseInt(latestTask.reference_id.slice(-7))
      nextSequence = lastSequence + 1
    }

    // Format: TSK-YYYYNNNNNNN (TSK-20250000001)
    const reference_id = `${yearPrefix}${nextSequence.toString().padStart(7, '0')}`

    // Create task with initial status, type, and priority in a transaction
    const result = await prisma.$transaction(async tx => {
      // Create task
      const task = await tx.tasks.create({
        data: {
          reference_id,
          title: title.trim(),
          description: description.trim(),
          attachment: attachment || null,
          organization_id: organizationId,
          property_id: property_id || null,
          room_id: room_id || null,
          created_by: staff.id
        }
      })

      // Create initial task status (Open)
      await tx.task_statuses.create({
        data: {
          task_id: task.id,
          state: 'Open'
        }
      })

      // Create initial task type
      await tx.task_types.create({
        data: {
          task_id: task.id,
          type: type as any,
          created_by: staff.id
        }
      })

      // Create initial task priority
      await tx.task_priorities.create({
        data: {
          task_id: task.id,
          priority: priority as any,
          created_by: staff.id
        }
      })

      // Create due date if provided
      if (due_date) {
        await tx.task_due_dates.create({
          data: {
            task_id: task.id,
            due_date: new Date(due_date),
            created_by: staff.id
          }
        })
      }

      return task
    })

    return NextResponse.json(
      {
        success: true,
        task: {
          id: result.id,
          reference_id: result.reference_id,
          title: result.title
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
