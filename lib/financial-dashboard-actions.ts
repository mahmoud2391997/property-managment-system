'use server'

import { prisma } from '@/lib/prisma'

// ── Helpers ──────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function utcDate(year: number, month: number, day: number = 1): Date {
  return new Date(Date.UTC(year, month, day))
}

const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  Property_Related: '#0d9488',
  Staff_Related: '#0284c7',
  Company_Related: '#7c3aed',
  Purchase_Related: '#64748b',
  Contract_Related: '#d97706',
}

const PAYMENT_TYPE_COLORS = [
  '#0d9488', '#7c3aed', '#0284c7', '#d97706', '#64748b',
  '#ec4899', '#ef4444', '#6b7280', '#059669', '#8b5cf6',
]

// ── Types ────────────────────────────────────────────────────────────────

export interface KpiData {
  totalPayments: number
  totalExpenses: number
  rentalDue: number
  rentalReceived: number
  rentalOverdueAmount: number
  rentalOverdueCount: number
  rentalOverdueThisMonth: number
  rentalOverduePreviousMonths: number
  expenseTotal: number
  expensePaid: number
  expenseOverdueAmount: number
  expenseOverdueCount: number
  expenseOverdueThisMonth: number
  expenseOverduePreviousMonths: number
}

// ── Projects + Years ─────────────────────────────────────────────────────

export async function getProjects(orgId: string) {
  const projects = await prisma.projects.findMany({
    where: { organization_id: orgId },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })
  return projects.map(p => ({ id: p.id, name: p.title }))
}

export async function getAvailableYears(orgId: string) {
  const rows = await prisma.financial_daily_summary.findMany({
    where: { organization_id: orgId },
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'desc' },
  })

  const yearsSet = new Set<number>()
  rows.forEach(r => yearsSet.add(r.date.getUTCFullYear()))
  yearsSet.add(new Date().getFullYear())

  return Array.from(yearsSet).sort((a, b) => b - a)
}

// ── KPI Cards ────────────────────────────────────────────────────────────

export async function getKpiData(orgId: string): Promise<KpiData> {
  const now = new Date()
  const monthStart = utcDate(now.getFullYear(), now.getMonth(), 1)

  // Try current month first
  let summary = await prisma.financial_daily_summary.findFirst({
    where: {
      organization_id: orgId,
      date: monthStart,
    },
  })

  // Fallback to latest month with data
  if (!summary) {
    summary = await prisma.financial_daily_summary.findFirst({
      where: { organization_id: orgId },
      orderBy: { date: 'desc' },
    })
  }

  if (!summary) {
    return {
      totalPayments: 0,
      totalExpenses: 0,
      rentalDue: 0,
      rentalReceived: 0,
      rentalOverdueAmount: 0,
      rentalOverdueCount: 0,
      rentalOverdueThisMonth: 0,
      rentalOverduePreviousMonths: 0,
      expenseTotal: 0,
      expensePaid: 0,
      expenseOverdueAmount: 0,
      expenseOverdueCount: 0,
      expenseOverdueThisMonth: 0,
      expenseOverduePreviousMonths: 0,
    }
  }

  return {
    totalPayments: Number(summary.total_income),
    totalExpenses: Number(summary.total_outcome),
    rentalDue: Number(summary.rental_due),
    rentalReceived: Number(summary.rental_received),
    rentalOverdueAmount: Number(summary.rental_overdue_amount),
    rentalOverdueCount: summary.rental_overdue_count,
    rentalOverdueThisMonth: Number(summary.rental_overdue_this_month),
    rentalOverduePreviousMonths: Number(summary.rental_overdue_previous_months),
    expenseTotal: Number(summary.expense_total),
    expensePaid: Number(summary.expense_paid),
    expenseOverdueAmount: Number(summary.expense_overdue_amount),
    expenseOverdueCount: summary.expense_overdue_count,
    expenseOverdueThisMonth: Number(summary.expense_overdue_this_month),
    expenseOverduePreviousMonths: Number(summary.expense_overdue_previous_months),
  }
}

// ── Monthly Overview (Income vs Outcome) ─────────────────────────────────

