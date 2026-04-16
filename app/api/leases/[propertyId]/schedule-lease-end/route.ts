'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()
    if (error) return error

    if (!hasPermission(permissions, 'leases.schedule_lease_end'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { propertyId: leaseId } = await params
    const body = await request.json()
    const { scheduledDate } = body

    // Validate required fields
    if (!scheduledDate) {
      return NextResponse.json(
        { error: 'Scheduled date is required' },
        { status: 400 }
      )
    }

    // Parse YYYY-MM-DD string and construct date at noon UTC (avoids timezone edge cases)
    const dateParts = String(scheduledDate).match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!dateParts) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    const [, yearStr, monthStr, dayStr] = dateParts
    const parsedDate = new Date(Date.UTC(
      parseInt(yearStr),
      parseInt(monthStr) - 1,
      parseInt(dayStr),
      12, 0, 0 // noon UTC to avoid timezone boundary issues
    ))

    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date' },
        { status: 400 }
      )
    }

    // Validate date is not in the past (use < to allow 1-day timezone buffer;
    // the frontend enforces the strict "tomorrow or later" check in the user's local timezone)
    const now = new Date()
    const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
    if (scheduledDate < todayStr) {
      return NextResponse.json(
        { error: 'Scheduled date must be in the future' },
        { status: 400 }
      )
    }

    // Validate lease exists and belongs to organization
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id,
        status: 'Current'
      },
      include: {
        properties: { select: { id: true, code: true } },
        rooms: { select: { id: true, title: true } },
        tenants: {
          select: {
            id: true,
            individual_tenants: {
              select: { first_name: true, last_name: true }
            },
            company_tenants: { select: { company_name: true } }
          }
        }
      }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found or not active' },
        { status: 404 }
      )
    }

    // Check for existing Current schedule
    const existingSchedule = await prisma.lease_end_schedule.findFirst({
      where: {
        lease_id: leaseId,
        status: 'Current'
      }
    })

    if (existingSchedule) {
      return NextResponse.json(
        { error: 'There is already a scheduled lease end for this lease' },
        { status: 400 }
      )
    }

    // Execute transaction
    const result = await prisma.$transaction(async tx => {
      // Create lease_end_schedule record
      const schedule = await tx.lease_end_schedule.create({
        data: {
          lease_id: leaseId,
          organization_id: staff.organization_id,
          scheduled_date: parsedDate,
          created_by: staff.id
        }
      })

      // Send notification to tenant
      const tenantUserId = lease.tenants.id
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const formattedDate = `${parseInt(dayStr)} ${monthNames[parseInt(monthStr) - 1]} ${yearStr}`

      const locationLabel = lease.rooms
        ? `${lease.properties.code}(${lease.rooms.title})`
        : lease.properties.code

      const pageUrl = `rentals?reference_id=${lease.reference_id}`

      await tx.notifications.create({
        data: {
          organization_id: staff.organization_id,
          user_id: tenantUserId,
          title: 'Planned Checkout Scheduled',
          message: `A planned checkout for ${locationLabel} has been scheduled for ${formattedDate}.`,
          reference_id: schedule.id,
          reference_type: 'lease_end_schedule',
          performer_id: null,
          performer_type: 'system',
          page: pageUrl,
          affected_type: 'tenant',
          affected_id: tenantUserId
        }
      })

      return schedule
    })

    return NextResponse.json(
      {
        success: true,
        scheduleId: result.id,
        message: 'Lease end scheduled successfully'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error scheduling lease end:', error)
    return NextResponse.json(
      { error: 'Failed to schedule lease end' },
      { status: 500 }
    )
  }
}
