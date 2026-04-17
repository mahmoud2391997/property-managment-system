import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

// Transform Prisma enum format (with underscores) to frontend format (with spaces)
const transformChargeType = (chargeType: string): string => {
  return chargeType.replace(/_/g, ' ')
}

// GET - Fetch room details for editing
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()
    if (error) return error
    if (!hasPermission(permissions, 'rooms.access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: roomId } = await params

    // Fetch room with property info
    const room = await prisma.rooms.findFirst({
      where: {
        id: roomId
      },
      include: {
        properties: {
          select: {
            id: true,
            code: true,
            organization_id: true,
            projects: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Verify room's property belongs to this organization
    if (!room.properties || room.properties.organization_id !== staff.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch default configurations in parallel
    const [leaseConfig, initialCharges, latePaymentCharges, roomImages] = await Promise.all([
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
      prisma.property_default_initial_charges.findMany({
        where: { room_id: roomId },
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
          room_id: roomId,
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
      }),
      prisma.property_images.findMany({
        where: { room_id: roomId },
        select: {
          id: true,
          image_url: true,
          thumb_url: true
        },
        orderBy: {
          created_at: 'asc'
        }
      })
    ])

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        title: room.title,
        status: room.status,
        wifi: room.wifi,
        cleaning_service: room.cleaning_service,
        toilet: room.toilet,
        balcony: room.balcony,
        ac: room.ac,
        queen_bed: room.queen_bed,
        female: room.female,
        property: {
          id: room.properties.id,
          code: room.properties.code,
          project: room.properties.projects
        }
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
      })),
      images: roomImages
    })
  } catch (error) {
    console.error('Error fetching room for edit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room details' },
      { status: 500 }
    )
  }
}

// PUT - Update room details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, staff, permissions, error } = await getUserAndStaff()
    if (error) return error
    if (!hasPermission(permissions, 'rooms.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: roomId } = await params

    // Verify room exists and get its property's organization
    const existingRoom = await prisma.rooms.findFirst({
      where: { id: roomId },
      include: {
        properties: {
          select: { organization_id: true }
        }
      }
    })

    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!existingRoom.properties || existingRoom.properties.organization_id !== staff.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const {
      // Room details (editable)
      title,
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
    if (!title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update room and related data in a transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Update the room
      const updatedRoom = await tx.rooms.update({
        where: { id: roomId },
        data: {
          title,
          wifi: features?.wifi || false,
          cleaning_service: features?.cleaning_service || false,
          toilet: features?.toilet || false,
          balcony: features?.balcony || false,
          ac: features?.ac || false,
          queen_bed: features?.queen_bed || false,
          female: features?.female || false
        }
      })

      // 2. Update initial charges only if provided in payload
      if (initial_charges !== undefined) {
        await tx.property_default_initial_charges.deleteMany({
          where: { room_id: roomId }
        })

        if (Array.isArray(initial_charges) && initial_charges.length > 0) {
          await tx.property_default_initial_charges.createMany({
            data: initial_charges.map(
              (charge: {
                charge_type: any
                amount: number
                is_taxed: boolean
                is_refundable: boolean
              }) => ({
                room_id: roomId,
                charge_type: charge.charge_type as any,
                amount: charge.amount,
                is_taxed: charge.is_taxed || false,
                is_refundable: charge.is_refundable || false,
                created_by: user.id
              })
            )
          })
        }
      }

      // 3. Update late payment charges only if provided in payload
      if (late_payment_charges !== undefined) {
        await tx.late_payment_charges.deleteMany({
          where: {
            room_id: roomId,
            lease_id: null
          }
        })

        if (Array.isArray(late_payment_charges) && late_payment_charges.length > 0) {
          await tx.late_payment_charges.createMany({
            data: late_payment_charges.map(
              (charge: { days_after_due: number; amount: number }) => ({
                room_id: roomId,
                days_after_due: charge.days_after_due,
                amount: charge.amount,
                created_by: user.id
              })
            )
          })
        }
      }

      // 4. Upsert default lease config only if provided in payload
      if (reminders !== undefined || monthly_rent !== undefined || payment_day !== undefined) {
        await tx.property_default_lease_config.upsert({
          where: { room_id: roomId },
          update: {
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
          },
          create: {
            room_id: roomId,
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

      return { room: updatedRoom }
    })

    return NextResponse.json({
      success: true,
      room: result.room
    })
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    )
  }
}
