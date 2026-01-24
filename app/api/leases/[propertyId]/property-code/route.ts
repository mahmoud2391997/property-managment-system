import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { computePropertyDisplayStatus } from '@/lib/properties-utils'

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
      select: {
        code: true,
        status: true,
        property_images: {
          where: { room_id: null },
          select: {
            id: true,
            image_url: true,
            thumb_url: true
          },
          orderBy: { created_at: 'asc' }
        },
        leases: {
          where: {
            status: 'Current',
            room_id: null
          },
          select: {
            status: true,
            start_date: true,
            number_of_months: true
          },
          take: 1
        },
        rooms: {
          select: {
            status: true,
            leases: {
              where: {
                status: 'Current'
              },
              select: {
                status: true,
                start_date: true,
                number_of_months: true
              },
              take: 1
            }
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const displayStatus = computePropertyDisplayStatus(
      property.status,
      property.leases[0] || null,
      property.rooms
    )

    return NextResponse.json({
      property: property.code,
      status: displayStatus,
      images: property.property_images
    })
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}
