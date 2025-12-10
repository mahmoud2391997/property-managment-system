'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { ComboBoxitemsType } from '@/types'
import { isLeaseActive } from '@/utils/lease-status'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant_id from query params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    // Get current staff organization
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Get properties linked to active leases for this tenant
    // Query 'Current' status and filter by computed active status (includes expired)
    const leases = await prisma.leases.findMany({
      where: {
        tenant_id: tenantId,
        organization_id: staff.organization_id,
        status: 'Current'
      },
      select: {
        id: true,
        reference_id: true,
        property_id: true,
        room_id: true,
        status: true,
        start_date: true,
        number_of_months: true,
        properties: {
          select: {
            id: true,
            code: true,
            projects: {
              select: {
                title: true
              }
            }
          }
        }
      },
      distinct: ['property_id']
    })

    // Filter to only include active leases (Current or Expired by date)
    const activeLeases = leases.filter(lease => isLeaseActive(lease))

    const properties:ComboBoxitemsType[] = activeLeases.map((lease) => ({
      id: lease.reference_id,
      label: lease.properties.code,
      // extraReference: lease reference_id if directly rented, 'Room rented' if has rooms
      extraReference: lease.room_id === null ? lease.reference_id : 'Room rented',
      subtitle: lease.properties.projects?.title || 'No Project',
      metadata: {
        propertyId: lease.property_id // Store property_id for room filtering
      }
    }))

    return NextResponse.json(properties)
  } catch (error: any) {
    console.error('Error fetching active properties:', error)
    return NextResponse.json({ error: 'Failed to fetch active properties' }, { status: 500 })
  }
}
