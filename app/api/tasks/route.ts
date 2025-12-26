'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only staff can access tasks
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const organizationId = staff.organization_id

    // Fetch tasks with related data
    const tasks = await prisma.tasks.findMany({
      where: {
        organization_id: organizationId
      },
      include: {
        properties: {
          select: { id: true, code: true }
        },
        rooms: {
          select: { id: true, title: true }
        },
        staff: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_pic: true
          }
        },
        task_types: {
          orderBy: { created_at: 'desc' },
          take: 1
        },
        task_priorities: {
          orderBy: { created_at: 'desc' },
          take: 1
        },
        task_statuses: {
          orderBy: { created_at: 'desc' },
          take: 1
        },
        task_due_dates: {
          orderBy: { created_at: 'desc' },
          take: 1
        },
        task_assignments: {
          where: {
            status: 'Accepted'
          },
          orderBy: { requested_at: 'desc' },
          take: 1,
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
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform data to match Task type
    const transformedTasks = tasks.map(task => {
      // Get creator name
      const creatorName = task.staff
        ? `${task.staff.first_name} ${task.staff.last_name || ''}`.trim()
        : 'Unknown'

      // Get property and room
      const property = task.properties?.code
      const room = task.rooms?.title

      // Get latest type
      const type = task.task_types[0]?.type || 'Miscellaneous/Others'

      // Get latest priority
      const priority = task.task_priorities[0]?.priority || 'Medium'

      // Get latest status and map to display format
      const rawStatus = task.task_statuses[0]?.state || 'Open'
      const statusMap: Record<string, string> = {
        Open: 'Open',
        In_Progress: 'In Progress',
        Resolved: 'Resolved'
      }
      const status = statusMap[rawStatus] || rawStatus

      // Get latest due date
      const dueDate = task.task_due_dates[0]?.due_date

      // Get assigned staff
      const assignment = task.task_assignments[0]
      const assignedStaff = assignment?.staff_task_assignments_assigned_idTostaff
      const staffName = assignedStaff
        ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
        : undefined

      return {
        id: task.reference_id,
        task_id: task.id,
        type,
        priority,
        title: task.title,
        description: task.description,
        property,
        room,
        due_date: dueDate?.toISOString(),
        created_by_name: creatorName,
        created_by_picture: task.staff?.profile_pic || undefined,
        created_at: task.created_at.toISOString(),
        staff_name: staffName,
        staff_picture: assignedStaff?.profile_pic || undefined,
        assignment_timestamp: assignment?.responded_at?.toISOString(),
        status
      }
    })

    return NextResponse.json(transformedTasks)
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
