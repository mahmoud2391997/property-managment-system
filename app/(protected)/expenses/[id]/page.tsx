export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import ExpenseDetailsContent from './expense-details-content'

type Props = {
  params: Promise<{ id: string }>
}

type ChargeData = {
  id: string
  title: string
  amount: number
  is_taxed: boolean
  is_refunded: boolean
}

type DeductionChargeData = {
  id: string
  title: string
  amount: number
}

type PaymentHistoryData = {
  id: string
  payment_number: number
  payment_method: string
  amount: number
  remaining_amount: number
  status: string
  paid_at: string
  receipt_image: string | null
}

export type ExpenseDetailsData = {
  id: string
  reference_id: string
  category: string
  description: string | null
  status: string
  due_payment_date: string | null
  created_at: string
  charges: ChargeData[]
  deduction_charges: DeductionChargeData[]
  payment_history: PaymentHistoryData[]
  recurring_config: {
    id: string
    title: string | null
    every: number | null
    time_unit: string | null
    event_on: string | null
    is_payment_fixed: boolean
  } | null
  // Category-specific
  property_expense: {
    type: string
    property: {
      id: string
      code: string
      street_address: string
      city: string
      project_title: string | null
    } | null
    lease: {
      id: string
      reference_id: string
    } | null
  } | null
  contract_expense: {
    type: string
    contract: {
      id: string
      reference_id: string
      owner_name: string
    }
  } | null
  company_expense: {
    type: string
    is_asset: boolean
  } | null
  purchase_expense: {
    type: string
    is_asset: boolean
    depreciation_percentage: number | null
    property: {
      id: string
      code: string
      street_address: string
      city: string
      project_title: string | null
    } | null
  } | null
  staff_expense: {
    type: string
    staff_id: string | null
    staff_name: string
    month: string
    gross_salary: number
    epf_employer: number
    socso_employer: number
    epf_employee: number
    socso_employee: number
    tax: number
  } | null
  // Computed
  total_amount: number
  total_paid: number
  remaining_amount: number
  payment_percentage: number
  can_edit: boolean
}

