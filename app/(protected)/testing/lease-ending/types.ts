// Types for Lease Ending Workflow

export type StaffMember = {
  id: string
  name: string
  avatar?: string
  role: 'Manager' | 'Staff' | 'Inspector' | 'Maintenance'
}

export type TaskStatus =
  | 'pending'
  | 'awaiting_response'
  | 'in_progress'
  | 'completed'
  | 'revision_requested'
  | 'cancelled'

export type TaskType =
  | 'inspection'
  | 'preparation'
  | 'refund_request'
  | 'refund_finalization'

export type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export type Assignment = {
  id: string
  assignerId: string
  assigneeId: string
  status: AssignmentStatus
  requestedAt: string
  respondedAt?: string
  cancelledAt?: string
}

export type TimelineEventType =
  | 'task_created'
  | 'assignment_sent'
  | 'assignment_accepted'
  | 'assignment_rejected'
  | 'assignment_self_assigned'
  | 'assignment_cancelled'
  | 'status_changed'
  | 'report_submitted'
  | 'comment'
  | 'preparation_tasks_created'
  | 'refund_decision'
  | 'revision_requested'

export type TaskTimelineEvent = {
  id: string
  type: TimelineEventType
  performerId: string
  performerName: string
  performerAvatar?: string
  date: string
  timestamp: number
  // Additional data based on event type
  data?: {
    assigneeName?: string
    assigneeId?: string
    assignerName?: string
    newStatus?: string
    message?: string
    attachment?: { name: string; url: string }
    preparationTaskCount?: number
    refundDecision?: 'full' | 'partial' | 'burn'
    refundAmount?: number
    charges?: { description: string; amount: number }[]
    rejectionReason?: string
    unassignReason?: string
    isSelfUnassign?: boolean
  }
}

export type InspectionFinding = 'ready' | 'needs_preparation'

export type RefundDecision = 'full' | 'partial' | 'burn'

export type PreparationTask = {
  id: string
  type: 'preparation'
  title: string
  description?: string
  status: TaskStatus
  assignment?: Assignment
  timelineEvents: TaskTimelineEvent[]
  createdAt: string
  completedAt?: string
  report?: {
    message: string
    attachment?: { name: string; url: string }
    submittedAt: string
    submittedBy: string
  }
}

export type RefundCharge = {
  id: string
  description: string
  amount: string
}

export type LeaseEndingTask = {
  id: string
  type: TaskType
  title: string
  description?: string
  status: TaskStatus
  assignment?: Assignment
  timelineEvents: TaskTimelineEvent[]
  createdAt: string
  completedAt?: string

  // Inspection specific
  inspectionFinding?: InspectionFinding
  inspectionReport?: {
    message: string
    attachment?: { name: string; url: string }
    submittedAt: string
    submittedBy: string
  }

  // Preparation tasks created from inspection
  preparationTasks?: PreparationTask[]

  // Refund specific
  refundDecision?: RefundDecision
  refundCharges?: RefundCharge[]
  originalDeposit?: number
  finalRefundAmount?: number
  tenantNote?: string
  refundReport?: {
    message: string
    attachment?: { name: string; url: string }
    submittedAt: string
    submittedBy: string
  }

  // Refund finalization specific
  reviewReport?: {
    message: string
    attachment?: { name: string; url: string }
    submittedAt: string
    submittedBy: string
    approved: boolean
    rejectionReason?: string
  }
}

export type LeaseEndingWorkflow = {
  id: string
  leaseId: string
  propertyName: string
  unitName: string
  tenantName: string
  tenantId: string
  depositAmount: number
  initiatedBy: string
  initiatedAt: string
  status: 'in_progress' | 'completed' | 'cancelled'

  // Tasks in the workflow
  inspectionTask: LeaseEndingTask
  preparationTasks: PreparationTask[]
  refundRequestTask?: LeaseEndingTask
  refundFinalizationTask?: LeaseEndingTask

  // Stats
  completedTasksCount: number
  totalTasksCount: number
}

export type WorkflowPhase =
  | 'inspection'
  | 'preparation'
  | 'refund_request'
  | 'refund_finalization'
  | 'completed'
