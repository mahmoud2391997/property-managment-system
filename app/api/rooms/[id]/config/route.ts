import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id: roomId } = await params

    // Fetch room with property info
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
        properties: {
          select: {
            id: true,
            code: true
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

    return NextResponse.json({
      roomTitle: room.title,
      propertyCode: room.properties?.code || 'N/A',
      propertyId: room.properties?.id || null
    })
  } catch (error: any) {
    console.error('Error fetching room config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room config' },
      { status: 500 }
    )
  }
}
