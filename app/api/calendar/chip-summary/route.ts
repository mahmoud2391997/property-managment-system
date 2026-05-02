import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(request: NextRequest) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!date || !type) {
      return NextResponse.json({ error: 'Missing date or type parameters' }, { status: 400 })
    }

    const [year, month, day] = date.split('-').map(Number)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)

    let items: any[] = []
    let count = 0

    switch (type) {
      case 'payment':
        const payments = await prisma.payments.findMany({
          where: {
            organization_id: staff.organization_id,
            due_payment_timestamp: { gte: startOfDay, lte: endOfDay },
            status: 'Pending'
          },
          include: {
            charges: { select: { title: true, amount: true } },
            leases: {
              include: {
                properties: { select: { code: true } },
                rooms: { select: { title: true } },
                tenants: {
                  include: {
                    individual_tenants: { select: { first_name: true, last_name: true } }
                  }
                }
              }
            }
          },
          take: limit
        })

        count = await prisma.payments.count({
          where: {
            organization_id: staff.organization_id,
            due_payment_timestamp: { gte: startOfDay, lte: endOfDay },
            status: 'Pending'
          }
        })

        items = payments.map(p => ({
          title: p.charges?.[0]?.title || 'Payment',
          reference_id: p.reference_id,
          amount: p.charges?.[0]?.amount,
          property: p.leases?.properties?.code || 'N/A',
          room: p.leases?.rooms?.title || 'Whole unit',
          tenant: p.leases?.tenants?.individual_tenants
            ? `${p.leases.tenants.individual_tenants.first_name} ${p.leases.tenants.individual_tenants.last_name}`
            : 'N/A',
          due_date: p.due_payment_timestamp
        }))
        break

      case 'task':
        const taskDueDates = await prisma.task_due_dates.findMany({
          where: {
            tasks: { organization_id: staff.organization_id },
            due_date: { gte: startOfDay, lte: endOfDay }
          },
          include: {
            tasks: {
              select: {
                title: true,
                reference_id: true,
                description: true,
                properties: { select: { code: true } },
                task_statuses: { select: { state: true }, take: 1 },
                task_priorities: { select: { priority: true }, take: 1 },
                task_types: { select: { type: true }, take: 1 }
              }
            }
          },
          take: limit
        })

        count = await prisma.task_due_dates.count({
          where: {
            tasks: { organization_id: staff.organization_id },
            due_date: { gte: startOfDay, lte: endOfDay }
          }
        })

        items = taskDueDates.map(t => ({
          title: t.tasks.title,
          reference_id: t.tasks.reference_id,
          description: t.tasks.description,
          status: t.tasks.task_statuses?.[0]?.state,
          priority: t.tasks.task_priorities?.[0]?.priority,
          type: t.tasks.task_types?.[0]?.type,
          property: t.tasks.properties?.code || 'N/A',
          due_date: t.due_date
        }))
        break

      case 'expense':
        const expenses = await prisma.expenses.findMany({
          where: {
            organization_id: staff.organization_id,
            due_payment_date: { gte: startOfDay, lte: endOfDay },
            status: 'Pending'
          },
          include: {
            charges: { select: { title: true, amount: true } },
            property_expenses: { select: { property_id: true, type: true } }
          },
          take: limit
        })

        count = await prisma.expenses.count({
          where: {
            organization_id: staff.organization_id,
            due_payment_date: { gte: startOfDay, lte: endOfDay },
            status: 'Pending'
          }
        })

        items = expenses.map(e => ({
          title: e.charges?.[0]?.title || e.description || e.category,
          reference_id: e.reference_id,
          amount: e.charges?.[0]?.amount,
          category: e.category,
          type: e.property_expenses?.type,
          due_date: e.due_payment_date
        }))
        break

      case 'lease_start':
        const leaseStarts = await prisma.leases.findMany({
          where: {
            organization_id: staff.organization_id,
            start_date: { gte: startOfDay, lte: endOfDay }
          },
          include: {
            properties: { select: { code: true } },
            rooms: { select: { title: true } },
            tenants: {
              include: {
                individual_tenants: { select: { first_name: true, last_name: true } }
              }
            }
          },
          take: limit
        })

        count = await prisma.leases.count({
          where: {
            organization_id: staff.organization_id,
            start_date: { gte: startOfDay, lte: endOfDay }
          }
        })

        items = leaseStarts.map(l => ({
          title: `Lease Start — RM ${Number(l.monthly_rent).toLocaleString()}/mo`,
          reference_id: l.reference_id,
          tenant: l.tenants?.individual_tenants
            ? `${l.tenants.individual_tenants.first_name} ${l.tenants.individual_tenants.last_name}`
            : 'N/A',
          property: l.properties?.code || 'N/A',
          room: l.rooms?.title || 'Whole unit',
          monthly_rent: l.monthly_rent,
          due_date: l.start_date
        }))
        break

      case 'lease_end':
        const leaseEnds = await prisma.leases.findMany({
          where: {
            organization_id: staff.organization_id,
            ended_at: { gte: startOfDay, lte: endOfDay }
          },
          include: {
            properties: { select: { code: true } },
            rooms: { select: { title: true } },
            tenants: {
              include: {
                individual_tenants: { select: { first_name: true, last_name: true } }
              }
            }
          },
          take: limit
        })

        count = await prisma.leases.count({
          where: {
            organization_id: staff.organization_id,
            ended_at: { gte: startOfDay, lte: endOfDay }
          }
        })

        items = leaseEnds.map(l => ({
          title: `Lease End — RM ${Number(l.monthly_rent).toLocaleString()}/mo`,
          reference_id: l.reference_id,
          tenant: l.tenants?.individual_tenants
            ? `${l.tenants.individual_tenants.first_name} ${l.tenants.individual_tenants.last_name}`
            : 'N/A',
          property: l.properties?.code || 'N/A',
          room: l.rooms?.title || 'Whole unit',
          monthly_rent: l.monthly_rent,
          due_date: l.ended_at
        }))
        break

      case 'expiry_reminder':
        // Compute all leases with reminder falling on this day
        // Similar to how we get it in getComputedCalendarEvents, but filtered by day
        const allReminderLeases = await prisma.leases.findMany({
          where: {
            organization_id: staff.organization_id,
            is_expiry_reminder: true,
            expiry_days_before_reminder: { not: null },
            OR: [
              { ended_at: null },
              { ended_at: { gte: startOfDay } }
            ]
          }
        })
        
        const matchingReminders = allReminderLeases.filter(l => {
          if (l.ended_at && l.expiry_days_before_reminder) {
            const reminderDate = new Date(l.ended_at)
            reminderDate.setDate(reminderDate.getDate() - l.expiry_days_before_reminder)
            return reminderDate >= startOfDay && reminderDate <= endOfDay
          }
          return false
        })

        count = matchingReminders.length
        items = matchingReminders.slice(0, limit).map(l => ({
          title: `Expiry Reminder - ${l.reference_id}`,
          reference_id: l.reference_id,
          due_date: l.ended_at
        }))
        break

      case 'rent_change':
        const rentChanges = await prisma.scheduled_rental_changes.findMany({
          where: {
            leases: { organization_id: staff.organization_id },
            effective_from: { gte: startOfDay, lte: endOfDay },
            status: 'Scheduled'
          },
          include: {
            leases: {
              select: {
                reference_id: true,
                monthly_rent: true,
                properties: { select: { code: true } },
                rooms: { select: { title: true } },
                tenants: {
                  include: {
                    individual_tenants: { select: { first_name: true, last_name: true } }
                  }
                }
              }
            }
          },
          take: limit
        })

        count = await prisma.scheduled_rental_changes.count({
          where: {
            leases: { organization_id: staff.organization_id },
            effective_from: { gte: startOfDay, lte: endOfDay },
            status: 'Scheduled'
          }
        })

        items = rentChanges.map(rc => ({
          title: `Rent Change: RM ${rc.old_monthly_rent?.toLocaleString()} → RM ${rc.new_monthly_rent.toLocaleString()}`,
          reference_id: rc.leases.reference_id,
          tenant: rc.leases.tenants?.individual_tenants
            ? `${rc.leases.tenants.individual_tenants.first_name} ${rc.leases.tenants.individual_tenants.last_name}`
            : 'N/A',
          property: rc.leases.properties?.code || 'N/A',
          room: rc.leases.rooms?.title || 'Whole unit',
          due_date: rc.effective_from
        }))
        break

      case 'manual_event':
        const events = await prisma.calendar_events.findMany({
          where: {
            organization_id: staff.organization_id,
            timestamp: { gte: startOfDay, lte: endOfDay }
          },
          include: {
            staff: { select: { first_name: true, last_name: true } }
          },
          take: limit
        })

        count = await prisma.calendar_events.count({
          where: {
            organization_id: staff.organization_id,
            timestamp: { gte: startOfDay, lte: endOfDay }
          }
        })

        items = events.map(e => ({
          title: e.title,
          description: e.description,
          reference_id: e.id,
          due_date: e.timestamp,
          created_by: e.staff ? `${e.staff.first_name} ${e.staff.last_name}` : 'System'
        }))
        break

      case 'info':
        // Fallback for any other info chips
        count = 1
        items = [{ title: 'See calendar for more details' }]
        break

      case 'assignment_request':
        const pendingAssignments = await prisma.task_assignments.findMany({
          where: {
            status: 'Pending',
            requested_at: { gte: startOfDay, lte: endOfDay }
          },
          include: {
            tasks: { select: { title: true, reference_id: true } },
            staff_task_assignments_assigner_idTostaff: { select: { first_name: true, last_name: true } }
          },
          take: limit
        })

        count = await prisma.task_assignments.count({
          where: {
            status: 'Pending',
            requested_at: { gte: startOfDay, lte: endOfDay }
          }
        })

        items = pendingAssignments.map(a => ({
          title: a.tasks.title,
          reference_id: a.tasks.reference_id,
          due_date: a.requested_at,
          created_by: a.staff_task_assignments_assigner_idTostaff
            ? `${a.staff_task_assignments_assigner_idTostaff.first_name} ${a.staff_task_assignments_assigner_idTostaff.last_name}`
            : 'N/A'
        }))
        break

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({
      date,
      type,
      count,
      items,
      hasMore: count > limit
    })
  } catch (error) {
    console.error('Error fetching chip summary:', error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
