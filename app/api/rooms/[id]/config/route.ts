import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { computeRoomDisplayStatus } from '@/lib/rooms-utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id: roomId } = await params

    // Fetch room with property info and lease status
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
      status: displayStatus
    })
  } catch (error: any) {
    console.error('Error fetching room config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room config' },
      { status: 500 }
    )
  }
}
