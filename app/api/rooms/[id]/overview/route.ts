import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { isLeaseActive } from '@/utils/lease-status'

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
        title: true,
        status: true,
        property_id: true,
        properties: {
          select: {
            code: true,
            status: true,
            // Check for property-level lease
            leases: {
              where: {
                room_id: null,
                status: 'Current'
              },
              select: {
                id: true
              },
              take: 1
            }
          }
        }
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
        },
        payments: {
          where: {
            type: 'Rental',
            status: 'Pending'
          },
          select: {
            id: true,
            due_payment_timestamp: true,
            charges: {
              select: {
                amount: true,
                is_taxed: true
              }
            }
          },
          orderBy: {
            due_payment_timestamp: 'asc'
          },
          take: 1
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

    // Fetch scheduled rental change for lease (if any)
    let scheduledChange = null
    if (lease) {
      scheduledChange = await prisma.scheduled_rental_changes.findFirst({
        where: {
          lease_id: lease.id,
          status: 'Scheduled'
        },
        select: {
          id: true,
          old_monthly_rent: true,
          new_monthly_rent: true,
          effective_from: true
        }
      })
    }

    // Transform lease data
    let leaseData = null
    if (lease) {
      const tenantName = lease.tenants.individual_tenants
        ? `${lease.tenants.individual_tenants.first_name} ${lease.tenants.individual_tenants.last_name || ''}`.trim()
        : lease.tenants.company_tenants?.company_name || 'Unknown'

      // Get pending payment data
      const pendingPayment = lease.payments[0]
      let dueDate: string | null = null
      let amount = 0

      if (pendingPayment) {
        dueDate = pendingPayment.due_payment_timestamp?.toISOString() || null
        amount = pendingPayment.charges.reduce((sum, charge) => {
          const chargeAmount = charge.amount.toNumber()
          const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
          return sum + chargeAmount + tax
        }, 0)
      }

      leaseData = {
        id: lease.id,
        reference_id: lease.reference_id,
        monthly_rent: amount || lease.monthly_rent,
        due_date: dueDate,
        start_date: lease.start_date,
        number_of_months: lease.number_of_months,
        tenant: {
          id: lease.tenants.id,
          name: tenantName,
          profile_thumb: lease.tenants.profile_thumb,
          phone_number: lease.tenants.individual_tenants?.phone_number || null
        },
        scheduled_change: scheduledChange
          ? {
              id: scheduledChange.id,
              old_rent: Number(scheduledChange.old_monthly_rent),
              new_rent: Number(scheduledChange.new_monthly_rent),
              effective_from: scheduledChange.effective_from.toISOString()
            }
          : null
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
          const chargeAmount = charge.amount.toNumber()
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

    // Compute display status
    type DisplayStatus = 'Occupied' | 'Vacant' | 'Pending_Inspection' | 'Under_Preparation'

    let displayStatus: DisplayStatus

    // Priority 1: Room is Pending_Inspection or Under_Preparation
    if (room.status === 'Pending_Inspection' || room.status === 'Under_Preparation') {
      displayStatus = room.status
    }
    // Priority 2: Room has active lease (Occupied)
    else if (lease && isLeaseActive({ status: 'Current', start_date: lease.start_date, number_of_months: lease.number_of_months })) {
      displayStatus = 'Occupied'
    }
    // Priority 3: No active lease, room is Vacant
    else {
      displayStatus = 'Vacant'
    }

    // Check if room can have a new lease added
    // Room can have a lease if:
    // 1. Room status is Ready (vacant)
    // 2. No active room lease
    // 3. Property status is Ready (vacant)
    // 4. No active property-level lease on parent property
    let canAddLease = true
    let leaseBlockedReason: string | null = null

    if (lease) {
      canAddLease = false
      leaseBlockedReason = 'Room already has an active lease'
    } else if (room.status !== 'Ready') {
      canAddLease = false
      leaseBlockedReason = `Room is ${room.status.replace(/_/g, ' ')}`
    } else if (room.properties?.status !== 'Ready') {
      canAddLease = false
      leaseBlockedReason = `Property is ${room.properties?.status?.replace(/_/g, ' ') || 'not ready'}`
    } else if (room.properties?.leases && room.properties.leases.length > 0) {
      canAddLease = false
      leaseBlockedReason = 'Property has an active property-level lease'
    }

    // Check if room can have a new booking added
    // Room can have a booking if:
    // 1. No current booking for this room already exists
    // 2. No current property-level booking on parent property (mutual exclusivity)
    let canAddBooking = true
    let bookingBlockedReason: string | null = null

    if (!booking) {
      // Only need to check mutual exclusivity when there's no existing booking shown
      const propertyLevelBooking = await prisma.bookings.findFirst({
        where: {
          property_id: room.property_id!,
          room_id: { equals: null },
          status: 'Current'
        },
        select: { id: true }
      })
      if (propertyLevelBooking) {
        canAddBooking = false
        bookingBlockedReason = 'Property already has a current booking'
      }
    }

    return NextResponse.json({
      roomTitle: room.title,
      propertyCode: room.properties?.code || null,
      roomStatus: displayStatus,
      lease: leaseData,
      booking: bookingData,
      propertyId: room.property_id,
      canAddLease,
      leaseBlockedReason,
      canAddBooking,
      bookingBlockedReason
    })
  } catch (error: any) {
    console.error('Error fetching room overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room overview' },
      { status: 500 }
    )
  }
}
