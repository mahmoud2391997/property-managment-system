'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  BalanceCard,
  RentalReceivedCard,
  RentalOverdueCard,
  ExpensePaidCard,
  ExpenseOverdueCard,
} from '@/components/dashboard/financial-kpi-cards'
import { FinancialMonthlyOverview } from '@/components/dashboard/financial-monthly-overview'
import { FinancialExpenseBreakdown } from '@/components/dashboard/financial-expense-breakdown'
import { PaymentTypeBreakdown } from '@/components/dashboard/payment-type-breakdown'
import { TopExpenseProperties } from '@/components/dashboard/top-expense-properties'
import { PropertyProfitHeatmap } from '@/components/dashboard/property-profit-heatmap'
import { RentalOverviewChart } from '@/components/dashboard/rental-overview-chart'

// ── Shared constants ───────────────────────────────────────────────────

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021]

const PROJECTS = [
  { id: 'proj-sr', name: 'Seri Rambai' },
  { id: 'proj-gf', name: 'Green Fields' },
  { id: 'proj-mh', name: 'Mutiara Heights' },
  { id: 'proj-bv', name: 'Bayview' },
]

// ── Monthly Overview mock data ─────────────────────────────────────────

const MONTHLY_OVERVIEW_2026 = [
  { month: 'Jan', income: 52000, outcome: 31000 },
  { month: 'Feb', income: 48500, outcome: 28500 },
  { month: 'Mar', income: 55000, outcome: 34000 },
  { month: 'Apr', income: 51000, outcome: 29000 },
  { month: 'May', income: 57500, outcome: 32500 },
  { month: 'Jun', income: 54000, outcome: 36000 },
  { month: 'Jul', income: 59000, outcome: 30000 },
  { month: 'Aug', income: 53500, outcome: 33500 },
  { month: 'Sep', income: 56000, outcome: 31500 },
  { month: 'Oct', income: 60000, outcome: 37000 },
  { month: 'Nov', income: 58000, outcome: 35500 },
  { month: 'Dec', income: 62000, outcome: 39000 },
]

const MONTHLY_OVERVIEW_2025 = [
  { month: 'Jan', income: 42000, outcome: 25000 },
  { month: 'Feb', income: 39000, outcome: 23500 },
  { month: 'Mar', income: 45000, outcome: 28000 },
  { month: 'Apr', income: 43000, outcome: 26000 },
  { month: 'May', income: 47000, outcome: 29500 },
  { month: 'Jun', income: 44500, outcome: 31000 },
  { month: 'Jul', income: 49000, outcome: 27000 },
  { month: 'Aug', income: 46000, outcome: 30000 },
  { month: 'Sep', income: 48000, outcome: 28500 },
  { month: 'Oct', income: 50000, outcome: 33000 },
  { month: 'Nov', income: 49500, outcome: 32000 },
  { month: 'Dec', income: 52000, outcome: 35000 },
]

// ── Rental Overview mock data (line chart) ──────────────────────────────

const RENTAL_OVERVIEW_2026 = [
  { month: 'Jan', rentalReceived: 42000, ownerPaid: 28000, occupancyRate: 60.5, propertyCount: 20 },
  { month: 'Feb', rentalReceived: 39500, ownerPaid: 26500, occupancyRate: 62.0, propertyCount: 20 },
  { month: 'Mar', rentalReceived: 44000, ownerPaid: 30000, occupancyRate: 64.5, propertyCount: 20 },
  { month: 'Apr', rentalReceived: 41000, ownerPaid: 27500, occupancyRate: 65.0, propertyCount: 20 },
  { month: 'May', rentalReceived: 46000, ownerPaid: 31500, occupancyRate: 68.2, propertyCount: 20 },
  { month: 'Jun', rentalReceived: 43500, ownerPaid: 29000, occupancyRate: 67.0, propertyCount: 20 },
  { month: 'Jul', rentalReceived: 47500, ownerPaid: 33000, occupancyRate: 71.5, propertyCount: 20 },
  { month: 'Aug', rentalReceived: 44500, ownerPaid: 30500, occupancyRate: 70.0, propertyCount: 20 },
  { month: 'Sep', rentalReceived: 45000, ownerPaid: 31000, occupancyRate: 72.8, propertyCount: 20 },
  { month: 'Oct', rentalReceived: 48000, ownerPaid: 34000, occupancyRate: 75.0, propertyCount: 20 },
  { month: 'Nov', rentalReceived: 46500, ownerPaid: 32500, occupancyRate: 76.5, propertyCount: 20 },
  { month: 'Dec', rentalReceived: 49000, ownerPaid: 35000, occupancyRate: 78.0, propertyCount: 20 },
]

