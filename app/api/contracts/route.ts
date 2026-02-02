import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (propertyId) {
      // Verify property belongs to the organization
      const property = await prisma.properties.findFirst({
        where: {
          id: propertyId,
          organization_id: staff.organization_id
        },
        select: { id: true }
      })

      if (!property) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        )
      }
    }

    const contracts = await prisma.contracts.findMany({
      where: {
        ...(propertyId && { property_id: propertyId }),
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        reference_id: true,
        start_date: true,
        number_of_months: true,
        monthly_rent: true,
        payment_day: true,
        status: true,
        property_id: true,
        owner_id: true,
        owners: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_thumb: true
          }
        },
        properties: {
          select: {
            code: true
          }
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
