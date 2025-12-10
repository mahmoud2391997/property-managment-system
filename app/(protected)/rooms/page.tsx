import { cn } from '@/lib/utils'
import RoomsSection from '@/components/sections/rooms-section'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { isLeaseActive } from '@/utils/lease-status'

type DisplayStatus = 'Occupied' | 'Vacant' | 'Pending_Inspection' | 'Under_Preparation' | 'Property_Rented' | 'Property_Not_Ready'

// Compute display status for a room
function computeRoomDisplayStatus(
  roomStatus: string,
  propertyStatus: string,
  roomLease: { status: string; start_date: Date; number_of_months: number | null } | null,
  propertyLease: { status: string; start_date: Date; number_of_months: number | null } | null
): DisplayStatus {
  // Priority 1: Property is Pending_Inspection or Under_Preparation
  if (propertyStatus === 'Pending_Inspection' || propertyStatus === 'Under_Preparation') {
    return 'Property_Not_Ready'
  }

  // Priority 2: Property has an active lease (whole-unit rental)
  if (propertyLease && isLeaseActive(propertyLease)) {
    return 'Property_Rented'
  }

  // Priority 3: Room's own status
  if (roomStatus === 'Pending_Inspection') return 'Pending_Inspection'
  if (roomStatus === 'Under_Preparation') return 'Under_Preparation'

  // Room is Ready - check for lease
  if (roomLease && isLeaseActive(roomLease)) {
    return 'Occupied'
  }

  return 'Vacant'
}

async function getRooms() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get staff info to find organization
  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (!staff) {
    return []
  }

  // Get rooms for properties in this organization with leases
  const rooms = await prisma.rooms.findMany({
    where: {
      properties: {
        organization_id: staff.organization_id
      }
    },
    select: {
      id: true,
      title: true,
      status: true,
      properties: {
        select: {
          code: true,
          status: true,
          leases: {
            where: {
              room_id: null,
              status: 'Current'
            },
            select: {
              status: true,
              start_date: true,
              number_of_months: true,
              tenants: {
                select: {
                  individual_tenants: {
                    select: {
                      phone_number: true
                    }
                  }
                }
              }
            },
            orderBy: { created_at: 'desc' },
            take: 1
          }
        }
      },
      leases: {
        where: { status: 'Current' },
        select: {
          status: true,
          start_date: true,
          number_of_months: true,
          tenants: {
            select: {
              individual_tenants: {
                select: {
                  phone_number: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 1
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return rooms.map(room => {
    const roomLease = room.leases[0] || null
    const propertyLease = room.properties?.leases[0] || null
    const propertyStatus = room.properties?.status || 'Ready'
    const displayStatus = computeRoomDisplayStatus(room.status, propertyStatus, roomLease, propertyLease)

    // Get tenant phone number from room lease or property lease
    let tenantPhone: string | null = null
    if (displayStatus === 'Occupied' && roomLease) {
      tenantPhone = roomLease.tenants.individual_tenants?.phone_number || null
    } else if (displayStatus === 'Property_Rented' && propertyLease) {
      tenantPhone = propertyLease.tenants.individual_tenants?.phone_number || null
    }

    return {
      id: room.id,
      title: room.title,
      property: room.properties?.code || 'No Property',
      status: displayStatus,
      tenantPhone
    }
  })
}

const Rooms = async () => {
  const rooms = await getRooms()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Rooms</h1>
      </div>
      <RoomsSection rooms={rooms} />
    </div>
  )
}

export default Rooms
