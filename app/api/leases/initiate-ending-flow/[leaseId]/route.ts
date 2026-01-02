'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { leaseId } = await params
    const body = await request.json()

    const { title, description, priority, attachment, assignedStaffId } = body

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    if (!priority) {
      return NextResponse.json(
        { error: 'Priority is required' },
        { status: 400 }
      )
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Urgent']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      )
    }

    if (!assignedStaffId) {
      return NextResponse.json(
        { error: 'Assigned staff is required' },
        { status: 400 }
      )
    }

    // Verify lease exists, is Current, and belongs to the organization
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        status: true,
        property_id: true,
        room_id: true
      }
    })

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    if (lease.status === 'Ended') {
      return NextResponse.json(
        { error: 'Lease is already ended' },
        { status: 400 }
      )
    }

    // Check if there's an existing active flow for this lease
    const existingFlow = await prisma.task_flow_instances.findFirst({
      where: {
        lease_id: leaseId,
        status: 'In Progress'
      }
    })

    if (existingFlow) {
      return NextResponse.json(
        { error: 'A lease ending flow is already in progress for this lease' },
        { status: 400 }
      )
    }

    // Verify assigned staff belongs to the organization
    const assignedStaff = await prisma.staff.findFirst({
      where: {
        id: assignedStaffId,
        organization_id: staff.organization_id
      }
    })

    if (!assignedStaff) {
      return NextResponse.json(
        { error: 'Assigned staff not found' },
        { status: 400 }
      )
    }

    const isSelfAssign = assignedStaffId === staff.id
    const organizationId = staff.organization_id

    // Generate reference_id for the inspection task
    const currentYear = new Date().getFullYear()
    const yearPrefix = `TSK-${currentYear}`

    const latestTask = await prisma.tasks.findFirst({
      where: {
        organization_id: organizationId,
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
    if (latestTask) {
      const lastSequence = parseInt(latestTask.reference_id.slice(-7))
      nextSequence = lastSequence + 1
    }

    const reference_id = `${yearPrefix}${nextSequence.toString().padStart(7, '0')}`

    // Create everything in a transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Create the flow instance first (without inspection_task_id)
      const flowInstance = await tx.task_flow_instances.create({
        data: {
          flow_type: 'Lease_Ending',
          lease_id: leaseId,
          property_id: lease.property_id,
          room_id: lease.room_id,
          status: 'In Progress',
          organization_id: organizationId,
          created_by: staff.id
        }
      })

      // 2. Create the inspection task
      const inspectionTask = await tx.tasks.create({
        data: {
          reference_id,
          title: title.trim(),
          description: description.trim(),
          attachment: attachment || null,
          organization_id: organizationId,
          property_id: lease.property_id,
          room_id: lease.room_id,
          created_by: staff.id
        }
      })

      // 3. Create initial task status
      // If self-assign, start as In Progress; otherwise Open
      await tx.task_statuses.create({
        data: {
          task_id: inspectionTask.id,
          state: isSelfAssign ? 'In_Progress' : 'Open'
        }
      })

      // 4. Create task type (Inspection)
      await tx.task_types.create({
        data: {
          task_id: inspectionTask.id,
          type: 'Inspection',
          created_by: staff.id
        }
      })

      // 5. Create task priority
      await tx.task_priorities.create({
        data: {
          task_id: inspectionTask.id,
          priority: priority as any,
          created_by: staff.id
        }
      })

      // 6. Create assignment
      await tx.task_assignments.create({
        data: {
          task_id: inspectionTask.id,
          assigner_id: staff.id,
          assigned_id: assignedStaffId,
          status: isSelfAssign ? 'Accepted' : 'Pending',
          responded_at: isSelfAssign ? new Date() : null,
          responded_by: isSelfAssign ? staff.id : null
        }
      })

      // 7. Update flow instance with inspection_task_id
      await tx.task_flow_instances.update({
        where: { id: flowInstance.id },
        data: { inspection_task_id: inspectionTask.id }
      })

      // 8. Update lease status to Ended
      await tx.leases.update({
        where: { id: leaseId },
        data: { status: 'Ended' }
      })

      // 9. Cancel all pending payments for this lease
      await tx.payments.updateMany({
        where: {
          lease_id: leaseId,
          status: 'Pending'
        },
        data: {
          status: 'Cancelled'
        }
      })

      // 10. Close all open tickets for this lease
      const openTickets = await tx.tickets.findMany({
        where: {
          lease_id: leaseId,
          ticket_statuses: {
            none: {
              state: 'Closed'
            }
          }
        },
        select: { id: true }
      })

      if (openTickets.length > 0) {
        await tx.ticket_statuses.createMany({
          data: openTickets.map(ticket => ({
            ticket_id: ticket.id,
            state: 'Closed',
            performer_type: 'system',
            performer_id: null
          }))
        })
      }

      // 11. Update property/room status to Pending_Inspection
      if (lease.room_id) {
        await tx.rooms.update({
          where: { id: lease.room_id },
          data: { status: 'Pending_Inspection' }
        })
      } else {
        await tx.properties.update({
          where: { id: lease.property_id },
          data: { status: 'Pending_Inspection' }
        })
      }

      return {
        flowInstance,
        inspectionTask
      }
    })

    return NextResponse.json(
      {
        success: true,
        flowInstanceId: result.flowInstance.id,
        inspectionTaskId: result.inspectionTask.id,
        inspectionTaskReferenceId: result.inspectionTask.reference_id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error initiating lease ending flow:', error)
    return NextResponse.json(
      { error: 'Failed to initiate lease ending flow' },
      { status: 500 }
    )
  }
}
