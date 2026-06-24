import { dummyLeases, dummyPayments, dummyTasks, dummyNotices } from '@/lib/dummy-data'
import { startOfMonth, endOfMonth, subMonths, format, addDays } from 'date-fns'

// Dummy data returns (frontend only - no backend)
async function cachedQuery<T>(key: string, fn: () => Promise<T>): Promise<T> {
  return fn()
}

export interface DashboardMetrics {
  totalProperties: number
  totalRooms: number
  activeLeases: number
  totalTenants: number
  monthlyRevenue: number
  outstandingPayments: number
  occupancyRate: number
  overduePayments: number
  // Additional detailed metrics
  propertyBreakdown: {
    ready: number
    occupied: number
    maintenance: number
  }
  roomOccupancyRate: number
  expiringLeasesThisMonth: number
  tenantBreakdown: {
    individual: number
    company: number
  }
  previousMonthRevenue: number
  pendingPaymentsAmount: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
}

export interface PaymentStatusDistribution {
  status: string
  count: number
  amount: number
  color: string
}

export interface OccupancyData {
  status: string
  count: number
  color: string
}

// Dashboard palette — built around primary #1f1f1f + secondary #0d9488 (teal)
export const STATUS_COLORS = {
  // Property/Room statuses
  vacant: '#64748b',       // Slate-500 — cool neutral that pairs with teal
  occupied: '#0d9488',     // Teal-600 — brand secondary = "good / active"
  underPreparation: '#0284c7', // Sky-600 — cool blue, same family as teal
  pendingInspection: '#7c3aed', // Violet-600 — cool accent, complements teal
  // Lease/Contract statuses
  active: '#0d9488',       // Teal-600 — brand "good"
  expiringSoon: '#d97706', // Amber-600 — warm but muted, not harsh
  expired: '#dc2626',      // Red-600 — deeper, more refined
  // Summary card statuses
  overdue: '#dc2626',      // Red-600 — consistent with expired
  pending: '#d97706',      // Amber-600 — consistent with expiringSoon
}

export interface PropertyStatusCounts {
  total: number
  vacant: number
  occupied: number
  underPreparation: number
  pendingInspection: number
}

export interface RoomStatusCounts {
  total: number
  vacant: number
  occupied: number
  underPreparation: number
  pendingInspection: number
}

export interface LeaseStatusCounts {
  total: number           // Total Current leases
  active: number          // Current and not expiring soon
  expiringSoon: number    // Expiring in next 30 days
  expired: number         // End date passed but still Current status
}

export interface ContractStatusCounts {
  total: number
  active: number
  expiringSoon: number
  expired: number
}

export interface RecentPayment {
  id: string
  referenceId: string
  tenantName: string
  propertyCode: string
  roomTitle: string | null
  amount: number
  status: string
  dueDate: Date | null
  paidAt: Date | null
}

export interface ExpiringLease {
  id: string
  referenceId: string
  tenantName: string
  propertyCode: string
  roomTitle: string | null
  endDate: Date
  monthlyRent: number
  daysUntilExpiry: number
}

export interface OpenTask {
  id: string
  referenceId: string
  title: string
  propertyCode: string | null
  roomTitle: string | null
  priority: string | null
  dueDate: Date | null
  status: string
  assignedTo: string | null
}

export interface DashboardAlert {
  id: string
  type: 'overdue_payment' | 'expiring_lease' | 'unassigned_task' | 'pending_ticket'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  link: string
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  Paid: 'var(--success-main)',
  Pending: 'var(--warning-main)',
  Cancelled: 'var(--error-main)',
  Unset: 'var(--muted)',
}

const PROPERTY_STATUS_COLORS: Record<string, string> = {
  Ready: 'var(--success-main)',
  Pending_Inspection: 'var(--warning-main)',
  Under_Preparation: 'var(--info-main)',
}

export async function getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  return cachedQuery(`dashboard-metrics-${organizationId}`, async () => {
    // Return dummy metrics
    return {
      totalProperties: 6,
      totalRooms: 18,
      activeLeases: dummyLeases.filter(l => l.status === 'Current').length,
      totalTenants: 5,
      monthlyRevenue: 15150,
      outstandingPayments: 4,
      occupancyRate: 78,
      overduePayments: 2,
      propertyBreakdown: {
        ready: 4,
        occupied: 2,
        maintenance: 0
      },
      roomOccupancyRate: 72,
      expiringLeasesThisMonth: 2,
      tenantBreakdown: {
        individual: 4,
        company: 1
      },
      previousMonthRevenue: 14200,
      pendingPaymentsAmount: 9350
    }
  })
}

export async function getMonthlyRevenue(organizationId: string, months: number = 6): Promise<MonthlyRevenue[]> {
  return cachedQuery(`monthly-revenue-${organizationId}-${months}`, async () => {
    const now = new Date()
    const results: MonthlyRevenue[] = []
    const baseRevenue = 14000

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i)
      results.push({
        month: format(date, 'MMM'),
        revenue: baseRevenue + Math.floor(Math.random() * 2000)
      })
    }

    return results
  })
}

