import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import {
  computeLeaseStatus,
  hasLeaseEndDate,
  getEarliestNewLeaseStartDate,
  formatLeaseDate,
  calculateLeaseEndDate
} from '@/utils/lease-status'

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
        status: true,
        property_id: true,
        properties: {
          select: {
            id: true,
            code: true,
            status: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!room.property_id) {
      return NextResponse.json(
        { error: 'Room is not associated with a property' },
        { status: 400 }
      )
    }

    // Check if room status is Pending_Inspection or Under_Preparation
    if (room.status === 'Pending_Inspection' || room.status === 'Under_Preparation') {
      const statusDisplay = room.status.replace(/_/g, ' ')
      return NextResponse.json({
        canAddLease: false,
        canScheduleLease: false,
        blockedBy: 'status',
        blockedStatus: room.status,
        blockedLeaseId: null,
        message: `Room is currently "${statusDisplay}". Please mark it as ready before adding a lease.`,
        room: {
          id: room.id,
          title: room.title,
          propertyId: room.property_id,
          propertyCode: room.properties?.code
        }
      })
    }

    // Check if parent property status is Pending_Inspection or Under_Preparation
    if (room.properties?.status === 'Pending_Inspection' || room.properties?.status === 'Under_Preparation') {
      const statusDisplay = room.properties.status.replace(/_/g, ' ')
      return NextResponse.json({
        canAddLease: false,
        canScheduleLease: false,
        blockedBy: 'property_status',
        blockedStatus: room.properties.status,
        blockedLeaseId: null,
        message: `The property "${room.properties.code}" is currently "${statusDisplay}". Please mark it as ready before adding a room lease.`,
        room: {
          id: room.id,
          title: room.title,
          propertyId: room.property_id,
          propertyCode: room.properties?.code
        }
      })
    }

    // Check if the property (parent) has an active lease
    const propertyLeases = await prisma.leases.findMany({
      where: {
        property_id: room.property_id,
        room_id: null,
        status: 'Current'
      },
      select: {
        id: true,
        reference_id: true,
        start_date: true,
        number_of_months: true,
        status: true
      },
      orderBy: {
        start_date: 'desc'
      }
    })

    // Find blocking property lease (Current or Expired)
    const blockingPropertyLease = propertyLeases.find(lease => {
      const computedStatus = computeLeaseStatus(lease)
      return computedStatus === 'Current' || computedStatus === 'Expired'
    })

    if (blockingPropertyLease) {
      const computedStatus = computeLeaseStatus(blockingPropertyLease)
      const hasEndDate = hasLeaseEndDate(blockingPropertyLease)

      if (!hasEndDate) {
        return NextResponse.json({
          canAddLease: false,
          canScheduleLease: false,
          blockedBy: 'property',
          blockedStatus: computedStatus,
          blockedLeaseId: blockingPropertyLease.reference_id,
          message: `The property "${room.properties?.code}" has an active lease (${blockingPropertyLease.reference_id}) with no end date. You cannot add a room lease until the property lease is ended.`,
          room: {
            id: room.id,
            title: room.title,
            propertyId: room.property_id,
            propertyCode: room.properties?.code
          }
        })
      } else {
        const earliestStart = getEarliestNewLeaseStartDate(blockingPropertyLease)
        const endDate = calculateLeaseEndDate(
          blockingPropertyLease.start_date,
          blockingPropertyLease.number_of_months
        )

        return NextResponse.json({
          canAddLease: true,
          canScheduleLease: true,
          blockedBy: 'property',
          blockedStatus: computedStatus,
          blockedLeaseId: blockingPropertyLease.reference_id,
          existingLeaseEndDate: endDate?.toISOString(),
          earliestNewLeaseStart: earliestStart?.toISOString(),
          message: `The property "${room.properties?.code}" has an active lease (${blockingPropertyLease.reference_id}) ending on ${formatLeaseDate(endDate!)}. You can schedule a room lease starting from ${formatLeaseDate(earliestStart!)}.`,
          room: {
            id: room.id,
            title: room.title,
            propertyId: room.property_id,
            propertyCode: room.properties?.code
          }
        })
      }
    }

    // Check if this room has an active lease
    const roomLeases = await prisma.leases.findMany({
      where: {
        room_id: roomId,
        status: 'Current'
      },
      select: {
        id: true,
        reference_id: true,
        start_date: true,
        number_of_months: true,
        status: true
      },
      orderBy: {
        start_date: 'desc'
      }
    })

    // Find blocking room lease (Current or Expired)
    const blockingRoomLease = roomLeases.find(lease => {
      const computedStatus = computeLeaseStatus(lease)
      return computedStatus === 'Current' || computedStatus === 'Expired'
    })

    if (blockingRoomLease) {
      const computedStatus = computeLeaseStatus(blockingRoomLease)
      const hasEndDate = hasLeaseEndDate(blockingRoomLease)

      if (!hasEndDate) {
        return NextResponse.json({
          canAddLease: false,
          canScheduleLease: false,
          blockedBy: 'room',
          blockedStatus: computedStatus,
          blockedLeaseId: blockingRoomLease.reference_id,
          message: `This room has an active lease (${blockingRoomLease.reference_id}) with no end date. You cannot add a new lease until this lease is ended.`,
          room: {
            id: room.id,
            title: room.title,
            propertyId: room.property_id,
            propertyCode: room.properties?.code
          }
        })
      } else {
        const earliestStart = getEarliestNewLeaseStartDate(blockingRoomLease)
        const endDate = calculateLeaseEndDate(
          blockingRoomLease.start_date,
          blockingRoomLease.number_of_months
        )

        return NextResponse.json({
          canAddLease: true,
          canScheduleLease: true,
          blockedBy: 'room',
          blockedStatus: computedStatus,
          blockedLeaseId: blockingRoomLease.reference_id,
          existingLeaseEndDate: endDate?.toISOString(),
          earliestNewLeaseStart: earliestStart?.toISOString(),
          message: `This room has an active lease (${blockingRoomLease.reference_id}) ending on ${formatLeaseDate(endDate!)}. You can schedule a new lease starting from ${formatLeaseDate(earliestStart!)}.`,
          room: {
            id: room.id,
            title: room.title,
            propertyId: room.property_id,
            propertyCode: room.properties?.code
          }
        })
      }
    }

    // No blocking leases found
    return NextResponse.json({
      canAddLease: true,
      canScheduleLease: false,
      blockedBy: null,
      blockedStatus: null,
      blockedLeaseId: null,
      message: null,
      room: {
        id: room.id,
        title: room.title,
        propertyId: room.property_id,
        propertyCode: room.properties?.code
      }
    })
  } catch (error) {
    console.error('Error checking lease eligibility:', error)
    return NextResponse.json(
      { error: 'Failed to check lease eligibility' },
      { status: 500 }
    )
  }
}
