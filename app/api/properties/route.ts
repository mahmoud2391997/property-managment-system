import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
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
      city,
      postal_code,
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
    if (!code || !street_address || !postal_code || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create property with all related data in a transaction
    const property = await prisma.$transaction(async tx => {
      // 1. Create the property
      const newProperty = await tx.properties.create({
        data: {
          code,
          street_address,
          postal_code,
          type,
          project_id: project_id || null,
          organization_id: staff.organization_id,
          is_ready: is_ready || false,
          created_by: user.id
        }
      })

      // 2. Create rooms if provided
      if (rooms && Array.isArray(rooms) && rooms.length > 0) {
        await tx.rooms.createMany({
          data: rooms.map((room: { title: string; is_ready: boolean }) => ({
            title: room.title,
            property_id: newProperty.id,
            organization_id: staff.organization_id,
            is_ready: room.is_ready || false,
            created_by: user.id
          }))
        })
      }

      // 3. Create initial charges if provided
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

      // 4. Create late payment charges if provided
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

      // 5. Create default lease config if reminders or monthly rent provided
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

      return newProperty
    })

    return NextResponse.json(
      {
        success: true,
        property
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
