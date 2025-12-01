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

    // Verify room belongs to the organization through its property
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
        property_id: true,
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

    if (!room.property_id) {
      return NextResponse.json(
        { error: 'Room is not associated with a property' },
        { status: 400 }
      )
    }

    // Check if the property (parent) has an active lease (Current or Expired)
    // A property lease means room_id is null
    const propertyLease = await prisma.leases.findFirst({
      where: {
        property_id: room.property_id,
        room_id: null,
        status: {
          in: ['Current', 'Expired']
        }
      },
      select: {
        id: true,
        reference_id: true,
        status: true
      }
    })

    // Check if this room has an active lease (Current or Expired)
    const roomLease = await prisma.leases.findFirst({
      where: {
        room_id: roomId,
        status: {
          in: ['Current', 'Expired']
        }
      },
      select: {
        id: true,
        reference_id: true,
        status: true
      }
    })

    // Determine eligibility
    let canAddLease = true
    let blockedBy: 'property' | 'room' | null = null
    let blockedStatus: 'Current' | 'Expired' | null = null
    let blockedLeaseId: string | null = null
    let message: string | null = null

    if (propertyLease) {
      canAddLease = false
      blockedBy = 'property'
      blockedStatus = propertyLease.status as 'Current' | 'Expired'
      blockedLeaseId = propertyLease.reference_id

      if (propertyLease.status === 'Current') {
        message = `The property "${room.properties?.code}" has an active lease (${propertyLease.reference_id}). You cannot add a lease for this room while the property has an active lease.`
      } else if (propertyLease.status === 'Expired') {
        message = `The property "${room.properties?.code}" has an expired lease (${propertyLease.reference_id}) that needs to be ended before adding a lease for this room or any rooms under it.`
      }
    } else if (roomLease) {
      canAddLease = false
      blockedBy = 'room'
      blockedStatus = roomLease.status as 'Current' | 'Expired'
      blockedLeaseId = roomLease.reference_id

      if (roomLease.status === 'Current') {
        message = `This room already has an active lease (${roomLease.reference_id}). You cannot add another lease while the current one is active.`
      } else if (roomLease.status === 'Expired') {
        message = `This room has an expired lease (${roomLease.reference_id}) that needs to be ended before adding a new lease.`
      }
    }

    return NextResponse.json({
      canAddLease,
      blockedBy,
      blockedStatus,
      blockedLeaseId,
      message,
      room: {
        id: room.id,
        title: room.title,
        propertyId: room.property_id,
        propertyCode: room.properties?.code
      }
    })
  } catch (error: any) {
    console.error('Error checking lease eligibility:', error)
    return NextResponse.json(
      { error: 'Failed to check lease eligibility' },
      { status: 500 }
    )
  }
}
