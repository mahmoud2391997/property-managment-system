'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const { id: reference_id } = await params

    // Find the expense
    const expense = await prisma.expenses.findFirst({
      where: {
        organization_id: staff.organization_id,
        reference_id
      },
      select: {
        id: true,
        category: true,
        payment_history: {
          where: { status: 'Success' },
          select: { id: true }
        },
        property_expenses: { select: { type: true } },
        staff_expenses: { select: { type: true } }
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Cannot edit if there are successful payments
    if (expense.payment_history.length > 0) {
      return NextResponse.json(
        { error: 'Cannot edit expense with payment history' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      expense_type,
      description,
      charges,
      // Category-specific fields
      property_id,
      lease_id,
      contract_id,
      is_asset,
      depreciation_percentage,
      // Vendor field
      vendor_id,
      // Property expense month
      expense_month,
      // Due payment date
      due_payment_date,
      // Staff claim fields
      is_claimed,
      claimer_id,
      // Staff-specific fields
      staff_id,
      staff_month,
      gross_salary,
      epf_employer,
      socso_employer,
      epf_employee,
      socso_employee,
      tax,
      deduction_charges: deductionChargesInput
    } = body

    // Validate type change constraints
    const category = expense.category

    if (category === 'Staff_Related') {
      // Staff type cannot change
      if (expense_type && expense_type !== expense.staff_expenses?.type) {
        return NextResponse.json(
          { error: 'Cannot change type for staff expenses' },
          { status: 400 }
        )
      }
    }

    if (category === 'Property_Related') {
      const currentType = expense.property_expenses?.type
      const isCurrentRefund = currentType === 'Refund'
      const isNewRefund = expense_type === 'Refund'

      if (isCurrentRefund && !isNewRefund) {
        return NextResponse.json(
          { error: 'Cannot change Refund type to another type' },
          { status: 400 }
        )
      }
      if (!isCurrentRefund && isNewRefund) {
        return NextResponse.json(
          { error: 'Cannot change to Refund type' },
          { status: 400 }
        )
      }
    }

    const isStaffSalary = category === 'Staff_Related' && expense.staff_expenses?.type === 'Salary'

    // Update in a transaction
    const result = await prisma.$transaction(async tx => {
      // Update base expense
      await tx.expenses.update({
        where: { id: expense.id },
        data: {
          description: description || null,
          ...(due_payment_date !== undefined && {
            due_payment_date: due_payment_date ? new Date(due_payment_date) : null
          })
        }
      })

      // Update category-specific subtype
      switch (category) {
        case 'Property_Related':
          await tx.property_expenses.update({
            where: { id: expense.id },
            data: {
              type: expense_type,
              property_id: property_id || null,
              lease_id: lease_id || null,
              is_claimed: is_claimed || false,
              claimer_id: is_claimed ? claimer_id : null,
              ...(expense_month !== undefined && {
                expense_month: new Date(expense_month)
              })
            }
          })
          break

        case 'Contract_Related':
          await tx.contract_expenses.update({
            where: { id: expense.id },
            data: {
              type: expense_type
              // contract_id is NOT updated (locked)
            }
          })
          break

        case 'Company_Related':
          await tx.company_expenses.update({
            where: { id: expense.id },
            data: {
              type: expense_type,
              is_asset: is_asset || false,
              is_claimed: is_claimed || false,
              claimer_id: is_claimed ? claimer_id : null
            }
          })
          break

        case 'Purchase_Related':
          await tx.purchase_expenses.update({
            where: { id: expense.id },
            data: {
              type: expense_type,
              is_asset: is_asset || false,
              depreciation_percentage: is_asset && depreciation_percentage
                ? parseFloat(depreciation_percentage)
                : null,
              property_id: property_id || null,
              is_claimed: is_claimed || false,
              claimer_id: is_claimed ? claimer_id : null
            }
          })
          break

        case 'Staff_Related':
          await tx.staff_expenses.update({
            where: { id: expense.id },
            data: {
              staff_id,
              month: new Date(staff_month),
              gross_salary: parseFloat(gross_salary) || 0,
              epf_employer: parseFloat(epf_employer) || 0,
              socso_employer: parseFloat(socso_employer) || 0,
              epf_employee: parseFloat(epf_employee) || 0,
              socso_employee: parseFloat(socso_employee) || 0,
              tax: parseFloat(tax) || 0
            }
          })
          break
      }

      // Replace charges (delete old, create new) — skip for staff salary without charges
      if (!isStaffSalary || (charges && charges.length > 0)) {
        await tx.charges.deleteMany({
          where: { expense_id: expense.id }
        })

        if (charges && charges.length > 0) {
          await tx.charges.createMany({
            data: charges.map((charge: any) => ({
              expense_id: expense.id,
              title: charge.type || charge.title,
              amount: parseFloat(charge.amount) || 0,
              is_taxed: charge.isTaxableChecked ?? charge.is_taxed ?? false,
              is_refunded: charge.isRefundableChecked ?? charge.is_refunded ?? false,
              created_by: staff.id
            }))
          })
        }
      }

      // Replace deduction charges for staff salary
      if (isStaffSalary) {
        await tx.deduction_charges.deleteMany({
          where: { expense_id: expense.id }
        })

        if (deductionChargesInput && deductionChargesInput.length > 0) {
          await tx.deduction_charges.createMany({
            data: deductionChargesInput
              .filter((d: any) => d.title && (parseFloat(d.amount) || 0) > 0)
              .map((d: any) => ({
                expense_id: expense.id,
                title: d.title,
                amount: parseFloat(d.amount) || 0,
                created_by: staff.id
              }))
          })
        }
      }

      return { id: expense.id }
    })

    return NextResponse.json({
      success: true,
      expense_id: result.id,
      message: 'Expense updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}
