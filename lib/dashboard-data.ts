import { prisma } from '@/lib/prisma'
import { payment_status, lease_status_new, property_status_new, task_state, payment_record_status } from '@prisma/client'
import { startOfMonth, endOfMonth, subMonths, format, addDays } from 'date-fns'

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

// Status colors for consistency
export const STATUS_COLORS = {
  // Property/Room statuses
  vacant: '#6b7280',      // Gray - Ready but no lease
  occupied: '#10b981',    // Green - Has active lease
  underPreparation: '#f59e0b', // Amber - Under preparation
  pendingInspection: '#3b82f6', // Blue - Pending inspection
  // Lease statuses
  active: '#10b981',      // Green - Current
  expiringSoon: '#f59e0b', // Amber - Expiring in 30 days
  expired: '#ef4444',     // Red - Already expired but status still Current
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
  status: payment_status
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
  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)
  const endOfCurrentMonth = endOfMonth(now)
  const startOfLastMonth = startOfMonth(subMonths(now, 1))
  const endOfLastMonth = endOfMonth(subMonths(now, 1))

  const [
    totalProperties,
    totalRooms,
    activeLeases,
    totalTenants,
    paidPayments,
    pendingPayments,
    readyProperties,
    readyRooms,
    overduePaymentsCount,
    // Additional queries
    propertiesByStatus,
    occupiedRooms,
    maintenanceProperties,
    expiringLeasesCount,
    individualTenants,
    companyTenants,
    previousMonthPayments,
    pendingPaymentsAmount
  ] = await Promise.all([
    // Total properties
    prisma.properties.count({
      where: { organization_id: organizationId }
    }),
    // Total rooms
    prisma.rooms.count({
      where: { properties: { organization_id: organizationId } }
    }),
    // Active leases (Current status)
    prisma.leases.count({
      where: {
        organization_id: organizationId,
        status: lease_status_new.Current
      }
    }),
    // Total tenants
    prisma.organizations_tenants.count({
      where: { organization_id: organizationId }
    }),
    // Monthly revenue (paid this month)
    prisma.payment_history.aggregate({
      where: {
        payments: {
          organization_id: organizationId,
        },
        paid_at: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth
        },
        status: payment_record_status.Success
      },
      _sum: { amount: true }
    }),
    // Outstanding payments (Pending)
    prisma.payments.aggregate({
      where: {
        organization_id: organizationId,
        status: payment_status.Pending
      },
      _count: true
    }),
    // Ready properties
    prisma.properties.count({
      where: {
        organization_id: organizationId,
        status: property_status_new.Ready
      }
    }),
    // Ready rooms
    prisma.rooms.count({
      where: {
        properties: { organization_id: organizationId },
        status: property_status_new.Ready
      }
    }),
    // Overdue payments count
    prisma.payments.count({
      where: {
        organization_id: organizationId,
        status: payment_status.Pending,
        due_payment_timestamp: { lt: now }
      }
    }),
    // Properties grouped by status
    prisma.properties.groupBy({
      by: ['status'],
      where: { organization_id: organizationId },
      _count: true
    }),
    // Occupied rooms (rooms with active leases)
    prisma.rooms.count({
      where: {
        properties: { organization_id: organizationId },
        leases: {
          some: { status: lease_status_new.Current }
        }
      }
    }),
    // Maintenance properties
    prisma.properties.count({
      where: {
        organization_id: organizationId,
        status: property_status_new.Under_Preparation
      }
    }),
    // Expiring leases this month
    prisma.leases.count({
      where: {
        organization_id: organizationId,
        status: lease_status_new.Current,
        // Will calculate in code since end_date is computed
      }
    }),
    // Individual tenants
    prisma.organizations_tenants.count({
      where: {
        organization_id: organizationId,
        tenants: { type: 'Individual' }
      }
    }),
    // Company tenants
    prisma.organizations_tenants.count({
      where: {
        organization_id: organizationId,
        tenants: { type: 'Company' }
      }
    }),
    // Previous month revenue
    prisma.payment_history.aggregate({
      where: {
        payments: {
          organization_id: organizationId,
        },
        paid_at: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        },
        status: payment_record_status.Success
      },
      _sum: { amount: true }
    }),
    // Pending payments total amount
    prisma.charges.aggregate({
      where: {
        payments: {
          organization_id: organizationId,
          status: payment_status.Pending
        }
      },
      _sum: { amount: true }
    })
  ])

  // Calculate occupancy rate
  const totalUnits = totalProperties + totalRooms
  const occupancyRate = totalUnits > 0 ? (activeLeases / totalUnits) * 100 : 0

  // Calculate room occupancy rate
  const roomOccupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

  // Calculate property breakdown
  const occupiedProperties = propertiesByStatus.find(p => p.status === property_status_new.Ready)?._count || 0

  return {
    totalProperties,
    totalRooms,
    activeLeases,
    totalTenants,
    monthlyRevenue: Number(paidPayments._sum?.amount) || 0,
    outstandingPayments: pendingPayments._count || 0,
    occupancyRate: Math.round(occupancyRate),
    overduePayments: overduePaymentsCount,
    // Additional metrics
    propertyBreakdown: {
      ready: readyProperties,
      occupied: totalProperties - readyProperties - maintenanceProperties,
      maintenance: maintenanceProperties
    },
    roomOccupancyRate: Math.round(roomOccupancyRate),
    expiringLeasesThisMonth: 0, // Will calculate separately if needed
    tenantBreakdown: {
      individual: individualTenants,
      company: companyTenants
    },
    previousMonthRevenue: Number(previousMonthPayments._sum?.amount) || 0,
    pendingPaymentsAmount: Number(pendingPaymentsAmount._sum?.amount) || 0
  }
}

