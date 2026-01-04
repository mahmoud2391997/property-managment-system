'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { transformExpense } from '@/lib/expenses-utils'

// Shared select for expense queries
const expenseSelect = {
  reference_id: true,
  type: true,
  status: true,
  due_payment_date: true,
  created_at: true,
  properties: {
    select: {
      id: true,
      code: true,
      projects: {
        select: {
          title: true
        }
      }
    }
  },
  leases: {
    select: {
      reference_id: true
    }
  },
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
      const whereClause: any = {
        organization_id: staff.organization_id,
        category: category,
        ...(search && {
          OR: [
            { reference_id: { contains: search, mode: 'insensitive' } },
            { properties: { is: { code: { contains: search, mode: 'insensitive' } } } },
            { leases: { is: { reference_id: { contains: search, mode: 'insensitive' } } } },
            { type: { contains: search, mode: 'insensitive' } }
          ]
        })
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

    // Legacy mode: Get optional propertyId filter
    const propertyId = searchParams.get('propertyId')

    // Build where clause
    const whereClause: any = {
      organization_id: staff.organization_id,
      category: category
    }

    // If propertyId provided, filter expenses by property_id
    if (propertyId) {
      whereClause.property_id = propertyId
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
