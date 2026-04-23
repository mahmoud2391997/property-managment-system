'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
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
import type { KpiData } from '@/lib/financial-dashboard-actions'
import {
  getMonthlyOverviewData,
  getExpenseBreakdownData,
  getRentalOverviewData,
  getPaymentTypeData,
  getTopExpensePropertiesData,
  getPropertyProfitHeatmapData,
} from '@/lib/financial-dashboard-actions'
import type { MonthlyOverviewData } from '@/components/dashboard/financial-monthly-overview'
import type { FinancialExpenseCategoryData } from '@/components/dashboard/financial-expense-breakdown'
import type { RentalOverviewData } from '@/components/dashboard/rental-overview-chart'
import type { PaymentTypeData } from '@/components/dashboard/payment-type-breakdown'
import type { PropertyExpenseData } from '@/components/dashboard/top-expense-properties'
import type { PropertyMonthlyData } from '@/components/dashboard/property-profit-heatmap'

// ── Loading overlay ──────────────────────────────────────────────────────

function LoadingOverlay({ loading, children, className }: { loading: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative [&>*:first-child]:h-full', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl z-20 backdrop-blur-[1px]">
          <Loader2 className="w-6 h-6 text-(--secondary-color) animate-spin" />
        </div>
      )}
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────────────────

interface FinancialDashboardClientProps {
  organizationId: string
  projects: { id: string; name: string }[]
  years: number[]
  categoryTypeMap: Record<string, string[]>
  initialKpi: KpiData
  initialMonthlyOverview: MonthlyOverviewData[]
  initialExpenseBreakdown: FinancialExpenseCategoryData[]
  initialRentalOverview: RentalOverviewData[]
  initialPaymentTypes: PaymentTypeData[]
  initialTopExpenseProperties: PropertyExpenseData[]
  initialHeatmapData: PropertyMonthlyData[]
}

// ── Component ────────────────────────────────────────────────────────────

