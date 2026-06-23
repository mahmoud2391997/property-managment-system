import { NextRequest, NextResponse } from 'next/server'
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'properties.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: propertyId } = await params

    // Verify property belongs to the organization and get status
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        code: true,
        status: true,
        rooms: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check if property status is Pending_Inspection or Under_Preparation
    if (property.status === 'Pending_Inspection' || property.status === 'Under_Preparation') {
      const statusDisplay = property.status.replace(/_/g, ' ')
      return NextResponse.json({
        canAddLease: false,
        canScheduleLease: false,
        blockedBy: 'status',
        blockedStatus: property.status,
        blockedLeaseId: null,
        message: `Property is currently "${statusDisplay}". Please mark it as ready before adding a lease.`,
        property: {
          id: property.id,
          code: property.code
        }
      })
    }

    // Check if any rooms under this property have Pending_Inspection or Under_Preparation status
    const roomsNotReady = property.rooms.filter(
      room => room.status === 'Pending_Inspection' || room.status === 'Under_Preparation'
    )

    if (roomsNotReady.length > 0) {
      const roomCount = roomsNotReady.length
      const roomText = roomCount === 1 ? 'a room' : `${roomCount} rooms`
      const roomNames = roomsNotReady.map(r => r.title).join(', ')

      return NextResponse.json({
        canAddLease: false,
        canScheduleLease: false,
        blockedBy: 'room_status',
        blockedStatus: roomsNotReady[0].status,
        blockedLeaseId: null,
        roomCount,
        message: `Cannot add property lease: ${roomText} (${roomNames}) needs to be marked as ready first.`,
        property: {
          id: property.id,
          code: property.code
        }
      })
    }

    // Check for active property-level leases (status = 'Current' in DB, excluding 'Ended')
    const propertyLeases = await prisma.leases.findMany({
      where: {
        property_id: propertyId,
        room_id: null,
        status: 'Current' // DB status
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

    // Find the blocking lease (Current or Expired, not Scheduled)
    const blockingPropertyLease = propertyLeases.find(lease => {
      const computedStatus = computeLeaseStatus(lease)
      return computedStatus === 'Current' || computedStatus === 'Expired'
    })

    if (blockingPropertyLease) {
      const computedStatus = computeLeaseStatus(blockingPropertyLease)
      const hasEndDate = hasLeaseEndDate(blockingPropertyLease)

      if (!hasEndDate) {
        // No end date - cannot add any new lease
        return NextResponse.json({
          canAddLease: false,
          canScheduleLease: false,
          blockedBy: 'property',
          blockedStatus: computedStatus,
          blockedLeaseId: blockingPropertyLease.reference_id,
          message: `Property has an active lease (${blockingPropertyLease.reference_id}) with no end date. You cannot add a new lease until this lease is ended.`,
          property: {
            id: property.id,
            code: property.code
          }
        })
      } else {
        // Has end date - can schedule a future lease
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
          message: `Property has an active lease (${blockingPropertyLease.reference_id}) ending on ${formatLeaseDate(endDate!)}. You can schedule a new lease starting from ${formatLeaseDate(earliestStart!)}.`,
          property: {
            id: property.id,
            code: property.code
          }
        })
      }
    }

    // Check if any rooms under this property have active leases
    const roomLeases = await prisma.leases.findMany({
      where: {
        property_id: propertyId,
        room_id: { not: null },
        status: 'Current'
      },
      select: {
        id: true,
        reference_id: true,
        start_date: true,
        number_of_months: true,
        status: true
      }
    })

    // Find blocking room leases (Current or Expired)
    const blockingRoomLeases = roomLeases.filter(lease => {
      const computedStatus = computeLeaseStatus(lease)
      return computedStatus === 'Current' || computedStatus === 'Expired'
    })

    if (blockingRoomLeases.length > 0) {
      // Check if any room lease has no end date
      const leaseWithNoEndDate = blockingRoomLeases.find(
        lease => !hasLeaseEndDate(lease)
      )

      if (leaseWithNoEndDate) {
        const roomCount = blockingRoomLeases.length
        const roomText = roomCount === 1 ? 'a room' : `${roomCount} rooms`

        return NextResponse.json({
          canAddLease: false,
          canScheduleLease: false,
          blockedBy: 'room',
          blockedStatus: 'Current',
          blockedLeaseId: null,
          roomCount,
          message: `Cannot add property lease: ${roomText} under this property has an active lease with no end date. End the room lease(s) first.`,
          property: {
            id: property.id,
            code: property.code
          }
        })
      }

      // All room leases have end dates - find the latest one
      const latestEndDate = blockingRoomLeases.reduce((latest, lease) => {
        const endDate = calculateLeaseEndDate(
          lease.start_date,
          lease.number_of_months
        )
        if (!endDate) return latest
        if (!latest || endDate > latest) return endDate
        return latest
      }, null as Date | null)

      const earliestStart = latestEndDate
        ? new Date(latestEndDate.getTime() + 24 * 60 * 60 * 1000)
        : null

      const roomCount = blockingRoomLeases.length
      const roomText = roomCount === 1 ? 'a room' : `${roomCount} rooms`

      return NextResponse.json({
        canAddLease: true,
        canScheduleLease: true,
        blockedBy: 'room',
        blockedStatus: 'Current',
        blockedLeaseId: null,
        roomCount,
        existingLeaseEndDate: latestEndDate?.toISOString(),
        earliestNewLeaseStart: earliestStart?.toISOString(),
        message: `${roomText} under this property has active leases. The last one ends on ${formatLeaseDate(latestEndDate!)}. You can schedule a property lease starting from ${formatLeaseDate(earliestStart!)}.`,
        property: {
          id: property.id,
          code: property.code
        }
      })
    }

    // No blocking leases found
    return NextResponse.json({
      canAddLease: true,
      canScheduleLease: false,
      blockedBy: null,
      blockedStatus: null,
      blockedLeaseId: null,
      message: null,
      property: {
        id: property.id,
        code: property.code
      }
    })
  } catch (error) {
    console.error('Error checking property lease eligibility:', error)
    return NextResponse.json(
      { error: 'Failed to check lease eligibility' },
      { status: 500 }
    )
  }
}
