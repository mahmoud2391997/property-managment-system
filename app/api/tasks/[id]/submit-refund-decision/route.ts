'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { id: taskId } = await params
    const body = await request.json()
    const { decision, charges, tenantNote, attachment } = body

    // Validation
    if (!decision || !['full', 'partial', 'forfeit'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    }

    if (decision === 'partial') {
      if (!charges || !Array.isArray(charges) || charges.length === 0) {
        return NextResponse.json({ error: 'Charges are required for partial refund' }, { status: 400 })
      }
      for (const charge of charges) {
        if (!charge.description || charge.description.trim().length < 3) {
          return NextResponse.json({ error: 'Each charge must have a description (min 3 chars)' }, { status: 400 })
        }
        if (typeof charge.amount !== 'number' || charge.amount <= 0) {
          return NextResponse.json({ error: 'Each charge must have a valid amount' }, { status: 400 })
        }
      }
    }

    // Verify task exists and is a Refund Request task
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: staff.organization_id
      },
      include: {
        task_types: { orderBy: { created_at: 'desc' }, take: 1 },
        task_statuses: { orderBy: { created_at: 'desc' }, take: 1 },
        task_assignments: {
          where: { status: 'Accepted', unassigned_at: null },
          take: 1
        },
        task_priorities: { orderBy: { created_at: 'desc' }, take: 1 }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const currentType = task.task_types[0]?.type
    if (currentType !== 'Refund_Request') {
      return NextResponse.json({ error: 'This is not a refund request task' }, { status: 400 })
    }

    const currentStatus = task.task_statuses[0]?.state
    if (currentStatus !== 'In_Progress' && currentStatus !== 'Needs_Modification') {
      return NextResponse.json({ error: 'Task must be In Progress or Needs Modification to submit' }, { status: 400 })
    }

    const assignment = task.task_assignments[0]
    if (!assignment || assignment.assigned_id !== staff.id) {
      return NextResponse.json({ error: 'Only the assigned staff can submit refund decision' }, { status: 400 })
    }

    // Find the flow instance via flow_instance_id
    if (!task.flow_instance_id) {
      return NextResponse.json({ error: 'This task is not part of a flow' }, { status: 400 })
    }

    const flowInstance = await prisma.task_flow_instances.findUnique({
      where: { id: task.flow_instance_id }
    })

    if (!flowInstance) {
      return NextResponse.json({ error: 'Flow instance not found' }, { status: 400 })
    }

    // Get refundable amount from initial charges (is_refunded = true means these ARE refundable)
    const refundableCharges = await prisma.charges.findMany({
      where: {
        payments: {
          lease_id: flowInstance.lease_id || '',
          type: 'Lease_Initial_Charges',
          status: 'Paid',
        },
        is_refunded: true
      },
      select: {
        amount: true
      }
    })

    const depositAmount = refundableCharges.reduce((sum, charge) => sum + charge.amount.toNumber(), 0)

    // Calculate refund amounts
    let totalCharges = 0
    if (decision === 'partial' && charges) {
      totalCharges = charges.reduce((sum: number, c: any) => sum + c.amount, 0)
    } else if (decision === 'forfeit') {
      totalCharges = depositAmount
    }

    const finalRefundAmount = Math.max(0, depositAmount - totalCharges)

    // Prepare report data
    const reportData = {
      decision,
      originalDeposit: depositAmount,
      charges: decision === 'partial' ? charges : [],
      totalCharges,
      finalRefundAmount,
      tenantNote: tenantNote || null,
      attachment: attachment || null
    }

    const organizationId = staff.organization_id
    const priority = task.task_priorities[0]?.priority || 'Medium'

    const result = await prisma.$transaction(async tx => {
      // 1. Create refund decision report
      await tx.task_reports.create({
        data: {
          task_id: taskId,
          content: JSON.stringify(reportData),
          attachment: attachment || null,
          is_resolved: true,
          submitted_by: staff.id
        }
      })

      // 2. Set refund request task status to Resolved
      await tx.task_statuses.create({
        data: {
          task_id: taskId,
          state: 'Resolved'
        }
      })

      let refundFinalizationTaskId: string | null = null

      // 3. Check if Refund Finalization task already exists (resubmission case)
      const existingFinalization = await tx.tasks.findFirst({
        where: {
          flow_instance_id: flowInstance.id,
          organization_id: organizationId
        },
        include: {
          task_types: { orderBy: { created_at: 'desc' }, take: 1 }
        }
      })

      const hasFinalizationTask = existingFinalization &&
        existingFinalization.task_types[0]?.type === 'Refund_Finalization'

      if (hasFinalizationTask) {
        // Resubmission case - just update existing finalization task to In_Progress
        await tx.task_statuses.create({
          data: {
            task_id: existingFinalization.id,
            state: 'In_Progress'
          }
        })
        refundFinalizationTaskId = existingFinalization.id
      } else {
        // First submission - create new Refund Finalization task
        const currentYear = new Date().getFullYear()
        const yearPrefix = `TSK-${currentYear}`

        const latestTask = await tx.tasks.findFirst({
          where: {
            organization_id: organizationId,
            reference_id: { startsWith: yearPrefix }
          },
          orderBy: { reference_id: 'desc' },
          select: { reference_id: true }
        })

        let nextSequence = 1
        if (latestTask) {
          const lastSequence = parseInt(latestTask.reference_id.slice(-7))
          nextSequence = lastSequence + 1
        }

        const refId = `${yearPrefix}${nextSequence.toString().padStart(7, '0')}`

        const refundFinalizationTask = await tx.tasks.create({
          data: {
            reference_id: refId,
            title: 'Refund Finalization - Review & Approve',
            description: 'Review the refund decision and approve or request modifications.',
            organization_id: organizationId,
            property_id: task.property_id,
            room_id: task.room_id,
            created_by: staff.id,
            flow_instance_id: flowInstance.id
          }
        })

        // Create status (Open - unassigned)
        await tx.task_statuses.create({
          data: { task_id: refundFinalizationTask.id, state: 'Open' }
        })

        // Create type (Refund Finalization)
        await tx.task_types.create({
          data: { task_id: refundFinalizationTask.id, type: 'Refund_Finalization', created_by: staff.id }
        })

        // Create priority (same as refund request)
        await tx.task_priorities.create({
          data: { task_id: refundFinalizationTask.id, priority: priority as any, created_by: staff.id }
        })

        // Update flow instance with refund finalization task
        await tx.task_flow_instances.update({
          where: { id: flowInstance.id },
          data: { refund_finalization_task_id: refundFinalizationTask.id }
        })

        refundFinalizationTaskId = refundFinalizationTask.id
      }

      return { refundFinalizationTaskId }
    })

    return NextResponse.json({
      success: true,
      refundFinalizationTaskId: result.refundFinalizationTaskId
    })
  } catch (error: any) {
    console.error('Error submitting refund decision:', error)
    return NextResponse.json({ error: 'Failed to submit refund decision' }, { status: 500 })
  }
}
