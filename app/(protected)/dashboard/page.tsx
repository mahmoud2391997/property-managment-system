export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  getDashboardMetrics,
  getMonthlyRevenue,
  getPaymentStatusDistribution,
  getOccupancyData,
  getRecentPayments,
  getExpiringLeases,
  getOpenTasks,
  getDashboardAlerts,
  getPropertyStatusCounts,
  getRoomStatusCounts,
  getLeaseStatusCounts,
  getContractStatusCounts,
  STATUS_COLORS
} from '@/lib/dashboard-data'
import {
  StatusMetricCard,
  StatusMetricCardSkeleton,
  RevenueChart,
  RevenueChartSkeleton,
  PaymentStatusChart,
  PaymentStatusChartSkeleton,
  OccupancyChart,
  OccupancyChartSkeleton,
  RecentPayments,
  RecentPaymentsSkeleton,
  ExpiringLeases,
  ExpiringLeasesSkeleton,
  OpenTasks,
  OpenTasksSkeleton,
  AlertsSection,
  AlertsSectionSkeleton
} from '@/components/dashboard'

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

// Metric Cards Section - 4 cards with status indicators
async function MetricsSection({ organizationId }: { organizationId: string }) {
  const [propertyStatus, roomStatus, leaseStatus, contractStatus] = await Promise.all([
    getPropertyStatusCounts(organizationId),
    getRoomStatusCounts(organizationId),
    getLeaseStatusCounts(organizationId),
    getContractStatusCounts(organizationId)
  ])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Properties */}
      <StatusMetricCard
        title="Properties"
        value={propertyStatus.total}
        icon="Building2"
        variant="warning"
        statuses={[
          { label: 'Vacant', count: propertyStatus.vacant, color: STATUS_COLORS.vacant },
          { label: 'Occupied', count: propertyStatus.occupied, color: STATUS_COLORS.occupied },
          { label: 'Under Preparation', count: propertyStatus.underPreparation, color: STATUS_COLORS.underPreparation },
          { label: 'Pending Inspection', count: propertyStatus.pendingInspection, color: STATUS_COLORS.pendingInspection },
        ]}
      />

      {/* Rooms */}
      <StatusMetricCard
        title="Rooms"
        value={roomStatus.total}
        icon="DoorOpen"
        variant="info"
        statuses={[
          { label: 'Vacant', count: roomStatus.vacant, color: STATUS_COLORS.vacant },
          { label: 'Occupied', count: roomStatus.occupied, color: STATUS_COLORS.occupied },
          { label: 'Under Preparation', count: roomStatus.underPreparation, color: STATUS_COLORS.underPreparation },
          { label: 'Pending Inspection', count: roomStatus.pendingInspection, color: STATUS_COLORS.pendingInspection },
        ]}
      />

      {/* Active Leases */}
      <StatusMetricCard
        title="Active Leases"
        value={leaseStatus.total}
        icon="FileText"
        variant="purple"
        statuses={[
          { label: 'Active', count: leaseStatus.active, color: STATUS_COLORS.active },
          { label: 'Expiring Soon', count: leaseStatus.expiringSoon, color: STATUS_COLORS.expiringSoon },
          { label: 'Expired', count: leaseStatus.expired, color: STATUS_COLORS.expired },
        ]}
      />

      {/* Active Owner Contracts */}
      <StatusMetricCard
        title="Active Contracts"
        value={contractStatus.total}
        icon="ScrollText"
        variant="success"
        statuses={[
          { label: 'Active', count: contractStatus.active, color: STATUS_COLORS.active },
          { label: 'Expiring Soon', count: contractStatus.expiringSoon, color: STATUS_COLORS.expiringSoon },
          { label: 'Expired', count: contractStatus.expired, color: STATUS_COLORS.expired },
        ]}
      />
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <StatusMetricCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Charts Section
async function ChartsSection({ organizationId }: { organizationId: string }) {
  const [revenueData, paymentStatus] = await Promise.all([
    getMonthlyRevenue(organizationId, 6),
    getPaymentStatusDistribution(organizationId)
  ])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <RevenueChart data={revenueData} className="lg:col-span-2" />
      <PaymentStatusChart data={paymentStatus} />
    </div>
  )
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <RevenueChartSkeleton />
      </div>
      <PaymentStatusChartSkeleton />
    </div>
  )
}

// Second Row: Occupancy + Expiring Leases + Alerts
async function SecondRowSection({ organizationId }: { organizationId: string }) {
  const [occupancyData, metrics, expiringLeases, alerts] = await Promise.all([
    getOccupancyData(organizationId),
    getDashboardMetrics(organizationId),
    getExpiringLeases(organizationId, 30),
    getDashboardAlerts(organizationId)
  ])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <OccupancyChart data={occupancyData} occupancyRate={metrics.occupancyRate} />
      <ExpiringLeases leases={expiringLeases} />
      {alerts.length > 0 ? (
        <AlertsSection alerts={alerts} />
      ) : (
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-sm font-medium text-gray-600">All Clear!</p>
            <p className="text-xs text-gray-400">No alerts at this time</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SecondRowSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <OccupancyChartSkeleton />
      <ExpiringLeasesSkeleton />
      <AlertsSectionSkeleton />
    </div>
  )
}

// Third Row: Tasks + Recent Payments
async function ThirdRowSection({ organizationId }: { organizationId: string }) {
  const [openTasks, recentPayments] = await Promise.all([
    getOpenTasks(organizationId, 5),
    getRecentPayments(organizationId, 5)
  ])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <OpenTasks tasks={openTasks} />
      <RecentPayments payments={recentPayments} />
    </div>
  )
}

function ThirdRowSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <OpenTasksSkeleton />
      <RecentPaymentsSkeleton />
    </div>
  )
}

// Main Dashboard Page
export default async function Dashboard() {
  const organizationId = await getOrganizationId()

  if (!organizationId) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col gap-6 border -m-7.5 p-7.5 h-fit bg-[#FAFAFA]">
      {/* Header */}
      <div>
        <h1>Dashboard</h1>
        <p className="texts-body-medium text-(--text-secondary)">
          Overview of your property management
        </p>
      </div>

      {/* Metrics - 4 status cards */}
      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsSection organizationId={organizationId} />
      </Suspense>

      {/* Charts Row: Revenue + Payment Status */}
      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsSection organizationId={organizationId} />
      </Suspense>

      {/* Second Row: Occupancy + Expiring Leases + Alerts */}
      <Suspense fallback={<SecondRowSkeleton />}>
        <SecondRowSection organizationId={organizationId} />
      </Suspense>

      {/* Third Row: Tasks + Recent Payments */}
      <Suspense fallback={<ThirdRowSkeleton />}>
        <ThirdRowSection organizationId={organizationId} />
      </Suspense>
    </div>
  )
}
