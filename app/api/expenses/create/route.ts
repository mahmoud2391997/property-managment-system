'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current staff and organization
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      category,
      expense_type,
      description,
      charges,
      is_paid,
      payment_method,
      payment_date,
      payment_time,
      receipt_image,
      recurring_config,
      // Category-specific fields
      property_id,
      lease_id,
      contract_id,
      is_asset,
      depreciation_percentage
    } = body

    // Validate required fields
    if (!category || !expense_type || !charges || charges.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!payment_date || !payment_time) {
      return NextResponse.json(
        { error: 'Payment date and time are required' },
        { status: 400 }
      )
    }

    // Category-specific validation
    if (category === 'Property_Related' && !property_id) {
      return NextResponse.json(
        { error: 'Property is required for property-related expenses' },
        { status: 400 }
      )
    }

    if (category === 'Contract_Related' && !contract_id) {
      return NextResponse.json(
        { error: 'Contract is required for contract-related expenses' },
        { status: 400 }
      )
    }

    // Combine date and time into timestamp
    const paymentDateTime = new Date(`${payment_date}T${payment_time}`)

    // Determine expense status
    const status = is_paid ? 'Paid' : 'Pending'

    // Calculate total amount from charges
    const totalAmount = charges.reduce((sum: number, charge: any) => {
      const amount = parseFloat(charge.amount) || 0
      const tax = charge.isTaxableChecked ? amount * 0.08 : 0
      return sum + amount + tax
    }, 0)

    // Create expense with charges and payment_history in a transaction
    const result = await prisma.$transaction(async tx => {
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
      const expense_reference_id = `${yearPrefix}${nextSequence.toString().padStart(8, '0')}`

      // Create base expense record
      const expense = await tx.expenses.create({
        data: {
          reference_id: expense_reference_id,
          category,
          description: description || null,
          status,
          due_payment_date: is_paid ? null : paymentDateTime,
          organization_id: staff.organization_id,
          created_by: staff.id,
          charges: {
            create: charges.map((charge: any) => ({
              title: charge.type,
              amount: parseFloat(charge.amount) || 0,
              is_taxed: charge.isTaxableChecked || false,
              is_refunded: charge.isRefundableChecked || false,
              created_by: staff.id
            }))
          }
        }
      })

      // Create category-specific subtype record
      switch (category) {
        case 'Property_Related':
          await tx.property_expenses.create({
            data: {
              id: expense.id,
              type: expense_type,
              property_id,
              lease_id: lease_id || null
            }
          })
          break

        case 'Contract_Related':
          await tx.contract_expenses.create({
            data: {
              id: expense.id,
              type: expense_type,
              contract_id
            }
          })
          break

        case 'Company_Related':
          await tx.company_expenses.create({
            data: {
              id: expense.id,
              type: expense_type
            }
          })
          break

        case 'Purchase_Related':
          await tx.purchase_expenses.create({
            data: {
              id: expense.id,
              type: expense_type,
              is_asset: is_asset || false,
              depreciation_percentage: is_asset && depreciation_percentage
                ? parseFloat(depreciation_percentage)
                : null
            }
          })
          break
      }

      // If paid, create payment_history entry
      if (is_paid) {
        await tx.payment_history.create({
          data: {
            expense_id: expense.id,
            amount: totalAmount,
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

      // If recurring config is provided and enabled
      if (recurring_config && recurring_config.enabled) {
        const newRecurringConfig = await tx.recurring_configs.create({
          data: {
            property_id: category === 'Property_Related' ? property_id : null,
            organization_id: staff.organization_id,
            title: recurring_config.title,
            every: recurring_config.every,
            time_unit: recurring_config.time_unit,
            event_on: recurring_config.event_on || null,
            is_payment_fixed: recurring_config.is_payment_fixed ?? false,
            created_by: staff.id
          }
        })

        // Link the expense to the recurring config
        await tx.expenses.update({
          where: { id: expense.id },
          data: { recurring_config_id: newRecurringConfig.id }
        })
      }

      return expense
    })

    return NextResponse.json({
      success: true,
      expense_id: result.id,
      message: 'Expense created successfully'
    })
  } catch (error: any) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
