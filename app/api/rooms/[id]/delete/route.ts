'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

/**
 * Delete a room - Staff only
 * Only allowed if room has no leases at all
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()
    if (error) return error
    if (!hasPermission(permissions, 'rooms.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: roomId } = await params

    // Find the room and verify it belongs to a property in staff's organization
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
        _count: {
          select: {
            leases: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or access denied' },
        { status: 404 }
      )
    }

    // Check if room has any leases
    if (room._count.leases > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete room with leases',
          has_leases: true,
          message: 'This room has leases associated with it. Rooms with lease history cannot be deleted.'
        },
        { status: 400 }
      )
    }

    // Delete the room (cascade will handle related records)
    await prisma.rooms.delete({
      where: { id: room.id }
    })

    console.log(`Room deleted: ${room.title} by staff ${staff.id}`)

    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting room:', error)
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    )
  }
}
