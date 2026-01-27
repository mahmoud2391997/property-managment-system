import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const contracts = await prisma.contracts.findMany({
      where: { organization_id: staff.organization_id },
      select: {
        id: true,
        contract_id: true,
        owner_id: true,
        property_id: true,
        owners: {
          select: { first_name: true, last_name: true }
        },
        properties: {
          select: { code: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ contracts })
  } catch (error: any) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}
