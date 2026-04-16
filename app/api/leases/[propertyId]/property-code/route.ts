import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { computePropertyDisplayStatus } from '@/lib/properties-utils'

export async function GET (
  req: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'leases.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { propertyId } = await params

    const property = await prisma.properties.findUnique({
      where: { id: propertyId },
      select: {
        code: true,
        status: true,
        owner_id: true,
        owners: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_thumb: true
          }
        },
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

    const assignedOwner = property.owners
      ? {
          id: property.owners.id,
          name: `${property.owners.first_name} ${property.owners.last_name || ''}`.trim(),
          profile_thumb: property.owners.profile_thumb
        }
      : null

    // Check if property has an active contract
    const activeContract = await prisma.contracts.findFirst({
      where: { property_id: propertyId },
      select: { id: true }
    })

    return NextResponse.json({
      property: property.code,
      status: displayStatus,
      images: property.property_images,
      assignedOwner,
      hasActiveContract: !!activeContract
    })
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}
