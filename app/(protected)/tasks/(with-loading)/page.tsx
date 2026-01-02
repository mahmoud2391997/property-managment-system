export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import TasksSection from '@/components/tasks-section'
import { Task } from '@/types'

async function getTasks(): Promise<Task[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return []
    }

    const tasks = await prisma.tasks.findMany({
      where: {
        organization_id: staff.organization_id
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

    return tasks.map(task => {
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
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
}

const Tasks = async () => {
  const tasks = await getTasks()

  return <TasksSection initialTasks={tasks} />
}

export default Tasks
