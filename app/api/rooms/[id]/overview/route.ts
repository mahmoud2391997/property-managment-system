import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(
  request: Request,
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
      select: {
        id: true,
        status: true,
        property_id: true
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Fetch active lease for this room (Current status in DB)
    const lease = await prisma.leases.findFirst({
      where: {
        room_id: roomId,
        status: 'Current'
      },
      select: {
        id: true,
        reference_id: true,
        monthly_rent: true,
        payment_day: true,
        start_date: true,
        number_of_months: true,
        tenants: {
          select: {
            id: true,
            profile_thumb: true,
            individual_tenants: {
              select: {
                first_name: true,
                last_name: true,
                phone_number: true
              }
            },
            company_tenants: {
              select: {
                company_name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Fetch active booking for this room
    const booking = await prisma.bookings.findFirst({
      where: {
        room_id: roomId
      },
      select: {
        id: true,
        move_in_timestamp: true,
        tenants: {
          select: {
            id: true,
            profile_thumb: true,
            individual_tenants: {
              select: {
                first_name: true,
                last_name: true
              }
            },
            company_tenants: {
              select: {
                company_name: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            charges: {
              select: {
                amount: true,
                is_taxed: true
              }
            }
          },
          take: 1
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Calculate next due date for lease based on payment_day
    const calculateNextDueDate = (paymentDay: number): string => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const currentDay = now.getDate()

      let dueDate: Date
      if (currentDay <= paymentDay) {
        // Due date is this month
        dueDate = new Date(currentYear, currentMonth, paymentDay)
      } else {
        // Due date is next month
        dueDate = new Date(currentYear, currentMonth + 1, paymentDay)
      }

      return dueDate.toISOString()
    }

    // Transform lease data
    let leaseData = null
    if (lease) {
      const tenantName = lease.tenants.individual_tenants
        ? `${lease.tenants.individual_tenants.first_name} ${lease.tenants.individual_tenants.last_name || ''}`.trim()
        : lease.tenants.company_tenants?.company_name || 'Unknown'

      leaseData = {
        id: lease.id,
        reference_id: lease.reference_id,
        monthly_rent: lease.monthly_rent,
        due_date: calculateNextDueDate(lease.payment_day),
        start_date: lease.start_date,
        number_of_months: lease.number_of_months,
        tenant: {
          id: lease.tenants.id,
          name: tenantName,
          profile_thumb: lease.tenants.profile_thumb,
          phone_number: lease.tenants.individual_tenants?.phone_number || null
        }
      }
    }

    // Transform booking data
    let bookingData = null
    if (booking) {
      const tenantName = booking.tenants.individual_tenants
        ? `${booking.tenants.individual_tenants.first_name} ${booking.tenants.individual_tenants.last_name || ''}`.trim()
        : booking.tenants.company_tenants?.company_name || 'Unknown'

      // Calculate booking amount from payments
      let amount = 0
      if (booking.payments[0]) {
        amount = booking.payments[0].charges.reduce((sum, charge) => {
          const chargeAmount = charge.amount
          const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
          return sum + chargeAmount + tax
        }, 0)
      }

      bookingData = {
        id: booking.id,
        amount,
        move_in_date: booking.move_in_timestamp.toISOString(),
        tenant: {
          id: booking.tenants.id,
          name: tenantName,
          profile_thumb: booking.tenants.profile_thumb
        }
      }
    }

    return NextResponse.json({
      roomStatus: room.status,
      lease: leaseData,
      booking: bookingData,
      propertyId: room.property_id
    })
  } catch (error: any) {
    console.error('Error fetching room overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room overview' },
      { status: 500 }
    )
  }
}
