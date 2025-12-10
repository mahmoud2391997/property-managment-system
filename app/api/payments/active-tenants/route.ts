'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { isLeaseActive } from '@/utils/lease-status'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current staff organization
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Get tenants with active leases (status = 'Current' in DB, filter by computed status)
    const leases = await prisma.leases.findMany({
      where: {
        organization_id: staff.organization_id,
        status: 'Current'
      },
      select: {
        tenant_id: true,
        status: true,
        start_date: true,
        number_of_months: true,
        tenants: {
          select: {
            id: true,
            profile_thumb: true,
            individual_tenants: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      },
      distinct: ['tenant_id']
    })

    // Filter to only include active leases (Current or Expired by date)
    const activeLeases = leases.filter(lease => isLeaseActive(lease))

    // Get tenant emails from Supabase Auth
    const tenantsWithEmail = await Promise.all(
      activeLeases.map(async (lease) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(lease.tenant_id)

        return {
          id: lease.tenant_id,
          avatar: lease.tenants.profile_thumb || undefined,
          label: `${lease.tenants.individual_tenants?.first_name} ${lease.tenants.individual_tenants?.last_name || ''}`.trim(),
          subtitle: authUser?.user?.email || ''
        }
      })
    )

    return NextResponse.json(tenantsWithEmail)
  } catch (error: any) {
    console.error('Error fetching active tenants:', error)
    return NextResponse.json({ error: 'Failed to fetch active tenants' }, { status: 500 })
  }
}
