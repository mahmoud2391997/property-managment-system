'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    // Note: propertyId is actually leaseId (following existing pattern in this folder)
    const { propertyId: leaseId } = await params

    // Get the source lease to determine if it's a property or room lease
    const sourceLease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        property_id: true,
        room_id: true,
        status: true
      }
    })

    if (!sourceLease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    if (sourceLease.status !== 'Current') {
      return NextResponse.json(
        { error: 'Only current leases can be transferred' },
        { status: 400 }
      )
    }

    const isPropertyLease = sourceLease.room_id === null

    if (isPropertyLease) {
      // Property → Property transfer
      // Property must be:
      // 1. Status = Ready (vacant state)
      // 2. No active property-level lease
      // 3. ALL rooms under this property must also be Ready (vacant) with no active leases
      const availableProperties = await prisma.properties.findMany({
        where: {
          organization_id: staff.organization_id,
          id: { not: sourceLease.property_id }, // Exclude current property
          status: 'Ready',
          // No active property-level lease
          leases: {
            none: {
              room_id: null,
              status: 'Current'
            }
          },
          // All rooms must be Ready (vacant) - no rooms that are NOT Ready
          rooms: {
            none: {
              OR: [
                { status: { not: 'Ready' } }, // Room not in Ready status
                {
                  leases: {
                    some: { status: 'Current' } // Room has active lease
                  }
                }
              ]
            }
          }
        },
        select: {
          id: true,
          code: true
        },
        orderBy: {
          code: 'asc'
        }
      })

      return NextResponse.json({
        lease_type: 'property',
        destinations: availableProperties.map(property => ({
          id: property.id,
          label: property.code
        }))
      })
    } else {
      // Room → Room transfer
      // Room must be:
      // 1. Status = Ready (vacant)
      // 2. No active room lease
      // 3. Parent property status = Ready (vacant)
      // 4. Parent property has no active property-level lease
      const availableRooms = await prisma.rooms.findMany({
        where: {
          id: { not: sourceLease.room_id! }, // Exclude current room
          status: 'Ready', // Room must be vacant
          // No active room lease
          leases: {
            none: {
              status: 'Current'
            }
          },
          // Property must be vacant too
          properties: {
            organization_id: staff.organization_id,
            status: 'Ready', // Property must be vacant
            // No active property-level lease
            leases: {
              none: {
                room_id: null,
                status: 'Current'
              }
            }
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
        },
        orderBy: [{ properties: { code: 'asc' } }, { title: 'asc' }]
      })

      return NextResponse.json({
        lease_type: 'room',
        destinations: availableRooms
          .filter(room => room.properties !== null)
          .map(room => ({
            id: room.id,
            label: room.title,
            subtitle: room.properties!.code,
            property_id: room.properties!.id
          }))
      })
    }
  } catch (error) {
    console.error('Error fetching transfer destinations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfer destinations' },
      { status: 500 }
    )
  }
}
