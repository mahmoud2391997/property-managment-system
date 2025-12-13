import { cn } from '@/lib/utils'
import PropertiesSection from '@/components/sections/properties-section'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { transformProperty, PropertyWithDetails } from '@/lib/properties-utils'

const PAGE_SIZE = 10

async function getProperties(): Promise<{ data: PropertyWithDetails[]; total: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], total: 0 }
  }

  // Get staff info to find organization
  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (!staff) {
    return { data: [], total: 0 }
  }

  const whereClause = {
    organization_id: staff.organization_id
  }

  // Fetch first page of properties and total count in parallel
  const [properties, total] = await Promise.all([
    prisma.properties.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        street_address: true,
        postal_code: true,
        city: true,
        type: true,
        status: true,
        projects: {
          select: {
            title: true,
            state: true
          }
        },
        rooms: {
          select: {
            id: true,
            status: true,
            leases: {
              where: { status: 'Current' },
              select: {
                status: true,
                start_date: true,
                number_of_months: true
              },
              orderBy: { created_at: 'desc' },
              take: 1
            }
          }
        },
        leases: {
          where: {
            room_id: null,
            status: 'Current'
          },
          select: {
            status: true,
            start_date: true,
            number_of_months: true,
            tenants: {
              select: {
                individual_tenants: {
                  select: {
                    phone_number: true
                  }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: PAGE_SIZE
    }),
    prisma.properties.count({ where: whereClause })
  ])

  return {
    data: properties.map(transformProperty),
    total
  }
}

const Properties = async () => {
  const { data: initialData, total: initialTotal } = await getProperties()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Properties</h1>
      </div>
      <PropertiesSection
        initialData={initialData}
        initialTotal={initialTotal}
      />
    </div>
  )
}

export default Properties
