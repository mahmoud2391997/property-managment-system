'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { transformProperty } from '@/lib/properties-utils'

export async function GET (req: Request) {
  if (process.env.NODE_ENV === 'development') {
    const { devProperties } = await import('@/lib/dev-data')
    const url = new URL(req.url)
    const paginate = url.searchParams.get('paginate') === 'true'
    if (paginate) {
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '10')
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const data = devProperties.slice(startIndex, endIndex)
      return NextResponse.json({ success: true, data, total: devProperties.length, page, pageSize: limit })
    }
    return NextResponse.json(devProperties)
  }
  try {
    const { user, staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'properties.access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get staff info to get organization_id
    const staffInfo = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staffInfo) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const fieldsParam = searchParams.get('fields')
    const includeProject = searchParams.get('includeProject') === 'true'

    // Pagination and search params
    const paginate = searchParams.get('paginate') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')?.trim() || ''

    // Filter params
    const statusFilter = searchParams.get('status')?.trim() || ''
    const codeFilter = searchParams.get('code')?.trim() || ''
    const typeFilter = searchParams.get('type')?.trim() || ''
    const projectFilter = searchParams.get('project')?.trim() || ''
    const stateFilter = searchParams.get('state')?.trim() || ''

    // If paginate mode is enabled, use new pagination/search logic
    if (paginate) {
      // Build where clause with search
      const whereClause: any = {
        organization_id: staffInfo.organization_id
      }

      // Add search conditions
      if (search) {
        whereClause.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { street_address: { contains: search, mode: 'insensitive' } },
          { projects: { title: { contains: search, mode: 'insensitive' } } }
        ]
      }

      // DB-level filters
      if (codeFilter) {
        whereClause.code = { contains: codeFilter, mode: 'insensitive' }
      }
      if (typeFilter) {
        whereClause.type = typeFilter
      }
      if (projectFilter) {
        whereClause.projects = { title: { contains: projectFilter, mode: 'insensitive' } }
      }
      if (stateFilter) {
        whereClause.projects = {
          ...whereClause.projects,
          state: { contains: stateFilter, mode: 'insensitive' }
        }
      }

      // DB-level status filters (Pending_Inspection, Under_Preparation)
      if (statusFilter === 'Pending_Inspection' || statusFilter === 'Under_Preparation') {
        whereClause.status = statusFilter
      }

      // Check if we need frontend filtering (for computed statuses)
      const needsFrontendFiltering = statusFilter === 'Occupied' || statusFilter === 'Vacant'

      // Fetch properties and total count in parallel
      const [properties, totalBeforeFilter] = await Promise.all([
        prisma.properties.findMany({
          where: whereClause,
          select: {
            id: true,
            code: true,
            street_address: true,
            postal_code: true,
            city: true,
            type: true,
            status: true,
            wifi: true,
            cleaning_service: true,
            water_heater: true,
            female: true,
            dryer: true,
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
            },
            bookings: {
              where: { status: 'Current' },
              select: { id: true },
              take: 1
            }
          },
          orderBy: { created_at: 'desc' },
          // Only paginate if NOT filtering by computed status
          ...(needsFrontendFiltering ? {} : {
            skip: (page - 1) * limit,
            take: limit
          })
        }),
        prisma.properties.count({ where: whereClause })
      ])

      // Transform properties for display
      let transformedProperties = properties.map(transformProperty)

      // Apply frontend filtering for computed statuses (Occupied, Vacant)
      if (needsFrontendFiltering) {
        transformedProperties = transformedProperties.filter(property => {
          // Get the primary status (handle both string and array status)
          const primaryStatus = Array.isArray(property.status)
            ? (property.status.some(s => s.status === 'Occupied') ? 'Occupied' : 'Vacant')
            : property.status

          return primaryStatus === statusFilter
        })

        // Apply pagination after filtering
        const startIndex = (page - 1) * limit
        const paginatedProperties = transformedProperties.slice(startIndex, startIndex + limit)

        return NextResponse.json({
          success: true,
          data: paginatedProperties,
          total: transformedProperties.length,
          page,
          pageSize: limit
        })
      }

      return NextResponse.json({
        success: true,
        data: transformedProperties,
        total: totalBeforeFilter,
        page,
        pageSize: limit
      })
    }

    // Legacy mode: return all properties (backward compatibility)
    const vacant = searchParams.get('vacant') === 'true'

    let properties
    if (fieldsParam) {
      // When selecting specific fields, use select with projects included
      const fields = fieldsParam.split(',')
      const selectFields: any = {}
      fields.forEach(field => {
        selectFields[field.trim()] = true
      })

      // If includeProject is true, add projects to select
      if (includeProject) {
        selectFields.projects = {
          select: {
            id: true,
            title: true
          }
        }
      }

      const whereClauseLegacy: any = {
        organization_id: staffInfo.organization_id
      }

      // Filter to only vacant properties (no Current property-level lease and no Current booking)
      if (vacant) {
        whereClauseLegacy.AND = [
          {
            NOT: {
              leases: {
                some: {
                  status: 'Current',
                  room_id: null
                }
              }
            }
          },
          {
            NOT: {
              bookings: {
                some: {
                  status: 'Current',
                  room_id: null
                }
              }
            }
          }
        ]
      }

      properties = await prisma.properties.findMany({
        where: whereClauseLegacy,
        select: selectFields,
        orderBy: {
          created_at: 'desc'
        }
      })
    } else {
      // When no specific fields requested, use include
      properties = await prisma.properties.findMany({
        where: {
          organization_id: staffInfo.organization_id
        },
        ...(includeProject && {
          include: {
            projects: true
          }
        }),
        orderBy: {
          created_at: 'desc'
        }
      })
    }

    return NextResponse.json(
      {
        success: true,
        properties
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

export async function POST (req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get staff info to get organization_id
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      // Property details
      code,
      street_address,
      postal_code,
      city,
      type,
      project_id,
      is_ready,
      rooms,
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
    if (!code || !street_address || !postal_code || !city || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if property code already exists in the same project
    if (project_id) {
      const existingProperty = await prisma.properties.findFirst({
        where: {
          code,
          project_id
        },
        select: {
          id: true,
          projects: {
            select: { title: true }
          }
        }
      })

      if (existingProperty) {
        const projectName = existingProperty.projects?.title || 'this project'
        return NextResponse.json(
          { error: `A property with code "${code}" already exists in ${projectName}` },
          { status: 400 }
        )
      }
    }

    // Validate room titles are unique within this property (check for duplicates in the request)
    if (rooms && Array.isArray(rooms) && rooms.length > 0) {
      const roomTitles = rooms.map((r: { title: string }) => r.title.toLowerCase())
      const uniqueTitles = new Set(roomTitles)
      if (roomTitles.length !== uniqueTitles.size) {
        return NextResponse.json(
          { error: 'Duplicate room titles found. Each room must have a unique title.' },
          { status: 400 }
        )
      }
    }

    // Create property with all related data in a transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Create the property first
      const newProperty = await tx.properties.create({
        data: {
          code,
          street_address,
          postal_code,
          city,
          type,
          project_id: project_id || null,
          organization_id: staff.organization_id,
          status: is_ready ? 'Ready' : 'Pending_Inspection',
          wifi: features?.wifi || false,
          cleaning_service: features?.cleaning_service || false,
          water_heater: features?.water_heater || false,
          female: features?.female || false,
          dryer: features?.dryer || false,
          created_by: user.id
        }
      })

      // 2. Create rooms if provided (rooms depend on property existing)
      let roomsCount = 0
      if (rooms && Array.isArray(rooms) && rooms.length > 0) {
        await tx.rooms.createMany({
          data: rooms.map((room: { title: string; is_ready: boolean; features?: { wifi?: boolean; cleaning_service?: boolean; toilet?: boolean; balcony?: boolean; ac?: boolean; queen_bed?: boolean; female?: boolean } }) => ({
            title: room.title,
            property_id: newProperty.id,
            status: room.is_ready ? 'Ready' : 'Pending_Inspection',
            wifi: room.features?.wifi || false,
            cleaning_service: room.features?.cleaning_service || false,
            toilet: room.features?.toilet || false,
            balcony: room.features?.balcony || false,
            ac: room.features?.ac || false,
            queen_bed: room.features?.queen_bed || false,
            female: room.features?.female || false,
            created_by: user.id
          }))
        })
        roomsCount = rooms.length
      }

      // 3. Create initial charges if provided (depends on property)
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
              property_id: newProperty.id,
              charge_type: charge.charge_type as any,
              amount: charge.amount,
              is_taxed: charge.is_taxed || false,
              is_refundable: charge.is_refundable || false,
              created_by: user.id
            })
          )
        })
      }

      // 4. Create late payment charges if provided (depends on property)
      if (
        late_payment_charges &&
        Array.isArray(late_payment_charges) &&
        late_payment_charges.length > 0
      ) {
        await tx.late_payment_charges.createMany({
          data: late_payment_charges.map(
            (charge: { days_after_due: number; amount: number }) => ({
              property_id: newProperty.id,
              days_after_due: charge.days_after_due,
              amount: charge.amount,
              created_by: user.id
            })
          )
        })
      }

      // 5. Create default lease config if reminders or monthly rent provided (depends on property)
      if (
        reminders ||
        monthly_rent !== undefined ||
        payment_day !== undefined
      ) {
        await tx.property_default_lease_config.create({
          data: {
            property_id: newProperty.id,
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

      return { property: newProperty, roomsCount }
    })

    return NextResponse.json(
      {
        success: true,
        property: result.property,
        roomsCount: result.roomsCount
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}
