import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { transformExpense } from '@/lib/expenses-utils'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

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
      vendors: { select: { name: true } },
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
  company_expenses: { select: { type: true, is_asset: true, vendors: { select: { name: true } } } },
  purchase_expenses: {
    select: {
      type: true,
      is_asset: true,
      vendors: { select: { name: true } },
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
    const { user, staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'expenses.access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    const type = searchParams.get('type') || ''
    const referenceId = searchParams.get('reference_id') || ''
    const dueMonth = searchParams.get('due_month') || '' // YYYY-MM
    const dueMonthTimezoneOffset = parseInt(searchParams.get('due_month_timezone_offset') || '0', 10)
    const dueDate = searchParams.get('due_date')?.trim() || ''
    const dueDateFrom = searchParams.get('dueDateFrom')?.trim() || ''
    const dueDateTo = searchParams.get('dueDateTo')?.trim() || ''
    const property = searchParams.get('property') || ''
    const leaseId = searchParams.get('lease_id') || ''
    const vendor = searchParams.get('vendor') || ''
    const isClaimed = searchParams.get('is_claimed') || ''
    const contractId = searchParams.get('contract_id') || ''
    const ownerName = searchParams.get('owner_name') || ''
    const staffName = searchParams.get('staff_name') || ''
    const month = searchParams.get('month') || ''
    const isAsset = searchParams.get('is_asset') || ''
    const recurringPattern = searchParams.get('recurring_pattern') || ''
    const rawStatus = searchParams.get('status') || ''

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
      if (search && category === 'Company_Related') {
        searchConditions.push(
          { company_expenses: { vendors: { name: { contains: search, mode: 'insensitive' } } } }
        )
      }
      if (search && category === 'Purchase_Related') {
        searchConditions.push(
          { purchase_expenses: { vendors: { name: { contains: search, mode: 'insensitive' } } } },
          { purchase_expenses: { properties: { code: { contains: search, mode: 'insensitive' } } } }
        )
      }

      const whereClause: any = {
        organization_id: staff.organization_id,
        category,
        ...(searchConditions.length > 0 && { OR: searchConditions })
      }

      // Global filters
      if (referenceId) {
        whereClause.reference_id = { contains: referenceId, mode: 'insensitive' }
      }
      const filters: any[] = []
      if (dueMonth) {
        const [year, month] = dueMonth.split('-').map(Number)
        const startUtc = Date.UTC(year, month - 1, 1) + dueMonthTimezoneOffset * 60 * 1000
        const endUtc = Date.UTC(year, month, 1) + dueMonthTimezoneOffset * 60 * 1000
        filters.push({ due_payment_date: { gte: new Date(startUtc), lt: new Date(endUtc) } })
      }
      if (dueDate) {
        const [year, month, day] = dueDate.split('-').map(Number)
        const startUtc = Date.UTC(year, month - 1, day) + dueMonthTimezoneOffset * 60 * 1000
        const endUtc = Date.UTC(year, month - 1, day + 1) + dueMonthTimezoneOffset * 60 * 1000
        filters.push({ due_payment_date: { gte: new Date(startUtc), lt: new Date(endUtc) } })
      }
      if (dueDateFrom || dueDateTo) {
        const rangeFilter: any = {}
        if (dueDateFrom) {
          const [year, month, day] = dueDateFrom.split('-').map(Number)
          rangeFilter.gte = new Date(Date.UTC(year, month - 1, day) + dueMonthTimezoneOffset * 60 * 1000)
        }
        if (dueDateTo) {
          const [year, month, day] = dueDateTo.split('-').map(Number)
          rangeFilter.lt = new Date(Date.UTC(year, month - 1, day + 1) + dueMonthTimezoneOffset * 60 * 1000)
        }
        filters.push({ due_payment_date: rangeFilter })
      }

      if (filters.length > 0) {
        whereClause.AND = [...(whereClause.AND || []), ...filters]
      }
      if (recurringPattern === 'Recurring') {
        whereClause.recurring_config_id = { not: null }
      } else if (recurringPattern === 'One-time') {
        whereClause.recurring_config_id = null
      }
      // Only filter on raw DB status values; calculated ones are client-side
      if (rawStatus === 'Paid' || rawStatus === 'Pending' || rawStatus === 'Cancelled') {
        whereClause.status = rawStatus
      }

      // Category-specific
      if (category === 'Property_Related') {
        const sub: any = {}
        if (type) sub.type = type
        if (isClaimed) sub.is_claimed = isClaimed === 'true'
        if (vendor) sub.vendors = { name: { contains: vendor, mode: 'insensitive' } }
        if (property) sub.properties = { code: { contains: property, mode: 'insensitive' } }
        if (leaseId) sub.leases = { reference_id: { contains: leaseId, mode: 'insensitive' } }
        if (Object.keys(sub).length) whereClause.property_expenses = sub
      }

      if (category === 'Contract_Related') {
        const sub: any = {}
        if (type) sub.type = type
        if (contractId || ownerName) {
          sub.contracts = {}
          if (contractId) sub.contracts.reference_id = { contains: contractId, mode: 'insensitive' }
          if (ownerName) {
            sub.contracts.owners = {
              OR: [
                { first_name: { contains: ownerName, mode: 'insensitive' } },
                { last_name: { contains: ownerName, mode: 'insensitive' } }
              ]
            }
          }
        }
        if (Object.keys(sub).length) whereClause.contract_expenses = sub
      }

      if (category === 'Staff_Related') {
        const sub: any = {}
        if (type) sub.type = type
        if (staffName) {
          sub.staff = {
            OR: [
              { first_name: { contains: staffName, mode: 'insensitive' } },
              { last_name: { contains: staffName, mode: 'insensitive' } }
            ]
          }
        }
        if (month) {
          const start = new Date(`${month}-01`)
          const end = new Date(start); end.setMonth(end.getMonth() + 1)
          sub.month = { gte: start, lt: end }
        }
        if (Object.keys(sub).length) whereClause.staff_expenses = sub
      }

      if (category === 'Company_Related') {
        const sub: any = {}
        if (type) sub.type = type
        if (isAsset) sub.is_asset = isAsset === 'true'
        if (isClaimed) sub.is_claimed = isClaimed === 'true'
        if (vendor) sub.vendors = { name: { contains: vendor, mode: 'insensitive' } }
        if (Object.keys(sub).length) whereClause.company_expenses = sub
      }

      if (category === 'Purchase_Related') {
        const sub: any = {}
        if (type) sub.type = type
        if (isAsset) sub.is_asset = isAsset === 'true'
        if (isClaimed) sub.is_claimed = isClaimed === 'true'
        if (vendor) sub.vendors = { name: { contains: vendor, mode: 'insensitive' } }
        if (property) sub.properties = { code: { contains: property, mode: 'insensitive' } }
        if (Object.keys(sub).length) whereClause.purchase_expenses = sub
      }

      const needsFrontendStatusFilter = Boolean(rawStatus && rawStatus !== 'all')

      // Fetch expenses and optionally total count in parallel
      const [expenses, total] = await Promise.all([
        prisma.expenses.findMany({
          where: whereClause,
          select: expenseSelect,
          orderBy: { created_at: 'desc' },
          ...(needsFrontendStatusFilter
            ? {}
            : { skip: (page - 1) * limit, take: limit }
          )
        }),
        needsFrontendStatusFilter || skipCount ? Promise.resolve(-1) : prisma.expenses.count({ where: whereClause })
      ])

      // Transform expenses for display with permission checks
      const hasLeaseAccess = hasPermission(permissions, 'leases.access')
      let transformedExpenses = expenses.map(e => transformExpense(e as any, hasLeaseAccess))

      if (needsFrontendStatusFilter) {
        transformedExpenses = transformedExpenses.filter(expense => {
          // Group "Paid" with "Paid Late"
          if (rawStatus === 'Paid') {
            return expense.status === 'Paid' || expense.status === 'Paid Late'
          }
          // Group "Pending" with "Overdue"
          if (rawStatus === 'Pending') {
            return expense.status === 'Pending' || expense.status === 'Overdue'
          }
          // Other statuses remain as-is
          return expense.status === rawStatus
        })

        const startIndex = (page - 1) * limit
        const paginatedExpenses = transformedExpenses.slice(startIndex, startIndex + limit)

        return NextResponse.json({
          success: true,
          data: paginatedExpenses,
          total: transformedExpenses.length,
          page,
          pageSize: limit
        })
      }

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

    // Transform expenses for display with permission checks
    const hasLeaseAccess = hasPermission(permissions, 'leases.access')
    console.log('Permission check:', {
      permissions: permissions,
      hasLeaseAccess: hasLeaseAccess,
      leasesAccess: permissions?.has('leases.access')
    })
    const transformedExpenses = expenses.map((expense) => {
      return transformExpense(expense as any, hasLeaseAccess)
    })

    return NextResponse.json(transformedExpenses)
  } catch (error: any) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}
