import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { computeLeaseStatus } from '@/utils/lease-status'

export async function GET(request: Request) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'leases.access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const leaseId = searchParams.get('leaseId')

    if (!leaseId) {
      return NextResponse.json(
        { error: 'leaseId is required' },
        { status: 400 }
      )
    }

    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        reference_id: true,
        start_date: true,
        number_of_months: true,
        monthly_rent: true,
        payment_day: true,
        status: true,
        property_id: true,
        room_id: true,
        is_expiry_reminder: true,
        expiry_days_before_reminder: true,
        is_rent_reminder: true,
        rent_reminder_days_before: true,
        is_overdue_rent_reminder: true,
        overdue_days_after_reminder: true,
        properties: {
          select: {
            id: true,
            code: true,
            street_address: true
          }
        },
        rooms: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      )
    }

    const dbStatus = lease.status
    const displayStatus = computeLeaseStatus({
      status: lease.status,
      start_date: lease.start_date,
      number_of_months: lease.number_of_months
    })

    return NextResponse.json({
      lease: {
        id: lease.id,
        reference_id: lease.reference_id,
        start_date: lease.start_date.toISOString().split('T')[0],
        number_of_months: lease.number_of_months,
        monthly_rent: lease.monthly_rent,
        payment_day: lease.payment_day,
        db_status: dbStatus,
        display_status: displayStatus,
        property: {
          code: lease.properties.code,
          address: lease.properties.street_address
        },
        room: lease.rooms ? {
          id: lease.rooms.id,
          title: lease.rooms.title
        } : null,
        reminders: {
          expiry: {
            enabled: lease.is_expiry_reminder,
            days_before: lease.expiry_days_before_reminder
          },
          rent: {
            enabled: lease.is_rent_reminder,
            days_before: lease.rent_reminder_days_before
          },
          overdue: {
            enabled: lease.is_overdue_rent_reminder,
            days_after: lease.overdue_days_after_reminder
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching lease details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lease details' },
      { status: 500 }
    )
  }
}
