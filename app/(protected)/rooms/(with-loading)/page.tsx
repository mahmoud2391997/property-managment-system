import { cn } from '@/lib/utils'
import RoomsSection from '@/components/sections/rooms-section'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { transformRoom, RoomWithDetails } from '@/lib/rooms-utils'

const PAGE_SIZE = 10

async function getRoomsWithTotal(): Promise<{ rooms: RoomWithDetails[], total: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { rooms: [], total: 0 }
  }

  // Get staff info to find organization
  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (!staff) {
    return { rooms: [], total: 0 }
  }

  const whereClause = {
    properties: {
      organization_id: staff.organization_id
    }
  }

  // Fetch first page of rooms and total count in parallel
  const [rooms, total] = await Promise.all([
    prisma.rooms.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        status: true,
        wifi: true,
        cleaning_service: true,
        toilet: true,
        balcony: true,
        ac: true,
        queen_bed: true,
        female: true,
        properties: {
          select: {
            id: true,
            code: true,
            status: true,
            projects: {
              select: {
                title: true
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
          }
        },
        leases: {
          where: { status: 'Current' },
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
    prisma.rooms.count({ where: whereClause })
  ])

  return {
    rooms: rooms.map(transformRoom),
    total
  }
}

const Rooms = async () => {
  const { rooms, total } = await getRoomsWithTotal()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Rooms</h1>
      </div>
      <RoomsSection initialData={rooms} initialTotal={total} />
    </div>
  )
}

export default Rooms
