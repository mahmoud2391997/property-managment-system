'use client'

import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon } from '@/components/costume-ui/icon'
import PaymentsTable from '@/components/tables/pyaments-table'
import Link from 'next/link'
import { PaymentWithDetails } from '@/lib/payments-utils'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'
import { Tab, TabGroup } from '../costume-ui/tab'
import { useEffect, useState, useMemo, useCallback } from 'react'
import TableFilter, { ActiveFilterChips, type FilterAttribute, type FilterValue } from '../costume-ui/table-filter'

// Define filterable attributes for payments
const PAYMENT_FILTER_ATTRIBUTES: FilterAttribute[] = [
  { key: 'payment_id', label: 'Payment ID', type: 'text' },
  { key: 'lease_id', label: 'Lease ID', type: 'text' },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'Rental', label: 'Rental' },
      { value: 'Deposit', label: 'Deposit' },
      { value: 'Utilities', label: 'Utilities' },
      { value: 'Maintenance', label: 'Maintenance' },
      { value: 'Other', label: 'Other' }
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
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<FilterValue[]>([])

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
    defaultFilters: { status: 'all' }
  })

  const statusOptions = ['all', 'Paid', 'Paid Late', 'Partially Paid', 'Overdue', 'Pending', 'Cancelled']

  // Current status from URL (via activeFilters)
  const currentStatus = activeFilters.status || 'all'

  // Handle tab selection - updates URL which triggers refetch
  const handleTabClick = (status: string) => {
    updateFilters({ status })
  }

  // Handle advanced filters change
  const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
    setAdvancedFilters(newFilters)
  }, [])

  // Remove single filter
  const handleRemoveFilter = useCallback((id: string) => {
    setAdvancedFilters(prev => prev.filter(f => f.id !== id))
  }, [])

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setAdvancedFilters([])
  }, [])

  // Apply client-side filtering for advanced filters
  const filteredData = useMemo(() => {
    if (advancedFilters.length === 0) return data

    return data.filter(payment => {
      return advancedFilters.every(filter => {
        if (!filter.attribute || !filter.value) return true

        const filterValue = filter.value.toLowerCase()

        switch (filter.attribute) {
          case 'payment_id':
            return payment.id.toLowerCase().includes(filterValue)
          case 'lease_id':
            return payment.lease_reference_id?.toLowerCase().includes(filterValue) ?? false
          case 'type':
            return payment.type === filter.value
          case 'recurring_pattern':
            return payment.recurring_pattern === filter.value
          case 'property':
            return payment.property.toLowerCase().includes(filterValue)
          case 'tenant_name':
            return payment.tenant_name.toLowerCase().includes(filterValue)
          default:
            return true
        }
      })
    })
  }, [data, advancedFilters])

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
        <div className='flex items-center gap-2.5'>
          <SearchInput
            placeholder='Search payments'
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
          <TableFilter
            attributes={PAYMENT_FILTER_ATTRIBUTES}
            filters={advancedFilters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
        {/* Buttons */}
        {userType === 'staff' && (
          <div className={cn('flex items-center gap-2.5', 'sm:py-5 py-2')}>
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

      {/* Active Filter Chips */}
      {advancedFilters.length > 0 && (
        <ActiveFilterChips
          filters={advancedFilters}
          attributes={PAYMENT_FILTER_ATTRIBUTES}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          className='mb-2'
        />
      )}

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
          data={filteredData}
          userType={userType}
          isLoading={isLoading}
          currentPage={currentPage}
          totalItems={advancedFilters.length > 0 ? filteredData.length : total}
          pageSize={pageSize}
          canGoNext={advancedFilters.length > 0 ? false : canGoNext}
          canGoPrevious={advancedFilters.length > 0 ? false : canGoPrevious}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
        />
      </div>
    </>
  )
}
