'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

type PreparationTask = {
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  assignedStaffId: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'properties.update'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { propertyId } = await params
    const body = await request.json()

    const { preparationTasks } = body as { preparationTasks: PreparationTask[] }

    // Validation
    if (!preparationTasks || !Array.isArray(preparationTasks) || preparationTasks.length === 0) {
      return NextResponse.json(
        { error: 'At least one preparation task is required' },
        { status: 400 }
      )
    }

    // Validate each preparation task
    const validPriorities = ['Low', 'Medium', 'High', 'Urgent']
    for (const task of preparationTasks) {
      if (!task.title || task.title.trim().length < 5) {
        return NextResponse.json(
          { error: 'Task title must be at least 5 characters' },
          { status: 400 }
        )
      }

      if (!task.description || task.description.trim().length < 10) {
        return NextResponse.json(
          { error: 'Task description must be at least 10 characters' },
          { status: 400 }
        )
      }

      if (!task.priority || !validPriorities.includes(task.priority)) {
        return NextResponse.json({ error: 'Invalid task priority' }, { status: 400 })
      }

      if (!task.assignedStaffId) {
        return NextResponse.json(
          { error: 'Each task must have an assigned staff member' },
          { status: 400 }
        )
      }
    }

    // Verify property exists and belongs to the organization
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        status: true,
        leases: {
          where: {
            status: 'Current'
          },
          select: {
            id: true,
            start_date: true,
            number_of_months: true
          }
        },
        rooms: {
          select: {
            id: true,
            leases: {
              where: {
                status: 'Current'
              },
              select: {
                id: true,
                start_date: true,
                number_of_months: true
              }
            }
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check property status is Ready
    if (property.status !== 'Ready') {
      return NextResponse.json(
        { error: 'Property must be in Ready status to initiate preparation flow' },
        { status: 400 }
      )
    }

    // Check no active property lease
    const hasActivePropertyLease = property.leases.some(lease => {
      const leaseEndDate = lease.number_of_months
        ? new Date(lease.start_date.getTime() + lease.number_of_months * 30 * 24 * 60 * 60 * 1000)
        : null
      const now = new Date()
      return !leaseEndDate || leaseEndDate > now
    })

    if (hasActivePropertyLease) {
      return NextResponse.json(
        { error: 'Cannot initiate preparation flow - property has an active lease' },
        { status: 400 }
      )
    }

    // Check no active room leases
    const hasActiveRoomLease = property.rooms.some(room =>
      room.leases.some(lease => {
        const leaseEndDate = lease.number_of_months
          ? new Date(lease.start_date.getTime() + lease.number_of_months * 30 * 24 * 60 * 60 * 1000)
          : null
        const now = new Date()
        return !leaseEndDate || leaseEndDate > now
      })
    )

    if (hasActiveRoomLease) {
      return NextResponse.json(
        { error: 'Cannot initiate preparation flow - property has rooms with active leases' },
        { status: 400 }
      )
    }

    // Check if there's an existing active flow for this property
    const existingFlow = await prisma.task_flow_instances.findFirst({
      where: {
        property_id: propertyId,
        room_id: null,
        status: 'In Progress',
        flow_type: 'Property_Not_Ready'
      }
    })

    if (existingFlow) {
      return NextResponse.json(
        { error: 'A preparation flow is already in progress for this property' },
        { status: 400 }
      )
    }

    // Verify all assigned staff belong to the organization
    const assignedStaffIds = [...new Set(preparationTasks.map(t => t.assignedStaffId))]
    const staffMembers = await prisma.staff.findMany({
      where: {
        id: { in: assignedStaffIds },
        organization_id: staff.organization_id
      },
      select: { id: true }
    })

    if (staffMembers.length !== assignedStaffIds.length) {
      return NextResponse.json(
        { error: 'One or more assigned staff members not found' },
        { status: 400 }
      )
    }

    const organizationId = staff.organization_id

    // Generate reference_ids for all tasks
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

    // Create everything in a transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Create the flow instance
      const flowInstance = await tx.task_flow_instances.create({
        data: {
          flow_type: 'Property_Not_Ready',
          property_id: propertyId,
          room_id: null,
          status: 'In Progress',
          organization_id: organizationId,
          created_by: staff.id
        }
      })

      // 2. Create all preparation tasks
      const createdTasks = []
      for (let i = 0; i < preparationTasks.length; i++) {
        const taskData = preparationTasks[i]
        const reference_id = `${yearPrefix}${(nextSequence + i).toString().padStart(7, '0')}`
        const isSelfAssign = taskData.assignedStaffId === staff.id

        // Create task
        const task = await tx.tasks.create({
          data: {
            reference_id,
            title: taskData.title.trim(),
            description: taskData.description.trim(),
            organization_id: organizationId,
            property_id: propertyId,
            room_id: null,
            flow_instance_id: flowInstance.id,
            created_by: staff.id
          }
        })

        // Create task status
        await tx.task_statuses.create({
          data: {
            task_id: task.id,
            state: isSelfAssign ? 'In_Progress' : 'Open'
          }
        })

        // Create task type (Preparation)
        await tx.task_types.create({
          data: {
            task_id: task.id,
            type: 'Preparation',
            created_by: staff.id
          }
        })

        // Create task priority
        await tx.task_priorities.create({
          data: {
            task_id: task.id,
            priority: taskData.priority,
            created_by: staff.id
          }
        })

        // Create assignment
        await tx.task_assignments.create({
          data: {
            task_id: task.id,
            assigner_id: staff.id,
            assigned_id: taskData.assignedStaffId,
            status: isSelfAssign ? 'Accepted' : 'Pending',
            responded_at: isSelfAssign ? new Date() : null,
            responded_by: isSelfAssign ? staff.id : null
          }
        })

        createdTasks.push({
          id: task.id,
          reference_id: task.reference_id
        })
      }

      // 3. Update property status to Under_Preparation
      await tx.properties.update({
        where: { id: propertyId },
        data: { status: 'Under_Preparation' }
      })

      return {
        flowInstance,
        tasks: createdTasks
      }
    })

    return NextResponse.json(
      {
        success: true,
        flowInstanceId: result.flowInstance.id,
        tasks: result.tasks
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error initiating property preparation flow:', error)
    return NextResponse.json(
      { error: 'Failed to initiate property preparation flow' },
      { status: 500 }
    )
  }
}
