import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { parseLocalDateTime } from '@/utils/formatTime'

export async function POST(request: Request) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'contracts.create'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const {
      property_id,
      owner_id,
      start_date,
      number_of_months,
      frequency: frequencyInput,
      lead_days: leadDaysInput,
      billing_cycle_start_month: billingCycleStartMonthInput,
      payment_day,
      monthly_rent,
      // Reminders
      is_expiry_reminder,
      expiry_days_before_reminder,
      is_rent_reminder,
      rent_reminder_days_before,
      is_overdue_rent_reminder,
      overdue_days_after_reminder,
      // Initial charges (expense)
      initial_charges,
      is_paid,
      payment_method,
      payment_date,
      payment_time,
      receipt_image,
      timezone_offset
    } = body

    const frequency = Math.max(1, Math.floor(Number(frequencyInput) || 1))
    const lead_days = Math.max(0, Math.floor(Number(leadDaysInput) ?? 7))

    const billing_cycle_start_month = new Date(billingCycleStartMonthInput || new Date())

    const requiredFields = [
      [property_id, 'Property ID'],
      [owner_id, 'Owner ID'],
      [start_date, 'Start date'],
      [payment_day, 'Payment day'],
      [initial_charges?.length, 'At least one initial charge'],
      [payment_date && payment_time, 'Payment date and time']
    ] as const

    for (const [value, name] of requiredFields) {
      if (!value) {
        return NextResponse.json(
          { error: `${name} is required` },
          { status: 400 }
        )
      }
    }

    // Authorization checks - verify property and owner belong to the organization
    const [property, owner] = await Promise.all([
      prisma.properties.findFirst({
        where: {
          id: property_id,
          organization_id: staff.organization_id
        },
        select: { id: true }
      }),
      prisma.owners.findFirst({
        where: {
          id: owner_id,
          organization_id: staff.organization_id
        },
        select: { id: true }
      })
    ])

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found in organization' },
        { status: 404 }
      )
    }

    // Combine payment date and time using client's timezone
    const paymentDateTime = parseLocalDateTime(payment_date, payment_time, timezone_offset ?? 0)

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
        return sum + amount
      },
      0
    )

    // Calculate First Month Rental amount
    const firstMonthRentalAmount = firstMonthRentalCharge
      ? parseFloat(firstMonthRentalCharge.amount) || 0
      : 0

    // Determine expense status
    const expenseStatus = is_paid ? 'Paid' : 'Pending'

    // Execute transaction
    const result = await prisma.$transaction(async tx => {
      // ============================================
      // STEP 1: Generate reference IDs
      // ============================================
      const currentYear = new Date().getFullYear()
      const contractYearPrefix = `CT-${currentYear}-`
      const expenseYearPrefix = `XP-${currentYear}`

      const [latestContract, latestExpense] = await Promise.all([
        tx.contracts.findFirst({
          where: {
            organization_id: staff.organization_id,
            reference_id: { startsWith: contractYearPrefix }
          },
          orderBy: { reference_id: 'desc' },
          select: { reference_id: true }
        }),
        tx.expenses.findFirst({
          where: {
            organization_id: staff.organization_id,
            reference_id: { startsWith: expenseYearPrefix }
          },
          orderBy: { reference_id: 'desc' },
          select: { reference_id: true }
        })
      ])

      let contractNextSequence = 1
      if (latestContract) {
        const lastSequence = parseInt(latestContract.reference_id.slice(-4))
        contractNextSequence = lastSequence + 1
      }

      const contractReferenceId = `${contractYearPrefix}${contractNextSequence
        .toString()
        .padStart(4, '0')}`

      let expenseNextSequence = 1
      if (latestExpense && latestExpense.reference_id) {
        const lastSequence = parseInt((latestExpense.reference_id || '').slice(-8))
        expenseNextSequence = lastSequence + 1
      }

      const generateExpenseReferenceId = (seq: number): string => {
        return `${expenseYearPrefix}${seq.toString().padStart(8, '0')}`
      }

      // ============================================
      // STEP 2: Create Contract
      // ============================================

      const contract = await tx.contracts.create({
        data: {
          reference_id: contractReferenceId,
          start_date: new Date(start_date),
          number_of_months: number_of_months || null,
          payment_day: payment_day,
          monthly_rent: monthly_rent || 0,
          frequency,
          lead_days,
          billing_cycle_start_month,
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
          owner_id: owner_id,
          organization_id: staff.organization_id,
          created_by: staff.id
        }
      })

      // ============================================
      // STEP 3: Create Initial Charges Expense (excluding First Month Rental)
      // ============================================

      let initialChargesExpense = null

      if (otherInitialCharges.length > 0) {
        const initialChargesRefId = generateExpenseReferenceId(expenseNextSequence)
        expenseNextSequence++

        initialChargesExpense = await tx.expenses.create({
          data: {
            reference_id: initialChargesRefId,
            category: 'Contract_Related',
            status: expenseStatus,
            due_payment_date: is_paid ? null : paymentDateTime,
            organization_id: staff.organization_id,
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

        // Link to contract_expenses
        await tx.contract_expenses.create({
          data: {
            id: initialChargesExpense.id,
            contract_id: contract.id,
            type: 'Contract_Initial_Charges'
          }
        })

        // If paid, create payment_history entry
        if (is_paid) {
          await tx.payment_history.create({
            data: {
              expense_id: initialChargesExpense.id,
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
      // STEP 4: Create First Month Rental Expense
      // ============================================

      let firstMonthRentalExpense = null

      if (firstMonthRentalCharge) {
        const firstMonthRefId = generateExpenseReferenceId(expenseNextSequence)
        expenseNextSequence++

        firstMonthRentalExpense = await tx.expenses.create({
          data: {
            reference_id: firstMonthRefId,
            category: 'Contract_Related',
            status: expenseStatus,
            due_payment_date: is_paid ? null : paymentDateTime,
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

        // Link to contract_expenses (mark as first rental so cron job skips it in duplicate checks)
        await tx.contract_expenses.create({
          data: {
            id: firstMonthRentalExpense.id,
            contract_id: contract.id,
            type: 'Rental',
            is_first_rental: true
          }
        })

        // If paid, create payment_history entry
        if (is_paid) {
          await tx.payment_history.create({
            data: {
              expense_id: firstMonthRentalExpense.id,
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

          // Subsequent rental expenses are generated by the scheduled cron job
          // based on billing_cycle_start_month, frequency, payment_day, and lead_days
        }
      }

      // ============================================
      // STEP 6: Assign owner to property
      // ============================================
      await tx.properties.update({
        where: { id: property_id },
        data: { owner_id }
      })

      return {
        contract,
        initialChargesExpense,
        firstMonthRentalExpense
      }
    }, { timeout: 10000 })

    return NextResponse.json(
      {
        success: true,
        contract_id: result.contract.id,
        contract_reference_id: result.contract.reference_id,
        initial_charges_expense_id: result.initialChargesExpense?.id || null,
        first_month_rental_expense_id: result.firstMonthRentalExpense?.id || null,
        message: 'Contract created successfully'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating contract:', error)

    if (error.code === 'P2028') {
      return NextResponse.json(
        { error: 'The server is taking too long to respond. Please try again' },
        { status: 408 }
      )
    }

    // Check for unique constraint violation (active contract on property)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This property already has an active contract' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}
