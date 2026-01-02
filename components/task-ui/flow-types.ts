import type { TaskStatus, FlowTaskType, TaskFlowType, PriorityLevel } from './types'

// Flow instance representing the entire workflow
export type FlowInstance = {
  id: string
  flowType: TaskFlowType
  leaseId?: string
  propertyId?: string
  roomId?: string
  status: 'In Progress' | 'Completed'
  inspectionTaskId?: string
  refundRequestTaskId?: string
  refundFinalizationTaskId?: string
  createdAt: string
  createdById?: string
}

// Summary of a task within a flow (for navigation)
export type FlowTaskSummary = {
  id: string
  title: string
  referenceId: string
  status: TaskStatus
  type: FlowTaskType
  isCurrent?: boolean
}

// Related tasks in a flow (for task details page navigation)
export type FlowRelatedTasks = {
  flowInstanceId: string
  flowType: TaskFlowType
  flowStatus: 'In Progress' | 'Completed'
  inspectionTask?: FlowTaskSummary
  preparationTasks: FlowTaskSummary[]
  refundRequestTask?: FlowTaskSummary
  refundFinalizationTask?: FlowTaskSummary
}

// Lease info for flow context
export type FlowLeaseInfo = {
  leaseId: string
  propertyName: string
  propertyCode: string
  roomTitle?: string
  tenantName: string
  depositAmount: number
}

// Preparation task data when creating from inspection
export type PreparationTaskInput = {
  title: string
  description: string
}

// Refund charge item
export type RefundCharge = {
  id: string
  description: string
  amount: number
}

// Refund decision types
export type RefundDecision = 'full' | 'partial' | 'forfeit'

// Inspection finding types
export type InspectionFinding = 'ready' | 'needs_preparation'

// Data stored in refund request report (as JSON in content field)
export type RefundRequestReportData = {
  decision: RefundDecision
  originalDeposit: number
  charges: RefundCharge[]
  totalCharges: number
  finalRefundAmount: number
  tenantNote?: string
}

// Props for initiate lease ending drawer
export type InitiateLeaseEndingFormData = {
  title: string
  description: string
  priority: PriorityLevel
  attachment?: string
  assignedStaffId: string
}
