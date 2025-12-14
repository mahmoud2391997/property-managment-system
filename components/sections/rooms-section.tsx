'use client'

import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, ImportButtonIcon } from '@/components/costume-ui/icon'
import RoomsTable from '@/components/tables/rooms-table'
import Link from 'next/link'
import { RoomWithDetails } from '@/lib/rooms-utils'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'

interface RoomsSectionProps {
  initialData: RoomWithDetails[]
  initialTotal: number
}

export default function RoomsSection({ initialData, initialTotal }: RoomsSectionProps) {
  const {
    data,
    isLoading,
    searchTerm,
    handleSearchChange,
    currentPage,
    total,
    canGoNext,
    canGoPrevious,
    goToNextPage,
    goToPreviousPage,
    pageSize
  } = usePaginatedSearch<RoomWithDetails>({
    apiRoute: '/api/rooms',
    initialData,
    initialTotal,
    pageSize: 10
  })

  return (
    <>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput
          placeholder='Search rooms'
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Link href='/rooms/import-rooms'>
            <Button
              variant='secondary'
              icon={<ImportButtonIcon className='text-neutral-400' />}
              label='Import'
            />
          </Link>
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
        <RoomsTable
          data={data}
          isLoading={isLoading}
          currentPage={currentPage}
          totalItems={total}
          pageSize={pageSize}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
        />
      </div>
    </>
  )
}
