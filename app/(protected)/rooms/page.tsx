import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import RoomsTable from '@/components/tables/rooms-table'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

async function getRooms() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get staff info to find organization
  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (!staff) {
    return []
  }

  // Get rooms for properties in this organization
  const rooms = await prisma.rooms.findMany({
    where: {
      properties: {
        organization_id: staff.organization_id
      }
    },
    select: {
      id: true,
      title: true,
      status: true,
      properties: {
        select: {
          code: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return rooms.map(room => ({
    id: room.id,
    title: room.title,
    property: room.properties?.code || 'No Property',
    status: room.status
  }))
}

const Rooms = async () => {
  const rooms = await getRooms()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Rooms</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search rooms' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />

          <Link href='/rooms/add-room'>
            <Button
              icon={<AddButtonIcon className='text-neutral-300' />}
              label='Add Room'
            />
          </Link>
        </div>
      </div>
      {/* Table */}
      <div>
        <RoomsTable data={rooms} />
      </div>
    </div>
  )
}

export default Rooms
