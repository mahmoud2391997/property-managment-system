import {
  StaffMember,
  LeaseEndingWorkflow,
  LeaseEndingTask,
  PreparationTask,
  TaskTimelineEvent
} from './types'

// Staff members for testing
export const staffMembers: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Ahmad Razak',
    role: 'Manager',
    avatar: undefined
  },
  {
    id: 'staff-2',
    name: 'Sarah Chen',
    role: 'Inspector',
    avatar: undefined
  },
  {
    id: 'staff-3',
    name: 'Kumar Raj',
    role: 'Maintenance',
    avatar: undefined
  },
  {
    id: 'staff-4',
    name: 'Lisa Wong',
    role: 'Staff',
    avatar: undefined
  },
  {
    id: 'staff-5',
    name: 'John Doe',
    role: 'Maintenance',
    avatar: undefined
  }
]

// Helper to format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Initial workflow data - User is at Inspection task, still inspecting
export const initialWorkflowData: LeaseEndingWorkflow = {
  id: 'workflow-1',
  leaseId: 'lease-123',
  propertyName: 'Greenwood Apartments',
  unitName: 'Unit 4B',
  tenantName: 'Michael Tan',
  tenantId: 'tenant-1',
  depositAmount: 3000,
  initiatedBy: 'staff-1',
  initiatedAt: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
  status: 'in_progress',

  inspectionTask: {
    id: 'task-inspection-1',
    type: 'inspection',
    title: 'Inspection',
    description: 'Conduct property inspection before lease ends to assess condition and identify any damages or issues.',
    status: 'in_progress',
    assignment: {
      id: 'assign-1',
      assignerId: 'staff-1',
      assigneeId: 'staff-2',
      status: 'accepted',
      requestedAt: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      respondedAt: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000))
    },
    timelineEvents: [
      {
        id: 'event-1',
        type: 'task_created',
        performerId: 'staff-1',
        performerName: 'Ahmad Razak',
        date: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        data: {
          message: 'Conduct property inspection before lease ends to assess condition and identify any damages or issues.'
        }
      },
      {
        id: 'event-2',
        type: 'assignment_sent',
        performerId: 'staff-1',
        performerName: 'Ahmad Razak',
        date: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 1000,
        data: {
          assigneeName: 'Sarah Chen',
          assigneeId: 'staff-2'
        }
      },
      {
        id: 'event-3',
        type: 'assignment_accepted',
        performerId: 'staff-2',
        performerName: 'Sarah Chen',
        date: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)),
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
      },
      {
        id: 'event-4',
        type: 'status_changed',
        performerId: 'system',
        performerName: 'System',
        date: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)),
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 1000,
        data: {
          newStatus: 'In Progress'
        }
      }
    ],
    createdAt: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
  },

  preparationTasks: [],

  completedTasksCount: 0,
  totalTasksCount: 1
}

// Function to create a new timeline event
export const createTimelineEvent = (
  type: TaskTimelineEvent['type'],
  performer: StaffMember,
  data?: TaskTimelineEvent['data']
): TaskTimelineEvent => {
  const now = new Date()
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    performerId: performer.id,
    performerName: performer.name,
    performerAvatar: performer.avatar,
    date: formatDate(now),
    timestamp: now.getTime(),
    data
  }
}

// Function to create a preparation task
export const createPreparationTask = (
  title: string,
  description: string,
  creatorId: string,
  creatorName: string
): PreparationTask => {
  const now = new Date()
  return {
    id: `prep-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'preparation',
    title,
    description,
    status: 'pending',
    timelineEvents: [
      {
        id: `event-${Date.now()}`,
        type: 'task_created',
        performerId: creatorId,
        performerName: creatorName,
        date: formatDate(now),
        timestamp: now.getTime(),
        data: { message: description }
      }
    ],
    createdAt: formatDate(now)
  }
}

// Function to create refund request task
export const createRefundRequestTask = (
  creatorId: string,
  creatorName: string,
  depositAmount: number
): LeaseEndingTask => {
  const now = new Date()
  return {
    id: `task-refund-${Date.now()}`,
    type: 'refund_request',
    title: 'Refund Request',
    description: 'Review preparation reports and decide on refund amount.',
    status: 'pending',
    timelineEvents: [
      {
        id: `event-${Date.now()}`,
        type: 'task_created',
        performerId: 'system',
        performerName: 'System',
        date: formatDate(now),
        timestamp: now.getTime(),
        data: { message: 'Refund request task created automatically after property is ready.' }
      }
    ],
    createdAt: formatDate(now),
    originalDeposit: depositAmount,
    refundCharges: []
  }
}

// Function to create refund finalization task
export const createRefundFinalizationTask = (
  assigneeId: string,
  assigneeName: string
): LeaseEndingTask => {
  const now = new Date()
  return {
    id: `task-finalization-${Date.now()}`,
    type: 'refund_finalization',
    title: 'Refund Finalization',
    description: 'Review and approve or reject the refund request.',
    status: 'pending',
    timelineEvents: [
      {
        id: `event-${Date.now()}`,
        type: 'task_created',
        performerId: 'system',
        performerName: 'System',
        date: formatDate(now),
        timestamp: now.getTime(),
        data: { message: 'Refund finalization task created for review.' }
      }
    ],
    createdAt: formatDate(now)
  }
}