export async function getPaymentStatusDistribution(organizationId: string): Promise<PaymentStatusDistribution[]> {
  return cachedQuery(`payment-status-${organizationId}`, async () => {
    return [
      { status: 'Paid', count: 42, amount: 105000, color: '#0d9488' },
      { status: 'Pending', count: 8, amount: 18200, color: '#d97706' },
      { status: 'Overdue', count: 2, amount: 4500, color: '#dc2626' }
    ]
  })
}

export async function getOccupancyData(organizationId: string): Promise<OccupancyData[]> {
  return cachedQuery(`occupancy-${organizationId}`, async () => {
    return [
      { status: 'Occupied', count: 14, color: '#0d9488' },
      { status: 'Vacant', count: 3, color: '#64748b' },
      { status: 'Under Preparation', count: 1, color: '#0284c7' }
    ]
  })
}

export async function getRecentPayments(organizationId: string, limit: number = 5): Promise<RecentPayment[]> {
  return cachedQuery(`recent-payments-${organizationId}-${limit}`, async () => {
    return [
      {
        id: '1',
        referenceId: 'PAY-001',
        tenantName: 'Ahmad bin Ali',
        propertyCode: 'A-101',
        roomTitle: 'Master Bedroom',
        amount: 2500,
        status: 'Paid',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        referenceId: 'PAY-002',
        tenantName: 'Siti Aminah binti Omar',
        propertyCode: 'B-201',
        roomTitle: 'Master Bedroom',
        amount: 1800,
        status: 'Paid Late',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        referenceId: 'PAY-003',
        tenantName: 'Raj Kumar',
        propertyCode: 'A-101',
        roomTitle: 'Bedroom 2',
        amount: 2000,
        status: 'Pending',
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        paidAt: null
      }
    ].slice(0, limit)
  })
}

export async function getExpiringLeases(organizationId: string, daysAhead: number = 30): Promise<ExpiringLease[]> {
  return cachedQuery(`expiring-leases-${organizationId}-${daysAhead}`, async () => {
    return [
      {
        id: '1',
        referenceId: 'LEASE-001',
        tenantName: 'Ahmad bin Ali',
        propertyCode: 'A-101',
        roomTitle: 'Master Bedroom',
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        monthlyRent: 2500,
        daysUntilExpiry: 25
      },
      {
        id: '2',
        referenceId: 'LEASE-002',
        tenantName: 'Siti Aminah binti Omar',
        propertyCode: 'B-201',
        roomTitle: 'Master Bedroom',
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        monthlyRent: 1800,
        daysUntilExpiry: 45
      }
    ]
      .filter(lease => lease.daysUntilExpiry > 0 && lease.daysUntilExpiry <= daysAhead)
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
      .slice(0, 5)
  })
}

export async function getOpenTasks(organizationId: string, limit: number = 5): Promise<OpenTask[]> {
  return cachedQuery(`open-tasks-${organizationId}-${limit}`, async () => {
    return dummyTasks
      .filter(t => t.status === 'Open' || t.status === 'In Progress')
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
      .slice(0, limit)
      .map(t => ({
        id: t.task_id,
        referenceId: t.id,
        title: t.title,
        propertyCode: t.property,
        roomTitle: t.room,
        priority: t.priority,
        dueDate: new Date(t.due_date),
        status: t.status,
        assignedTo: t.staff_name || null
      }))
  })
}

export async function getDashboardAlerts(organizationId: string): Promise<DashboardAlert[]> {
  return cachedQuery(`dashboard-alerts-${organizationId}`, async () => {
    return [
      {
        id: '1',
        type: 'overdue_payment' as const,
        title: 'Overdue Payment',
        description: 'Payment from Raj Kumar for A-101 (Bedroom 2) is 5 days overdue',
        severity: 'high' as const,
        link: '/payments'
      },
      {
        id: '2',
        type: 'expiring_lease' as const,
        title: 'Lease Expiring Soon',
        description: 'Lease for Ahmad bin Ali expires in 25 days',
        severity: 'medium' as const,
        link: '/leases'
      },
      {
        id: '3',
        type: 'unassigned_task' as const,
        title: 'Unassigned Task',
        description: 'Cleaning task for A-102 needs assignment',
        severity: 'medium' as const,
        link: '/tasks'
      }
    ]
  })
}

export async function getPropertyStatusCounts(organizationId: string): Promise<PropertyStatusCounts> {
  return { total: 6, vacant: 1, occupied: 4, underPreparation: 1, pendingInspection: 0 }
}

export async function getRoomStatusCounts(organizationId: string): Promise<RoomStatusCounts> {
  return { total: 18, vacant: 3, occupied: 14, underPreparation: 1, pendingInspection: 0 }
}

export async function getLeaseStatusCounts(organizationId: string): Promise<LeaseStatusCounts> {
  return { total: 14, active: 12, expiringSoon: 2, expired: 0 }
}

export async function getContractStatusCounts(organizationId: string): Promise<ContractStatusCounts> {
  return { total: 8, active: 7, expiringSoon: 1, expired: 0 }
}