export async function getMonthlyRevenue(organizationId: string, months: number = 6): Promise<MonthlyRevenue[]> {
  const now = new Date()
  const results: MonthlyRevenue[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i)
    const start = startOfMonth(date)
    const end = endOfMonth(date)

    const revenue = await prisma.payment_history.aggregate({
      where: {
        payments: {
          organization_id: organizationId,
        },
        paid_at: {
          gte: start,
          lte: end
        },
        status: payment_record_status.Success
      },
      _sum: { amount: true }
    })

    results.push({
      month: format(date, 'MMM'),
      revenue: Number(revenue._sum?.amount) || 0
    })
  }

  return results
}

export async function getPaymentStatusDistribution(organizationId: string): Promise<PaymentStatusDistribution[]> {
  const payments = await prisma.payments.groupBy({
    by: ['status'],
    where: {
      organization_id: organizationId,
      status: { not: payment_status.Unset }
    },
    _count: true
  })

  // Get amounts for each status
  const statusAmounts = await Promise.all(
    payments.map(async (p) => {
      const charges = await prisma.charges.aggregate({
        where: {
          payments: {
            organization_id: organizationId,
            status: p.status
          }
        },
        _sum: { amount: true }
      })
      return {
        status: p.status,
        amount: Number(charges._sum?.amount) || 0
      }
    })
  )

  return payments.map((p) => ({
    status: p.status,
    count: p._count,
    amount: statusAmounts.find(a => a.status === p.status)?.amount || 0,
    color: PAYMENT_STATUS_COLORS[p.status] || 'var(--muted)'
  }))
}

export async function getOccupancyData(organizationId: string): Promise<OccupancyData[]> {
  const [properties, rooms] = await Promise.all([
    prisma.properties.groupBy({
      by: ['status'],
      where: { organization_id: organizationId },
      _count: true
    }),
    prisma.rooms.groupBy({
      by: ['status'],
      where: { properties: { organization_id: organizationId } },
      _count: true
    })
  ])

  // Combine properties and rooms by status
  const statusMap = new Map<string, number>()

  properties.forEach(p => {
    const current = statusMap.get(p.status) || 0
    statusMap.set(p.status, current + p._count)
  })

  rooms.forEach(r => {
    const current = statusMap.get(r.status) || 0
    statusMap.set(r.status, current + r._count)
  })

  return Array.from(statusMap.entries()).map(([status, count]) => ({
    status: status.replace(/_/g, ' '),
    count,
    color: PROPERTY_STATUS_COLORS[status] || 'var(--muted)'
  }))
}

