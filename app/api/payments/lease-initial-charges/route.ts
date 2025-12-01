'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

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

    // Get lease_reference_id from query params
    const searchParams = request.nextUrl.searchParams
    const leaseReferenceId = searchParams.get('lease_reference_id')

    if (!leaseReferenceId) {
      return NextResponse.json(
        { error: 'lease_reference_id is required' },
        { status: 400 }
      )
    }

    // Find the lease by reference_id
    const lease = await prisma.leases.findFirst({
      where: {
        reference_id: leaseReferenceId,
        organization_id: staff.organization_id
      },
      select: { id: true }
    })

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    // Find all payments of type 'Lease_Initial_Charges' for this lease
    const payments = await prisma.payments.findMany({
      where: {
        lease_id: lease.id,
        type: 'Lease_Initial_Charges',
        organization_id: staff.organization_id
      },
      select: {
        charges: {
          select: {
            title: true
          }
        }
      }
    })

    // Extract unique charge titles
    const usedChargeTitles = [
      ...new Set(payments.flatMap(payment => payment.charges.map(charge => charge.title)))
    ]

    return NextResponse.json({ usedChargeTitles })
  } catch (error: any) {
    console.error('Error fetching lease initial charges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lease initial charges' },
      { status: 500 }
    )
  }
}