export function FinancialDashboardClient({
  organizationId: orgId,
  projects,
  years,
  categoryTypeMap,
  initialKpi: kpi,
  initialMonthlyOverview,
  initialExpenseBreakdown,
  initialRentalOverview,
  initialPaymentTypes,
  initialTopExpenseProperties,
  initialHeatmapData,
}: FinancialDashboardClientProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  // ── Loading state ────────────────────────────────────────────────────

  const [loading, setLoading] = useState<Set<string>>(new Set())

  const startLoading = (...keys: string[]) => {
    setLoading(prev => {
      const next = new Set(prev)
      keys.forEach(k => next.add(k))
      return next
    })
  }

  const stopLoading = (...keys: string[]) => {
    setLoading(prev => {
      const next = new Set(prev)
      keys.forEach(k => next.delete(k))
      return next
    })
  }

  // ── Filter state (independent project filters per chart) ─────────────

  // Monthly Overview
  const [overviewYear, setOverviewYear] = useState(currentYear)
  const [overviewProject, setOverviewProject] = useState('all')
  const [monthlyOverview, setMonthlyOverview] = useState(initialMonthlyOverview)

  // Expense Breakdown (no project filter)
  const [expCatDate, setExpCatDate] = useState(new Date(currentYear, currentMonth, 1))
  const [expenseBreakdown, setExpenseBreakdown] = useState(initialExpenseBreakdown)

  // Rental Overview
  const [rentalYear, setRentalYear] = useState(currentYear)
  const [rentalProject, setRentalProject] = useState('all')
  const [rentalOverview, setRentalOverview] = useState(initialRentalOverview)

  // Payment Type
  const [payTypeDate, setPayTypeDate] = useState(new Date(currentYear, currentMonth, 1))
  const [payTypeProject, setPayTypeProject] = useState('all')
  const [paymentTypes, setPaymentTypes] = useState(initialPaymentTypes)

  // Top Expense Properties
  const allCategories = ['All Categories', ...Object.keys(categoryTypeMap)]
  const allTypeKeys = Object.entries(categoryTypeMap).flatMap(([cat, types]) =>
    types.map(t => `${cat}:${t}`),
  )
  const [topExpCategory, setTopExpCategory] = useState('All Categories')
  const [topExpTypes, setTopExpTypes] = useState<string[]>(allTypeKeys)
  const [topExpProject, setTopExpProject] = useState('all')
  const [topExpProperties, setTopExpProperties] = useState(initialTopExpenseProperties)

  // Property Profit Heatmap
  const [heatmapYear, setHeatmapYear] = useState(currentYear)
  const [heatmapProject, setHeatmapProject] = useState('all')
  const [heatmapData, setHeatmapData] = useState(initialHeatmapData)

  // ── Handlers ─────────────────────────────────────────────────────────

  // Monthly Overview
  const handleOverviewYearChange = async (year: number) => {
    setOverviewYear(year)
    startLoading('overview')
    const data = await getMonthlyOverviewData(orgId, year, overviewProject)
    setMonthlyOverview(data)
    stopLoading('overview')
  }

  const handleOverviewProjectChange = async (projectId: string) => {
    setOverviewProject(projectId)
    startLoading('overview')
    const data = await getMonthlyOverviewData(orgId, overviewYear, projectId)
    setMonthlyOverview(data)
    stopLoading('overview')
  }

  // Expense Breakdown
  const handleExpCatDateChange = async (date: Date) => {
    setExpCatDate(date)
    startLoading('expense')
    const data = await getExpenseBreakdownData(orgId, date.getFullYear(), date.getMonth())
    setExpenseBreakdown(data)
    stopLoading('expense')
  }

  // Rental Overview
  const handleRentalYearChange = async (year: number) => {
    setRentalYear(year)
    startLoading('rental')
    const data = await getRentalOverviewData(orgId, year, rentalProject)
    setRentalOverview(data)
    stopLoading('rental')
  }

  const handleRentalProjectChange = async (projectId: string) => {
    setRentalProject(projectId)
    startLoading('rental')
    const data = await getRentalOverviewData(orgId, rentalYear, projectId)
    setRentalOverview(data)
    stopLoading('rental')
  }

  // Payment Type
  const handlePayTypeDateChange = async (date: Date) => {
    setPayTypeDate(date)
    startLoading('paytype')
    const data = await getPaymentTypeData(orgId, date.getFullYear(), date.getMonth(), payTypeProject)
    setPaymentTypes(data)
    stopLoading('paytype')
  }

  const handlePayTypeProjectChange = async (projectId: string) => {
    setPayTypeProject(projectId)
    startLoading('paytype')
    const data = await getPaymentTypeData(orgId, payTypeDate.getFullYear(), payTypeDate.getMonth(), projectId)
    setPaymentTypes(data)
    stopLoading('paytype')
  }

  // Top Expense Properties
  const handleTopExpCategoryChange = async (category: string) => {
    setTopExpCategory(category)
    let newTypes: string[]
    if (category === 'All Categories') {
      newTypes = allTypeKeys
    } else {
      newTypes = (categoryTypeMap[category] || []).map(t => `${category}:${t}`)
    }
    setTopExpTypes(newTypes)
    startLoading('topexp')
    const data = await getTopExpensePropertiesData(orgId, topExpProject, newTypes)
    setTopExpProperties(data)
    stopLoading('topexp')
  }

  const handleTopExpTypesChange = async (types: string[]) => {
    setTopExpTypes(types)
    startLoading('topexp')
    const data = await getTopExpensePropertiesData(orgId, topExpProject, types)
    setTopExpProperties(data)
    stopLoading('topexp')
  }

  const handleTopExpProjectChange = async (projectId: string) => {
    setTopExpProject(projectId)
    startLoading('topexp')
    const data = await getTopExpensePropertiesData(orgId, projectId, topExpTypes)
    setTopExpProperties(data)
    stopLoading('topexp')
  }

  // Heatmap
  const handleHeatmapYearChange = async (year: number) => {
    setHeatmapYear(year)
    startLoading('heatmap')
    const data = await getPropertyProfitHeatmapData(orgId, year, heatmapProject)
    setHeatmapData(data)
    stopLoading('heatmap')
  }

  const handleHeatmapProjectChange = async (projectId: string) => {
    setHeatmapProject(projectId)
    startLoading('heatmap')
    const data = await getPropertyProfitHeatmapData(orgId, heatmapYear, projectId)
    setHeatmapData(data)
    stopLoading('heatmap')
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <>
      {/* Row 1: KPI Cards */}
      <Card className="gap-0 p-0 shadow-xs overflow-hidden">
        <div className="flex flex-row py-5">
          <div className="flex-1">
            <BalanceCard
              totalPayments={kpi.totalPayments}
              totalExpenses={kpi.totalExpenses}
              previousBalance={kpi.previousBalance}
            />
          </div>
          <div className="flex-1 border-l border-(--border-default)">
            <RentalReceivedCard
              totalDue={kpi.rentalDue}
              totalReceived={kpi.rentalReceived}
            />
          </div>
          <div className="flex-1 border-l border-(--border-default)">
            <RentalOverdueCard
              overdueAmount={kpi.rentalOverdueAmount}
              overdueCount={kpi.rentalOverdueCount}
              overdueThisMonth={kpi.rentalOverdueThisMonth}
              overduePreviousMonths={kpi.rentalOverduePreviousMonths}
            />
          </div>
          <div className="flex-1 border-l border-(--border-default)">
            <ExpensePaidCard
              totalAmount={kpi.expenseTotal}
              paidAmount={kpi.expensePaid}
            />
          </div>
          <div className="flex-1 border-l border-(--border-default)">
            <ExpenseOverdueCard
              overdueAmount={kpi.expenseOverdueAmount}
              overdueCount={kpi.expenseOverdueCount}
              overdueThisMonth={kpi.expenseOverdueThisMonth}
              overduePreviousMonths={kpi.expenseOverduePreviousMonths}
            />
          </div>
        </div>
      </Card>

      {/* Row 2: Monthly Overview + Expense Breakdown */}
      <div className="flex gap-5">
        <LoadingOverlay loading={loading.has('overview')} className="flex-2">
          <FinancialMonthlyOverview
            data={monthlyOverview}
            years={years}
            projects={projects}
            selectedYear={overviewYear}
            selectedProject={overviewProject}
            onYearChange={handleOverviewYearChange}
            onProjectChange={handleOverviewProjectChange}
          />
        </LoadingOverlay>
        <LoadingOverlay loading={loading.has('expense')} className="flex-1">
          <FinancialExpenseBreakdown
            data={expenseBreakdown}
            selectedDate={expCatDate}
            onDateChange={handleExpCatDateChange}
          />
        </LoadingOverlay>
      </div>

      {/* Row 3: Rental Overview Line Chart */}
      <LoadingOverlay loading={loading.has('rental')}>
        <RentalOverviewChart
          data={rentalOverview}
          years={years}
          projects={projects}
          selectedYear={rentalYear}
          selectedProject={rentalProject}
          onYearChange={handleRentalYearChange}
          onProjectChange={handleRentalProjectChange}
        />
      </LoadingOverlay>

      {/* Row 4: Payment Type Donut + Top Expense Properties */}
      <div className="flex gap-5">
        <LoadingOverlay loading={loading.has('paytype')} className="flex-1">
          <PaymentTypeBreakdown
            data={paymentTypes}
            projects={projects}
            selectedDate={payTypeDate}
            selectedProject={payTypeProject}
            onDateChange={handlePayTypeDateChange}
            onProjectChange={handlePayTypeProjectChange}
          />
        </LoadingOverlay>
        <LoadingOverlay loading={loading.has('topexp')} className="flex-2">
          <TopExpenseProperties
            data={topExpProperties}
            categories={allCategories}
            categoryTypeMap={categoryTypeMap}
            projects={projects}
            selectedCategory={topExpCategory}
            selectedTypes={topExpTypes}
            selectedProject={topExpProject}
            onCategoryChange={handleTopExpCategoryChange}
            onTypesChange={handleTopExpTypesChange}
            onProjectChange={handleTopExpProjectChange}
          />
        </LoadingOverlay>
      </div>

      {/* Row 5: Property Profit Heatmap */}
      <LoadingOverlay loading={loading.has('heatmap')}>
        <PropertyProfitHeatmap
          data={heatmapData}
          years={years}
          projects={projects}
          selectedYear={heatmapYear}
          selectedProject={heatmapProject}
          onYearChange={handleHeatmapYearChange}
          onProjectChange={handleHeatmapProjectChange}
        />
      </LoadingOverlay>
    </>
  )
}
