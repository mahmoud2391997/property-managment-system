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

interface PropertiesSectionProps {
  initialData: PropertyWithDetails[]
  initialTotal: number
}

export default function PropertiesSection({ initialData, initialTotal }: PropertiesSectionProps) {
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
  } = usePaginatedSearch<PropertyWithDetails>({
    apiRoute: '/api/properties',
    initialData,
    initialTotal,
    pageSize: 10,
    debounceMs: 500
  })

  return (
    <>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput
          placeholder='Search properties'
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
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
        </div>
      </div>
      {/* Table */}
      <div>
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
