'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import Button from './costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from './costume-ui/icon'
import RoomsTable from './tables/rooms-table'
import TableSectionSkeleton from './loading-ui/table-section-skeleton'
import Link from 'next/link'

type RoomTableData = {
  id: string
  title: string
  propertyId: string | null
  property: string
  status: 'Occupied' | 'Vacant' | 'Pending_Inspection' | 'Under_Preparation' | 'Property_Rented' | 'Property_Not_Ready'
  tenantPhone?: string | null
}

type Props = {
  propertyId: string
}

export default function RoomsSection({ propertyId }: Props) {
  const [rooms, setRooms] = useState<RoomTableData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms?propertyId=${propertyId}`)
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  if (loading) {
    return <TableSectionSkeleton />
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        'p-5 py-2.5 rounded-[12px]',
        'bg-(--background-primary) '
      )}
    >
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <h2>Rooms</h2>
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          {/* <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          /> */}

          <Link href={`/properties/${propertyId}/add-room`}>
            <Button
              icon={<AddButtonIcon className='text-neutral-300' />}
              label='Add Room'
            />
          </Link>
        </div>
      </div>

      <RoomsTable
        data={rooms}
        className='-mx-5! rounded-none! border-x-0 mb-5'
        noPagnitation={true}
      />
    </div>
  )
}
