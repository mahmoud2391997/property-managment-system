'use client'

import { useCallback, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { ImportButtonIcon } from '@/components/costume-ui/icon'
import TenantsTable from '@/components/tables/tenants-table'
import AddTenantDialog from '@/components/dialogs/add-tenant-dialog'
import { TenantWithDetails } from '@/lib/tenants-utils'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'
import { Tab, TabGroup } from '../costume-ui/tab'
import TableFilter, { type FilterAttribute, type FilterValue } from '../costume-ui/table-filter'

// Define filterable attributes for tenants
const TENANT_FILTER_ATTRIBUTES: FilterAttribute[] = [
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'Individual', label: 'Individual' },
      { value: 'Company', label: 'Company' }
    ]
  },
  {
    key: 'identity_type',
    label: 'Identity Type',
    type: 'select',
    options: [
      { value: 'mykad', label: 'MyKad' },
      { value: 'passport', label: 'Passport' }
    ]
  },
  {
    key: 'account_status',
    label: 'Account Status',
    type: 'select',
    options: [
      { value: 'Activated', label: 'Activated' },
      { value: 'Pending', label: 'Pending' }
    ]
  },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'identity_number', label: 'Identity Number', type: 'text' },
  { key: 'phone_number', label: 'Phone Number', type: 'text' }
]

interface TenantsSectionProps {
  initialData: TenantWithDetails[]
  initialTotal: number
}

export default function TenantsSection({
  initialData,
  initialTotal
}: TenantsSectionProps) {
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
    updateItem,
    updateFilters,
    activeFilters
  } = usePaginatedSearch<TenantWithDetails>({
    apiRoute: '/api/tenants',
    initialData,
    initialTotal,
    pageSize: 10,
    defaultFilters: {
      rental_status: 'all',
      type: '',
      identity_type: '',
      account_status: '',
      name: '',
      email: '',
      identity_number: '',
      phone_number: ''
    },
    filterKeyMapping: {
      account_status: 'accountStatus'
    },
    textFilterKeys: ['name', 'email', 'identity_number', 'phone_number']
  })

  const rentalStatusOptions = ['all', 'Renting', 'Not Renting']

  // Current rental status from URL (via activeFilters)
  const currentRentalStatus = activeFilters.rental_status || 'all'

  // Handle tab selection - updates URL which triggers refetch
  const handleTabClick = (status: string) => {
    updateFilters({ rental_status: status })
  }

  // Convert activeFilters (Record) to FilterValue[] for TableFilter component
  const advancedFilters = useMemo((): FilterValue[] => {
    return Object.entries(activeFilters)
      .filter(([key, value]) => value && key !== 'rental_status') // Exclude rental_status (handled by tabs)
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
    TENANT_FILTER_ATTRIBUTES.forEach(attr => {
      if (!filterObj[attr.key]) {
        filterObj[attr.key] = ''
      }
    })

    updateFilters(filterObj)
  }, [updateFilters])

  const handleInviteSent = useCallback((tenantId: string) => {
    updateItem(tenantId, { inviteSent: true })
  }, [updateItem])

  return (
    <>
      {/* Actions */}
      <div
        className={cn(
          'flex flex-col sm:flex-row justify-between sm:items-center gap-3',
          'w-full'
        )}
      >
        <div className='flex items-center gap-2'>
          <TableFilter
            attributes={TENANT_FILTER_ATTRIBUTES}
            filters={advancedFilters}
            onFiltersChange={handleFiltersChange}
          />
          <SearchInput
            placeholder='Search tenants'
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'sm:py-5 py-2')}>
          <Link href='/tenants/import-tenants' className='flex-1 sm:flex-none'>
            <Button
              variant='secondary'
              icon={<ImportButtonIcon className='text-neutral-400' />}
              label='Import'
              className='w-full'
            />
          </Link>
          <AddTenantDialog />
        </div>
      </div>

      {/* Rental Status Tabs */}
      <TabGroup showButton={true} className='-mx-5 px-5 mb-3'>
        {rentalStatusOptions.map((status) => (
          <Tab
            key={status}
            label={status === 'all' ? 'All' : status}
            isSelected={currentRentalStatus === status}
            onClick={() => handleTabClick(status)}
            className='texts-tab-secondary'
          />
        ))}
      </TabGroup>

      {/* Table */}
      <TenantsTable
        data={data}
        isLoading={isLoading}
        currentPage={currentPage}
        totalItems={total}
        pageSize={pageSize}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        onNextPage={goToNextPage}
        onPreviousPage={goToPreviousPage}
        onInviteSent={handleInviteSent}
      />
    </>
  )
}