export async function getMonthlyOverviewData(
  orgId: string,
  year: number,
  projectId?: string,
) {
  if (projectId && projectId !== 'all') {
    // Project-filtered: aggregate from financial_daily_property via properties.project_id
    const rows = await prisma.financial_daily_property.findMany({
      where: {
        organization_id: orgId,
        date: { gte: utcDate(year, 0, 1), lte: utcDate(year, 11, 1) },
        properties: { project_id: projectId },
      },
      select: { date: true, income: true, outcome: true },
    })

    const monthMap = new Map<number, { income: number; outcome: number }>()
    rows.forEach(r => {
      const month = r.date.getUTCMonth()
      const existing = monthMap.get(month) || { income: 0, outcome: 0 }
      existing.income += Number(r.income)
      existing.outcome += Number(r.outcome)
      monthMap.set(month, existing)
    })

    return MONTH_NAMES.map((name, i) => ({
      month: name,
      income: monthMap.has(i) ? monthMap.get(i)!.income : null,
      outcome: monthMap.has(i) ? monthMap.get(i)!.outcome : null,
    }))
  }

  // No project filter: use financial_daily_summary
  const rows = await prisma.financial_daily_summary.findMany({
    where: {
      organization_id: orgId,
      date: { gte: utcDate(year, 0, 1), lte: utcDate(year, 11, 1) },
    },
    select: { date: true, total_income: true, total_outcome: true },
    orderBy: { date: 'asc' },
  })

  const monthMap = new Map<number, { income: number; outcome: number }>()
  rows.forEach(r => {
    monthMap.set(r.date.getUTCMonth(), {
      income: Number(r.total_income),
      outcome: Number(r.total_outcome),
    })
  })

  return MONTH_NAMES.map((name, i) => ({
    month: name,
    income: monthMap.has(i) ? monthMap.get(i)!.income : null,
    outcome: monthMap.has(i) ? monthMap.get(i)!.outcome : null,
  }))
}

// ── Expense Breakdown by Category ────────────────────────────────────────

export async function getExpenseBreakdownData(
  orgId: string,
  year: number,
  month: number,
) {
  const monthStart = utcDate(year, month, 1)

  const rows = await prisma.financial_daily_expense_category.findMany({
    where: {
      organization_id: orgId,
      date: monthStart,
    },
    select: { category: true, amount: true },
  })

  const categoryAmounts = new Map<string, number>()
  rows.forEach(r => {
    categoryAmounts.set(r.category, Number(r.amount))
  })

  // Always return all known categories, even if 0
  return Object.entries(EXPENSE_CATEGORY_COLORS)
    .map(([category, color]) => ({
      category: category.replace(/_/g, ' '),
      amount: categoryAmounts.get(category) || 0,
      color,
    }))
    .sort((a, b) => b.amount - a.amount)
}

// ── Rental Overview (received vs owner paid + occupancy line) ────────────

export async function getRentalOverviewData(
  orgId: string,
  year: number,
  projectId?: string,
) {
  // Rental received & owner paid from financial_daily_property
  const propertyRows = await prisma.financial_daily_property.findMany({
    where: {
      organization_id: orgId,
      date: { gte: utcDate(year, 0, 1), lte: utcDate(year, 11, 1) },
      ...(projectId && projectId !== 'all'
        ? { properties: { project_id: projectId } }
        : {}),
    },
    select: { date: true, rental_received: true, owner_paid: true },
  })

  const rentalMap = new Map<number, { received: number; paid: number }>()
  propertyRows.forEach(r => {
    const month = r.date.getUTCMonth()
    const existing = rentalMap.get(month) || { received: 0, paid: 0 }
    existing.received += Number(r.rental_received)
    existing.paid += Number(r.owner_paid)
    rentalMap.set(month, existing)
  })

  // Occupancy data — org-wide (not filtered by project), latest snapshot per month
  const occupancyRows = await prisma.financial_daily_occupancy.findMany({
    where: {
      organization_id: orgId,
      date: { gte: utcDate(year, 0, 1), lte: utcDate(year, 11, 31) },
    },
    select: { date: true, occupancy_rate: true, properties_count: true },
    orderBy: { date: 'desc' },
  })

  // Take the latest snapshot for each month
  const occupancyMap = new Map<number, { rate: number; count: number }>()
  occupancyRows.forEach(r => {
    const month = r.date.getUTCMonth()
    if (!occupancyMap.has(month)) {
      occupancyMap.set(month, {
        rate: Number(r.occupancy_rate),
        count: r.properties_count,
      })
    }
  })

  return MONTH_NAMES.map((name, i) => ({
    month: name,
    rentalReceived: rentalMap.has(i) ? rentalMap.get(i)!.received : null,
    ownerPaid: rentalMap.has(i) ? rentalMap.get(i)!.paid : null,
    occupancyRate: occupancyMap.has(i) ? occupancyMap.get(i)!.rate : null,
    propertyCount: occupancyMap.has(i) ? occupancyMap.get(i)!.count : null,
  }))
}

// ── Payment Type Breakdown (donut) ───────────────────────────────────────

