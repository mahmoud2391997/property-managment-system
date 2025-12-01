import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id: propertyId } = await params

    // Verify property belongs to the organization
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        code: true
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check if property already has an active lease (Current or Expired)
    const propertyLease = await prisma.leases.findFirst({
      where: {
        property_id: propertyId,
        room_id: null, // Property-level lease (not room lease)
        status: {
          in: ['Current', 'Expired']
        }
      },
      select: {
        id: true,
        status: true,
        reference_id: true
      }
    })

    if (propertyLease) {
      const message =
        propertyLease.status === 'Current'
          ? `Property already has an active lease (${propertyLease.reference_id})`
          : `Property has an expired lease (${propertyLease.reference_id}) that needs to be ended first`

      return NextResponse.json({
        canAddLease: false,
        blockedBy: 'property',
        blockedStatus: propertyLease.status,
        blockedLeaseId: propertyLease.reference_id,
        message,
        property: {
          id: property.id,
          code: property.code
        }
      })
    }

    // Check if any rooms under this property have active leases (Current or Expired)
    const roomLeases = await prisma.leases.findMany({
      where: {
        property_id: propertyId,
        room_id: { not: null }, // Room-level lease
        status: {
          in: ['Current', 'Expired']
        }
      },
      select: {
        id: true,
        status: true
      }
    })

    if (roomLeases.length > 0) {
      // Check if any are expired (takes priority for warning message)
      const hasExpired = roomLeases.some(lease => lease.status === 'Expired')
      const roomCount = roomLeases.length
      const roomText = roomCount === 1 ? 'a room' : `${roomCount} rooms`

      const message = hasExpired
        ? `Cannot add property lease: ${roomText} under this property has a lease that needs to be ended first`
        : `Cannot add property lease: ${roomText} under this property has an active lease`

      return NextResponse.json({
        canAddLease: false,
        blockedBy: 'room',
        blockedStatus: hasExpired ? 'Expired' : 'Current',
        blockedLeaseId: null,
        roomCount,
        message,
        property: {
          id: property.id,
          code: property.code
        }
      })
    }

    // No blocking leases found
    return NextResponse.json({
      canAddLease: true,
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