const RENTAL_OVERVIEW_2025 = [
  { month: 'Jan', rentalReceived: 35000, ownerPaid: 23000, occupancyRate: 50.0, propertyCount: 18 },
  { month: 'Feb', rentalReceived: 33000, ownerPaid: 21500, occupancyRate: 48.5, propertyCount: 18 },
  { month: 'Mar', rentalReceived: 37000, ownerPaid: 25000, occupancyRate: 52.0, propertyCount: 18 },
  { month: 'Apr', rentalReceived: 35500, ownerPaid: 24000, occupancyRate: 53.5, propertyCount: 18 },
  { month: 'May', rentalReceived: 38000, ownerPaid: 26000, occupancyRate: 55.0, propertyCount: 18 },
  { month: 'Jun', rentalReceived: 36000, ownerPaid: 24500, occupancyRate: 54.0, propertyCount: 18 },
  { month: 'Jul', rentalReceived: 39500, ownerPaid: 27500, occupancyRate: 57.5, propertyCount: 19 },
  { month: 'Aug', rentalReceived: 37500, ownerPaid: 26000, occupancyRate: 56.0, propertyCount: 19 },
  { month: 'Sep', rentalReceived: 38500, ownerPaid: 26500, occupancyRate: 58.5, propertyCount: 19 },
  { month: 'Oct', rentalReceived: 40000, ownerPaid: 28000, occupancyRate: 60.0, propertyCount: 19 },
  { month: 'Nov', rentalReceived: 39000, ownerPaid: 27000, occupancyRate: 59.0, propertyCount: 19 },
  { month: 'Dec', rentalReceived: 41000, ownerPaid: 29000, occupancyRate: 61.5, propertyCount: 20 },
]

// ── Expense Category mock data ─────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  { category: 'Property Related', amount: 14200, color: '#0d9488' },
  { category: 'Staff Related', amount: 9800, color: '#0284c7' },
  { category: 'Company Related', amount: 5600, color: '#7c3aed' },
  { category: 'Purchase Related', amount: 4100, color: '#64748b' },
  { category: 'Contract Related', amount: 2800, color: '#d97706' },
]

// ── Payment Type mock data ─────────────────────────────────────────────

const PAYMENT_TYPES = [
  { type: 'Rental', amount: 38000, color: '#0d9488' },
  { type: 'Electricity_Bill', amount: 4500, color: '#7c3aed' },
  { type: 'Water_Bill', amount: 3200, color: '#0284c7' },
  { type: 'Internet_Bill', amount: 2100, color: '#d97706' },
  { type: 'Parking', amount: 2800, color: '#64748b' },
  { type: 'Cleaning_Service', amount: 1200, color: '#ec4899' },
  { type: 'Late_Payment_Charges', amount: 800, color: '#ef4444' },
  { type: 'Miscellaneous_Others', amount: 600, color: '#6b7280' },
]

// ── Property Profit Heatmap mock data ──────────────────────────────────

