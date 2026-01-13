'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function POST (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { id: taskId } = await params
    const body = await request.json()
    const { report, attachment } = body

    // Validation
    if (!report || report.trim().length < 10) {
      return NextResponse.json(
        { error: 'Report must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Verify task exists and is a Preparation task
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
    if (currentType !== 'Preparation') {
      return NextResponse.json(
        { error: 'This is not a preparation task' },
        { status: 400 }
      )
    }

    const currentStatus = task.task_statuses[0]?.state
    if (currentStatus !== 'In_Progress') {
      return NextResponse.json(
        { error: 'Task must be In Progress to complete' },
        { status: 400 }
      )
    }

    const assignment = task.task_assignments[0]
    if (!assignment || assignment.assigned_id !== staff.id) {
      return NextResponse.json(
        { error: 'Only the assigned staff can complete this task' },
        { status: 400 }
      )
    }

    // Find the flow instance via flow_instance_id
    if (!task.flow_instance_id) {
      return NextResponse.json(
        { error: 'This task is not part of a flow' },
        { status: 400 }
      )
    }

    const flowInstance = await prisma.task_flow_instances.findFirst({
      where: { id: task.flow_instance_id },
      select: {
        id: true,
        flow_type: true,
        inspection_task_id: true,
        leases: {
          select: {
            id: true,
            reference_id: true
          }
        }
      }
    })

    if (!flowInstance) {
      return NextResponse.json(
        { error: 'Flow instance not found' },
        { status: 400 }
      )
    }

    const organizationId = staff.organization_id
    const priority = task.task_priorities[0]?.priority || 'Medium'
    const isPropertyNotReadyFlow = flowInstance.flow_type === 'Property_Not_Ready'

    // Only check refundable charges for Lease_Ending flow
    let hasRefundableDeposit = false
    let inspectorId = staff.id
    let refId = ''

    if (!isPropertyNotReadyFlow) {
      // Check if there are refundable charges for this lease
      const refundableCharges = await prisma.charges.findMany({
        where: {
          payments: {
            lease_id: flowInstance.leases?.id || '',
            type: 'Lease_Initial_Charges'
          },
          is_refunded: true
        },
        select: { amount: true }
      })
      hasRefundableDeposit =
        refundableCharges.length > 0 &&
        refundableCharges.reduce((sum, c) => sum + c.amount.toNumber(), 0) > 0

      // Get the original inspector (who created the flow) - BEFORE transaction
      const inspectionTask = await prisma.tasks.findUnique({
        where: { id: flowInstance.inspection_task_id || '' },
        select: { created_by: true }
      })
      inspectorId = inspectionTask?.created_by || staff.id

      // Get latest task reference ID - BEFORE transaction
      const currentYear = new Date().getFullYear()
      const yearPrefix = `TSK-${currentYear}`
      const latestTask = await prisma.tasks.findFirst({
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
      refId = `${yearPrefix}${nextSequence.toString().padStart(7, '0')}`
    }

    const result = await prisma.$transaction(
      async tx => {
        // 1. Create preparation report
        await tx.task_reports.create({
          data: {
            task_id: taskId,
            content: report.trim(),
            attachment: attachment || null,
            is_resolved: true,
            submitted_by: staff.id
          }
        })

        // 2. Set preparation task status to Resolved
        await tx.task_statuses.create({
          data: {
            task_id: taskId,
            state: 'Resolved'
          }
        })

        // 3. Check if ALL preparation tasks in this flow are now Resolved
        const allPrepTasks = await tx.tasks.findMany({
          where: { flow_instance_id: flowInstance.id },
          include: {
            task_statuses: { orderBy: { created_at: 'desc' }, take: 1 }
          }
        })

        const allResolved = allPrepTasks.every(
          t => t.task_statuses[0]?.state === 'Resolved'
        )

        let refundRequestTaskId: string | null = null

        if (allResolved) {
          // For Property_Not_Ready flow, just complete the flow and update status to Ready
          if (isPropertyNotReadyFlow) {
            // Complete the flow
            await tx.task_flow_instances.update({
              where: { id: flowInstance.id },
              data: { status: 'Completed' }
            })
          }
          // For Lease_Ending flow, create Refund Request task only if there are refundable deposits
          else if (hasRefundableDeposit) {
            const refundRequestTask = await tx.tasks.create({
              data: {
                reference_id: refId,
                title: `Refund Request - ${flowInstance.leases?.reference_id}`,
                description:
                  'Review inspection and preparation reports to determine refundable deposits refund amount.',
                organization_id: organizationId,
                property_id: task.property_id,
                room_id: task.room_id,
                created_by: staff.id,
                flow_instance_id: flowInstance.id
              }
            })

            // Auto-assign to inspector
            await tx.task_statuses.create({
              data: { task_id: refundRequestTask.id, state: 'In_Progress' }
            })

            await tx.task_types.create({
              data: {
                task_id: refundRequestTask.id,
                type: 'Refund_Request',
                created_by: staff.id
              }
            })

            await tx.task_priorities.create({
              data: {
                task_id: refundRequestTask.id,
                priority: priority as any,
                created_by: staff.id
              }
            })

            await tx.task_assignments.create({
              data: {
                task_id: refundRequestTask.id,
                assigner_id: staff.id,
                assigned_id: inspectorId,
                status: 'Accepted',
                responded_at: new Date(),
                responded_by: inspectorId
              }
            })

            // Update flow instance with refund request task
            await tx.task_flow_instances.update({
              where: { id: flowInstance.id },
              data: { refund_request_task_id: refundRequestTask.id }
            })

            refundRequestTaskId = refundRequestTask.id
          } else {
            // No refundable deposit - complete the flow directly
            await tx.task_flow_instances.update({
              where: { id: flowInstance.id },
              data: { status: 'Completed' }
            })
          }

          // Update property/room status to Ready
          if (task.room_id) {
            await tx.rooms.update({
              where: { id: task.room_id },
              data: { status: 'Ready' }
            })
          } else if (task.property_id) {
            await tx.properties.update({
              where: { id: task.property_id },
              data: { status: 'Ready' }
            })
          }
        }

        return { refundRequestTaskId }
      },
      {
        maxWait: 10000, // 10 seconds max wait to acquire a connection
        timeout: 30000 // 30 seconds timeout for the transaction
      }
    )

    return NextResponse.json({
      success: true,
      refundRequestTaskId: result.refundRequestTaskId
    })
  } catch (error: any) {
    console.error('Error completing preparation:', error)
    return NextResponse.json(
      { error: 'Failed to complete preparation' },
      { status: 500 }
    )
  }
}
