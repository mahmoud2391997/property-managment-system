import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (staff) {
      return NextResponse.json({ userType: 'staff' })
    }

    // Check if user is tenant
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (tenant) {
      return NextResponse.json({ userType: 'tenant' })
    }

    return NextResponse.json({ error: 'User type not found' }, { status: 404 })
  } catch (error: any) {
    console.error('Error fetching user type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user type' },
      { status: 500 }
    )
  }
}
