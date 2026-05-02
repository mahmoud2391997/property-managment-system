import { NextRequest, NextResponse } from 'next/server'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { prisma } from '@/lib/prisma'
import { getComputedCalendarEvents } from '@/lib/calendar-utils'

export async function GET(request: NextRequest) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json({ error: 'Missing from/to parameters' }, { status: 400 })
    }

    const startDate = new Date(from)
    const endDate = new Date(to)

    const getLocalDateStr = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    const chipsByDate: Record<string, any[]> = {}

    // Fetch Payments
    const payments = await prisma.payments.findMany({
      where: {
        organization_id: staff.organization_id,
        due_payment_timestamp: { gte: startDate, lte: endDate },
        status: 'Pending'
      },
      select: { due_payment_timestamp: true, charges: { select: { amount: true } } }
    })
    
    // Group Payments
    const paymentsGrouped: Record<string, { count: number; total: number }> = {}
    payments.forEach(p => {
      if (p.due_payment_timestamp) {
        const dateStr = getLocalDateStr(p.due_payment_timestamp)
        if (!paymentsGrouped[dateStr]) paymentsGrouped[dateStr] = { count: 0, total: 0 }
        paymentsGrouped[dateStr].count += 1
        p.charges.forEach(c => {
          paymentsGrouped[dateStr].total += Number(c.amount ?? 0)
        })
      }
    })
    
    // Fetch Expenses grouped by category
    const expenses = await prisma.expenses.findMany({
      where: {
        organization_id: staff.organization_id,
        due_payment_date: { gte: startDate, lte: endDate },
        status: 'Pending'
      },
      select: { due_payment_date: true, category: true, charges: { select: { amount: true } } }
    })

    const expensesGrouped: Record<string, Record<string, { count: number; total: number }>> = {}
    expenses.forEach(e => {
      if (e.due_payment_date) {
        const dateStr = getLocalDateStr(e.due_payment_date)
        const cat = e.category as string
        if (!expensesGrouped[dateStr]) expensesGrouped[dateStr] = {}
        if (!expensesGrouped[dateStr][cat]) expensesGrouped[dateStr][cat] = { count: 0, total: 0 }
        expensesGrouped[dateStr][cat].count += 1
        e.charges.forEach(c => {
          expensesGrouped[dateStr][cat].total += Number(c.amount ?? 0)
        })
      }
    })

    // Fetch Tasks with urgent count
    const tasks = await prisma.task_due_dates.findMany({
      where: {
        tasks: { organization_id: staff.organization_id },
        due_date: { gte: startDate, lte: endDate }
      },
      include: {
        tasks: {
          include: {
            task_priorities: { select: { priority: true }, take: 1 }
          }
        }
      }
    })

    const tasksGrouped: Record<string, { count: number; urgent: number }> = {}
    tasks.forEach(t => {
      if (t.due_date) {
        const dateStr = getLocalDateStr(t.due_date)
        if (!tasksGrouped[dateStr]) tasksGrouped[dateStr] = { count: 0, urgent: 0 }
        tasksGrouped[dateStr].count += 1
        if (t.tasks.task_priorities?.[0]?.priority === 'Urgent') {
          tasksGrouped[dateStr].urgent += 1
        }
      }
    })

    // Fetch Task Assignments
    const taskAssignments = await prisma.task_assignments.findMany({
      where: {
        status: 'Pending',
        requested_at: { gte: startDate, lte: endDate }
      },
      select: { requested_at: true }
    })

    const assignmentsGrouped: Record<string, number> = {}
    taskAssignments.forEach(a => {
      if (a.requested_at) {
        const dateStr = getLocalDateStr(a.requested_at)
        assignmentsGrouped[dateStr] = (assignmentsGrouped[dateStr] || 0) + 1
      }
    })

    // Fetch Calendar Events
    const events = await prisma.calendar_events.findMany({
      where: {
        organization_id: staff.organization_id,
        timestamp: { gte: startDate, lte: endDate }
      },
      select: { timestamp: true }
    })

    const eventsGrouped: Record<string, number> = {}
    events.forEach(e => {
      if (e.timestamp) {
        const dateStr = getLocalDateStr(e.timestamp)
        eventsGrouped[dateStr] = (eventsGrouped[dateStr] || 0) + 1
      }
    })

    // Fetch Computed Events
    const computed = await getComputedCalendarEvents(staff.organization_id, startDate, endDate)

    const leaseStartsGrouped: Record<string, { count: number; totalRent: number }> = {}
    computed.leaseStarts.forEach(l => {
      if (l.start_date) {
        const dateStr = getLocalDateStr(l.start_date)
        if (!leaseStartsGrouped[dateStr]) leaseStartsGrouped[dateStr] = { count: 0, totalRent: 0 }
        leaseStartsGrouped[dateStr].count += 1
        leaseStartsGrouped[dateStr].totalRent += Number(l.monthly_rent ?? 0)
      }
    })

    const leaseEndsGrouped: Record<string, { count: number; totalRent: number }> = {}
    computed.leaseEnds.forEach(l => {
      if (l.ended_at) {
        const dateStr = getLocalDateStr(l.ended_at)
        if (!leaseEndsGrouped[dateStr]) leaseEndsGrouped[dateStr] = { count: 0, totalRent: 0 }
        leaseEndsGrouped[dateStr].count += 1
        leaseEndsGrouped[dateStr].totalRent += Number(l.monthly_rent ?? 0)
      }
    })

    const remindersGrouped: Record<string, number> = {}
    computed.leases.forEach(l => {
      if (l.ended_at && l.expiry_days_before_reminder) {
        const reminderDate = new Date(l.ended_at)
        reminderDate.setDate(reminderDate.getDate() - l.expiry_days_before_reminder)
        
        if (reminderDate >= startDate && reminderDate <= endDate) {
          const dateStr = getLocalDateStr(reminderDate)
          remindersGrouped[dateStr] = (remindersGrouped[dateStr] || 0) + 1
        }
      }
    })

    const rentChangesGrouped: Record<string, { count: number; total: number }> = {}
    computed.rentChanges.forEach(r => {
      if (r.effective_from) {
        const dateStr = getLocalDateStr(r.effective_from)
        if (!rentChangesGrouped[dateStr]) rentChangesGrouped[dateStr] = { count: 0, total: 0 }
        rentChangesGrouped[dateStr].count += 1
        rentChangesGrouped[dateStr].total += Number(r.new_monthly_rent ?? 0)
      }
    })

    // Build the chips
    const current = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    while (current <= endDate) {
      const dateStr = getLocalDateStr(current)
      const currentReset = new Date(current)
      currentReset.setHours(0, 0, 0, 0)
      
      const chips: any[] = []

      if (paymentsGrouped[dateStr]) {
        chips.push({
          type: 'payment',
          count: paymentsGrouped[dateStr].count,
          total: paymentsGrouped[dateStr].total,
          label: 'rent due',
          status: currentReset < today ? 'overdue' : 'due',
          hasViewAll: true,
          viewAllUrl: '/payments'
        })
      }

      if (expensesGrouped[dateStr]) {
        Object.entries(expensesGrouped[dateStr]).forEach(([cat, data]) => {
          const catLabel = cat.replace(/_/g, ' ').toLowerCase() + ' expenses due'
          chips.push({
            type: 'expense',
            count: data.count,
            total: data.total,
            label: catLabel,
            status: currentReset < today ? 'overdue' : 'due',
            hasViewAll: true,
            viewAllUrl: '/expenses'
          })
        })
      }

      if (tasksGrouped[dateStr]) {
        chips.push({
          type: 'task',
          count: tasksGrouped[dateStr].count,
          urgentCount: tasksGrouped[dateStr].urgent,
          label: 'tasks due',
          status: currentReset < today ? 'overdue' : 'due',
          hasViewAll: true,
          viewAllUrl: '/tasks'
        })
      }

      if (assignmentsGrouped[dateStr]) {
        chips.push({
          type: 'assignment_request',
          count: assignmentsGrouped[dateStr],
          label: 'assignment requests',
          status: currentReset < today ? 'overdue' : 'due',
          hasViewAll: true,
          viewAllUrl: '/tasks'
        })
      }

      if (eventsGrouped[dateStr]) {
        chips.push({
          type: 'manual_event',
          count: eventsGrouped[dateStr],
          label: 'events',
          hasViewAll: true,
          viewAllUrl: '/calendar'
        })
      }

      if (leaseStartsGrouped[dateStr]) {
        chips.push({ type: 'lease_start', count: leaseStartsGrouped[dateStr].count, total: leaseStartsGrouped[dateStr].totalRent, label: 'lease start' })
      }
      if (leaseEndsGrouped[dateStr]) {
        chips.push({ type: 'lease_end', count: leaseEndsGrouped[dateStr].count, total: leaseEndsGrouped[dateStr].totalRent, label: 'lease end' })
      }
      if (remindersGrouped[dateStr]) {
        chips.push({ type: 'expiry_reminder', count: remindersGrouped[dateStr], label: 'expiry reminders' })
      }
      if (rentChangesGrouped[dateStr]) {
        chips.push({ type: 'rent_change', count: rentChangesGrouped[dateStr].count, total: rentChangesGrouped[dateStr].total, label: 'rent changes' })
      }

      if (chips.length > 0) {
        chipsByDate[dateStr] = chips
      }
      
      current.setDate(current.getDate() + 1)
    }

    return NextResponse.json({ chips: chipsByDate })
  } catch (error: any) {
    console.error('Error fetching calendar month:', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch calendar data', stack: error?.stack }, { status: 500 })
  }
}