import { isLeaseActive } from '@/utils/lease-status'

type DisplayStatus = 'Occupied' | 'Vacant' | 'Pending_Inspection' | 'Under_Preparation'

type StatusCount = {
  status: DisplayStatus
  count: number
  total: number
}

type RoomWithLease = {
  id: string
  status: string
  leases: {
    status: string
    start_date: Date
    number_of_months: number | null
  }[]
}

type PropertyLease = {
  status: string
  start_date: Date
  number_of_months: number | null
  tenants?: {
    individual_tenants?: {
      phone_number: string | null
    } | null
  } | null
}

type PropertyFeatures = {
  wifi?: boolean
  cleaning_service?: boolean
  water_heater?: boolean
  female?: boolean
}

type RawProperty = {
  id: string
  code: string
  street_address: string
  postal_code: string
  city: string
  type: string
  status: string
  wifi?: boolean | null
  cleaning_service?: boolean | null
  water_heater?: boolean | null
  female?: boolean | null
  projects: {
    title: string
    state: string | null
  } | null
  rooms: RoomWithLease[]
  leases: PropertyLease[]
  bookings?: { id: string }[]
}

export type PropertyWithDetails = {
  id: string
  code: string
  address: string
  project: string | null
  type: string
  status: string | StatusCount[]
  isBooked: boolean
  tenantPhone?: string | null
  features?: PropertyFeatures
}

// Compute simple display status for property (for header dropdown menus)
// Returns a simple string status: 'Vacant', 'Occupied', 'Pending_Inspection', 'Under_Preparation'
export function computePropertyDisplayStatus(
  propertyStatus: string,
  propertyLease: { status: string; start_date: Date; number_of_months: number | null } | null,
  rooms: { status: string; leases: { status: string; start_date: Date; number_of_months: number | null }[] }[]
): DisplayStatus {
  // Priority 1: Property is Pending_Inspection or Under_Preparation
  if (propertyStatus === 'Pending_Inspection' || propertyStatus === 'Under_Preparation') {
    return propertyStatus as DisplayStatus
  }

  // Priority 2: Property has active lease (Occupied)
  if (propertyLease && isLeaseActive(propertyLease)) {
    return 'Occupied'
  }

  // Priority 3: Check if any room has an active lease
  const hasRoomWithActiveLease = rooms.some(room => {
    const roomLease = room.leases[0] || null
    return roomLease && isLeaseActive(roomLease)
  })

  if (hasRoomWithActiveLease) {
    return 'Occupied'
  }

  // Priority 4: Property is Vacant (Ready + no lease + no room leases)
  return 'Vacant'
}

// Compute display status for a room based on its DB status and lease
export function computeRoomDisplayStatus(
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

// Transform raw property from database to display format
export function transformProperty(property: RawProperty): PropertyWithDetails {
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

  // Check if property has any current booking
  const isBooked = (property.bookings?.length ?? 0) > 0

  return {
    id: property.id,
    code: property.code,
    address: `${property.street_address}, ${property.postal_code}, ${property.city}, ${property.projects?.state || ''}`,
    project: property.projects?.title || null,
    type: property.type,
    status: displayStatus,
    isBooked,
    tenantPhone,
    features: {
      wifi: property.wifi || false,
      cleaning_service: property.cleaning_service || false,
      water_heater: property.water_heater || false,
      female: property.female || false
    }
  }
}
