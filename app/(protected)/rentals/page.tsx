export const dynamic = 'force-dynamic'

import { cn } from '@/lib/utils'
import RentalsSection from '@/components/sections/rentals-section'
import { RentalWithDetails } from '@/components/tables/rentals-table'
import { computeLeaseStatus } from '@/utils/lease-status'

async function fetchRentals(): Promise<RentalWithDetails[]> {
  try {
    const { data: { user } } = 

    if (!user) {
      return []
    }

    // Check if user is tenant
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!tenant) {
      return []
    }

    // Fetch all leases for this tenant with pending payments
    const leases = await prisma.leases.findMany({
      where: {
        tenant_id: tenant.id
      },
      include: {
        properties: {
          select: {
            code: true
          }
        },
        rooms: {
          select: {
            title: true
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
        },
        scheduled_rental_changes: {
          where: {
            status: 'Scheduled'
          },
          select: {
            id: true,
            old_monthly_rent: true,
            new_monthly_rent: true,
            effective_from: true
          },
          take: 1
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform to RentalWithDetails format
    const rentals: RentalWithDetails[] = leases.map(lease => {
      // Compute display status based on dates
      const status = computeLeaseStatus({
        status: lease.status,
        start_date: lease.start_date,
        number_of_months: lease.number_of_months
      })

      // Calculate rental amount from pending payment if available
      const pendingPayment = lease.payments[0]
      let monthlyRent = lease.monthly_rent.toNumber()

      if (pendingPayment) {
        monthlyRent = pendingPayment.charges.reduce((sum, charge) => {
          const chargeAmount = Number(charge.amount)
          const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
          return sum + chargeAmount + tax
        }, 0)
      }

      // Get scheduled change if any
      const scheduledChange = lease.scheduled_rental_changes[0]

      return {
        id: lease.id,
        reference_id: lease.reference_id,
        property: lease.properties?.code || 'N/A',
        unit: lease.rooms?.title || 'Whole unit',
        start_date: lease.start_date.toISOString(),
        number_of_months: lease.number_of_months,
        monthly_rent: monthlyRent,
        status,
        scheduled_change: scheduledChange
          ? {
              id: scheduledChange.id,
              old_rent: Number(scheduledChange.old_monthly_rent),
              new_rent: Number(scheduledChange.new_monthly_rent),
              effective_from: scheduledChange.effective_from.toISOString()
            }
          : null
      }
    })

    return rentals
  } catch (error) {
    console.error('Error fetching rentals:', error)
    return []
  }
}

const Rentals = async () => {
  const rentals = await fetchRentals()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Rentals</h1>
      </div>
      <RentalsSection rentals={rentals} />
    </div>
  )
}

export default Rentals
