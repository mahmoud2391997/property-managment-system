'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()
    if (error) return error

    if (!hasPermission(permissions, 'rooms.access'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: roomId } = await params

    // First verify the room belongs to the organization
    const room = await prisma.rooms.findFirst({
      where: {
        id: roomId,
        properties: {
          organization_id: staff.organization_id
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Find the active flow instance for this room
    const flowInstance = await prisma.task_flow_instances.findFirst({
      where: {
        room_id: roomId,
        status: 'In Progress'
      },
      select: {
        inspection_task_id: true
      }
    })

    if (!flowInstance || !flowInstance.inspection_task_id) {
      return NextResponse.json({ inspectionTaskId: null })
    }

    return NextResponse.json({
      inspectionTaskId: flowInstance.inspection_task_id
    })
  } catch (error: any) {
    console.error('Error fetching inspection task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inspection task' },
      { status: 500 }
    )
  }
}
