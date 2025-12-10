'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import RoomsTable from '@/components/tables/rooms-table'
import Link from 'next/link'

type RoomTableData = {
  id: string
  title: string
  property: string
  status:
    | 'Occupied'
    | 'Vacant'
    | 'Pending_Inspection'
    | 'Under_Preparation'
    | 'Property_Rented'
    | 'Property_Not_Ready'
  tenantPhone?: string | null
}

interface RoomsSectionProps {
  rooms: RoomTableData[]
}

export default function RoomsSection({ rooms }: RoomsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRooms = useMemo(() => {
    if (!searchTerm.trim()) {
      return rooms
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return rooms.filter(room => {
      const titleMatch = room.title?.toLowerCase().includes(lowerSearch)
      const propertyMatch = room.property?.toLowerCase().includes(lowerSearch)
      const statusMatch = room.status?.toLowerCase().replace(/_/g, ' ').includes(lowerSearch)

      return titleMatch || propertyMatch || statusMatch
    })
  }, [rooms, searchTerm])

  return (
    <>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput
          placeholder='Search rooms'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          {/* <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          /> */}

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
        <RoomsTable data={filteredRooms} />
      </div>
    </>
  )
}
