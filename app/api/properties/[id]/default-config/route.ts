import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

// Transform Prisma enum format (with underscores) to frontend format (with spaces)
// e.g., "First_Month_Rental" -> "First Month Rental"
const transformChargeType = (chargeType: string): string => {
  return chargeType.replace(/_/g, ' ')
}

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

    // Fetch all default configurations in parallel
    const [leaseConfig, initialCharges, latePaymentCharges] = await Promise.all([
      // Default lease config (monthly rent, payment day, reminders)
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
      // Default initial charges
      prisma.property_default_initial_charges.findMany({
        where: { property_id: propertyId },
        select: {
          charge_type: true,
          amount: true,
          is_taxed: true,
          is_refundable: true
        }
      }),
      // Late payment charges (property-level, not lease-level)
      prisma.late_payment_charges.findMany({
        where: {
          property_id: propertyId,
          lease_id: null
        },
        select: {
          days_after_due: true,
          amount: true
        },
        orderBy: {
          days_after_due: 'asc'
        }
      })
    ])

    // Check if any defaults exist
    const hasDefaults =
      leaseConfig !== null ||
      initialCharges.length > 0 ||
      latePaymentCharges.length > 0

    return NextResponse.json({
      success: true,
      hasDefaults,
      leaseConfig,
      initialCharges: initialCharges.map(charge => ({
        type: transformChargeType(charge.charge_type),
        amount: charge.amount,
        is_taxed: charge.is_taxed,
        is_refundable: charge.is_refundable
      })),
      latePaymentCharges: latePaymentCharges.map(charge => ({
        days_after_due: charge.days_after_due,
        amount: charge.amount
      }))
    })
  } catch (error) {
    console.error('Error fetching default config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch default configurations' },
      { status: 500 }
    )
  }
}
