import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function PUT(request: Request) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'leases.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { leaseId } = body

    if (!leaseId) {
      return NextResponse.json(
        { error: 'leaseId is required' },
        { status: 400 }
      )
    }

    const existingLease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        status: true
      }
    })

    if (!existingLease) {
      return NextResponse.json(
        { error: 'Lease not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    if (!['Current', 'Scheduled'].includes(existingLease.status)) {
      return NextResponse.json(
        { error: 'Cannot edit leases that are not in Current or Scheduled status' },
        { status: 400 }
      )
    }

    const {
      start_date,
      number_of_months,
      payment_day,
      monthly_rent,
      is_expiry_reminder,
      expiry_days_before_reminder,
      is_rent_reminder,
      rent_reminder_days_before,
      is_overdue_rent_reminder,
      overdue_days_after_reminder
    } = body

    const updateData: Record<string, any> = {}

    if (start_date !== undefined) updateData.start_date = new Date(start_date)
    if (number_of_months !== undefined) updateData.number_of_months = number_of_months
    if (payment_day !== undefined) updateData.payment_day = payment_day
    if (monthly_rent !== undefined) updateData.monthly_rent = monthly_rent

    if (is_expiry_reminder !== undefined) {
      updateData.is_expiry_reminder = is_expiry_reminder
      updateData.expiry_days_before_reminder = is_expiry_reminder ? (expiry_days_before_reminder || null) : null
    } else if (expiry_days_before_reminder !== undefined) {
      updateData.expiry_days_before_reminder = expiry_days_before_reminder
    }

    if (is_rent_reminder !== undefined) {
      updateData.is_rent_reminder = is_rent_reminder
      updateData.rent_reminder_days_before = is_rent_reminder ? (rent_reminder_days_before || null) : null
    } else if (rent_reminder_days_before !== undefined) {
      updateData.rent_reminder_days_before = rent_reminder_days_before
    }

    if (is_overdue_rent_reminder !== undefined) {
      updateData.is_overdue_rent_reminder = is_overdue_rent_reminder
      updateData.overdue_days_after_reminder = is_overdue_rent_reminder ? (overdue_days_after_reminder || null) : null
    } else if (overdue_days_after_reminder !== undefined) {
      updateData.overdue_days_after_reminder = overdue_days_after_reminder
    }

    const updatedLease = await prisma.leases.update({
      where: { id: leaseId },
      data: updateData
    })

    return NextResponse.json(
      { success: true, lease_id: updatedLease.id, message: 'Lease updated successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating lease:', error)
    return NextResponse.json(
      { error: 'Failed to update lease' },
      { status: 500 }
    )
  }
}
