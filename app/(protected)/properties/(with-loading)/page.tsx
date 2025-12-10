import { cn } from '@/lib/utils'
import PropertiesSection from '@/components/sections/properties-section'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { isLeaseActive } from '@/utils/lease-status'

type DisplayStatus = 'Occupied' | 'Vacant' | 'Pending_Inspection' | 'Under_Preparation'

type StatusCount = {
  status: DisplayStatus
  count: number
  total: number
}

// Compute display status for a room based on its DB status and lease
function computeRoomDisplayStatus(
  roomStatus: string,
  roomLease: { status: string; start_date: Date; number_of_months: number | null } | null
): DisplayStatus {
  // If room is not Ready, return its status
  if (roomStatus === 'Pending_Inspection') return 'Pending_Inspection'
  if (roomStatus === 'Under_Preparation') return 'Under_Preparation'

  // Room is Ready - check for lease
  if (roomLease && isLeaseActive(roomLease)) {
    return 'Occupied'
  }

  return 'Vacant'
}

async function getProperties() {
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

  // Get properties for this organization with rooms and leases
  const properties = await prisma.properties.findMany({
    where: {
      organization_id: staff.organization_id
    },
    select: {
      id: true,
      code: true,
      street_address: true,
      postal_code: true,
      city: true,
      type: true,
      status: true,
      projects: {
        select: {
          title: true,
          state: true
        }
      },
      rooms: {
        select: {
          id: true,
          status: true,
          leases: {
            where: { status: 'Current' },
            select: {
              status: true,
              start_date: true,
              number_of_months: true
            },
            orderBy: { created_at: 'desc' },
            take: 1
          }
        }
      },
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
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return properties.map(property => {
    const hasRooms = property.rooms.length > 0
    const propertyLease = property.leases[0] || null

    let displayStatus: string | StatusCount[]

    // Priority 1: Property is Pending_Inspection or Under_Preparation
    if (property.status === 'Pending_Inspection' || property.status === 'Under_Preparation') {
      displayStatus = property.status
    }
    // Priority 2: Property has active lease (Occupied)
    else if (propertyLease && isLeaseActive(propertyLease)) {
      displayStatus = 'Occupied'
    }
    // Priority 3: Property is Vacant (Ready + no lease)
    else if (hasRooms) {
      // Show aggregated room statuses only if at least one room is not Vacant
      const roomStatuses = property.rooms.map(room => {
        const roomLease = room.leases[0] || null
        return computeRoomDisplayStatus(room.status, roomLease)
      })

      // Check if all rooms are Vacant
      const allVacant = roomStatuses.every(status => status === 'Vacant')

      if (allVacant) {
        displayStatus = 'Vacant'
      } else {
        // Count statuses
        const statusCounts: Record<DisplayStatus, number> = {
          Occupied: 0,
          Vacant: 0,
          Pending_Inspection: 0,
          Under_Preparation: 0
        }

        roomStatuses.forEach(status => {
          statusCounts[status]++
        })

        // Filter out zero counts and build display array
        const total = property.rooms.length
        const statusArray: StatusCount[] = []

        for (const [status, count] of Object.entries(statusCounts)) {
          if (count > 0) {
            statusArray.push({
              status: status as DisplayStatus,
              count,
              total
            })
          }
        }

        displayStatus = statusArray
      }
    } else {
      // No rooms - property is Vacant
      displayStatus = 'Vacant'
    }

    // Get tenant phone from property lease (whole-unit rental)
    const tenantPhone = propertyLease?.tenants?.individual_tenants?.phone_number || null

    return {
      id: property.id,
      code: property.code,
      address: `${property.street_address}, ${property.postal_code}, ${property.city}, ${property.projects?.state || ''}`,
      project: property.projects?.title || null,
      type: property.type,
      status: displayStatus,
      tenantPhone
    }
  })
}

const Properties = async () => {
  const properties = await getProperties()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Properties</h1>
      </div>
      <PropertiesSection properties={properties} />
    </div>
  )
}

export default Properties
