'use server'

// Dummy data - no database calls

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
  previousBalance: number | null
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
  return [
    { id: '1', name: 'Sunset Residences' },
    { id: '2', name: 'Green Valley Apartments' },
    { id: '3', name: 'City Center Condos' }
  ]
}

export async function getAvailableYears(orgId: string) {
  return [2025, 2024, 2023]
}

// ── KPI Cards ────────────────────────────────────────────────────────────

export async function getKpiData(orgId: string): Promise<KpiData> {
  return {
    totalPayments: 450000,
    totalExpenses: 120000,
    previousBalance: 280000,
    rentalDue: 45000,
    rentalReceived: 42000,
    rentalOverdueAmount: 15000,
    rentalOverdueCount: 3,
    rentalOverdueThisMonth: 1,
    rentalOverduePreviousMonths: 2,
    expenseTotal: 120000,
    expensePaid: 95000,
    expenseOverdueAmount: 8000,
    expenseOverdueCount: 2,
    expenseOverdueThisMonth: 0,
    expenseOverduePreviousMonths: 2
  }
}

// ── Monthly Overview (Income vs Outcome) ─────────────────────────────────

export async function getMonthlyOverviewData(
  orgId: string,
  year: number,
  projectId?: string,
) {
  return MONTH_NAMES.map((name, i) => ({
    month: name,
    income: 30000 + Math.floor(Math.random() * 10000),
    outcome: 10000 + Math.floor(Math.random() * 3000),
  }))
}

// ── Expense Breakdown by Category ────────────────────────────────────────

export async function getExpenseBreakdownData(
  orgId: string,
  year: number,
  month: number,
) {
  return Object.entries(EXPENSE_CATEGORY_COLORS)
    .map(([category, color]) => ({
      category: category.replace(/_/g, ' '),
      amount: Math.floor(Math.random() * 25000) + 5000,
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
  return MONTH_NAMES.map((name, i) => ({
    month: name,
    rentalReceived: 25000 + Math.floor(Math.random() * 5000),
    ownerPaid: 20000 + Math.floor(Math.random() * 4000),
    occupancyRate: 70 + Math.floor(Math.random() * 20),
    propertyCount: 18,
  }))
}

// ── Payment Type Breakdown (donut) ───────────────────────────────────────

export async function getPaymentTypeData(
  orgId: string,
  year: number,
  month: number,
  projectId?: string,
) {
  return [
    { type: 'Cash', amount: 8000, color: PAYMENT_TYPE_COLORS[0] },
    { type: 'Bank Transfer', amount: 15000, color: PAYMENT_TYPE_COLORS[1] },
    { type: 'Cheque', amount: 5000, color: PAYMENT_TYPE_COLORS[2] },
    { type: 'Online Payment', amount: 12000, color: PAYMENT_TYPE_COLORS[3] }
  ]
}

// ── Top Expense Properties (bar chart) ──────────────────────────────────

export async function getTopExpensePropertiesData(
  orgId: string,
  projectId?: string,
  selectedTypes?: string[],
) {
  return [
    { propertyCode: 'A-101', totalExpense: 8500 },
    { propertyCode: 'B-201', totalExpense: 6200 },
    { propertyCode: 'D-401', totalExpense: 4800 },
    { propertyCode: 'E-501', totalExpense: 3500 }
  ]
}

export async function getAvailableExpenseTypes(orgId: string) {
  return {
    'Property_Related': ['Maintenance', 'Repairs', 'Utilities'],
    'Staff_Related': ['Salaries', 'Training', 'Benefits'],
    'Company_Related': ['Office', 'Equipment', 'Supplies'],
    'Purchase_Related': ['Inventory', 'Assets', 'Stock'],
    'Contract_Related': ['Vendor Fees', 'Services', 'Licenses']
  }
}

export async function getPropertyProfitHeatmapData(
  orgId: string,
  year: number,
  projectId?: string,
) {
  const propertyCodes = ['A-101', 'A-102', 'B-201', 'C-301', 'D-401', 'E-501']
  
  return propertyCodes.map(code => ({
    propertyCode: code,
    months: MONTH_NAMES.map(name => ({
      month: name,
      income: 3000 + Math.floor(Math.random() * 2000),
      outcome: 1000 + Math.floor(Math.random() * 500),
      profit: 2000 + Math.floor(Math.random() * 1000)
    })),
    avgProfit: 2500
  }))
}
