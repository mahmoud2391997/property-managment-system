import { cn } from '@/lib/utils'
import RentalsSection from '@/components/sections/rentals-section'
import { RentalWithDetails } from '@/components/tables/rentals-table'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { computeLeaseStatus } from '@/utils/lease-status'

async function fetchRentals(): Promise<RentalWithDetails[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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

    // Fetch all leases for this tenant
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

      return {
        id: lease.id,
        reference_id: lease.reference_id,
        property: lease.properties?.code || 'N/A',
        unit: lease.rooms?.title || 'Whole unit',
        start_date: lease.start_date.toISOString(),
        number_of_months: lease.number_of_months,
        monthly_rent: lease.monthly_rent,
        status
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
