/**
 * Shared API types for task flow endpoints
 * Used by both client and server to ensure type safety
 */

import { RefundDecision } from '@/components/task-ui/flow-types'

// ============================================
// SUBMIT REFUND DECISION ENDPOINT
// ============================================

export type SubmitRefundDecisionRequestBody = {
  decision: RefundDecision
  charges?: Array<{
    id: string
    description: string
    amount: number
  }>
  report: string
  attachment?: string
}

export type SubmitRefundDecisionResponse = {
  success: true
  refundFinalizationTaskId: string | null
} | {
  error: string
}

// ============================================
// REVIEW REFUND ENDPOINT
// ============================================

export type ReviewRefundRequestBody = {
  approved: boolean
  report: string
  attachment?: string
  paymentMethod?: 'Cash' | 'Bank Transfer'
}

export type ReviewRefundResponse = {
  success: true
  approved: boolean
} | {
  error: string
}
