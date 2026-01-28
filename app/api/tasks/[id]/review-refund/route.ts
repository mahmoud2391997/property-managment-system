'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import {
  ReviewRefundRequestBody,
  ReviewRefundResponse
} from '@/types/api/task-flow-api.types'

export async function POST (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ReviewRefundResponse>> {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { id: taskId } = await params
    const body: ReviewRefundRequestBody = await request.json()
    const { approved, report, attachment, paymentMethod } = body

    // Validation
    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Approved status is required' },
        { status: 400 }
      )
    }

    if (!report || report.trim().length < 10) {
      return NextResponse.json(
        { error: 'Report must be at least 10 characters' },
        { status: 400 }
      )
    }

    if (approved && !paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required when approving refund' },
        { status: 400 }
      )
    }

    if (
      approved &&
      paymentMethod &&
      !['Cash', 'Bank Transfer'].includes(paymentMethod)
    ) {
      return NextResponse.json(
        { error: 'Payment method must be Cash or Bank Transfer' },
        { status: 400 }
      )
    }

    // Verify task exists and is a Refund Finalization task
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId
      },
      include: {
        task_types: { orderBy: { created_at: 'desc' }, take: 1 },
        task_statuses: { orderBy: { created_at: 'desc' }, take: 1 },
        task_assignments: {
          where: { status: 'Accepted', unassigned_at: null },
          take: 1
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const currentType = task.task_types[0]?.type
    if (currentType !== 'Refund_Finalization') {
      return NextResponse.json(
        { error: 'This is not a refund finalization task' },
        { status: 400 }
      )
    }

    const currentStatus = task.task_statuses[0]?.state
    if (currentStatus !== 'In_Progress') {
      return NextResponse.json(
        { error: 'Task must be In Progress to review' },
        { status: 400 }
      )
    }

    const assignment = task.task_assignments[0]
    if (!assignment || assignment.assigned_id !== staff.id) {
      return NextResponse.json(
        { error: 'Only the assigned staff can review this task' },
        { status: 400 }
      )
    }

    const flowInstance = await prisma.task_flow_instances.findUnique({
      select: { id: true, lease_id: true, property_id: true, refund_request_task_id: true },
      where: { refund_finalization_task_id: taskId }
    })

    // Find the flow instance
    if (!flowInstance) {
      return NextResponse.json(
        { error: 'This task is not part of a flow' },
        { status: 400 }
      )
    }

    if (!flowInstance) {
      return NextResponse.json(
        { error: 'Flow instance not found' },
        { status: 400 }
      )
    }

    if (!flowInstance.refund_request_task_id) {
      return NextResponse.json(
        { error: 'Refund request task not found in flow' },
        { status: 400 }
      )
    }

    if (!flowInstance.lease_id) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 400 })
    }

    // Get the latest refund decision for this refund request task
    const latestRefundDecision = await prisma.refund_decisions.findFirst({
      where: { task_id: flowInstance.refund_request_task_id },
      orderBy: { submitted_at: 'desc' },
      include: {
        refunded_charges: true
      }
    })

    if (!latestRefundDecision) {
      return NextResponse.json(
        { error: 'No refund decision found for this refund request' },
        { status: 400 }
      )
    }

    // Check if already approved
    const alreadyApproved = await prisma.refund_decisions.findFirst({
      where: {
        task_id: flowInstance.refund_request_task_id,
        status: 'approved'
      }
    })

    if (alreadyApproved) {
      return NextResponse.json(
        { error: 'Lease has already been refunded' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async tx => {
      if (approved) {
        // Generate expense reference_id
        const currentYear = new Date().getFullYear()
        const yearPrefix = `XP-${currentYear}`

        // Get the latest expense for this year and organization
        const latestExpense = await tx.expenses.findFirst({
          where: {
            organization_id: staff.organization_id,
            reference_id: {
              startsWith: yearPrefix
            }
          },
          orderBy: {
            reference_id: 'desc'
          },
          select: {
            reference_id: true
          }
        })

        let nextSequence = 1
        if (latestExpense) {
          // Extract the last 8 digits and increment
          const lastSequence = parseInt(latestExpense.reference_id.slice(-8))
          nextSequence = lastSequence + 1
        }

        // Format: XP-YYYY00000001
        const expense_reference_id = `${yearPrefix}${nextSequence
          .toString()
          .padStart(8, '0')}`
        // APPROVED: Complete the flow

        // 1. Set finalization task status to Resolved
        await tx.task_statuses.create({
          data: {
            task_id: taskId,
            state: 'Resolved'
          }
        })

        // 2. Create review report (approved)
        await tx.task_reports.create({
          data: {
            task_id: taskId,
            content: report.trim(),
            attachment: attachment || null,
            is_resolved: true,
            submitted_by: staff.id
          }
        })

        // 3. Update flow status to Completed
        await tx.task_flow_instances.update({
          where: { id: flowInstance.id },
          data: { status: 'Completed' }
        })

        // 4. Update refund decision status to approved
        await tx.refund_decisions.update({
          where: { id: latestRefundDecision.id },
          data: {
            status: 'approved',
            reviewed_by: staff.id,
            reviewed_at: new Date()
          }
        })

        // 5. Create expense & payment history
        // Create single charge for the refund amount (not the deductions)
        const refundExpense = await tx.expenses.create({
          data: {
            reference_id: expense_reference_id,
            category: 'Property_Related',
            status: 'Paid',
            due_payment_date: null,
            organization_id: staff.organization_id,
            created_by: staff.id,
            charges: {
              create: {
                title: 'Deposit Refund',
                amount: latestRefundDecision.final_refund_amount.toNumber(),
                is_refunded: false
              }
            },
            payment_history: {
              create: {
                amount: latestRefundDecision.final_refund_amount.toNumber(),
                payment_method:
                  paymentMethod === 'Bank Transfer' ? 'Bank_Transfer' : 'Cash',
                paid_at: new Date(),
                registrar_role: 'staff',
                registrar: staff.id,
                status: 'Success'
              }
            }
          }
        })

        // Create property_expenses subtype record
        await tx.property_expenses.create({
          data: {
            id: refundExpense.id,
            type: 'Refund',
            property_id: flowInstance.property_id,
            lease_id: flowInstance.lease_id
          }
        })
        return { approved: true }
      } else {
        // REJECTED: Send refund request back to Needs Modification

        // 1. Create review report (rejected)
        await tx.task_reports.create({
          data: {
            task_id: taskId,
            content: report.trim(),
            attachment: attachment || null,
            is_resolved: false,
            submitted_by: staff.id
          }
        })

        // 2. Set finalization task status to Needs Modification
        await tx.task_statuses.create({
          data: {
            task_id: taskId,
            state: 'Needs_Modification'
          }
        })

        // 3. Update refund decision status to rejected
        await tx.refund_decisions.update({
          where: { id: latestRefundDecision.id },
          data: {
            status: 'rejected',
            reviewed_by: staff.id,
            reviewed_at: new Date()
          }
        })

        // 4. Set Refund Request task status to Needs Modification
        await tx.task_statuses.create({
          data: {
            task_id: flowInstance.refund_request_task_id || '',
            state: 'Needs_Modification'
          }
        })

        return { approved: false }
      }
    })

    return NextResponse.json({
      success: true,
      approved: result.approved
    })
  } catch (error: any) {
    console.error('Error reviewing refund:', error)
    return NextResponse.json(
      { error: 'Failed to review refund' },
      { status: 500 }
    )
  }
}
