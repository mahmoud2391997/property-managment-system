import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'rooms.status'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: roomId } = await params
    const body = await req.json()
    const { status } = body

    // Validate status
    const validStatuses = ['Ready', 'Under_Preparation']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "Ready" or "Under_Preparation"' },
        { status: 400 }
      )
    }

    // Verify room belongs to the organization
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
        status: true
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Update room status
    await prisma.rooms.update({
      where: { id: roomId },
      data: { status }
    })

    return NextResponse.json({
      success: true,
      message: `Room status updated to ${status.replace(/_/g, ' ')}`
    })
  } catch (error) {
    console.error('Error updating room status:', error)
    return NextResponse.json(
      { error: 'Failed to update room status' },
      { status: 500 }
    )
  }
}
