import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function getComputedCalendarEvents(organizationId: string, startDate: Date, endDate: Date) {
  // 1. Lease Expiry Reminders
  // Leases with is_expiry_reminder = true and (ended_at is null or ended_at >= startDate)
  const leases = await prisma.leases.findMany({
    where: {
      organization_id: organizationId,
      is_expiry_reminder: true,
      expiry_days_before_reminder: { not: null },
      OR: [
        { ended_at: null },
        { ended_at: { gte: startDate } }
      ]
    },
    select: {
      id: true,
      ended_at: true,
      expiry_days_before_reminder: true,
      reference_id: true,
      tenants: { select: { individual_tenants: { select: { first_name: true, last_name: true } } } }
    }
  })

  // 2. Scheduled Rent Changes
  const rentChanges = await prisma.scheduled_rental_changes.findMany({
    where: {
      leases: { organization_id: organizationId },
      effective_from: { gte: startDate, lte: endDate },
      status: 'Scheduled'
    },
    select: {
      id: true,
      effective_from: true,
      new_monthly_rent: true,
      leases: { select: { reference_id: true } }
    }
  })

  // 3. Lease Starts
  const leaseStarts = await prisma.leases.findMany({
    where: {
      organization_id: organizationId,
      start_date: { gte: startDate, lte: endDate }
    },
    select: {
      id: true,
      start_date: true,
      reference_id: true,
      monthly_rent: true
    }
  })

  // 4. Lease Ends
  const leaseEnds = await prisma.leases.findMany({
    where: {
      organization_id: organizationId,
      ended_at: { gte: startDate, lte: endDate }
    },
    select: {
      id: true,
      ended_at: true,
      reference_id: true,
      monthly_rent: true
    }
  })

  return {
    leases,
    rentChanges,
    leaseStarts,
    leaseEnds
  }
}
