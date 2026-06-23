export const dynamic = 'force-dynamic'

import TasksSection from '@/components/sections/tasks-section'
import { Task } from '@/types'
import { requirePermission } from '@/lib/server-permissions'

const PAGE_SIZE = 10

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
      }
    }
  }
}

async function getTasks(): Promise<{ data: Task[]; total: number }> {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], total: 0 }
    }

    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return { data: [], total: 0 }
    }

    const whereClause = {
      organization_id: staff.organization_id
    }

    // Fetch first page of tasks and total count in parallel
    const [tasks, total] = await Promise.all([
      prisma.tasks.findMany({
        where: whereClause,
        select: taskSelect,
        orderBy: { created_at: 'desc' },
        take: PAGE_SIZE
      }),
      prisma.tasks.count({ where: whereClause })
    ])

    // Map enum values to display format (underscores to spaces)
    const typeMap: Record<string, Task['type']> = {
      Inspection: 'Inspection',
      Preparation: 'Preparation',
      Refund_Request: 'Refund Request',
      Refund_Finalization: 'Refund Finalizatoin',
      Maintenance: 'Maintenance',
      Renovation: 'Renovation',
      Cleaning: 'Cleaning',
      Administrative: 'Administrative',
      Documentation: 'Documentation',
      Data_Entry: 'Data Entry',
      Accounting: 'Accounting',
      Legal: 'Legal',
      IT_Support: 'IT Support',
      Follow_Up: 'Follow Up',
      Complaint_Handling: 'Complaint Handling',
      'Miscellaneous/Others': 'Miscellaneous/Others'
    }

    const statusMap: Record<string, Task['status']> = {
      Open: 'Open',
      In_Progress: 'In Progress',
      Resolved: 'Resolved'
    }

    return {
      data: tasks.map(task => {
        const creatorName = task.staff
          ? `${task.staff.first_name} ${task.staff.last_name || ''}`.trim()
          : 'Unknown'

        const property = task.properties?.code
        const room = task.rooms?.title
        const rawType = task.task_types[0]?.type || 'Miscellaneous/Others'
        const type = typeMap[rawType] || 'Miscellaneous/Others'
        const priority = task.task_priorities[0]?.priority || 'Medium'

        const rawStatus = task.task_statuses[0]?.state || 'Open'
        const status = statusMap[rawStatus] || 'Open'

        const dueDate = task.task_due_dates[0]?.due_date
        const assignment = task.task_assignments[0]
        const assignedStaff = assignment?.staff_task_assignments_assigned_idTostaff
        const staffName = assignedStaff && assignment?.status === 'Accepted'
          ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
          : undefined

        // Check if current user has a pending assignment
        const hasPendingAssignment = assignment?.assigned_id === user.id && assignment?.status === 'Pending'

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
          status,
          has_pending_assignment: hasPendingAssignment
        }
      }),
      total
    }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return { data: [], total: 0 }
  }
}

const Tasks = async () => {
  await requirePermission('tasks.access')
  const { data: initialData, total: initialTotal } = await getTasks()

  return (
    <div className='flex flex-col gap-2.5 h-full'>
      <div>
        <h1>Tasks</h1>
      </div>
      <TasksSection initialData={initialData} initialTotal={initialTotal} />
    </div>
  )
}

export default Tasks
