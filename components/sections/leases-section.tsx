'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import Button from '../costume-ui/button'
import LeasesTable from '../tables/leases-table'
import { LeaseWithDetails } from '@/types'
import TableSectionSkeleton from '../loading-ui/table-section-skeleton'
import { useRouter } from 'next/navigation'

type Props = {
  propertyId?: string
  roomId?: string
}

export default function LeasesSection({ propertyId, roomId }: Props) {
  const [leases, setLeases] = useState<LeaseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchLeases = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (propertyId) params.append('propertyId', propertyId)
      if (roomId) params.append('roomId', roomId)

      const response = await fetch(`/api/leases?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLeases(data.leases)
      }
    } catch (error) {
      console.error('Error fetching leases:', error)
    } finally {
      setLoading(false)
    }
  }, [propertyId, roomId])

  useEffect(() => {
    fetchLeases()
  }, [fetchLeases])

  const handleAddLease = () => {
    router.push(`/properties/${propertyId}/leases/add-lease`)
  }

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
        <h2>Leases</h2>
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          {/* <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          /> */}

          <Button label='Add Lease' onClick={handleAddLease} />
        </div>
      </div>

      <LeasesTable
        data={leases}
        className='-mx-5! rounded-none! border-x-0 mb-5'
        noPagnitation={true}
        onDataRefresh={fetchLeases}
      />
    </div>
  )
}