function generatePropertyHeatmap(): {
  propertyCode: string
  months: { month: string; income: number; outcome: number; profit: number }[]
  avgProfit: number
}[] {
  const codes = [
    'SR-A1', 'SR-A2', 'SR-B1', 'SR-B2', 'SR-B3',
    'GF-01', 'GF-02', 'GF-03', 'GF-12A', 'GF-12B',
    'MH-PH1', 'MH-PH2', 'MH-01', 'MH-02', 'MH-03',
    'BV-A1', 'BV-A2', 'BV-B1', 'BV-B2', 'BV-C1',
  ]
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Deterministic pseudo-random based on string hash
  const hash = (s: string, i: number) => {
    let h = 0
    for (let c = 0; c < s.length; c++) h = (h * 31 + s.charCodeAt(c) + i * 7) & 0xffff
    return h
  }

  return codes.map((code) => {
    const months = monthNames.map((m, i) => {
      const h = hash(code, i)
      const income = 1500 + (h % 4000)
      const outcome = 800 + ((h * 3) % 3500)
      const profit = income - outcome
      return { month: m, income, outcome, profit }
    })
    const avgProfit = Math.round(months.reduce((s, m) => s + m.profit, 0) / 12)
    return { propertyCode: code, months, avgProfit }
  })
}

const PROPERTY_HEATMAP_DATA = generatePropertyHeatmap()

// ── Top Expense Properties mock data ───────────────────────────────────

const PROPERTY_EXPENSES = [
  { propertyCode: 'SR-A1', totalExpense: 15200 },
  { propertyCode: 'GF-12A', totalExpense: 12800 },
  { propertyCode: 'MH-PH1', totalExpense: 11500 },
  { propertyCode: 'SR-B3', totalExpense: 9800 },
  { propertyCode: 'GF-03', totalExpense: 8600 },
  { propertyCode: 'BV-A1', totalExpense: 7900 },
  { propertyCode: 'MH-02', totalExpense: 7200 },
  { propertyCode: 'SR-A2', totalExpense: 6500 },
  { propertyCode: 'GF-01', totalExpense: 5800 },
  { propertyCode: 'BV-B1', totalExpense: 5100 },
  { propertyCode: 'MH-03', totalExpense: 4400 },
  { propertyCode: 'SR-B1', totalExpense: 3700 },
  { propertyCode: 'GF-02', totalExpense: 3100 },
  { propertyCode: 'BV-C1', totalExpense: 2400 },
  { propertyCode: 'MH-01', totalExpense: 1800 },
]

const EXPENSE_CATEGORIES_LIST = [
  'All Categories',
  'Property_Related',
  'Contract_Related',
  'Purchase_Related',
]

const CATEGORY_TYPE_MAP: Record<string, string[]> = {
  Property_Related: [
    'Refund', 'Agent_Commission', 'Maintenance', 'Cleaning_Service', 'Internet_Bill', 'Water_Bill',
    'Electricity_Bill', 'Sewerage_Bill', 'Management_Fees', 'Renovation',
    'Painting_Service', 'AC_Service_Installation', 'Wiring_Electrical', 'Plumbing',
    'Miscellaneous_Others',
  ],
  Contract_Related: ['Rental', 'Contract_Initial_Charges'],
  Purchase_Related: [
    'Furniture', 'Home_Appliances', 'Office_Appliances', 'Tools', 'Electrical_Items', 'Plumbing_Items',
    'Lighting___Bulbs', 'Paint___Renovation_Materials', 'Maintenance_Consumables',
    'Safety_Items', 'Miscellaneous_Others',
  ],
}

const ALL_TYPES = Object.entries(CATEGORY_TYPE_MAP).flatMap(([cat, types]) =>
  types.map((t) => `${cat}:${t}`),
)

// ── Page Component ─────────────────────────────────────────────────────

