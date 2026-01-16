'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

// Helper function to parse lease conflict errors from database trigger
function parseLeaseConflictError(errorMessage: string): string | null {
  if (!errorMessage) return null

  const errorMappings: Record<string, (refId?: string) => string> = {
    'LEASE_ERROR:ENDED_NO_END_DATE': () =>
      'Cannot create lease with status Ended without an end date',
    'LEASE_ERROR:ENDED_FUTURE_DATE': () =>
      'Cannot create lease with status Ended when end date is in the future',
    'LEASE_CONFLICT:PROPERTY_HAS_LEASE': refId =>
      `Property already has an active lease (${refId})`,
    'LEASE_CONFLICT:ROOM_HAS_LEASE': refId =>
      `Room already has an active lease (${refId})`,
    'LEASE_CONFLICT:ROOM_HAS_ACTIVE_LEASE': refId =>
      `Cannot create property lease: A room under this property has an active lease (${refId})`
  }

  for (const [code, getMessage] of Object.entries(errorMappings)) {
    if (errorMessage.includes(code)) {
      const parts = errorMessage.split(code + ':')
      const refId = parts[1]?.split(/[\s\n]/)[0]?.trim()
      return getMessage(refId)
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const body = await request.json()
    const {
      source_lease_id,
      ending_task,
      new_lease
    } = body

    // ============================================
    // VALIDATION
    // ============================================

    // Validate source_lease_id
    if (!source_lease_id) {
      return NextResponse.json(
        { error: 'Source lease ID is required' },
        { status: 400 }
      )
    }

    // Validate ending_task fields
    if (!ending_task?.title?.trim()) {
      return NextResponse.json(
        { error: 'Inspection task title is required' },
        { status: 400 }
      )
    }

    if (!ending_task?.description?.trim()) {
      return NextResponse.json(
        { error: 'Inspection task description is required' },
        { status: 400 }
      )
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Urgent']
    if (!ending_task?.priority || !validPriorities.includes(ending_task.priority)) {
      return NextResponse.json(
        { error: 'Valid priority is required' },
        { status: 400 }
      )
    }

    if (!ending_task?.assigned_staff_id) {
      return NextResponse.json(
        { error: 'Assigned staff is required' },
        { status: 400 }
      )
    }

    // Validate new_lease fields
    if (!new_lease?.destination_property_id && !new_lease?.destination_room_id) {
      return NextResponse.json(
        { error: 'Destination property or room is required' },
        { status: 400 }
      )
    }

    if (!new_lease?.transfer_date) {
      return NextResponse.json(
        { error: 'Transfer date is required' },
        { status: 400 }
      )
    }

    if (!new_lease?.payment_day) {
      return NextResponse.json(
        { error: 'Payment day is required' },
        { status: 400 }
      )
    }

    if (!new_lease?.initial_charges?.length) {
      return NextResponse.json(
        { error: 'At least one initial charge is required' },
        { status: 400 }
      )
    }

    if (!new_lease?.payment_date || !new_lease?.payment_time) {
      return NextResponse.json(
        { error: 'Payment date and time are required' },
        { status: 400 }
      )
    }

    // Verify source lease exists, is Current, and belongs to organization
    const sourceLease = await prisma.leases.findFirst({
      where: {
        id: source_lease_id,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        status: true,
        property_id: true,
        room_id: true,
        tenant_id: true
      }
    })

    if (!sourceLease) {
      return NextResponse.json(
        { error: 'Source lease not found' },
        { status: 404 }
      )
    }

    if (sourceLease.status === 'Ended') {
      return NextResponse.json(
        { error: 'Source lease is already ended' },
        { status: 400 }
      )
    }

    // Check if there's an existing active flow for this lease
    const existingFlow = await prisma.task_flow_instances.findFirst({
      where: {
        lease_id: source_lease_id,
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
        id: ending_task.assigned_staff_id,
        organization_id: staff.organization_id
      }
    })

    if (!assignedStaff) {
      return NextResponse.json(
        { error: 'Assigned staff not found' },
        { status: 400 }
      )
    }

    // Validate transfer type consistency
    const isPropertyLease = sourceLease.room_id === null
    const isTransferringToProperty = !!new_lease.destination_property_id
    const isTransferringToRoom = !!new_lease.destination_room_id

    if (isPropertyLease && isTransferringToRoom) {
      return NextResponse.json(
        { error: 'Property leases can only be transferred to another property' },
        { status: 400 }
      )
    }

    if (!isPropertyLease && isTransferringToProperty) {
      return NextResponse.json(
        { error: 'Room leases can only be transferred to another room' },
        { status: 400 }
      )
    }

    // Verify destination belongs to organization
    if (isPropertyLease) {
      const destProperty = await prisma.properties.findFirst({
        where: {
          id: new_lease.destination_property_id,
          organization_id: staff.organization_id
        }
      })

      if (!destProperty) {
        return NextResponse.json(
          { error: 'Destination property not found or does not belong to your organization' },
          { status: 404 }
        )
      }
    } else {
      const destRoom = await prisma.rooms.findFirst({
        where: {
          id: new_lease.destination_room_id,
          properties: {
            organization_id: staff.organization_id
          }
        },
        include: {
          properties: {
            select: {
              id: true
            }
          }
        }
      })

      if (!destRoom) {
        return NextResponse.json(
          { error: 'Destination room not found or does not belong to your organization' },
          { status: 404 }
        )
      }
    }

    const isSelfAssign = ending_task.assigned_staff_id === staff.id
    const organizationId = staff.organization_id

    // Combine payment date and time
    const paymentDateTime = new Date(`${new_lease.payment_date}T${new_lease.payment_time}`)

    // Separate First Month Rental from other initial charges
    const firstMonthRentalCharge = new_lease.initial_charges.find(
      (charge: any) => charge.type === 'First Month Rental'
    )
    const otherInitialCharges = new_lease.initial_charges.filter(
      (charge: any) => charge.type !== 'First Month Rental'
    )

    // Calculate total amount from other initial charges
    const initialChargesTotalAmount = otherInitialCharges.reduce(
      (sum: number, charge: any) => {
        const amount = parseFloat(charge.amount) || 0
        const tax = charge.isTaxableChecked ? amount * 0.08 : 0
        return sum + amount + tax
      },
      0
    )

    // Calculate First Month Rental amount
    const firstMonthRentalAmount = firstMonthRentalCharge
      ? parseFloat(firstMonthRentalCharge.amount) || 0
      : 0

    // Determine payment status
    const paymentStatus = new_lease.is_paid ? 'Paid' : 'Pending'

    // ============================================
    // TRANSACTION: End source lease + Create new lease
    // ============================================

    const result = await prisma.$transaction(async tx => {
      // ============================================
      // PHASE 1: END SOURCE LEASE (replicate initiate-ending-flow exactly)
      // ============================================

      // Generate reference_id for the inspection task
      const currentYear = new Date().getFullYear()
      const taskYearPrefix = `TSK-${currentYear}`

      const latestTask = await tx.tasks.findFirst({
        where: {
          organization_id: organizationId,
          reference_id: {
            startsWith: taskYearPrefix
          }
        },
        orderBy: {
          reference_id: 'desc'
        },
        select: {
          reference_id: true
        }
      })

      let taskNextSequence = 1
      if (latestTask) {
        const lastSequence = parseInt(latestTask.reference_id.slice(-7))
        taskNextSequence = lastSequence + 1
      }

      const taskReferenceId = `${taskYearPrefix}${taskNextSequence.toString().padStart(7, '0')}`

      // 1. Create the flow instance
      const flowInstance = await tx.task_flow_instances.create({
        data: {
          flow_type: 'Lease_Ending',
          lease_id: source_lease_id,
          property_id: sourceLease.property_id,
          room_id: sourceLease.room_id,
          status: 'In Progress',
          organization_id: organizationId,
          created_by: staff.id
        }
      })

      // 2. Create the inspection task
      const inspectionTask = await tx.tasks.create({
        data: {
          reference_id: taskReferenceId,
          title: ending_task.title.trim(),
          description: ending_task.description.trim(),
          attachment: ending_task.attachment || null,
          organization_id: organizationId,
          property_id: sourceLease.property_id,
          room_id: sourceLease.room_id,
          created_by: staff.id
        }
      })

      // 3. Create initial task status
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
          priority: ending_task.priority as any,
          created_by: staff.id
        }
      })

      // 6. Create assignment
      await tx.task_assignments.create({
        data: {
          task_id: inspectionTask.id,
          assigner_id: staff.id,
          assigned_id: ending_task.assigned_staff_id,
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

      // 8. Update source lease status to Ended
      await tx.leases.update({
        where: { id: source_lease_id },
        data: {
          status: 'Ended',
          ended_at: new Date()
        }
      })

      // 9. Cancel all pending payments for source lease
      await tx.payments.updateMany({
        where: {
          lease_id: source_lease_id,
          status: 'Pending'
        },
        data: {
          status: 'Cancelled'
        }
      })

      // 10. Close all open tickets for source lease
      const openTickets = await tx.tickets.findMany({
        where: {
          lease_id: source_lease_id,
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

      // 11. Update source property/room status to Pending_Inspection
      if (sourceLease.room_id) {
        await tx.rooms.update({
          where: { id: sourceLease.room_id },
          data: { status: 'Pending_Inspection' }
        })
      } else {
        await tx.properties.update({
          where: { id: sourceLease.property_id },
          data: { status: 'Pending_Inspection' }
        })
      }

      // ============================================
      // PHASE 2: CREATE NEW LEASE (replicate create exactly)
      // ============================================

      // Generate lease reference_id
      const leaseYearPrefix = `LS-${currentYear}-`

      const latestLease = await tx.leases.findFirst({
        where: {
          organization_id: organizationId,
          reference_id: {
            startsWith: leaseYearPrefix
          }
        },
        orderBy: {
          reference_id: 'desc'
        },
        select: {
          reference_id: true
        }
      })

      let leaseNextSequence = 1
      if (latestLease) {
        const lastSequence = parseInt(latestLease.reference_id.slice(-4))
        leaseNextSequence = lastSequence + 1
      }

      const leaseReferenceId = `${leaseYearPrefix}${leaseNextSequence
        .toString()
        .padStart(4, '0')}`

      // Determine destination property and room
      let destPropertyId: string
      let destRoomId: string | null = null

      if (isPropertyLease) {
        destPropertyId = new_lease.destination_property_id!
      } else {
        // For room lease, get the property from the room
        const destRoom = await tx.rooms.findUnique({
          where: { id: new_lease.destination_room_id! },
          select: { properties: { select: { id: true } } }
        })
        if (!destRoom?.properties?.id) {
          throw new Error('Destination room has no associated property')
        }
        destPropertyId = destRoom.properties.id
        destRoomId = new_lease.destination_room_id!
      }

      // 12. Create new lease with transferred_from link
      const newLease = await tx.leases.create({
        data: {
          reference_id: leaseReferenceId,
          start_date: new Date(new_lease.transfer_date),
          number_of_months: new_lease.number_of_months || null,
          payment_day: new_lease.payment_day,
          monthly_rent: new_lease.monthly_rent || 0,
          status: 'Current',
          // Transfer link
          transferred_from: source_lease_id,
          is_transferred_from: true,
          // Reminders
          is_expiry_reminder: new_lease.is_expiry_reminder || false,
          expiry_days_before_reminder: new_lease.expiry_days_before_reminder || null,
          is_rent_reminder: new_lease.is_rent_reminder || false,
          rent_reminder_days_before: new_lease.rent_reminder_days_before || null,
          is_overdue_rent_reminder: new_lease.is_overdue_rent_reminder || false,
          overdue_days_after_reminder: new_lease.overdue_days_after_reminder || null,
          // Relations
          property_id: destPropertyId,
          room_id: destRoomId,
          tenant_id: sourceLease.tenant_id, // Same tenant
          organization_id: organizationId,
          created_by: staff.id
        }
      })

      // 13. Update source lease with transferred_to link
      await tx.leases.update({
        where: { id: source_lease_id },
        data: {
          transferred_to: newLease.id,
          is_transferred_to: true
        }
      })

      // Generate payment reference_id helper
      const paymentYearPrefix = `PY-${currentYear}`

      const latestPayment = await tx.payments.findFirst({
        where: {
          organization_id: organizationId,
          reference_id: {
            startsWith: paymentYearPrefix
          }
        },
        orderBy: {
          reference_id: 'desc'
        },
        select: {
          reference_id: true
        }
      })

      let paymentNextSequence = 1
      if (latestPayment) {
        const lastSequence = parseInt(latestPayment.reference_id.slice(-8))
        paymentNextSequence = lastSequence + 1
      }

      const generatePaymentReferenceId = (): string => {
        const refId = `${paymentYearPrefix}${paymentNextSequence.toString().padStart(8, '0')}`
        paymentNextSequence++
        return refId
      }

      // 14. Create Initial Charges Payment (excluding First Month Rental)
      let initialChargesPayment = null

      if (otherInitialCharges.length > 0) {
        const initialChargesReferenceId = generatePaymentReferenceId()

        initialChargesPayment = await tx.payments.create({
          data: {
            reference_id: initialChargesReferenceId,
            lease_id: newLease.id,
            type: 'Lease_Initial_Charges',
            status: paymentStatus,
            due_payment_timestamp: new_lease.is_paid ? null : paymentDateTime,
            organization_id: organizationId,
            created_by: staff.id,
            charges: {
              create: otherInitialCharges.map((charge: any) => ({
                title: charge.type,
                amount: parseFloat(charge.amount) || 0,
                is_taxed: charge.isTaxableChecked || false,
                is_refunded: charge.isRefundableChecked || false,
                created_by: staff.id
              }))
            }
          }
        })

        // 15. If paid, create payment_history entry for initial charges
        if (new_lease.is_paid) {
          await tx.payment_history.create({
            data: {
              payment_id: initialChargesPayment.id,
              amount: initialChargesTotalAmount,
              payment_method:
                new_lease.payment_method === 'Bank Transfer' ? 'Bank_Transfer' : 'Cash',
              paid_at: paymentDateTime,
              registrar_role: 'staff',
              registrar: staff.id,
              receipt_image: new_lease.receipt_image || null,
              status: 'Success'
            }
          })
        }
      }

      // 16. Create First Month Rental Payment
      let firstMonthRentalPayment = null

      if (firstMonthRentalCharge) {
        const firstMonthRentalReferenceId = generatePaymentReferenceId()

        // Build charges array - Monthly Rental + optional Proration
        const rentalCharges: any[] = [
          {
            title: 'Monthly Rental',
            amount: firstMonthRentalAmount,
            is_taxed: false,
            is_refunded: firstMonthRentalCharge?.isRefundableChecked || false,
            created_by: staff.id
          }
        ]

        firstMonthRentalPayment = await tx.payments.create({
          data: {
            reference_id: firstMonthRentalReferenceId,
            lease_id: newLease.id,
            type: 'Rental',
            status: paymentStatus,
            due_payment_timestamp: new_lease.is_paid ? null : paymentDateTime,
            organization_id: organizationId,
            created_by: staff.id,
            charges: {
              create: rentalCharges
            }
          }
        })

        // 18. If paid, create payment_history entry for first month rental
        if (new_lease.is_paid) {
          await tx.payment_history.create({
            data: {
              payment_id: firstMonthRentalPayment.id,
              amount: firstMonthRentalAmount,
              payment_method:
                new_lease.payment_method === 'Bank Transfer' ? 'Bank_Transfer' : 'Cash',
              paid_at: paymentDateTime,
              registrar_role: 'staff',
              registrar: staff.id,
              receipt_image: new_lease.receipt_image || null,
              status: 'Success'
            }
          })

          // 19. Create Next Month Rental Payment (if First Month is Paid)
          const firstMonthDueDate = paymentDateTime
          const nextMonthDueDate = new Date(firstMonthDueDate)
          nextMonthDueDate.setMonth(nextMonthDueDate.getMonth() + 1)
          nextMonthDueDate.setDate(new_lease.payment_day)
          nextMonthDueDate.setHours(0, 0, 0, 0)

          const nextMonthRentalReferenceId = generatePaymentReferenceId()

          await tx.payments.create({
            data: {
              reference_id: nextMonthRentalReferenceId,
              lease_id: newLease.id,
              type: 'Rental',
              status: 'Pending',
              due_payment_timestamp: nextMonthDueDate,
              organization_id: organizationId,
              created_by: staff.id,
              charges: {
                create: {
                  title: 'Monthly Rental',
                  amount: new_lease.monthly_rent || 0,
                  is_taxed: false,
                  is_refunded: false,
                  created_by: staff.id
                }
              }
            }
          })
        }
      }

      // 20. Create Late Payment Charges
      if (new_lease.late_charges && new_lease.late_charges.length > 0) {
        await tx.late_payment_charges.createMany({
          data: new_lease.late_charges.map((charge: any) => ({
            lease_id: newLease.id,
            days_after_due: charge.days_after_due,
            amount: parseFloat(charge.amount) || 0,
            created_by: staff.id
          }))
        })
      }

      return {
        flowInstance,
        inspectionTask,
        newLease,
        initialChargesPayment,
        firstMonthRentalPayment
      }
    }, { timeout: 15000 })

    return NextResponse.json(
      {
        success: true,
        source_lease_id: source_lease_id,
        new_lease_id: result.newLease.id,
        new_lease_reference_id: result.newLease.reference_id,
        flow_instance_id: result.flowInstance.id,
        inspection_task_id: result.inspectionTask.id,
        inspection_task_reference_id: result.inspectionTask.reference_id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error transferring lease:', error)

    // Check for transaction timeout
    if (error.code === 'P2028') {
      return NextResponse.json(
        { error: 'The server is taking too long to respond. Please try again' },
        { status: 408 }
      )
    }

    // Check for lease conflict errors from database trigger
    const conflictError = parseLeaseConflictError(error.message)
    if (conflictError) {
      return NextResponse.json({ error: conflictError }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to transfer lease' },
      { status: 500 }
    )
  }
}
