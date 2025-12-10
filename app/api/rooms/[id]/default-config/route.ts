import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

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
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id: roomId } = await params

    // Verify room belongs to the organization through its property
    const room = await prisma.rooms.findFirst({
      where: {
        id: roomId,
        properties: {
          organization_id: staff.organization_id
        }
      },
      select: { id: true }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Fetch all default configurations in parallel
    const [leaseConfig, initialCharges, latePaymentCharges] = await Promise.all([
      // Default lease config (monthly rent, payment day, reminders)
      prisma.property_default_lease_config.findUnique({
        where: { room_id: roomId },
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
        where: { room_id: roomId },
        select: {
          charge_type: true,
          amount: true,
          is_taxed: true,
          is_refundable: true
        }
      }),
      // Late payment charges (room-level, not lease-level)
      prisma.late_payment_charges.findMany({
        where: {
          room_id: roomId,
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
    console.error('Error fetching room default config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch default configurations' },
      { status: 500 }
    )
  }
}
