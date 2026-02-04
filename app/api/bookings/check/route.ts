import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const roomId = searchParams.get('roomId')

    if (!propertyId && !roomId) {
      return NextResponse.json(
        { error: 'propertyId or roomId is required' },
        { status: 400 }
      )
    }

    const booking = await prisma.bookings.findFirst({
      where: {
        status: 'Current',
        properties: {
          organization_id: staff.organization_id
        },
        ...(roomId
          ? { room_id: roomId }
          : { property_id: propertyId!, room_id: null })
      },
      select: {
        id: true,
        tenants: {
          select: {
            id: true,
            profile_thumb: true,
            individual_tenants: {
              select: {
                first_name: true,
                last_name: true
              }
            },
            company_tenants: {
              select: {
                company_name: true
              }
            }
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ booking: null })
    }

    const tenant = booking.tenants
    const name = tenant.individual_tenants
      ? `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
      : tenant.company_tenants?.company_name || 'Unknown'

    return NextResponse.json({
      booking: {
        id: booking.id,
        tenant: {
          id: tenant.id,
          name,
          profile_thumb: tenant.profile_thumb
        }
      }
    })
  } catch (error: any) {
    console.error('Error checking booking:', error)
    return NextResponse.json(
      { error: 'Failed to check booking' },
      { status: 500 }
    )
  }
}
