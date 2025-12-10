import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { computeLeaseStatus, isLeaseActive } from '@/utils/lease-status'

export async function POST(request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const body = await request.json()
    const {
      property_id,
      room_id, // Optional - if provided, this is a room lease
      tenant_id,
      start_date,
      number_of_months,
      payment_day,
      monthly_rent,
      // Reminders
      is_expiry_reminder,
      expiry_days_before_reminder,
      is_rent_reminder,
      rent_reminder_days_before,
      is_overdue_rent_reminder,
      overdue_days_after_reminder,
      // Initial charges payment
      initial_charges,
      is_paid,
      payment_method,
      payment_date,
      payment_time,
      receipt_image,
      // Late payment charges
      late_charges
    } = body

    // Validation
    if (!property_id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    if (!start_date) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

    if (!payment_day) {
      return NextResponse.json(
        { error: 'Payment day is required' },
        { status: 400 }
      )
    }

    if (!initial_charges || initial_charges.length === 0) {
      return NextResponse.json(
        { error: 'At least one initial charge is required' },
        { status: 400 }
      )
    }

    if (!payment_date || !payment_time) {
      return NextResponse.json(
        { error: 'Payment date and time are required' },
        { status: 400 }
      )
    }

    // Verify property belongs to the organization
    const property = await prisma.properties.findFirst({
      where: {
        id: property_id,
        organization_id: staff.organization_id
      },
      select: { id: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // If room_id is provided, this is a room lease - verify room and check for conflicts
    if (room_id) {
      const room = await prisma.rooms.findFirst({
        where: {
          id: room_id,
          property_id: property_id
        },
        select: { id: true }
      })

      if (!room) {
        return NextResponse.json(
          { error: 'Room not found or does not belong to this property' },
          { status: 404 }
        )
      }

      // Check if property has an active lease - rooms cannot have leases if property does
      const propertyLeases = await prisma.leases.findMany({
        where: {
          property_id: property_id,
          room_id: null,
          status: 'Current' // DB status
        },
        select: { id: true, start_date: true, number_of_months: true, status: true, reference_id: true }
      })

      const activePropertyLease = propertyLeases.find(lease => isLeaseActive(lease))

      if (activePropertyLease) {
        const computedStatus = computeLeaseStatus(activePropertyLease)
        const message = computedStatus === 'Current'
          ? `Cannot create room lease: Property has an active lease (${activePropertyLease.reference_id})`
          : `Cannot create room lease: Property has an expired lease (${activePropertyLease.reference_id}) that needs to be ended first`
        return NextResponse.json(
          { error: message },
          { status: 400 }
        )
      }

      // Check if room already has an active lease
      const roomLeases = await prisma.leases.findMany({
        where: {
          room_id: room_id,
          status: 'Current'
        },
        select: { id: true, start_date: true, number_of_months: true, status: true, reference_id: true }
      })

      const activeRoomLease = roomLeases.find(lease => isLeaseActive(lease))

      if (activeRoomLease) {
        const computedStatus = computeLeaseStatus(activeRoomLease)
        const message = computedStatus === 'Current'
          ? `Room already has an active lease (${activeRoomLease.reference_id})`
          : `Room has an expired lease (${activeRoomLease.reference_id}) that needs to be ended first`
        return NextResponse.json(
          { error: message },
          { status: 400 }
        )
      }
    } else {
      // This is a property lease (no room_id) - check for conflicts

      // Check if property already has an active lease
      const existingPropertyLeases = await prisma.leases.findMany({
        where: {
          property_id: property_id,
          room_id: null,
          status: 'Current'
        },
        select: { id: true, start_date: true, number_of_months: true, status: true, reference_id: true }
      })

      const existingActivePropertyLease = existingPropertyLeases.find(lease => isLeaseActive(lease))

      if (existingActivePropertyLease) {
        const computedStatus = computeLeaseStatus(existingActivePropertyLease)
        const message = computedStatus === 'Current'
          ? `Property already has an active lease (${existingActivePropertyLease.reference_id})`
          : `Property has an expired lease (${existingActivePropertyLease.reference_id}) that needs to be ended first`
        return NextResponse.json(
          { error: message },
          { status: 400 }
        )
      }

      // Check if any rooms under this property have active leases
      const roomLeases = await prisma.leases.findMany({
        where: {
          property_id: property_id,
          room_id: { not: null },
          status: 'Current'
        },
        select: {
          id: true,
          start_date: true,
          number_of_months: true,
          status: true
        }
      })

      const activeRoomLeases = roomLeases.filter(lease => isLeaseActive(lease))

      if (activeRoomLeases.length > 0) {
        const hasExpired = activeRoomLeases.some(lease => computeLeaseStatus(lease) === 'Expired')
        const roomCount = activeRoomLeases.length
        const roomText = roomCount === 1 ? 'a room' : `${roomCount} rooms`

        const message = hasExpired
          ? `Cannot add property lease: ${roomText} under this property has a lease that needs to be ended first`
          : `Cannot add property lease: ${roomText} under this property has an active lease`
        return NextResponse.json(
          { error: message },
          { status: 400 }
        )
      }
    }

    // Verify tenant belongs to the organization
    const organizationTenant = await prisma.organizations_tenants.findFirst({
      where: {
        tenant_id: tenant_id,
        organization_id: staff.organization_id
      }
    })

    if (!organizationTenant) {
      return NextResponse.json(
        { error: 'Tenant not found in organization' },
        { status: 404 }
      )
    }

    // Combine payment date and time
    const paymentDateTime = new Date(`${payment_date}T${payment_time}`)

    // Separate First Month Rental from other initial charges
    const firstMonthRentalCharge = initial_charges.find(
      (charge: any) => charge.type === 'First Month Rental'
    )
    const otherInitialCharges = initial_charges.filter(
      (charge: any) => charge.type !== 'First Month Rental'
    )

    // Calculate total amount from other initial charges (excluding First Month Rental)
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
    const paymentStatus = is_paid ? 'Paid' : 'Pending'

    // Execute transaction
    const result = await prisma.$transaction(async tx => {
      // ============================================
      // STEP 1: Create Lease
      // ============================================

      // Generate lease reference_id (unique per organization)
      // Format: LS-YYYY-#### (e.g., LS-2025-0001)
      const currentYear = new Date().getFullYear()
      const leaseYearPrefix = `LS-${currentYear}-`

      const latestLease = await tx.leases.findFirst({
        where: {
          organization_id: staff.organization_id,
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

      const leaseReferenceId = `${leaseYearPrefix}${leaseNextSequence.toString().padStart(4, '0')}`

      const lease = await tx.leases.create({
        data: {
          reference_id: leaseReferenceId,
          start_date: new Date(start_date),
          number_of_months: number_of_months || null,
          payment_day: payment_day,
          monthly_rent: monthly_rent || 0,
          status: 'Current',
          // Reminders
          is_expiry_reminder: is_expiry_reminder || false,
          expiry_days_before_reminder: expiry_days_before_reminder || null,
          is_rent_reminder: is_rent_reminder || false,
          rent_reminder_days_before: rent_reminder_days_before || null,
          is_overdue_rent_reminder: is_overdue_rent_reminder || false,
          overdue_days_after_reminder: overdue_days_after_reminder || null,
          // Relations
          property_id: property_id,
          room_id: room_id || null, // null for property leases, set for room leases
          tenant_id: tenant_id,
          organization_id: staff.organization_id,
          created_by: staff.id
        }
      })

      // ============================================
      // STEP 2: Create Initial Charges Payment (excluding First Month Rental)
      // ============================================

      // Helper function to generate next payment reference_id
      const generatePaymentReferenceId = async (
        currentSequence: number
      ): Promise<string> => {
        return `${paymentYearPrefix}${currentSequence.toString().padStart(8, '0')}`
      }

      // Generate payment reference_id (unique per organization)
      // Format: PY-YYYY######## (e.g., PY-202500000001)
      const paymentYearPrefix = `PY-${currentYear}`

      const latestPayment = await tx.payments.findFirst({
        where: {
          organization_id: staff.organization_id,
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

      let initialChargesPayment = null

      // Only create initial charges payment if there are other charges besides First Month Rental
      if (otherInitialCharges.length > 0) {
        const initialChargesReferenceId = await generatePaymentReferenceId(
          paymentNextSequence
        )
        paymentNextSequence++

        initialChargesPayment = await tx.payments.create({
          data: {
            reference_id: initialChargesReferenceId,
            lease_id: lease.id,
            type: 'Lease_Initial_Charges',
            status: paymentStatus,
            due_payment_timestamp: is_paid ? null : paymentDateTime,
            organization_id: staff.organization_id,
            created_by: staff.id,
            charges: {
              create: otherInitialCharges.map((charge: any) => ({
                title: charge.type,
                amount: parseFloat(charge.amount) || 0,
                is_taxed: charge.isTaxableChecked || false,
                is_refunded: false,
                created_by: staff.id
              }))
            }
          }
        })

        // If paid, create payment_history entry for initial charges
        if (is_paid) {
          await tx.payment_history.create({
            data: {
              payment_id: initialChargesPayment.id,
              amount: initialChargesTotalAmount,
              payment_method:
                payment_method === 'Bank Transfer' ? 'Bank_Transfer' : 'Cash',
              paid_at: paymentDateTime,
              registrar_role: 'staff',
              registrar: staff.id,
              receipt_image: receipt_image || null,
              status: 'Success'
            }
          })
        }
      }

      // ============================================
      // STEP 3: Create First Month Rental Payment (type: Rental)
      // ============================================

      let firstMonthRentalPayment = null

      if (firstMonthRentalCharge) {
        const firstMonthRentalReferenceId = await generatePaymentReferenceId(
          paymentNextSequence
        )
        paymentNextSequence++

        firstMonthRentalPayment = await tx.payments.create({
          data: {
            reference_id: firstMonthRentalReferenceId,
            lease_id: lease.id,
            type: 'Rental',
            status: paymentStatus,
            due_payment_timestamp: is_paid ? null : paymentDateTime,
            organization_id: staff.organization_id,
            created_by: staff.id,
            charges: {
              create: {
                title: 'Monthly Rental',
                amount: firstMonthRentalAmount,
                is_taxed: false,
                is_refunded: false,
                created_by: staff.id
              }
            }
          }
        })

        // If paid, create payment_history entry for first month rental
        if (is_paid) {
          await tx.payment_history.create({
            data: {
              payment_id: firstMonthRentalPayment.id,
              amount: firstMonthRentalAmount,
              payment_method:
                payment_method === 'Bank Transfer' ? 'Bank_Transfer' : 'Cash',
              paid_at: paymentDateTime,
              registrar_role: 'staff',
              registrar: staff.id,
              receipt_image: receipt_image || null,
              status: 'Success'
            }
          })

          // ============================================
          // STEP 4: Create Next Month Rental Payment (if First Month is Paid)
          // ============================================

          // Calculate next month due date based on payment_day
          // Similar logic to the trigger: month after current payment, using lease's payment_day
          const firstMonthDueDate = paymentDateTime
          const nextMonthDueDate = new Date(firstMonthDueDate)
          nextMonthDueDate.setMonth(nextMonthDueDate.getMonth() + 1)
          nextMonthDueDate.setDate(payment_day)
          // Set time to start of day
          nextMonthDueDate.setHours(0, 0, 0, 0)

          const nextMonthRentalReferenceId = await generatePaymentReferenceId(
            paymentNextSequence
          )

          await tx.payments.create({
            data: {
              reference_id: nextMonthRentalReferenceId,
              lease_id: lease.id,
              type: 'Rental',
              status: 'Pending',
              due_payment_timestamp: nextMonthDueDate,
              organization_id: staff.organization_id,
              created_by: staff.id,
              charges: {
                create: {
                  title: 'Monthly Rental',
                  amount: monthly_rent || 0,
                  is_taxed: false,
                  is_refunded: false,
                  created_by: staff.id
                }
              }
            }
          })
        }
      }

      // ============================================
      // STEP 3: Create Late Payment Charges
      // ============================================

      if (late_charges && late_charges.length > 0) {
        await tx.late_payment_charges.createMany({
          data: late_charges.map((charge: any) => ({
            lease_id: lease.id,
            days_after_due: charge.days_after_due,
            amount: parseFloat(charge.amount) || 0,
            created_by: staff.id
          }))
        })
      }

      return {
        lease,
        initialChargesPayment,
        firstMonthRentalPayment
      }
    })

    return NextResponse.json(
      {
        success: true,
        lease_id: result.lease.id,
        lease_reference_id: result.lease.reference_id,
        initial_charges_payment_id: result.initialChargesPayment?.id || null,
        initial_charges_payment_reference_id:
          result.initialChargesPayment?.reference_id || null,
        first_month_rental_payment_id:
          result.firstMonthRentalPayment?.id || null,
        first_month_rental_payment_reference_id:
          result.firstMonthRentalPayment?.reference_id || null,
        message: 'Lease created successfully'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating lease:', error)
    return NextResponse.json(
      { error: 'Failed to create lease' },
      { status: 500 }
    )
  }
}
