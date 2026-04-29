'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import BookingsTable from '../tables/bookings-table'
import { BookingWithTenant } from '@/types'
import TableSectionSkeleton from '../loading-ui/table-section-skeleton'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'
import { NoAccessCard } from '@/components/no-access-card'

type Props = {
  propertyId?: string
  roomId?: string
}

export default function BookingsSection({ propertyId, roomId }: Props) {
  const { can } = usePermissions()
  const [bookings, setBookings] = useState<BookingWithTenant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (propertyId) params.append('propertyId', propertyId)
      if (roomId) params.append('roomId', roomId)

      const response = await fetch(`/api/bookings?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [propertyId, roomId])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  if (loading) {
    return <TableSectionSkeleton />
  }

  return (
    <PermissionGate 
      permission="bookings.access" 
      fallback={
        <NoAccessCard label="Bookings" />
      }
    >
      <div
        className={cn(
          'flex flex-col gap-5',
          'p-5 py-2.5 rounded-[12px]',
          'bg-(--background-primary) '
        )}
      >
        {/* Actions */}
        <div className={cn('flex justify-between items-center', 'w-full')}>
          <h2>Bookings</h2>
        </div>

        <BookingsTable
          data={bookings}
          className='w-full rounded-none! border-x-0 mb-5'
          noPagnitation={true}
        />
      </div>
    </PermissionGate>
  )
}
