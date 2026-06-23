'use client'

import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import {
  AddButtonIcon,
  ImportButtonIcon
} from '@/components/costume-ui/icon'
import PropertiesTable from '@/components/tables/properties-table'
import Link from 'next/link'
import { PropertyWithDetails } from '@/lib/properties-utils'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'
import { useCallback, useMemo } from 'react'
import { Tab, TabGroup } from '../costume-ui/tab'
import TableFilter, { type FilterAttribute, type FilterValue } from '../costume-ui/table-filter'
import { usePermissions } from '@/hooks/use-permissions'

// Define filterable attributes for properties
const PROPERTY_FILTER_ATTRIBUTES: FilterAttribute[] = [
  { key: 'code', label: 'Property Code', type: 'text' },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'Apartment', label: 'Apartment' },
      { value: 'House', label: 'House' },
      { value: 'Commercial_Unit', label: 'Commercial Unit' },
      { value: 'Studio', label: 'Studio' }
    ]
  },
  { key: 'project', label: 'Project', type: 'text' },
  { key: 'state', label: 'State', type: 'text' }
]

interface PropertiesSectionProps {
  initialData: PropertyWithDetails[]
  initialTotal: number
}

export default function PropertiesSection({ initialData, initialTotal }: PropertiesSectionProps) {
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
  } = usePaginatedSearch<PropertyWithDetails>({
    apiRoute: '/api/properties',
    initialData,
    initialTotal,
    pageSize: 10,
    defaultFilters: {
      status: 'all',
      code: '',
      type: '',
      project: '',
      state: ''
    },
    textFilterKeys: ['code', 'project', 'state']
  })

  const statusOptions = [
    'all',
    'Occupied',
    'Vacant',
    'Pending_Inspection',
    'Under_Preparation'
  ]

  // Current status from URL (via activeFilters)
  const currentStatus = activeFilters.status || 'all'

  // Handle tab selection
  const handleTabClick = (status: string) => {
    updateFilters({ status })
  }

  // Convert activeFilters (Record) to FilterValue[] for TableFilter component
  const advancedFilters = useMemo((): FilterValue[] => {
    return Object.entries(activeFilters)
      .filter(([key, value]) => value && key !== 'status')
      .map(([key, value]) => ({ id: key, attribute: key, value }))
  }, [activeFilters])

  // Handle advanced filters change
  const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
    const filterObj: Record<string, string> = {}

    newFilters.forEach(f => {
      if (f.attribute && f.value) {
        filterObj[f.attribute] = f.value
      }
    })

    PROPERTY_FILTER_ATTRIBUTES.forEach(attr => {
      if (!filterObj[attr.key]) {
        filterObj[attr.key] = ''
      }
    })

    updateFilters(filterObj)
  }, [updateFilters])

  // Format status label for display
  const formatStatusLabel = (status: string) => {
    if (status === 'all') return 'All'
    return status.replace(/_/g, ' ')
  }

  return (
    <>
      {/* Actions */}
      <div className={cn('flex flex-col sm:flex-row justify-between sm:items-center gap-3', 'w-full')}>
        <div className='flex items-center gap-2'>
          <TableFilter
            attributes={PROPERTY_FILTER_ATTRIBUTES}
            filters={advancedFilters}
            onFiltersChange={handleFiltersChange}
          />
          <SearchInput
            placeholder='Search properties'
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        {/* Buttons */}
        <div className='flex items-center gap-2.5'>
          {can('properties.create') && (
            <>
              <Link href='/properties/import-properties'>
                <Button
                  variant='secondary'
                  icon={<ImportButtonIcon className='text-neutral-400' />}
                  label='Import'
                />
              </Link>

              <Link href='/properties/add-property'>
                <Button
                  icon={<AddButtonIcon className='text-neutral-300' />}
                  label='Add Property'
                />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <TabGroup showButton={true} className='-mx-5 px-5 mb-3'>
        {statusOptions.map(status => (
          <Tab
            key={status}
            label={formatStatusLabel(status)}
            isSelected={currentStatus === status}
            onClick={() => handleTabClick(status)}
            className='texts-tab-secondary'
          />
        ))}
      </TabGroup>

      {/* Table */}
      <div className='pb-5'>
        <PropertiesTable
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