export async function getRecentPayments(organizationId: string, limit: number = 5): Promise<RecentPayment[]> {
  const payments = await prisma.payments.findMany({
    where: {
      organization_id: organizationId,
      status: { not: payment_status.Unset }
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      id: true,
      reference_id: true,
      status: true,
      due_payment_timestamp: true,
      leases: {
        select: {
          properties: {
            select: { code: true }
          },
          rooms: {
            select: { title: true }
          },
          tenants: {
            select: {
              type: true,
              individual_tenants: {
                select: { first_name: true, last_name: true }
              },
              company_tenants: {
                select: { company_name: true }
              }
            }
          }
        }
      },
      charges: {
        select: { amount: true }
      },
      payment_history: {
        orderBy: { paid_at: 'desc' },
        take: 1,
        select: { paid_at: true }
      }
    }
  })

  return payments.map(p => {
    const tenant = p.leases?.tenants
    const tenantName = tenant?.type === 'Individual'
      ? `${tenant.individual_tenants?.first_name || ''} ${tenant.individual_tenants?.last_name || ''}`.trim()
      : tenant?.company_tenants?.company_name || 'Unknown'

    const totalAmount = p.charges.reduce((sum, c) => sum + Number(c.amount), 0)

    return {
      id: p.id,
      referenceId: p.reference_id,
      tenantName,
      propertyCode: p.leases?.properties?.code || 'N/A',
      roomTitle: p.leases?.rooms?.title || null,
      amount: totalAmount,
      status: p.status,
      dueDate: p.due_payment_timestamp,
      paidAt: p.payment_history[0]?.paid_at || null
    }
  })
}

export async function getExpiringLeases(organizationId: string, daysAhead: number = 30): Promise<ExpiringLease[]> {
  const now = new Date()

  const leases = await prisma.leases.findMany({
    where: {
      organization_id: organizationId,
      status: lease_status_new.Current,
      number_of_months: { not: null }
    },
    select: {
      id: true,
      reference_id: true,
      start_date: true,
      number_of_months: true,
      monthly_rent: true,
      properties: {
        select: { code: true }
      },
      rooms: {
        select: { title: true }
      },
      tenants: {
        select: {
          type: true,
          individual_tenants: {
            select: { first_name: true, last_name: true }
          },
          company_tenants: {
            select: { company_name: true }
          }
        }
      }
    }
  })

  // Calculate end dates and filter
  const expiringLeases = leases
    .map(lease => {
      const startDate = new Date(lease.start_date)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + (lease.number_of_months || 0))

      const tenant = lease.tenants
      const tenantName = tenant?.type === 'Individual'
        ? `${tenant.individual_tenants?.first_name || ''} ${tenant.individual_tenants?.last_name || ''}`.trim()
        : tenant?.company_tenants?.company_name || 'Unknown'

      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: lease.id,
        referenceId: lease.reference_id,
        tenantName,
        propertyCode: lease.properties?.code || 'N/A',
        roomTitle: lease.rooms?.title || null,
        endDate,
        monthlyRent: Number(lease.monthly_rent),
        daysUntilExpiry
      }
    })
    .filter(lease => lease.daysUntilExpiry > 0 && lease.daysUntilExpiry <= daysAhead)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    .slice(0, 5)

  return expiringLeases
}

export async function getOpenTasks(organizationId: string, limit: number = 5): Promise<OpenTask[]> {
  const tasks = await prisma.tasks.findMany({
    where: {
      organization_id: organizationId,
      task_statuses: {
        some: {
          state: { in: [task_state.Open, task_state.In_Progress] }
        }
      }
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      id: true,
      reference_id: true,
      title: true,
      properties: {
        select: { code: true }
      },
      rooms: {
        select: { title: true }
      },
      task_priorities: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { priority: true }
      },
      task_due_dates: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { due_date: true }
      },
      task_statuses: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { state: true }
      },
      task_assignments: {
        where: { status: 'Accepted' },
        take: 1,
        select: {
          staff_task_assignments_assigned_idTostaff: {
            select: { first_name: true, last_name: true }
          }
        }
      }
    }
  })

  return tasks.map(task => {
    const assignedStaff = task.task_assignments[0]?.staff_task_assignments_assigned_idTostaff
    const assignedTo = assignedStaff
      ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
      : null

    const state = task.task_statuses[0]?.state || 'Unknown'

    return {
      id: task.id,
      referenceId: task.reference_id,
      title: task.title,
      propertyCode: task.properties?.code || null,
      roomTitle: task.rooms?.title || null,
      priority: task.task_priorities[0]?.priority || null,
      dueDate: task.task_due_dates[0]?.due_date || null,
      status: state.replace(/_/g, ' '),
      assignedTo
    }
  })
}

