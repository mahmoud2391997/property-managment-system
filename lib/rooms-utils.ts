import { isLeaseActive } from '@/utils/lease-status'

type DisplayStatus = 'Occupied' | 'Vacant' | 'Pending_Inspection' | 'Under_Preparation' | 'Property_Rented' | 'Property_Not_Ready'

type RoomLease = {
  status: string
  start_date: Date
  number_of_months: number | null
  tenants?: {
    individual_tenants?: {
      phone_number: string | null
    } | null
  } | null
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

type RoomFeatures = {
  wifi?: boolean
  cleaning_service?: boolean
  toilet?: boolean
  balcony?: boolean
  ac?: boolean
  queen_bed?: boolean
  female?: boolean
}

type RawRoom = {
  id: string
  title: string
  status: string
  wifi?: boolean | null
  cleaning_service?: boolean | null
  toilet?: boolean | null
  balcony?: boolean | null
  ac?: boolean | null
  queen_bed?: boolean | null
  female?: boolean | null
  properties: {
    id: string
    code: string
    status: string
    projects?: {
      title: string
    } | null
    leases: PropertyLease[]
  } | null
  leases: RoomLease[]
}

export type RoomWithDetails = {
  id: string
  title: string
  propertyId: string | null
  property: string
  project: string | null
  status: DisplayStatus
  tenantPhone?: string | null
  features?: RoomFeatures
}

// Compute display status for a room
export function computeRoomDisplayStatus(
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

// Transform raw room from database to display format
export function transformRoom(room: RawRoom): RoomWithDetails {
  const roomLease = room.leases[0] || null
  const propertyLease = room.properties?.leases[0] || null
  const propertyStatus = room.properties?.status || 'Ready'
  const displayStatus = computeRoomDisplayStatus(room.status, propertyStatus, roomLease, propertyLease)

  // Get tenant phone number from room lease or property lease
  let tenantPhone: string | null = null
  if (displayStatus === 'Occupied' && roomLease) {
    tenantPhone = roomLease.tenants?.individual_tenants?.phone_number || null
  } else if (displayStatus === 'Property_Rented' && propertyLease) {
    tenantPhone = propertyLease.tenants?.individual_tenants?.phone_number || null
  }

  return {
    id: room.id,
    title: room.title,
    propertyId: room.properties?.id || null,
    property: room.properties?.code || 'No Property',
    project: room.properties?.projects?.title || null,
    status: displayStatus,
    tenantPhone,
    features: {
      wifi: room.wifi || false,
      cleaning_service: room.cleaning_service || false,
      toilet: room.toilet || false,
      balcony: room.balcony || false,
      ac: room.ac || false,
      queen_bed: room.queen_bed || false,
      female: room.female || false
    }
  }
}
