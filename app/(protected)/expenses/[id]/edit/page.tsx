export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import EditExpenseContent from './edit-expense-content'

type Props = {
  params: Promise<{ id: string }>
}

export type EditExpenseData = {
  id: string
  reference_id: string
  category: string
  description: string | null
  // Category-specific
  property_expense: {
    type: string
    property_id: string | null
    lease_id: string | null
    is_claimed: boolean
    claimer_id: string | null
  } | null
  contract_expense: {
    type: string
    contract_id: string
    contract_reference_id: string
    contract_owner_name: string
  } | null
  company_expense: {
    type: string
    is_asset: boolean
    is_claimed: boolean
    claimer_id: string | null
  } | null
  purchase_expense: {
    type: string
    is_asset: boolean
    depreciation_percentage: number | null
    property_id: string | null
    is_claimed: boolean
    claimer_id: string | null
  } | null
  staff_expense: {
    type: string
    staff_id: string | null
    month: string
    gross_salary: number
    epf_employer: number
    socso_employer: number
    epf_employee: number
    socso_employee: number
    tax: number
  } | null
  charges: {
    id: string
    title: string
    amount: number
    is_taxed: boolean
    is_refunded: boolean
  }[]
  deduction_charges: {
    id: string
    title: string
    amount: number
  }[]
}

async function getExpenseForEdit(referenceId: string): Promise<EditExpenseData | null> {
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
          select: { id: true }
        },
        property_expenses: {
          select: {
            type: true,
            property_id: true,
            lease_id: true,
            is_claimed: true,
            claimer_id: true
          }
        },
        contract_expenses: {
          select: {
            type: true,
            contract_id: true,
            contracts: {
              select: {
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
          select: {
            type: true,
            is_asset: true,
            is_claimed: true,
            claimer_id: true
          }
        },
        purchase_expenses: {
          select: {
            type: true,
            is_asset: true,
            depreciation_percentage: true,
            property_id: true,
            is_claimed: true,
            claimer_id: true
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
            tax: true
          }
        }
      }
    })

    if (!expense) return null

    // Cannot edit if there are successful payments
    if (expense.payment_history.length > 0) return null

    return {
      id: expense.id,
      reference_id: expense.reference_id,
      category: expense.category,
      description: expense.description,
      property_expense: expense.property_expenses ? {
        type: expense.property_expenses.type,
        property_id: expense.property_expenses.property_id,
        lease_id: expense.property_expenses.lease_id,
        is_claimed: expense.property_expenses.is_claimed,
        claimer_id: expense.property_expenses.claimer_id
      } : null,
      contract_expense: expense.contract_expenses ? {
        type: expense.contract_expenses.type,
        contract_id: expense.contract_expenses.contract_id,
        contract_reference_id: expense.contract_expenses.contracts.reference_id,
        contract_owner_name: [
          expense.contract_expenses.contracts.owners.first_name,
          expense.contract_expenses.contracts.owners.last_name
        ].filter(Boolean).join(' ')
      } : null,
      company_expense: expense.company_expenses ? {
        type: expense.company_expenses.type,
        is_asset: expense.company_expenses.is_asset,
        is_claimed: expense.company_expenses.is_claimed,
        claimer_id: expense.company_expenses.claimer_id
      } : null,
      purchase_expense: expense.purchase_expenses ? {
        type: expense.purchase_expenses.type,
        is_asset: expense.purchase_expenses.is_asset,
        depreciation_percentage: expense.purchase_expenses.depreciation_percentage?.toNumber() ?? null,
        property_id: expense.purchase_expenses.property_id,
        is_claimed: expense.purchase_expenses.is_claimed,
        claimer_id: expense.purchase_expenses.claimer_id
      } : null,
      staff_expense: expense.staff_expenses ? {
        type: expense.staff_expenses.type,
        staff_id: expense.staff_expenses.staff_id,
        month: expense.staff_expenses.month.toISOString(),
        gross_salary: expense.staff_expenses.gross_salary.toNumber(),
        epf_employer: expense.staff_expenses.epf_employer.toNumber(),
        socso_employer: expense.staff_expenses.socso_employer.toNumber(),
        epf_employee: expense.staff_expenses.epf_employee.toNumber(),
        socso_employee: expense.staff_expenses.socso_employee.toNumber(),
        tax: expense.staff_expenses.tax?.toNumber() ?? 0
      } : null,
      charges: expense.charges.map(c => ({
        id: c.id,
        title: c.title,
        amount: c.amount.toNumber(),
        is_taxed: c.is_taxed,
        is_refunded: c.is_refunded
      })),
      deduction_charges: expense.deduction_charges.map(d => ({
        id: d.id,
        title: d.title,
        amount: d.amount.toNumber()
      }))
    }
  } catch (error) {
    console.error('Error fetching expense for edit:', error)
    return null
  }
}

export default async function EditExpensePage({ params }: Props) {
  const { id } = await params
  const expense = await getExpenseForEdit(id)

  if (!expense) {
    notFound()
  }

  return <EditExpenseContent expense={expense} />
}
