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

    const { id: propertyId } = await params

    // Verify property belongs to the organization
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        code: true,
        status: true,
        rooms: {
          select: {
            id: true,
            status: true,
            leases: {
              where: {
                status: 'Current'
              },
              select: {
                id: true,
                start_date: true,
                number_of_months: true
              }
            }
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Fetch active lease for this property (Current status in DB)
    // Only get property-level leases (room_id is null), not room leases
    const lease = await prisma.leases.findFirst({
      where: {
        property_id: propertyId,
        room_id: null, // Property-level lease only
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

    // Fetch active contract for this property
    const contract = await prisma.contracts.findFirst({
      where: {
        property_id: propertyId
      },
      select: {
        id: true,
        start_date: true,
        owners: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_thumb: true
          }
        },
        expenses: {
          where: {
            status: 'Pending'
          },
          select: {
            id: true,
            due_payment_date: true,
            charges: {
              select: {
                amount: true,
                is_taxed: true
              }
            }
          },
          orderBy: {
            due_payment_date: 'asc'
          },
          take: 1
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Fetch active booking for this property
    const booking = await prisma.bookings.findFirst({
      where: {
        property_id: propertyId
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

    // Transform contract data
    let contractData = null
    if (contract) {
      const ownerName = `${contract.owners.first_name} ${contract.owners.last_name || ''}`.trim()
      const nextExpense = contract.expenses[0]

      // Calculate amount from charges
      let amount = 0
      let dueDate = null
      if (nextExpense) {
        amount = nextExpense.charges.reduce((sum, charge) => {
          const chargeAmount = charge.amount.toNumber()
          const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
          return sum + chargeAmount + tax
        }, 0)
        dueDate = nextExpense.due_payment_date?.toISOString() || null
      }

      contractData = {
        id: contract.id,
        amount,
        due_date: dueDate,
        owner: {
          id: contract.owners.id,
          name: ownerName,
          profile_thumb: contract.owners.profile_thumb
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

    let displayStatus: string | { status: DisplayStatus; count: number; total: number }[]

    // Priority 1: Property is Pending_Inspection or Under_Preparation
    if (property.status === 'Pending_Inspection' || property.status === 'Under_Preparation') {
      displayStatus = property.status
    }
    // Priority 2: Property has active lease (Occupied)
    else if (lease && isLeaseActive({ status: 'Current', start_date: lease.start_date, number_of_months: lease.number_of_months })) {
      displayStatus = 'Occupied'
    }
    // Priority 3: Check rooms
    else if (property.rooms.length > 0) {
      // Compute room statuses
      const roomStatuses = property.rooms.map(room => {
        const roomLease = room.leases[0] || null

        // If room has active lease, it's Occupied
        if (roomLease && isLeaseActive({ status: 'Current', start_date: roomLease.start_date, number_of_months: roomLease.number_of_months })) {
          return 'Occupied' as DisplayStatus
        }

        // Check room's own status
        if (room.status === 'Pending_Inspection') return 'Pending_Inspection' as DisplayStatus
        if (room.status === 'Under_Preparation') return 'Under_Preparation' as DisplayStatus

        return 'Vacant' as DisplayStatus
      })

      const allVacant = roomStatuses.every(status => status === 'Vacant')

      if (allVacant) {
        displayStatus = 'Vacant'
      } else {
        // Count statuses
        const statusCounts: Record<DisplayStatus, number> = {
          Occupied: 0,
          Vacant: 0,
          Pending_Inspection: 0,
          Under_Preparation: 0
        }

        roomStatuses.forEach(status => {
          statusCounts[status]++
        })

        // Build status array
        const total = property.rooms.length
        const statusArray: { status: DisplayStatus; count: number; total: number }[] = []

        for (const [status, count] of Object.entries(statusCounts)) {
          if (count > 0) {
            statusArray.push({
              status: status as DisplayStatus,
              count,
              total
            })
          }
        }

        displayStatus = statusArray
      }
    } else {
      // No rooms - property is Vacant
      displayStatus = 'Vacant'
    }

    return NextResponse.json({
      propertyCode: property.code,
      propertyStatus: displayStatus,
      lease: leaseData,
      contract: contractData,
      booking: bookingData
    })
  } catch (error: any) {
    console.error('Error fetching property overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property overview' },
      { status: 500 }
    )
  }
}
