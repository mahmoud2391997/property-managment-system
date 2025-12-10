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

    const { id: propertyId } = await params

    // Verify property belongs to the organization
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        status: true
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
          const chargeAmount = charge.amount
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
      propertyStatus: property.status,
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