export async function getDashboardAlerts(organizationId: string): Promise<DashboardAlert[]> {
  const now = new Date()
  const alerts: DashboardAlert[] = []

  // Get overdue payments (Pending payments past due date, 7+ days overdue)
  const overduePayments = await prisma.payments.findMany({
    where: {
      organization_id: organizationId,
      status: payment_status.Pending,
      due_payment_timestamp: {
        lt: addDays(now, -7)
      }
    },
    take: 3,
    select: {
      id: true,
      reference_id: true,
      due_payment_timestamp: true,
      leases: {
        select: {
          tenants: {
            select: {
              type: true,
              individual_tenants: { select: { first_name: true } },
              company_tenants: { select: { company_name: true } }
            }
          }
        }
      }
    }
  })

  overduePayments.forEach(payment => {
    const tenant = payment.leases?.tenants
    const tenantName = tenant?.type === 'Individual'
      ? tenant.individual_tenants?.first_name || 'Tenant'
      : tenant?.company_tenants?.company_name || 'Tenant'

    const daysOverdue = Math.ceil((now.getTime() - (payment.due_payment_timestamp?.getTime() || 0)) / (1000 * 60 * 60 * 24))

    alerts.push({
      id: `overdue-${payment.id}`,
      type: 'overdue_payment',
      title: `Payment ${payment.reference_id} overdue`,
      description: `${tenantName}'s payment is ${daysOverdue} days overdue`,
      severity: daysOverdue > 30 ? 'high' : 'medium',
      link: `/payments/${payment.id}`
    })
  })

  // Get leases expiring within 7 days
  const expiringLeases = await getExpiringLeases(organizationId, 7)
  expiringLeases.forEach(lease => {
    alerts.push({
      id: `expiring-${lease.id}`,
      type: 'expiring_lease',
      title: `Lease ${lease.referenceId} expiring soon`,
      description: `${lease.tenantName}'s lease expires in ${lease.daysUntilExpiry} days`,
      severity: lease.daysUntilExpiry <= 3 ? 'high' : 'medium',
      link: `/rentals/${lease.id}`
    })
  })

  // Get unassigned tasks (Open tasks without accepted assignments)
  const unassignedTasks = await prisma.tasks.count({
    where: {
      organization_id: organizationId,
      task_statuses: {
        some: { state: task_state.Open }
      },
      task_assignments: {
        none: { status: 'Accepted' }
      }
    }
  })

  if (unassignedTasks > 0) {
    alerts.push({
      id: 'unassigned-tasks',
      type: 'unassigned_task',
      title: `${unassignedTasks} unassigned task${unassignedTasks > 1 ? 's' : ''}`,
      description: 'Tasks need to be assigned to staff members',
      severity: 'medium',
      link: '/tasks'
    })
  }

  // Get open tickets
  const openTickets = await prisma.tickets.count({
    where: {
      organization_id: organizationId,
      ticket_statuses: {
        some: { state: 'Open' }
      }
    }
  })

  if (openTickets > 0) {
    alerts.push({
      id: 'open-tickets',
      type: 'pending_ticket',
      title: `${openTickets} open ticket${openTickets > 1 ? 's' : ''}`,
      description: 'Support tickets require attention',
      severity: 'low',
      link: '/tickets'
    })
  }

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 }
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

// ============================================
// NEW METRIC CARD FUNCTIONS
// ============================================

