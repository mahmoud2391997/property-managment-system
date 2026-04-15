'use client'

import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon } from '@/components/costume-ui/icon'
import { Repeat } from 'lucide-react'
import PaymentsTable from '@/components/tables/pyaments-table'
import Link from 'next/link'
import { PaymentWithDetails } from '@/lib/payments-utils'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'
import { Tab, TabGroup } from '../costume-ui/tab'
import { useEffect, useCallback, useMemo } from 'react'
import TableFilter, { type FilterAttribute, type FilterValue } from '../costume-ui/table-filter'

// Define filterable attributes for payments
const PAYMENT_FILTER_ATTRIBUTES: FilterAttribute[] = [
  { key: 'payment_id', label: 'Payment ID', type: 'text' },
  { key: 'lease_id', label: 'Lease ID', type: 'text' },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      // Booking
      { value: 'Booking', label: 'Booking' },
      // Core rent
      { value: 'Rental', label: 'Rental' },
      { value: 'Rental_Adjustment', label: 'Rental Adjustment' },
      { value: 'Lease_Initial_Charges', label: 'Lease Initial Charges' },
      // Utilities
      { value: 'Electricity_Bill', label: 'Electricity Bill' },
      { value: 'Water_Bill', label: 'Water Bill' },
      { value: 'Internet_Bill', label: 'Internet Bill' },
      { value: 'Sewerage_Bill', label: 'Sewerage Bill' },
      // Services
      { value: 'Cleaning_Service', label: 'Cleaning Service' },
      { value: 'Parking', label: 'Parking' },
      // Penalties & Other
      { value: 'Late_Payment_Charges', label: 'Late Payment Charges' },
      { value: 'Fines_or_Penalties', label: 'Fines or Penalties' },
      { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
    ]
  },
  {
    key: 'recurring_pattern',
    label: 'Pattern',
    type: 'select',
    options: [
      { value: 'Recurring', label: 'Recurring' },
      { value: 'One-time', label: 'One-time' }
    ]
  },
  { key: 'property', label: 'Property', type: 'text' },
  { key: 'tenant_name', label: 'Tenant', type: 'text' }
]

interface PaymentsSectionProps {
  initialData: PaymentWithDetails[]
  initialTotal: number
  userType: 'staff' | 'tenant'
}

export default function PaymentsSection ({
  initialData,
  initialTotal,
  userType
}: PaymentsSectionProps) {
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
  } = usePaginatedSearch<PaymentWithDetails>({
    apiRoute: '/api/payments',
    initialData,
    initialTotal,
    pageSize: 10,
    defaultFilters: {
      status: 'all',
      payment_id: '',
      lease_id: '',
      type: '',
      recurring_pattern: '',
      property: '',
      tenant_name: ''
    },
    // Map filter keys to actual data property names
    filterKeyMapping: {
      payment_id: 'id',
      lease_id: 'lease_reference_id'
    },
    // Text filters use partial/case-insensitive matching
    textFilterKeys: ['payment_id', 'lease_id', 'property', 'tenant_name']
  })

  const statusOptions = ['all', 'Paid', 'Paid Late', 'Partially Paid', 'Overdue', 'Pending', 'Cancelled']

  // Current status from URL (via activeFilters)
  const currentStatus = activeFilters.status || 'all'

  // Handle tab selection - updates URL which triggers refetch
  const handleTabClick = (status: string) => {
    updateFilters({ status })
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
    PAYMENT_FILTER_ATTRIBUTES.forEach(attr => {
      if (!filterObj[attr.key]) {
        filterObj[attr.key] = ''
      }
    })

    updateFilters(filterObj)
  }, [updateFilters])

  // Listen for payment updates from the payment gateway return flow
  useEffect(() => {
    const handlePaymentUpdate = (event: CustomEvent) => {
      const updatedPayment = event.detail
      if (updatedPayment?.id) {
        updateItem(updatedPayment.id, updatedPayment)
      }
    }

    window.addEventListener('payment-updated', handlePaymentUpdate as EventListener)

    return () => {
      window.removeEventListener('payment-updated', handlePaymentUpdate as EventListener)
    }
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
            attributes={PAYMENT_FILTER_ATTRIBUTES}
            filters={advancedFilters}
            onFiltersChange={handleFiltersChange}
          />
          <SearchInput
            placeholder='Search payments'
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        {/* Buttons */}
        {userType === 'staff' && (
          <div className={cn('flex items-center gap-2.5', 'sm:py-5 py-2')}>
            <Link href='/payments/recurring-configs' className='flex-1 sm:flex-none'>
              <Button
                variant='secondary'
                icon={<Repeat size={16} />}
                label='Recurring Configs'
                className='w-full'
              />
            </Link>
            <Link href='/payments/add-payment' className='flex-1 sm:flex-none'>
              <Button
                icon={<AddButtonIcon className='text-neutral-300' />}
                label='Add Payment'
                className='w-full'
              />
            </Link>
          </div>
        )}
      </div>

      {/* Status Tabs */}
      <TabGroup showButton={true} className='-mx-5 px-5 mb-3'>
        {statusOptions.map((status) => (
          <Tab
            key={status}
            label={status === 'all' ? 'All' : status}
            isSelected={currentStatus === status}
            onClick={() => handleTabClick(status)}
            className='texts-tab-secondary'
          />
        ))}
      </TabGroup>

      {/* Table */}
      <div>
        <PaymentsTable
          data={data}
          userType={userType}
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