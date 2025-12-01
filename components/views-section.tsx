'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import Button from './costume-ui/button'
import { DeleteButtonIcon } from './costume-ui/icon'
import ViewsTable from './tables/views-table'
import AddViewDialog from './dialogs/add-view-dialog'
import { ViewWithProperty } from '@/types'
import TableSectionSkeleton from './loading-ui/table-section-skeleton'

type Props = {
  propertyId?: string
  roomId?: string
}

export default function ViewsSection({ propertyId, roomId }: Props) {
  const [views, setViews] = useState<ViewWithProperty[]>([])
  const [loading, setLoading] = useState(true)

  const fetchViews = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (propertyId) params.append('propertyId', propertyId)
      if (roomId) params.append('roomId', roomId)

      const response = await fetch(`/api/views?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setViews(data.views)
      }
    } catch (error) {
      console.error('Error fetching views:', error)
    } finally {
      setLoading(false)
    }
  }, [propertyId, roomId])

  useEffect(() => {
    fetchViews()
  }, [fetchViews])

  const handleRefresh = () => {
    fetchViews()
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
        <h2>Views</h2>
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />

          <AddViewDialog propertyId={propertyId} roomId={roomId} onSuccess={handleRefresh} />
        </div>
      </div>

      <ViewsTable
        data={views}
        className='-mx-5! rounded-none! border-x-0 mb-5'
        noPagnitation={true}
      />
    </div>
  )
}
