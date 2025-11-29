import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Verify property belongs to the organization
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: { id: true, code: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Fetch rooms for this property
    const rooms = await prisma.rooms.findMany({
      where: {
        property_id: propertyId
      },
      select: {
        id: true,
        title: true,
        status: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({
      rooms: rooms.map(room => ({
        id: room.id,
        title: room.title,
        property: property.code,
        status: room.status
      }))
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

    // Create room with all related data in a transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Create the room first
      const newRoom = await tx.rooms.create({
        data: {
          title,
          property_id,
          status: is_ready ? 'Vacant' : 'Pending_Inspection',
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
