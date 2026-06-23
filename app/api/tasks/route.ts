'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

// Shared select for task queries
const taskSelect = {
  id: true,
  reference_id: true,
  title: true,
  description: true,
  created_at: true,
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
    orderBy: { created_at: 'desc' as const },
    take: 1
  },
  task_priorities: {
    orderBy: { created_at: 'desc' as const },
    take: 1
  },
  task_statuses: {
    orderBy: { created_at: 'desc' as const },
    take: 1
  },
  task_due_dates: {
    orderBy: { created_at: 'desc' as const },
    take: 1
  },
  task_assignments: {
    orderBy: { requested_at: 'desc' as const },
    take: 1,
    include: {
      staff_task_assignments_assigned_idTostaff: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_pic: true
        }
      },
      staff_task_assignments_assigner_idTostaff: {
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

// Transform task data to match Task type
function transformTask(task: any, currentUserId: string) {
  const creatorName = task.staff
    ? `${task.staff.first_name} ${task.staff.last_name || ''}`.trim()
    : 'Unknown'

  const property = task.properties?.code
  const room = task.rooms?.title
  const type = task.task_types[0]?.type || 'Miscellaneous/Others'
  const priority = task.task_priorities[0]?.priority || 'Medium'

  const rawStatus = task.task_statuses[0]?.state || 'Open'
  const statusMap: Record<string, string> = {
    Open: 'Open',
    In_Progress: 'In Progress',
    Resolved: 'Resolved'
  }
  const status = statusMap[rawStatus] || rawStatus

  const dueDate = task.task_due_dates[0]?.due_date

  // Get assignment info
  const assignment = task.task_assignments[0]
  const assignedStaff = assignment?.staff_task_assignments_assigned_idTostaff
  const assignerStaff = assignment?.staff_task_assignments_assigner_idTostaff
  const staffName = assignedStaff && assignment?.status === 'Accepted'
    ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
    : undefined
  const assignerName = assignerStaff
    ? `${assignerStaff.first_name} ${assignerStaff.last_name || ''}`.trim()
    : undefined

  // Check if current user has a pending assignment
  const hasPendingAssignment = assignment?.assigned_id === currentUserId && assignment?.status === 'Pending'

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
    assigner_name: assignerName,
    assigner_picture: assignerStaff?.profile_pic || undefined,
    assignment_timestamp: assignment?.responded_at?.toISOString(),
    status,
    has_pending_assignment: hasPendingAssignment
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'tasks.access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)

    // Pagination and search params
    const paginate = searchParams.get('paginate') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')?.trim() || ''
    const skipCount = searchParams.get('skipCount') === 'true'
    const statusFilter = searchParams.get('status')?.trim() || ''

    // Advanced filter params
    const taskIdFilter = searchParams.get('task_id')?.trim() || ''
    const typeFilter = searchParams.get('type')?.trim() || ''
    const priorityFilter = searchParams.get('priority')?.trim() || ''
    const propertyFilter = searchParams.get('property')?.trim() || ''
    const roomFilter = searchParams.get('room')?.trim() || ''
    const createdByFilter = searchParams.get('created_by')?.trim() || ''
    const assignedToFilter = searchParams.get('assigned_to')?.trim() || ''
    const assignedByFilter = searchParams.get('assigned_by')?.trim() || ''
    const dueDateFilter = searchParams.get('due_date')?.trim() || ''
    const dueMonth = searchParams.get('due_month')?.trim() || ''
    const dueMonthTimezoneOffset = parseInt(searchParams.get('due_month_timezone_offset') || '0', 10)
    const dueDateFrom = searchParams.get('dueDateFrom')?.trim() || ''
    const dueDateTo = searchParams.get('dueDateTo')?.trim() || ''

    // If paginate mode is enabled, use pagination/search logic
    if (paginate) {
      // Build base where clause
      const baseWhere: any = {
        organization_id: staff.organization_id
      }

      // Add search conditions
      if (search) {
        baseWhere.OR = [
          { reference_id: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { properties: { code: { contains: search, mode: 'insensitive' } } },
          { rooms: { title: { contains: search, mode: 'insensitive' } } },
          { staff: { first_name: { contains: search, mode: 'insensitive' } } },
          { staff: { last_name: { contains: search, mode: 'insensitive' } } }
        ]
      }

      // DB-level filters (can filter directly in Prisma WHERE)
      if (taskIdFilter) {
        baseWhere.reference_id = { contains: taskIdFilter, mode: 'insensitive' }
      }
      if (propertyFilter) {
        baseWhere.properties = { code: { contains: propertyFilter, mode: 'insensitive' } }
      }
      if (roomFilter) {
        baseWhere.rooms = { title: { contains: roomFilter, mode: 'insensitive' } }
      }
      if (createdByFilter) {
        baseWhere.staff = {
          OR: [
            { first_name: { contains: createdByFilter, mode: 'insensitive' } },
            { last_name: { contains: createdByFilter, mode: 'insensitive' } }
          ]
        }
      }

      // Check if we need frontend filtering (for fields that require latest from history tables)
      const needsStatusFiltering = statusFilter && statusFilter !== 'all' && statusFilter !== 'Pending My Assignment'
      const needsFrontendFiltering = needsStatusFiltering || typeFilter || priorityFilter || assignedToFilter || assignedByFilter || dueDateFilter || dueMonth || dueDateFrom || dueDateTo

      // Add status filter
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'Pending My Assignment') {
          // Special handling for "Pending My Assignment" filter - can filter in DB
          baseWhere.task_assignments = {
            some: {
              assigned_id: user.id,
              status: 'Pending'
            }
          }
        }
        // For Open/In Progress/Resolved: We can't filter by LATEST status in Prisma WHERE clause
        // So we fetch all tasks and filter after transformation
      }

      // Fetch tasks - if filtering by latest status, fetch all matching tasks
      const [tasks, totalBeforeFilter] = await Promise.all([
        prisma.tasks.findMany({
          where: baseWhere,
          select: taskSelect,
          orderBy: { created_at: 'desc' },
          // Only paginate if NOT filtering by latest status
          ...(needsFrontendFiltering ? {} : {
            skip: (page - 1) * limit,
            take: limit
          })
        }),
        skipCount ? Promise.resolve(-1) : prisma.tasks.count({ where: baseWhere })
      ])

      // Transform tasks
      let transformedTasks = tasks.map(task => transformTask(task, user.id))

      // Apply frontend filtering for fields that require latest from history tables
      if (needsFrontendFiltering) {
        // Status filter (Open, In Progress, Resolved)
        if (needsStatusFiltering) {
          transformedTasks = transformedTasks.filter(task => task.status === statusFilter)
        }

        // Type filter
        if (typeFilter) {
          transformedTasks = transformedTasks.filter(task => task.type === typeFilter)
        }

        // Priority filter
        if (priorityFilter) {
          transformedTasks = transformedTasks.filter(task => task.priority === priorityFilter)
        }

        // Assigned To filter (case-insensitive partial match)
        if (assignedToFilter) {
          const lowerFilter = assignedToFilter.toLowerCase()
          transformedTasks = transformedTasks.filter(task =>
            task.staff_name?.toLowerCase().includes(lowerFilter)
          )
        }

        // Assigned By filter (case-insensitive partial match)
        if (assignedByFilter) {
          const lowerFilter = assignedByFilter.toLowerCase()
          transformedTasks = transformedTasks.filter(task =>
            task.assigner_name?.toLowerCase().includes(lowerFilter)
          )
        }

        // Due Date filter (exact date match)
        if (dueDateFilter) {
          const filterDate = new Date(dueDateFilter).toDateString()
          transformedTasks = transformedTasks.filter(task => {
            if (!task.due_date) return false
            return new Date(task.due_date).toDateString() === filterDate
          })
        }

        // Due Month filter
        if (dueMonth) {
          const [year, month] = dueMonth.split('-').map(Number)
          const startUtc = Date.UTC(year, month - 1, 1) + dueMonthTimezoneOffset * 60 * 1000
          const endUtc = Date.UTC(year, month, 1) + dueMonthTimezoneOffset * 60 * 1000
          transformedTasks = transformedTasks.filter(task => {
            if (!task.due_date) return false
            const tDate = new Date(task.due_date).getTime()
            return tDate >= startUtc && tDate < endUtc
          })
        }

        // Due Date Range filter
        if (dueDateFrom || dueDateTo) {
          let startUtc: number | null = null
          let endUtc: number | null = null
          
          if (dueDateFrom) {
            const [year, month, day] = dueDateFrom.split('-').map(Number)
            startUtc = Date.UTC(year, month - 1, day) + dueMonthTimezoneOffset * 60 * 1000
          }
          if (dueDateTo) {
            const [year, month, day] = dueDateTo.split('-').map(Number)
            endUtc = Date.UTC(year, month - 1, day + 1) + dueMonthTimezoneOffset * 60 * 1000
          }

          transformedTasks = transformedTasks.filter(task => {
            if (!task.due_date) return false
            const tDate = new Date(task.due_date).getTime()
            if (startUtc !== null && tDate < startUtc) return false
            if (endUtc !== null && tDate >= endUtc) return false
            return true
          })
        }

        // Apply pagination after filtering
        const startIndex = (page - 1) * limit
        const paginatedTasks = transformedTasks.slice(startIndex, startIndex + limit)

        return NextResponse.json({
          success: true,
          data: paginatedTasks,
          total: transformedTasks.length,
          page,
          pageSize: limit
        })
      }

      return NextResponse.json({
        success: true,
        data: transformedTasks,
        total: totalBeforeFilter,
        page,
        pageSize: limit
      })
    }

    // Legacy mode: Fetch all tasks
    const tasks = await prisma.tasks.findMany({
      where: {
        organization_id: staff.organization_id
      },
      select: taskSelect,
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform tasks
    const transformedTasks = tasks.map(task => transformTask(task, user.id))

    return NextResponse.json(transformedTasks)
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
