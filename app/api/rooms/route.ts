import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { isLeaseActive } from '@/utils/lease-status'
import { transformRoom } from '@/lib/rooms-utils'

type DisplayStatus = 'Occupied' | 'Vacant' | 'Pending_Inspection' | 'Under_Preparation' | 'Property_Rented' | 'Property_Not_Ready'

// Compute display status for a room (kept for legacy propertyId mode)
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

export async function GET(request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    // Pagination and search params
    const paginate = searchParams.get('paginate') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')?.trim() || ''

    // Filter params
    const statusFilter = searchParams.get('status') || 'all'
    const titleFilter = searchParams.get('title')?.trim() || ''
    const propertyFilter = searchParams.get('property')?.trim() || ''
    const projectFilter = searchParams.get('project')?.trim() || ''

    // Check if we need frontend filtering (for computed status)
    const needsFrontendFiltering = statusFilter !== 'all'

    // If paginate mode is enabled, return all rooms with pagination
    if (paginate) {
      // Build where clause with search and DB-level filters
      const whereClause: any = {
        properties: {
          organization_id: staff.organization_id
        },
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { properties: { code: { contains: search, mode: 'insensitive' } } },
            { properties: { projects: { title: { contains: search, mode: 'insensitive' } } } }
          ]
        }),
        // DB-level filters for direct fields
        ...(titleFilter && {
          title: { contains: titleFilter, mode: 'insensitive' }
        }),
        ...(propertyFilter && {
          properties: {
            organization_id: staff.organization_id,
            code: { contains: propertyFilter, mode: 'insensitive' }
          }
        }),
        ...(projectFilter && {
          properties: {
            organization_id: staff.organization_id,
            projects: { title: { contains: projectFilter, mode: 'insensitive' } }
          }
        })
      }

      const roomSelect = {
        id: true,
        title: true,
        status: true,
        wifi: true,
        cleaning_service: true,
        toilet: true,
        balcony: true,
        ac: true,
        queen_bed: true,
        female: true,
        properties: {
          select: {
            id: true,
            code: true,
            status: true,
            projects: {
              select: {
                title: true
              }
            },
            leases: {
              where: {
                room_id: null,
                status: 'Current' as const
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
              orderBy: { created_at: 'desc' as const },
              take: 1
            }
          }
        },
        leases: {
          where: { status: 'Current' as const },
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
          orderBy: { created_at: 'desc' as const },
          take: 1
        }
      }

      // If we need frontend filtering, fetch all and filter after transform
      if (needsFrontendFiltering) {
        const allRooms = await prisma.rooms.findMany({
          where: whereClause,
          select: roomSelect,
          orderBy: { created_at: 'desc' }
        })

        // Transform all rooms
        let transformedRooms = allRooms.map(transformRoom)

        // Apply frontend filters (computed status)
        if (statusFilter !== 'all') {
          transformedRooms = transformedRooms.filter(room => room.status === statusFilter)
        }

        // Get total after filtering
        const total = transformedRooms.length

        // Apply pagination
        const paginatedRooms = transformedRooms.slice((page - 1) * limit, page * limit)

        return NextResponse.json({
          success: true,
          data: paginatedRooms,
          total,
          page,
          pageSize: limit
        })
      }

      // No frontend filtering needed - use DB pagination
      const [rooms, total] = await Promise.all([
        prisma.rooms.findMany({
          where: whereClause,
          select: roomSelect,
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.rooms.count({ where: whereClause })
      ])

      // Transform rooms for display
      const transformedRooms = rooms.map(transformRoom)

      return NextResponse.json({
        success: true,
        data: transformedRooms,
        total,
        page,
        pageSize: limit
      })
    }

    // Legacy mode: requires propertyId
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Verify property belongs to the organization and get property lease
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
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
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    const propertyLease = property.leases[0] || null

    // Fetch rooms for this property with their leases
    const rooms = await prisma.rooms.findMany({
      where: {
        property_id: propertyId
      },
      select: {
        id: true,
        title: true,
        status: true,
        created_at: true,
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

    return NextResponse.json({
      rooms: rooms.map(room => {
        const roomLease = room.leases[0] || null
        const displayStatus = computeRoomDisplayStatus(room.status, property.status, roomLease, propertyLease)

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
          property: property.code,
          status: displayStatus,
          tenantPhone
        }
      })
    })
  } catch (error: any) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      // Room details
      title,
      property_id,
      is_ready,
      // Features
      features,
      // Optional default payment details
      initial_charges,
      monthly_rent,
      payment_day,
      late_payment_charges,
      // Optional reminder details
      reminders
    } = body

    // Validate required fields
    if (!title || !property_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if room title already exists for this property
    const existingRoom = await prisma.rooms.findFirst({
      where: {
        title,
        property_id
      },
      select: {
        id: true,
        properties: {
          select: { code: true }
        }
      }
    })

    if (existingRoom) {
      const propertyCode = existingRoom.properties?.code || 'this property'
      return NextResponse.json(
        { error: `A room with title "${title}" already exists in property ${propertyCode}` },
        { status: 400 }
      )
    }

    // Create room with all related data in a transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Create the room first
      const newRoom = await tx.rooms.create({
        data: {
          title,
          property_id,
          status: is_ready ? 'Ready' : 'Pending_Inspection',
          wifi: features?.wifi || false,
          cleaning_service: features?.cleaning_service || false,
          toilet: features?.toilet || false,
          balcony: features?.balcony || false,
          ac: features?.ac || false,
          queen_bed: features?.queen_bed || false,
          female: features?.female || false,
          created_by: user.id
        }
      })

      // 2. Create initial charges if provided (depends on room)
      if (
        initial_charges &&
        Array.isArray(initial_charges) &&
        initial_charges.length > 0
      ) {
        await tx.property_default_initial_charges.createMany({
          data: initial_charges.map(
            (charge: {
              charge_type: any
              amount: number
              is_taxed: boolean
              is_refundable: boolean
            }) => ({
              room_id: newRoom.id,
              charge_type: charge.charge_type as any,
              amount: charge.amount,
              is_taxed: charge.is_taxed || false,
              is_refundable: charge.is_refundable || false,
              created_by: user.id
            })
          )
        })
      }

      // 3. Create late payment charges if provided (depends on room)
      if (
        late_payment_charges &&
        Array.isArray(late_payment_charges) &&
        late_payment_charges.length > 0
      ) {
        await tx.late_payment_charges.createMany({
          data: late_payment_charges.map(
            (charge: { days_after_due: number; amount: number }) => ({
              room_id: newRoom.id,
              days_after_due: charge.days_after_due,
              amount: charge.amount,
              created_by: user.id
            })
          )
        })
      }

      // 4. Create default lease config if reminders or monthly rent provided (depends on room)
      if (
        reminders ||
        monthly_rent !== undefined ||
        payment_day !== undefined
      ) {
        await tx.property_default_lease_config.create({
          data: {
            room_id: newRoom.id,
            default_monthly_rent: monthly_rent || null,
            default_payment_day: payment_day || null,
            is_expiry_reminder: reminders?.is_expiry_reminder || false,
            expiry_days_before_reminder:
              reminders?.expiry_days_before_reminder || null,
            is_rent_reminder: reminders?.is_rent_reminder || false,
            rent_reminder_days_before:
              reminders?.rent_reminder_days_before || null,
            is_overdue_rent_reminder:
              reminders?.is_overdue_rent_reminder || false,
            overdue_days_after_reminder:
              reminders?.overdue_days_after_reminder || null,
            created_by: user.id
          }
        })
      }

      return { room: newRoom }
    })

    return NextResponse.json(
      {
        success: true,
        room: result.room
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
