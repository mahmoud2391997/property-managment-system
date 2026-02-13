export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import {
  FinancialKpiCardSkeleton,
  FinancialMonthlyOverviewSkeleton,
  FinancialExpenseBreakdownSkeleton,
  RentalOverviewChartSkeleton,
  PaymentTypeBreakdownSkeleton,
  TopExpensePropertiesSkeleton,
  PropertyProfitHeatmapSkeleton,
} from '@/components/dashboard'
import { FinancialDashboardClient } from './financial-dashboard-client'
import {
  getProjects,
  getAvailableYears,
  getAvailableExpenseTypes,
  getKpiData,
  getMonthlyOverviewData,
  getExpenseBreakdownData,
  getRentalOverviewData,
  getPaymentTypeData,
  getTopExpensePropertiesData,
  getPropertyProfitHeatmapData,
} from '@/lib/financial-dashboard-actions'

async function getOrganizationId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  return staff?.organization_id || null
}

// Fetch all initial data and render the client component
async function DashboardContent({ organizationId }: { organizationId: string }) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const [
    projects,
    years,
    categoryTypeMap,
    kpi,
    monthlyOverview,
    expenseBreakdown,
    rentalOverview,
    paymentTypes,
    topExpProperties,
    heatmapData,
  ] = await Promise.all([
    getProjects(organizationId),
    getAvailableYears(organizationId),
    getAvailableExpenseTypes(organizationId),
    getKpiData(organizationId),
    getMonthlyOverviewData(organizationId, currentYear),
    getExpenseBreakdownData(organizationId, currentYear, currentMonth),
    getRentalOverviewData(organizationId, currentYear),
    getPaymentTypeData(organizationId, currentYear, currentMonth),
    getTopExpensePropertiesData(organizationId),
    getPropertyProfitHeatmapData(organizationId, currentYear),
  ])

  return (
    <FinancialDashboardClient
      organizationId={organizationId}
      projects={projects}
      years={years}
      categoryTypeMap={categoryTypeMap}
      initialKpi={kpi}
      initialMonthlyOverview={monthlyOverview}
      initialExpenseBreakdown={expenseBreakdown}
      initialRentalOverview={rentalOverview}
      initialPaymentTypes={paymentTypes}
      initialTopExpenseProperties={topExpProperties}
      initialHeatmapData={heatmapData}
    />
  )
}

function DashboardSkeleton() {
  return (
    <>
      {/* KPI Cards Skeleton */}
      <Card className="gap-0 p-0 shadow-xs overflow-hidden">
        <div className="flex flex-row py-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${i > 0 ? 'border-l border-(--border-default)' : ''}`}
            >
              <FinancialKpiCardSkeleton />
            </div>
          ))}
        </div>
      </Card>

      {/* Row 2 Skeleton */}
      <div className="flex gap-5">
        <FinancialMonthlyOverviewSkeleton />
        <FinancialExpenseBreakdownSkeleton />
      </div>

      {/* Row 3 Skeleton */}
      <RentalOverviewChartSkeleton />

      {/* Row 4 Skeleton */}
      <div className="flex gap-5">
        <PaymentTypeBreakdownSkeleton />
        <TopExpensePropertiesSkeleton />
      </div>

      {/* Row 5 Skeleton */}
      <PropertyProfitHeatmapSkeleton />
    </>
  )
}

export default async function Dashboard() {
  const organizationId = await getOrganizationId()

  if (!organizationId) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col gap-6 border -m-7.5 p-7.5 h-fit">
      {/* Header */}
      <div>
        <h1>Dashboard</h1>
        <p className="texts-body-medium text-(--text-secondary)">
          Overview of your property management
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent organizationId={organizationId} />
      </Suspense>
    </div>
  )
}
