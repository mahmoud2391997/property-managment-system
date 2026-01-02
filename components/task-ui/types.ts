// Regular task types (can be created/selected normally)
export const REGULAR_TASK_TYPES = [
  'Maintenance',
  'Renovation',
  'Cleaning',
  'Administrative',
  'Documentation',
  'Data Entry',
  'Accounting',
  'Legal',
  'IT Support',
  'Follow Up',
  'Complaint Handling',
  'Miscellaneous/Others'
] as const

// Flow task types (auto-generated, not selectable in normal task creation)
export const FLOW_TASK_TYPES = [
  'Inspection',
  'Preparation',
  'Refund_Request',
  'Refund_Finalization'
] as const

// All task types combined
export const TASK_TYPES = [...REGULAR_TASK_TYPES, ...FLOW_TASK_TYPES] as const

export type RegularTaskType = (typeof REGULAR_TASK_TYPES)[number]
export type FlowTaskType = (typeof FLOW_TASK_TYPES)[number]
export type TaskType = (typeof TASK_TYPES)[number]

// Priority levels
export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'] as const
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number]

// Task status
export const TASK_STATUSES = ['Open', 'In Progress', 'Resolved', 'Needs Modification'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

// Staff member
export type StaffMember = {
  id: string
  name: string
  avatar?: string
  role?: string
}

// Assignment
export type Assignment = {
  id: string
  staffId: string
  staffName: string
  staffAvatar?: string
  status: 'pending' | 'accepted' | 'rejected'
  assignerId: string
  assignerName: string
  assignerAvatar?: string
  requestedAt: string
  respondedAt?: string
  rejectionReason?: string
}

// Timeline event types
export type TimelineEventType =
  | 'task_created'
  | 'assignment_sent'
  | 'assignment_accepted'
  | 'assignment_rejected'
  | 'assignment_self_assigned'
  | 'assignment_unassigned'
  | 'assignment_cancelled'
  | 'status_changed'
  | 'type_changed'
  | 'priority_changed'
  | 'comment'
  | 'report_submitted'
  | 'due_date_set'
  | 'due_date_changed'
  | 'due_date_removed'

// Timeline event
export type TimelineEvent = {
  id: string
  type: TimelineEventType
  performerId: string
  performerName: string
  performerAvatar?: string
  timestamp: string
  // Context-specific fields
  message?: string
  attachment?: {
    name: string
    url: string
  }
  // For assignment events
  assignerName?: string
  assignerAvatar?: string
  assignedName?: string
  assignedAvatar?: string
  rejectionReason?: string
  unassignedByName?: string
  unassignReason?: string
  cancelledByName?: string
  cancelReason?: string
  // For status/type/priority changes
  oldValue?: string
  newValue?: string
  // For due date
  dueDate?: string
  oldDueDate?: string
  dueDateReason?: string
}

// Location info (matches schema: project -> property -> room)
export type TaskLocation = {
  // Project level
  projectId?: string
  projectName?: string
  projectState?: string
  // Property level
  propertyId?: string
  propertyCode?: string
  propertyCity?: string
  // Room level (optional - only if task is room-specific)
  roomId?: string
  roomTitle?: string
}

// Flow types
export type TaskFlowType = 'Lease Ending' | 'Property Not Ready'

// Flow task summary for navigation
export type FlowTaskSummaryForNav = {
  id: string
  referenceId: string
  title: string
  status: TaskStatus
  type: FlowTaskType | string
  isCurrent?: boolean
}

// Flow lease info
export type FlowLeaseInfoForTask = {
  id: string
  depositAmount: number
  propertyCode?: string
  roomTitle?: string
  tenantName: string
}

// Flow info attached to task
export type TaskFlowInfo = {
  flowInstanceId: string
  flowType: string
  flowStatus: 'In Progress' | 'Completed'
  relatedTasks: FlowTaskSummaryForNav[]
  leaseInfo?: FlowLeaseInfoForTask
}

// Task
export type TaskDetail = {
  id: string
  referenceId: string
  title: string
  description: string
  type: TaskType
  priority: PriorityLevel
  status: TaskStatus
  createdAt: string
  createdById: string
  createdByName: string
  createdByAvatar?: string
  dueDate?: string
  // Location context (optional)
  location?: TaskLocation
  // Assignment
  assignment?: Assignment
  pendingAssignment?: Assignment
  // Timeline
  timeline: TimelineEvent[]
  // Report (for resolution)
  report?: {
    content: string
    attachment?: {
      name: string
      url: string
    }
    submittedAt: string
    submittedById: string
    submittedByName: string
    isResolved?: boolean
  }
  // Current staff viewing
  currentStaff?: StaffMember
  // Flow task fields
  flowInstanceId?: string
  flowType?: TaskFlowType
  isFlowTask?: boolean
  flowInfo?: TaskFlowInfo
}

// Helper functions
export function getPriorityColor(priority: PriorityLevel): string {
  switch (priority) {
    case 'Low':
      return 'bg-neutral-100 text-neutral-700'
    case 'Medium':
      return 'bg-blue-100 text-blue-700'
    case 'High':
      return 'bg-amber-100 text-amber-700'
    case 'Urgent':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-neutral-100 text-neutral-700'
  }
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'Open':
      return 'bg-neutral-100 text-neutral-700'
    case 'In Progress':
      return 'bg-blue-100 text-blue-700'
    case 'Resolved':
      return 'bg-green-100 text-green-700'
    case 'Needs Modification':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-neutral-100 text-neutral-700'
  }
}

export function formatDate(date: string): string {
  const now = new Date()
  const dateObj = new Date(date)
  const diffMs = now.getTime() - dateObj.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

export function formatDateTime(date: string): string {
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