async function getExpenseDetails(referenceId: string): Promise<ExpenseDetailsData | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) return null

    const expense = await prisma.expenses.findFirst({
      where: {
        reference_id: referenceId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        reference_id: true,
        category: true,
        description: true,
        status: true,
        due_payment_date: true,
        created_at: true,
        charges: {
          select: {
            id: true,
            title: true,
            amount: true,
            is_taxed: true,
            is_refunded: true
          },
          orderBy: { created_at: 'asc' }
        },
        deduction_charges: {
          select: {
            id: true,
            title: true,
            amount: true
          },
          orderBy: { created_at: 'asc' }
        },
        payment_history: {
          where: { status: 'Success' },
          select: {
            id: true,
            amount: true,
            payment_method: true,
            paid_at: true,
            receipt_image: true,
            status: true
          },
          orderBy: { paid_at: 'asc' }
        },
        recurring_configs: {
          select: {
            id: true,
            title: true,
            every: true,
            time_unit: true,
            event_on: true,
            is_payment_fixed: true
          }
        },
        property_expenses: {
          select: {
            type: true,
            properties: {
              select: {
                id: true,
                code: true,
                street_address: true,
                city: true,
                projects: { select: { title: true } }
              }
            },
            leases: {
              select: {
                id: true,
                reference_id: true
              }
            }
          }
        },
        contract_expenses: {
          select: {
            type: true,
            contracts: {
              select: {
                id: true,
                reference_id: true,
                owners: {
                  select: {
                    first_name: true,
                    last_name: true
                  }
                }
              }
            }
          }
        },
        company_expenses: {
          select: { type: true, is_asset: true }
        },
        purchase_expenses: {
          select: {
            type: true,
            is_asset: true,
            depreciation_percentage: true,
            properties: {
              select: {
                id: true,
                code: true,
                street_address: true,
                city: true,
                projects: { select: { title: true } }
              }
            }
          }
        },
        staff_expenses: {
          select: {
            type: true,
            staff_id: true,
            month: true,
            gross_salary: true,
            epf_employer: true,
            socso_employer: true,
            epf_employee: true,
            socso_employee: true,
            tax: true,
            staff: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      }
    })

    if (!expense) return null

    // Calculate totals
    let totalAmount: number

    if (expense.category === 'Staff_Related' && expense.staff_expenses?.type === 'Salary') {
      const gross = expense.staff_expenses.gross_salary.toNumber()
      const epfEr = expense.staff_expenses.epf_employer.toNumber()
      const socsoEr = expense.staff_expenses.socso_employer.toNumber()
      const allowancesTotal = expense.charges.reduce((sum, c) => sum + c.amount.toNumber(), 0)
      totalAmount = gross + epfEr + socsoEr + allowancesTotal
    } else {
      totalAmount = expense.charges.reduce((sum, charge) => {
        const amount = charge.amount.toNumber()
        const tax = charge.is_taxed ? amount * 0.08 : 0
        return sum + amount + tax
      }, 0)
    }

    const totalPaid = expense.payment_history.reduce((sum, h) => sum + h.amount.toNumber(), 0)
    const remainingAmount = totalAmount - totalPaid
    const paymentPercentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

    // Transform payment history with running totals
    let runningTotal = 0
    const transformedHistory: PaymentHistoryData[] = expense.payment_history.map((h, index) => {
      runningTotal += h.amount.toNumber()
      const remaining = totalAmount - runningTotal

      return {
        id: h.id,
        payment_number: index + 1,
        payment_method: h.payment_method,
        amount: h.amount.toNumber(),
        remaining_amount: remaining > 0 ? remaining : 0,
        status: h.status,
        paid_at: h.paid_at.toISOString(),
        receipt_image: h.receipt_image
      }
    })

    // Reverse for display (newest first)
    transformedHistory.reverse()

    // Transform charges
    const transformedCharges: ChargeData[] = expense.charges.map(c => ({
      id: c.id,
      title: c.title,
      amount: c.amount.toNumber(),
      is_taxed: c.is_taxed,
      is_refunded: c.is_refunded
    }))

    // Transform deduction charges
    const transformedDeductions: DeductionChargeData[] = expense.deduction_charges.map(d => ({
      id: d.id,
      title: d.title,
      amount: d.amount.toNumber()
    }))

    // Build category-specific data
    const propertyExpense = expense.property_expenses ? {
      type: expense.property_expenses.type,
      property: expense.property_expenses.properties ? {
        id: expense.property_expenses.properties.id,
        code: expense.property_expenses.properties.code,
        street_address: expense.property_expenses.properties.street_address,
        city: expense.property_expenses.properties.city,
        project_title: expense.property_expenses.properties.projects?.title || null
      } : null,
      lease: expense.property_expenses.leases ? {
        id: expense.property_expenses.leases.id,
        reference_id: expense.property_expenses.leases.reference_id
      } : null
    } : null

    const contractExpense = expense.contract_expenses ? {
      type: expense.contract_expenses.type,
      contract: {
        id: expense.contract_expenses.contracts.id,
        reference_id: expense.contract_expenses.contracts.reference_id,
        owner_name: [
          expense.contract_expenses.contracts.owners.first_name,
          expense.contract_expenses.contracts.owners.last_name
        ].filter(Boolean).join(' ')
      }
    } : null

    const companyExpense = expense.company_expenses ? {
      type: expense.company_expenses.type,
      is_asset: expense.company_expenses.is_asset
    } : null

    const purchaseExpense = expense.purchase_expenses ? {
      type: expense.purchase_expenses.type,
      is_asset: expense.purchase_expenses.is_asset,
      depreciation_percentage: expense.purchase_expenses.depreciation_percentage?.toNumber() ?? null,
      property: expense.purchase_expenses.properties ? {
        id: expense.purchase_expenses.properties.id,
        code: expense.purchase_expenses.properties.code,
        street_address: expense.purchase_expenses.properties.street_address,
        city: expense.purchase_expenses.properties.city,
        project_title: expense.purchase_expenses.properties.projects?.title || null
      } : null
    } : null

    const staffExpense = expense.staff_expenses ? {
      type: expense.staff_expenses.type,
      staff_id: expense.staff_expenses.staff_id,
      staff_name: expense.staff_expenses.staff
        ? [expense.staff_expenses.staff.first_name, expense.staff_expenses.staff.last_name].filter(Boolean).join(' ')
        : 'N/A',
      month: expense.staff_expenses.month.toISOString(),
      gross_salary: expense.staff_expenses.gross_salary.toNumber(),
      epf_employer: expense.staff_expenses.epf_employer.toNumber(),
      socso_employer: expense.staff_expenses.socso_employer.toNumber(),
      epf_employee: expense.staff_expenses.epf_employee.toNumber(),
      socso_employee: expense.staff_expenses.socso_employee.toNumber(),
      tax: expense.staff_expenses.tax?.toNumber() ?? 0
    } : null

    // Can edit only if no successful payments
    const canEdit = expense.payment_history.length === 0

    return {
      id: expense.id,
      reference_id: expense.reference_id,
      category: expense.category,
      description: expense.description,
      status: expense.status,
      due_payment_date: expense.due_payment_date?.toISOString() || null,
      created_at: expense.created_at.toISOString(),
      charges: transformedCharges,
      deduction_charges: transformedDeductions,
      payment_history: transformedHistory,
      recurring_config: expense.recurring_configs,
      property_expense: propertyExpense,
      contract_expense: contractExpense,
      company_expense: companyExpense,
      purchase_expense: purchaseExpense,
      staff_expense: staffExpense,
      total_amount: totalAmount,
      total_paid: totalPaid,
      remaining_amount: remainingAmount,
      payment_percentage: paymentPercentage,
      can_edit: canEdit
    }
  } catch (error) {
    console.error('Error fetching expense details:', error)
    return null
  }
}

export default async function ExpenseDetailsPage({ params }: Props) {
  const { id } = await params
  const expense = await getExpenseDetails(id)

  if (!expense) {
    notFound()
  }

  return <ExpenseDetailsContent expense={expense} />
}
