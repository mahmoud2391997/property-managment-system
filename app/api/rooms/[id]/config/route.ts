import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { computeRoomDisplayStatus } from '@/lib/rooms-utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'rooms.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: roomId } = await params

    // Fetch room with property info, lease status, and images
    const room = await prisma.rooms.findFirst({
      where: {
        id: roomId,
        properties: {
          organization_id: staff.organization_id
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        property_images: {
          select: {
            id: true,
            image_url: true,
            thumb_url: true
          },
          orderBy: { created_at: 'asc' }
        },
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
        },
        properties: {
          select: {
            id: true,
            code: true,
            status: true,
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
            }
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    const displayStatus = computeRoomDisplayStatus(
      room.status,
      room.properties?.status || 'Ready',
      room.leases[0] || null,
      room.properties?.leases[0] || null
    )

    return NextResponse.json({
      roomTitle: room.title,
      propertyCode: room.properties?.code || 'N/A',
      propertyId: room.properties?.id || null,
      status: displayStatus,
      images: room.property_images
    })
  } catch (error: any) {
    console.error('Error fetching room config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room config' },
      { status: 500 }
    )
  }
}
