'use client'

import { createContext, useContext, ReactNode } from 'react'
import type {
  TaskDetail,
  StaffMember,
  TaskType,
  PriorityLevel,
  TimelineEvent
} from '@/components/task-ui/types'
import type {
  InspectionFinding,
  PreparationTaskInput,
  RefundCharge
} from '@/components/task-ui/flow-types'
import type {
  SubmitRefundDecisionRequestBody,
  ReviewRefundRequestBody
} from '@/types/api/task-flow-api.types'

// Flow task submission types
export interface InspectionSubmitData {
  finding: InspectionFinding
  report: string
  attachment?: File
  preparationTasks?: PreparationTaskInput[]
}

export interface PreparationSubmitData {
  report: string
  attachment?: File
}

// Client-side types with File objects (before conversion to URLs)
export interface RefundDecisionSubmitData {
  decision: SubmitRefundDecisionRequestBody['decision']
  charges?: RefundCharge[]
  report: string
  attachment?: File
}

export interface RefundReviewSubmitData {
  approved: boolean
  report: string
  attachment?: File
  paymentMethod?: ReviewRefundRequestBody['paymentMethod']
}

export interface CommentData {
  id: string
  message: string
  attachment: string | null
  createdAt: string
  senderName: string
  senderAvatar?: string
}

export interface TaskContextType {
  // Core state
  task: TaskDetail | null
  taskId: string
  staffList: StaffMember[]
  currentStaff: StaffMember | null
  loading: boolean
  error: string | null
  actionLoading: string | null

  // Computed values
  isFlowTask: boolean
  hasPendingForMe: boolean

  // Core task handlers
  handleTypeChange: (type: TaskType) => Promise<void>
  handlePriorityChange: (priority: PriorityLevel) => Promise<void>
  handleAssign: (staffId: string, isSelfAssign: boolean) => Promise<void>
  handleAcceptAssignment: () => Promise<void>
  handleRejectAssignment: (reason: string) => Promise<void>
  handleUnassign: (reason: string) => Promise<void>
  handleCancelAssignment: (reason: string) => Promise<void>
  handleResolve: (report: string, attachmentFile?: File) => Promise<void>
  handleCommentAdded: (comment: CommentData) => void

  // Due date handlers
  handleDueDateSet: (dueDate: string) => Promise<void>
  handleDueDateChange: (newDueDate: string, reason: string) => Promise<void>
  handleDueDateRemove: (reason: string) => Promise<void>

  // Flow task handlers
  handleCompleteInspection: (data: InspectionSubmitData) => Promise<void>
  handleCompletePreparation: (data: PreparationSubmitData) => Promise<void>
  handleSubmitRefundDecision: (data: RefundDecisionSubmitData) => Promise<void>
  handleReviewRefund: (data: RefundReviewSubmitData) => Promise<void>

  // Dialog states
  showInspectionDialog: boolean
  setShowInspectionDialog: (open: boolean) => void
  showPreparationDialog: boolean
  setShowPreparationDialog: (open: boolean) => void
  showRefundDecisionDialog: boolean
  setShowRefundDecisionDialog: (open: boolean) => void
  showReviewRefundDialog: boolean
  setShowReviewRefundDialog: (open: boolean) => void

  // Refresh function
  refreshTask: () => Promise<void>
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined)

export const TaskProvider = ({
  children,
  value
}: {
  children: ReactNode
  value: TaskContextType
}) => <TaskContext.Provider value={value}>{children}</TaskContext.Provider>

export const useTask = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider')
  }
  return context
}