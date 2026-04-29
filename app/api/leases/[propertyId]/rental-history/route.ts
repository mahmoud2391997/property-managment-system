'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()
    if (error) return error

    if (!hasPermission(permissions, 'leases.access'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { propertyId: leaseId } = await params

    // Verify lease exists and belongs to organization
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        monthly_rent: true,
        start_date: true
      }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      )
    }

    // Fetch all rental changes (all statuses)
    const changes = await prisma.scheduled_rental_changes.findMany({
      where: {
        lease_id: leaseId
      },
      select: {
        id: true,
        old_monthly_rent: true,
        new_monthly_rent: true,
        effective_from: true,
        status: true,
        applied_at: true,
        created_at: true
      },
      orderBy: {
        effective_from: 'desc'
      }
    })

    // Determine initial rent
    // If there are applied changes, initial rent is the old_rent of the earliest applied change
    // Otherwise, use the current monthly_rent from the lease
    const appliedChanges = changes.filter(c => c.status === 'Applied')
    let initialRent = lease.monthly_rent

    if (appliedChanges.length > 0) {
      // Get the earliest applied change
      const earliestApplied = appliedChanges[appliedChanges.length - 1]
      initialRent = earliestApplied.old_monthly_rent
    }

    return NextResponse.json({
      initial_rent: initialRent,
      lease_start_date: lease.start_date.toISOString(),
      changes: changes.map(change => ({
        id: change.id,
        old_rent: change.old_monthly_rent,
        new_rent: change.new_monthly_rent,
        effective_from: change.effective_from.toISOString(),
        status: change.status,
        applied_at: change.applied_at?.toISOString() || null,
        created_at: change.created_at.toISOString()
      }))
    })
  } catch (error: any) {
    console.error('Error fetching rental history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rental history' },
      { status: 500 }
    )
  }
}
