import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { transformExpense } from '@/lib/expenses-utils'

// Shared select for expense queries
export const expenseSelect = {
  reference_id: true,
  category: true,
  description: true,
  status: true,
  due_payment_date: true,
  created_at: true,
  charges: {
    select: {
      amount: true,
      is_taxed: true
    }
  },
  payment_history: {
    orderBy: {
      paid_at: 'desc' as const
    },
    select: {
      paid_at: true,
      amount: true,
      status: true
    }
  },
  recurring_configs: {
    select: {
      every: true,
      time_unit: true,
      event_on: true
    }
  },
  property_expenses: {
    select: {
      type: true,
      properties: {
        select: {
          id: true,
          code: true,
          projects: { select: { title: true } }
        }
      },
      leases: {
        select: {
          id: true,
          reference_id: true,
          property_id: true,
          room_id: true,
          properties: { select: { id: true, code: true } },
          rooms: { select: { id: true, title: true } }
        }
      }
    }
  },
  contract_expenses: {
    select: {
      type: true,
      contracts: {
        select: {
          reference_id: true,
          owners: { select: { first_name: true, last_name: true } }
        }
      }
    }
  },
  company_expenses: { select: { type: true, is_asset: true } },
  purchase_expenses: {
    select: {
      type: true,
      is_asset: true,
      properties: {
        select: {
          id: true,
          code: true,
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current staff organization
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)

    // Pagination and search params
    const paginate = searchParams.get('paginate') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')?.trim() || ''
    const skipCount = searchParams.get('skipCount') === 'true'
    const category = searchParams.get('category') || 'Property_Related'

    // If paginate mode is enabled, use pagination/search logic
    if (paginate) {
      // Build where clause with search and category filter
      const searchConditions: any[] = search
        ? [
            { reference_id: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        : []

      // Category-specific search conditions
      if (search && category === 'Property_Related') {
        searchConditions.push(
          { property_expenses: { properties: { code: { contains: search, mode: 'insensitive' } } } },
          { property_expenses: { properties: { projects: { title: { contains: search, mode: 'insensitive' } } } } },
          { property_expenses: { leases: { reference_id: { contains: search, mode: 'insensitive' } } } }
        )
      }
      if (search && category === 'Contract_Related') {
        searchConditions.push(
          { contract_expenses: { contracts: { reference_id: { contains: search, mode: 'insensitive' } } } },
          { contract_expenses: { contracts: { owners: { first_name: { contains: search, mode: 'insensitive' } } } } },
          { contract_expenses: { contracts: { owners: { last_name: { contains: search, mode: 'insensitive' } } } } }
        )
      }
      if (search && category === 'Staff_Related') {
        searchConditions.push(
          { staff_expenses: { staff: { first_name: { contains: search, mode: 'insensitive' } } } },
          { staff_expenses: { staff: { last_name: { contains: search, mode: 'insensitive' } } } }
        )
      }

      const whereClause: any = {
        organization_id: staff.organization_id,
        category: category,
        ...(searchConditions.length > 0 && { OR: searchConditions })
      }

      // Fetch expenses and optionally total count in parallel
      const [expenses, total] = await Promise.all([
        prisma.expenses.findMany({
          where: whereClause,
          select: expenseSelect,
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        skipCount ? Promise.resolve(-1) : prisma.expenses.count({ where: whereClause })
      ])

      // Transform expenses for display
      const transformedExpenses = expenses.map(transformExpense)

      return NextResponse.json({
        success: true,
        data: transformedExpenses,
        total,
        page,
        pageSize: limit
      })
    }

    // Legacy mode: fetch all expenses for a category
    const whereClause: any = {
      organization_id: staff.organization_id,
      category: category
    }

    // Fetch expenses with related data
    const expenses = await prisma.expenses.findMany({
      where: whereClause,
      select: expenseSelect,
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform expenses for display
    const transformedExpenses = expenses.map(transformExpense)

    return NextResponse.json(transformedExpenses)
  } catch (error: any) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}
