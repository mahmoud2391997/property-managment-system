import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET (
  req: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { propertyId } = await params

    const property = await prisma.properties.findUnique({
      where: { id: propertyId },
      select: { code: true }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    return NextResponse.json({ property: property?.code })
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}
