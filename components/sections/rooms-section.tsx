'use client'

import { useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, ImportButtonIcon } from '@/components/costume-ui/icon'
import RoomsTable from '@/components/tables/rooms-table'
import Link from 'next/link'
import { RoomWithDetails } from '@/lib/rooms-utils'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'
import { Tab, TabGroup } from '@/components/costume-ui/tab'
import TableFilter, { type FilterAttribute, type FilterValue } from '@/components/costume-ui/table-filter'
import { usePermissions } from '@/hooks/use-permissions'

// Define filterable attributes for rooms
const ROOM_FILTER_ATTRIBUTES: FilterAttribute[] = [
  { key: 'title', label: 'Room Title', type: 'text' },
  { key: 'property', label: 'Property', type: 'text' },
  { key: 'project', label: 'Project', type: 'text' }
]

// Status options - values use underscores as stored in data
const STATUS_OPTIONS = [
  'all',
  'Occupied',
  'Vacant',
  'Pending_Inspection',
  'Under_Preparation',
  'Property_Rented',
  'Property_Not_Ready'
]

interface RoomsSectionProps {
  initialData: RoomWithDetails[]
  initialTotal: number
}

export default function RoomsSection({ initialData, initialTotal }: RoomsSectionProps) {
  const { can } = usePermissions()
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
    pageSize,
    updateFilters,
    activeFilters
  } = usePaginatedSearch<RoomWithDetails>({
    apiRoute: '/api/rooms',
    initialData,
    initialTotal,
    pageSize: 10,
    defaultFilters: {
      status: 'all',
      title: '',
      property: '',
      project: ''
    }
  })

  // Current status from URL (via activeFilters)
  const currentStatus = activeFilters.status || 'all'

  // Handle tab selection - updates URL which triggers refetch
  const handleTabClick = (status: string) => {
    updateFilters({ status })
  }

  // Convert status value to display format (underscores to spaces)
  const getStatusDisplayLabel = (status: string) => {
    if (status === 'all') return 'All'
    return status.replace(/_/g, ' ')
  }

  // Convert activeFilters (Record) to FilterValue[] for TableFilter component
  const advancedFilters = useMemo((): FilterValue[] => {
    return Object.entries(activeFilters)
      .filter(([key, value]) => value && key !== 'status') // Exclude status (handled by tabs)
      .map(([key, value]) => ({ id: key, attribute: key, value }))
  }, [activeFilters])

  // Handle advanced filters change - convert FilterValue[] to Record and update
  const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
    const filterObj: Record<string, string> = {}

    // Set values for active filters
    newFilters.forEach(f => {
      if (f.attribute && f.value) {
        filterObj[f.attribute] = f.value
      }
    })

    // Clear filters that were removed
    ROOM_FILTER_ATTRIBUTES.forEach(attr => {
      if (!filterObj[attr.key]) {
        filterObj[attr.key] = ''
      }
    })

    updateFilters(filterObj)
  }, [updateFilters])

  // Handle refresh (for delete actions)
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <>
      {/* Actions */}
      <div className={cn('flex flex-col sm:flex-row justify-between sm:items-center gap-3', 'w-full')}>
        <div className='flex items-center gap-2'>
          <TableFilter
            attributes={ROOM_FILTER_ATTRIBUTES}
            filters={advancedFilters}
            onFiltersChange={handleFiltersChange}
          />
          <SearchInput
            placeholder='Search rooms'
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        {/* Buttons */}
        <div className='flex items-center gap-2.5'>
          {can('rooms.create') && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <TabGroup showButton={true} className='-mx-5 px-5 mb-3'>
        {STATUS_OPTIONS.map((status) => (
          <Tab
            key={status}
            label={getStatusDisplayLabel(status)}
            isSelected={currentStatus === status}
            onClick={() => handleTabClick(status)}
            className='texts-tab-secondary'
          />
        ))}
      </TabGroup>

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
          onDeleteRoom={handleRefresh}
        />
      </div>
    </>
  )
}