export async function getPropertyStatusCounts(organizationId: string): Promise<PropertyStatusCounts> {
  const [
    totalProperties,
    underPreparation,
    pendingInspection,
    propertiesWithActiveLease
  ] = await Promise.all([
    // Total properties
    prisma.properties.count({
      where: { organization_id: organizationId }
    }),
    // Under Preparation
    prisma.properties.count({
      where: {
        organization_id: organizationId,
        status: property_status_new.Under_Preparation
      }
    }),
    // Pending Inspection
    prisma.properties.count({
      where: {
        organization_id: organizationId,
        status: property_status_new.Pending_Inspection
      }
    }),
    // Properties with active lease (Occupied)
    prisma.properties.count({
      where: {
        organization_id: organizationId,
        status: property_status_new.Ready,
        leases: {
          some: { status: lease_status_new.Current }
        }
      }
    })
  ])

  // Ready properties without active lease = Vacant
  const readyProperties = totalProperties - underPreparation - pendingInspection
  const vacant = readyProperties - propertiesWithActiveLease

  return {
    total: totalProperties,
    vacant: Math.max(0, vacant),
    occupied: propertiesWithActiveLease,
    underPreparation,
    pendingInspection
  }
}

export async function getRoomStatusCounts(organizationId: string): Promise<RoomStatusCounts> {
  const [
    totalRooms,
    underPreparation,
    pendingInspection,
    roomsWithActiveLease
  ] = await Promise.all([
    // Total rooms
    prisma.rooms.count({
      where: { properties: { organization_id: organizationId } }
    }),
    // Under Preparation
    prisma.rooms.count({
      where: {
        properties: { organization_id: organizationId },
        status: property_status_new.Under_Preparation
      }
    }),
    // Pending Inspection
    prisma.rooms.count({
      where: {
        properties: { organization_id: organizationId },
        status: property_status_new.Pending_Inspection
      }
    }),
    // Rooms with active lease (Occupied)
    prisma.rooms.count({
      where: {
        properties: { organization_id: organizationId },
        status: property_status_new.Ready,
        leases: {
          some: { status: lease_status_new.Current }
        }
      }
    })
  ])

  // Ready rooms without active lease = Vacant
  const readyRooms = totalRooms - underPreparation - pendingInspection
  const vacant = readyRooms - roomsWithActiveLease

  return {
    total: totalRooms,
    vacant: Math.max(0, vacant),
    occupied: roomsWithActiveLease,
    underPreparation,
    pendingInspection
  }
}

export async function getLeaseStatusCounts(organizationId: string): Promise<LeaseStatusCounts> {
  const now = new Date()
  const thirtyDaysFromNow = addDays(now, 30)

  // Get all current leases with their dates
  const currentLeases = await prisma.leases.findMany({
    where: {
      organization_id: organizationId,
      status: lease_status_new.Current
    },
    select: {
      id: true,
      start_date: true,
      number_of_months: true
    }
  })

  let expiringSoon = 0
  let expired = 0
  let active = 0

  currentLeases.forEach(lease => {
    if (lease.start_date && lease.number_of_months) {
      const startDate = new Date(lease.start_date)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + lease.number_of_months)

      if (endDate < now) {
        // Already expired but still Current status
        expired++
      } else if (endDate <= thirtyDaysFromNow) {
        // Expiring within 30 days
        expiringSoon++
      } else {
        // Active and not expiring soon
        active++
      }
    } else {
      // No end date info, count as active
      active++
    }
  })

  return {
    total: currentLeases.length,
    active,
    expiringSoon,
    expired
  }
}

export async function getContractStatusCounts(organizationId: string): Promise<ContractStatusCounts> {
  const now = new Date()
  const thirtyDaysFromNow = addDays(now, 30)

  // Get all current contracts with their dates
  const currentContracts = await prisma.contracts.findMany({
    where: {
      organization_id: organizationId,
      status: 'Current'
    },
    select: {
      id: true,
      start_date: true,
      number_of_months: true
    }
  })

  let expiringSoon = 0
  let expired = 0
  let active = 0

  currentContracts.forEach(contract => {
    if (contract.start_date && contract.number_of_months) {
      const startDate = new Date(contract.start_date)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + contract.number_of_months)

      if (endDate < now) {
        // Already expired but still Current status
        expired++
      } else if (endDate <= thirtyDaysFromNow) {
        // Expiring within 30 days
        expiringSoon++
      } else {
        // Active and not expiring soon
        active++
      }
    } else {
      // No end date info, count as active
      active++
    }
  })

  return {
    total: currentContracts.length,
    active,
    expiringSoon,
    expired
  }
}
