import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

// Transform Prisma enum format (with underscores) to frontend format (with spaces)
const transformChargeType = (chargeType: string): string => {
  return chargeType.replace(/_/g, ' ')
}

// GET - Fetch property details for editing
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: propertyId } = await params

    // Get staff info to verify organization access
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Fetch property with all related data for editing
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            state: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Fetch default configurations in parallel
    const [leaseConfig, initialCharges, latePaymentCharges] = await Promise.all([
      prisma.property_default_lease_config.findUnique({
        where: { property_id: propertyId },
        select: {
          default_monthly_rent: true,
          default_payment_day: true,
          is_expiry_reminder: true,
          expiry_days_before_reminder: true,
          is_rent_reminder: true,
          rent_reminder_days_before: true,
          is_overdue_rent_reminder: true,
          overdue_days_after_reminder: true
        }
      }),
      prisma.property_default_initial_charges.findMany({
        where: { property_id: propertyId },
        select: {
          id: true,
          charge_type: true,
          amount: true,
          is_taxed: true,
          is_refundable: true
        }
      }),
      prisma.late_payment_charges.findMany({
        where: {
          property_id: propertyId,
          lease_id: null
        },
        select: {
          id: true,
          days_after_due: true,
          amount: true
        },
        orderBy: {
          days_after_due: 'asc'
        }
      })
    ])

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        code: property.code,
        street_address: property.street_address,
        city: property.city,
        postal_code: property.postal_code,
        type: property.type,
        status: property.status,
        project: property.projects
      },
      leaseConfig,
      initialCharges: initialCharges.map(charge => ({
        id: charge.id,
        type: transformChargeType(charge.charge_type),
        amount: charge.amount,
        is_taxed: charge.is_taxed,
        is_refundable: charge.is_refundable
      })),
      latePaymentCharges: latePaymentCharges.map(charge => ({
        id: charge.id,
        days_after_due: charge.days_after_due,
        amount: charge.amount
      }))
    })
  } catch (error) {
    console.error('Error fetching property for edit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property details' },
      { status: 500 }
    )
  }
}

// PUT - Update property details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: propertyId } = await params

    // Get staff info to verify organization access
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Verify property exists and belongs to this organization
    const existingProperty = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      }
    })

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      // Property details (editable)
      code,
      street_address,
      postal_code,
      city,
      project_id,
      // Optional default payment details
      initial_charges,
      monthly_rent,
      payment_day,
      late_payment_charges,
      // Optional reminder details
      reminders
    } = body

    // Validate required fields
    if (!code || !street_address || !postal_code || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update property and related data in a transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Update the property
      const updatedProperty = await tx.properties.update({
        where: { id: propertyId },
        data: {
          code,
          street_address,
          postal_code,
          city,
          project_id: project_id || null
        }
      })

      // 2. Delete existing initial charges and create new ones
      await tx.property_default_initial_charges.deleteMany({
        where: { property_id: propertyId }
      })

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
              property_id: propertyId,
              charge_type: charge.charge_type as any,
              amount: charge.amount,
              is_taxed: charge.is_taxed || false,
              is_refundable: charge.is_refundable || false,
              created_by: user.id
            })
          )
        })
      }

      // 3. Delete existing late payment charges (property-level only) and create new ones
      await tx.late_payment_charges.deleteMany({
        where: {
          property_id: propertyId,
          lease_id: null
        }
      })

      if (
        late_payment_charges &&
        Array.isArray(late_payment_charges) &&
        late_payment_charges.length > 0
      ) {
        await tx.late_payment_charges.createMany({
          data: late_payment_charges.map(
            (charge: { days_after_due: number; amount: number }) => ({
              property_id: propertyId,
              days_after_due: charge.days_after_due,
              amount: charge.amount,
              created_by: user.id
            })
          )
        })
      }

      // 4. Upsert default lease config
      const existingConfig = await tx.property_default_lease_config.findUnique({
        where: { property_id: propertyId }
      })

      if (existingConfig) {
        await tx.property_default_lease_config.update({
          where: { property_id: propertyId },
          data: {
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
              reminders?.overdue_days_after_reminder || null
          }
        })
      } else if (
        reminders ||
        monthly_rent !== undefined ||
        payment_day !== undefined
      ) {
        await tx.property_default_lease_config.create({
          data: {
            property_id: propertyId,
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

      return { property: updatedProperty }
    })

    return NextResponse.json({
      success: true,
      property: result.property
    })
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    )
  }
}
