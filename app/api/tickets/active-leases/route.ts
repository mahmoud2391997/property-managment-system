'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { isLeaseActive } from '@/utils/lease-status'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only tenants can fetch their leases for ticket creation
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Fetch leases with Current status for this tenant
    const leases = await prisma.leases.findMany({
      where: {
        tenant_id: tenant.id,
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
          select: { id: true, code: true }
        },
        rooms: {
          select: { id: true, title: true }
        }
      },
      orderBy: { start_date: 'desc' }
    })

    // Filter to only include active leases (Current or Expired by date)
    const activeLeases = leases.filter(lease => isLeaseActive(lease))

    // Transform to combobox format
    // Label: lease reference_id
    // Subtitle: property code OR "property code - room title" for room leases
    const items = activeLeases.map(lease => {
      const isRoomLease = lease.property_id && lease.room_id
      const subtitle = isRoomLease
        ? `${lease.properties.code} - ${lease.rooms?.title || 'Unknown Room'}`
        : lease.properties.code

      return {
        id: lease.id,
        label: lease.reference_id,
        subtitle
      }
    })

    return NextResponse.json(items)
  } catch (error: any) {
    console.error('Error fetching leases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leases' },
      { status: 500 }
    )
  }
}
