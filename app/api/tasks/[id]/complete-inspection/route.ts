'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function POST (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()
    if (error) return error

    if (!hasPermission(permissions, 'tasks.update'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: taskId } = await params
    const body = await request.json()
    const { finding, report, attachment, preparationTasks } = body

    // Validation
    if (!finding || !['ready', 'needs_preparation'].includes(finding)) {
      return NextResponse.json({ error: 'Invalid finding' }, { status: 400 })
    }

    if (!report || report.trim().length < 10) {
      return NextResponse.json(
        { error: 'Report must be at least 10 characters' },
        { status: 400 }
      )
    }

    if (finding === 'needs_preparation') {
      if (
        !preparationTasks ||
        !Array.isArray(preparationTasks) ||
        preparationTasks.length === 0
      ) {
        return NextResponse.json(
          { error: 'At least one preparation task is required' },
          { status: 400 }
        )
      }
      for (const task of preparationTasks) {
        if (!task.title || task.title.trim().length < 5) {
          return NextResponse.json(
            { error: 'Each preparation task must have a title (min 5 chars)' },
            { status: 400 }
          )
        }
        if (!task.description || task.description.trim().length < 10) {
          return NextResponse.json(
            {
              error:
                'Each preparation task must have a description (min 10 chars)'
            },
            { status: 400 }
          )
        }
      }
    }

    // Verify task exists and is an Inspection task
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
    if (currentType !== 'Inspection') {
      return NextResponse.json(
        { error: 'This is not an inspection task' },
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

    // Find the flow instance
    const flowInstance = await prisma.task_flow_instances.findFirst({
      where: { inspection_task_id: taskId },
      select: {
        id: true,
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
    const hasRefundableDeposit =
      refundableCharges.length > 0 &&
      refundableCharges.reduce((sum, c) => sum + c.amount.toNumber(), 0) > 0

    // Generate reference IDs for new tasks
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

    const result = await prisma.$transaction(async tx => {
      // 1. Create inspection report
      await tx.task_reports.create({
        data: {
          task_id: taskId,
          content: report.trim(),
          attachment: attachment || null,
          is_resolved: true,
          submitted_by: staff.id
        }
      })

      // 2. Set inspection task status to Resolved
      await tx.task_statuses.create({
        data: {
          task_id: taskId,
          state: 'Resolved'
        }
      })

      let nextTaskId: string | null = null

      if (finding === 'needs_preparation') {
        // Create preparation tasks
        const createdPrepTasks: string[] = []

        for (let i = 0; i < preparationTasks.length; i++) {
          const prepTask = preparationTasks[i]
          const refId = `${yearPrefix}${(nextSequence + i)
            .toString()
            .padStart(7, '0')}`

          const newTask = await tx.tasks.create({
            data: {
              reference_id: refId,
              title: prepTask.title.trim(),
              description: prepTask.description.trim(),
              organization_id: organizationId,
              property_id: task.property_id,
              room_id: task.room_id,
              created_by: staff.id,
              flow_instance_id: flowInstance.id
            }
          })

          // Create status (Open - unassigned)
          await tx.task_statuses.create({
            data: { task_id: newTask.id, state: 'Open' }
          })

          // Create type (Preparation)
          await tx.task_types.create({
            data: {
              task_id: newTask.id,
              type: 'Preparation',
              created_by: staff.id
            }
          })

          // Create priority (same as inspection)
          await tx.task_priorities.create({
            data: {
              task_id: newTask.id,
              priority: priority as any,
              created_by: staff.id
            }
          })

          createdPrepTasks.push(newTask.id)
        }

        // Update property/room status to Under_Preparation
        if (task.room_id) {
          await tx.rooms.update({
            where: { id: task.room_id },
            data: { status: 'Under_Preparation' }
          })
        } else if (task.property_id) {
          await tx.properties.update({
            where: { id: task.property_id },
            data: { status: 'Under_Preparation' }
          })
        }

        nextTaskId = createdPrepTasks[0]
      } else {
        // Property is ready - create Refund Request task only if there are refundable deposits
        if (hasRefundableDeposit) {
          const refId = `${yearPrefix}${nextSequence
            .toString()
            .padStart(7, '0')}`

          const refundRequestTask = await tx.tasks.create({
            data: {
              reference_id: refId,
              title: `Refund Request - ${flowInstance.leases?.reference_id}`,
              description:
                'Review inspection report and determine refundable deposits refund amount.',
              organization_id: organizationId,
              property_id: task.property_id,
              room_id: task.room_id,
              created_by: staff.id,
              flow_instance_id: flowInstance.id
            }
          })

          // Auto-assign to inspector (self)
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
              assigned_id: staff.id,
              status: 'Accepted',
              responded_at: new Date(),
              responded_by: staff.id
            }
          })

          // Update flow instance with refund request task
          await tx.task_flow_instances.update({
            where: { id: flowInstance.id },
            data: { refund_request_task_id: refundRequestTask.id }
          })

          nextTaskId = refundRequestTask.id
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

      return { nextTaskId }
    })

    return NextResponse.json({
      success: true,
      nextTaskId: result.nextTaskId
    })
  } catch (error: any) {
    console.error('Error completing inspection:', error)
    return NextResponse.json(
      { error: 'Failed to complete inspection' },
      { status: 500 }
    )
  }
}
