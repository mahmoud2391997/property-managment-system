import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET (req: Request) {
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

    // Parse query parameters to determine what fields to return
    const { searchParams } = new URL(req.url)
    const fieldsParam = searchParams.get('fields')
    const includeProject = searchParams.get('includeProject') === 'true'

    // Build query based on whether specific fields are requested
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

      properties = await prisma.properties.findMany({
        where: {
          organization_id: staff.organization_id
        },
        select: selectFields,
        orderBy: {
          created_at: 'desc'
        }
      })
    } else {
      // When no specific fields requested, use include
      properties = await prisma.properties.findMany({
        where: {
          organization_id: staff.organization_id
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
          created_by: user.id
        }
      })

      // 2. Create rooms if provided (rooms depend on property existing)
      let roomsCount = 0
      if (rooms && Array.isArray(rooms) && rooms.length > 0) {
        await tx.rooms.createMany({
          data: rooms.map((room: { title: string; is_ready: boolean }) => ({
            title: room.title,
            property_id: newProperty.id,
            status: room.is_ready ? 'Ready' : 'Pending_Inspection',
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
