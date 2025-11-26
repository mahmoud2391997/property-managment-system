'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { ComboBoxitemsType } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant_id and property_id from query params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const propertyId = searchParams.get('property_id')

    if (!tenantId || !propertyId) {
      return NextResponse.json({ error: 'Tenant ID and Property ID are required' }, { status: 400 })
    }

    // Get current staff organization
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Get rooms linked to active leases for this tenant + property
    const activeLeases = await prisma.leases.findMany({
      where: {
        tenant_id: tenantId,
        property_id: propertyId,
        organization_id: staff.organization_id,
        room_id: {
          not: null
        },
        status: {
          in: ['Current', 'Expired']
        }
      },
      select: {
        id: true,
        reference_id: true,
        room_id: true,
        rooms: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    const rooms: ComboBoxitemsType[] = activeLeases.map((lease) => ({
      id: lease.reference_id,
      label: lease.rooms!.title,
      extraReference: lease.reference_id // Display lease reference_id, not UUID
    }))

    return NextResponse.json(rooms)
  } catch (error: any) {
    console.error('Error fetching active rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch active rooms' }, { status: 500 })
  }
}