export async function getPaymentTypeData(
  orgId: string,
  year: number,
  month: number,
  projectId?: string,
) {
  const monthStart = utcDate(year, month, 1)

  const rows = await prisma.financial_daily_payment_type.findMany({
    where: {
      organization_id: orgId,
      date: monthStart,
      ...(projectId && projectId !== 'all'
        ? { project_id: projectId }
        : {}),
    },
    select: { type: true, amount: true },
  })

  // Aggregate by type (in case there are multiple project_id rows for same type)
  const typeMap = new Map<string, number>()
  rows.forEach(r => {
    typeMap.set(r.type, (typeMap.get(r.type) || 0) + Number(r.amount))
  })

  return Array.from(typeMap.entries())
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, amount], i) => ({
      type,
      amount,
      color: PAYMENT_TYPE_COLORS[i % PAYMENT_TYPE_COLORS.length],
    }))
}

// ── Top Expense Properties (bar chart) ──────────────────────────────────

export async function getTopExpensePropertiesData(
  orgId: string,
  projectId?: string,
  selectedTypes?: string[], // Format: "Category:Type"
) {
  if (selectedTypes && selectedTypes.length === 0) return []

  // Build OR conditions from selected types
  const typeConditions = selectedTypes?.length
    ? selectedTypes.map(t => {
        const [category, type] = t.split(':')
        return { category, type }
      })
    : undefined

  const rows = await prisma.financial_daily_property_expense.findMany({
    where: {
      organization_id: orgId,
      ...(projectId && projectId !== 'all'
        ? { properties: { project_id: projectId } }
        : {}),
      ...(typeConditions ? { OR: typeConditions } : {}),
    },
    select: {
      property_id: true,
      amount: true,
      properties: { select: { code: true } },
    },
  })

  // Aggregate by property
  const propertyMap = new Map<string, { code: string; total: number }>()
  rows.forEach(r => {
    const existing = propertyMap.get(r.property_id) || { code: r.properties.code, total: 0 }
    existing.total += Number(r.amount)
    propertyMap.set(r.property_id, existing)
  })

  return Array.from(propertyMap.values())
    .map(p => ({ propertyCode: p.code, totalExpense: p.total }))
    .sort((a, b) => b.totalExpense - a.totalExpense)
}

// ── Available Expense Types (for TopExpenseProperties filter) ────────────

export async function getAvailableExpenseTypes(orgId: string) {
  const rows = await prisma.financial_daily_property_expense.findMany({
    where: { organization_id: orgId },
    select: { category: true, type: true },
    distinct: ['category', 'type'],
  })

  const categoryTypeMap: Record<string, string[]> = {}
  rows.forEach(r => {
    if (!categoryTypeMap[r.category]) {
      categoryTypeMap[r.category] = []
    }
    if (!categoryTypeMap[r.category].includes(r.type)) {
      categoryTypeMap[r.category].push(r.type)
    }
  })

  return categoryTypeMap
}

// ── Property Profit Heatmap ──────────────────────────────────────────────

export async function getPropertyProfitHeatmapData(
  orgId: string,
  year: number,
  projectId?: string,
) {
  const rows = await prisma.financial_daily_property.findMany({
    where: {
      organization_id: orgId,
      date: { gte: utcDate(year, 0, 1), lte: utcDate(year, 11, 1) },
      ...(projectId && projectId !== 'all'
        ? { properties: { project_id: projectId } }
        : {}),
    },
    select: {
      date: true,
      income: true,
      outcome: true,
      properties: { select: { code: true } },
    },
  })

  // Group by property code, then by month
  const propertyMap = new Map<string, Map<number, { income: number; outcome: number }>>()
  rows.forEach(r => {
    const code = r.properties.code
    if (!propertyMap.has(code)) {
      propertyMap.set(code, new Map())
    }
    propertyMap.get(code)!.set(r.date.getUTCMonth(), {
      income: Number(r.income),
      outcome: Number(r.outcome),
    })
  })

  return Array.from(propertyMap.entries()).map(([code, monthData]) => {
    const months = MONTH_NAMES.map((name, i) => {
      const data = monthData.get(i)
      if (!data) return { month: name, income: null, outcome: null, profit: null }
      return {
        month: name,
        income: data.income,
        outcome: data.outcome,
        profit: data.income - data.outcome,
      }
    })
    const validMonths = months.filter(m => m.profit !== null)
    const avgProfit = validMonths.length > 0
      ? Math.round(validMonths.reduce((s, m) => s + m.profit!, 0) / validMonths.length)
      : 0
    return { propertyCode: code, months, avgProfit }
  })
}