export default function FinancialDashboardTest() {
  // Monthly overview
  const [overviewYear, setOverviewYear] = useState(2026)

  // Expense breakdown
  const [expCatDate, setExpCatDate] = useState(new Date(2026, 1, 1))

  // Payment type
  const [payTypeDate, setPayTypeDate] = useState(new Date(2026, 1, 1))

  // Rental overview line chart
  const [rentalYear, setRentalYear] = useState(2026)

  // Heatmap
  const [heatmapYear, setHeatmapYear] = useState(2026)

  // Top expenses
  const [topExpCategory, setTopExpCategory] = useState('All Categories')
  const [topExpTypes, setTopExpTypes] = useState<string[]>(ALL_TYPES)

  // Shared project filter
  const [selectedProject, setSelectedProject] = useState('all')

  const overviewData = overviewYear === 2026 ? MONTHLY_OVERVIEW_2026 : MONTHLY_OVERVIEW_2025
  const rentalData = rentalYear === 2026 ? RENTAL_OVERVIEW_2026 : RENTAL_OVERVIEW_2025

  return (
    <div className="flex flex-col gap-6 p-3">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Financial Dashboard - Testing</h1>
        <p className="text-sm text-gray-500">Edit this page freely — no DB queries, instant reload</p>
      </div>

      {/* Row 1: KPI Cards */}
      <Card className="gap-0 p-0 shadow-xs overflow-hidden">
        <div className="flex flex-row py-5">
          <div className="flex-1">
            <BalanceCard totalPayments={53200} totalExpenses={36500} />
          </div>
          <div className="flex-1 border-l border-(--border-default)">
            <RentalReceivedCard totalDue={52000} totalReceived={43500} />
          </div>
          <div className="flex-1 border-l border-(--border-default)">
            <RentalOverdueCard
              overdueAmount={8500}
              overdueCount={5}
              overdueThisMonth={3200}
              overduePreviousMonths={5300}
            />
          </div>
          <div className="flex-1 border-l border-(--border-default)">
            <ExpensePaidCard totalAmount={38000} paidAmount={28000} />
          </div>
          <div className="flex-1 border-l border-(--border-default)">
            <ExpenseOverdueCard
              overdueAmount={4200}
              overdueCount={3}
              overdueThisMonth={1800}
              overduePreviousMonths={2400}
            />
          </div>
        </div>
      </Card>

      {/* Row 2: Monthly Overview + Expense Breakdown */}
      <div className="flex gap-5">
        <FinancialMonthlyOverview
          data={overviewData}
          years={[2026, 2025]}
          projects={PROJECTS}
          selectedYear={overviewYear}
          selectedProject={selectedProject}
          onYearChange={setOverviewYear}
          onProjectChange={setSelectedProject}
        />
        <FinancialExpenseBreakdown
          data={EXPENSE_CATEGORIES}
          selectedDate={expCatDate}
          onDateChange={setExpCatDate}
        />
      </div>

      {/* Row 3: Rental Overview Line Chart */}
      <RentalOverviewChart
        data={rentalData}
        years={[2026, 2025]}
        projects={PROJECTS}
        selectedYear={rentalYear}
        selectedProject={selectedProject}
        onYearChange={setRentalYear}
        onProjectChange={setSelectedProject}
      />

      {/* Row 4: Payment Type Donut + Top Expense Properties */}
      <div className="flex gap-5">
        <PaymentTypeBreakdown
          data={PAYMENT_TYPES}
          projects={PROJECTS}
          selectedDate={payTypeDate}
          selectedProject={selectedProject}
          onDateChange={setPayTypeDate}
          onProjectChange={setSelectedProject}
        />
        <TopExpenseProperties
          data={PROPERTY_EXPENSES}
          categories={EXPENSE_CATEGORIES_LIST}
          categoryTypeMap={CATEGORY_TYPE_MAP}
          projects={PROJECTS}
          selectedCategory={topExpCategory}
          selectedTypes={topExpTypes}
          selectedProject={selectedProject}
          onCategoryChange={setTopExpCategory}
          onTypesChange={setTopExpTypes}
          onProjectChange={setSelectedProject}
        />
      </div>

      {/* Row 5: Property Profit Heatmap */}
      <PropertyProfitHeatmap
        data={PROPERTY_HEATMAP_DATA}
        years={YEARS}
        projects={PROJECTS}
        selectedYear={heatmapYear}
        selectedProject={selectedProject}
        onYearChange={setHeatmapYear}
        onProjectChange={setSelectedProject}
      />
    </div>
  )
}
