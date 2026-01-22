'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import CustomButton from './costume-ui/button'
import { AddButtonIcon } from './costume-ui/icon'
import { Tab, TabGroup } from './costume-ui/tab'
import SectionTab from './costume-ui/section-tab'
import SearchInput from './costume-ui/search-input'
import Link from 'next/link'
import PaymentsTable from './tables/pyaments-table'
import { PaymentWithDetails } from '@/lib/payments-utils'
import TableSectionSkeleton from './loading-ui/table-section-skeleton'
import { CreditCard, Receipt } from 'lucide-react'
import { SectionUnderDevelopment } from './costume-ui/under-development'
import TableFilter, { type FilterAttribute, type FilterValue } from './costume-ui/table-filter'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'

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
      { value: 'Rental_Adjustment', label: 'Rental Adjustment' },
      { value: 'Lease_Initial_Charges', label: 'Lease Initial Charges' },
      { value: 'Electricity_Bill', label: 'Electricity Bill' },
      { value: 'Water_Bill', label: 'Water Bill' },
      { value: 'Internet_Bill', label: 'Internet Bill' },
      { value: 'Sewerage_Bill', label: 'Sewerage Bill' },
      { value: 'Cleaning_Service', label: 'Cleaning Service' },
      { value: 'Parking', label: 'Parking' },
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
  { key: 'tenant_name', label: 'Tenant', type: 'text' }
]

type Props = {
  propertyId?: string
  roomId?: string
  hasActiveLease?: boolean
  activeLeaseId?: string
}

const STATUS_OPTIONS = ['all', 'Paid', 'Paid Late', 'Partially Paid', 'Overdue', 'Pending', 'Cancelled']

export default function PaymentsSection({ propertyId, roomId, hasActiveLease = false, activeLeaseId }: Props) {
  const [initialData, setInitialData] = useState<PaymentWithDetails[] | null>(null)
  const [initialTotal, setInitialTotal] = useState<number>(0)
  const [initialLoading, setInitialLoading] = useState(true)

  // For section tabs (Payments/Expenses)
  const [selectedSection, setSelectedSection] = useState(0)

  // Room mode: no expenses tab, show section header instead
  const isRoomMode = !!roomId && !propertyId

  // Build API route with propertyId or roomId
  const apiRoute = useMemo(() => {
    const params = new URLSearchParams()
    if (propertyId) params.append('propertyId', propertyId)
    if (roomId) params.append('roomId', roomId)
    const queryString = params.toString()
    return queryString ? `/api/payments?${queryString}` : '/api/payments'
  }, [propertyId, roomId])

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const params = new URLSearchParams()
        params.append('paginate', 'true')
        params.append('page', '1')
        params.append('limit', '10')
        if (propertyId) params.append('propertyId', propertyId)
        if (roomId) params.append('roomId', roomId)

        const response = await fetch(`/api/payments?${params.toString()}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setInitialData(result.data)
            setInitialTotal(result.total)
          } else {
            // Legacy response format
            setInitialData(result)
            setInitialTotal(result.length)
          }
        }
      } catch (error) {
        console.error('Error fetching initial payments:', error)
        setInitialData([])
        setInitialTotal(0)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchInitialData()
  }, [propertyId, roomId])

  // Use the paginated search hook once initial data is loaded
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
  } = usePaginatedSearch<PaymentWithDetails>({
    apiRoute,
    initialData: initialData || [],
    initialTotal,
    pageSize: 10,
    defaultFilters: {
      status: 'all',
      payment_id: '',
      lease_id: '',
      type: '',
      recurring_pattern: '',
      tenant_name: ''
    },
    // Map filter keys to actual data property names
    filterKeyMapping: {
      payment_id: 'id',
      lease_id: 'lease_reference_id'
    },
    // Text filters use partial/case-insensitive matching
    textFilterKeys: ['payment_id', 'lease_id', 'tenant_name']
  })

  // Current status from activeFilters
  const currentStatus = activeFilters.status || 'all'

  // Handle tab selection
  const handleTabClick = (status: string) => {
    updateFilters({ status })
  }

  // Convert activeFilters to FilterValue[] for TableFilter component
  const advancedFilters = useMemo((): FilterValue[] => {
    return Object.entries(activeFilters)
      .filter(([key, value]) => value && key !== 'status')
      .map(([key, value]) => ({ id: key, attribute: key, value }))
  }, [activeFilters])

  // Handle filter changes from TableFilter
  const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
    const filterObj: Record<string, string> = {}

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

  const isPaymentsTab = selectedSection === 0 || isRoomMode
  const isExpensesTab = selectedSection === 1 && !isRoomMode

  // Determine add payment URL based on mode
  const addPaymentUrl = roomId
    ? `/rooms/${roomId}/add-payment`
    : propertyId
      ? `/properties/${propertyId}/add-payment`
      : '/payments/add-payment'

  if (initialLoading || initialData === null) {
    return <TableSectionSkeleton />
  }

  return (
    <div
      className={cn(
        'flex flex-col',
        'p-5 py-2.5 rounded-[12px]',
        'bg-(--background-primary) '
      )}
    >
      {/* Room mode: Show section header instead of tabs */}
      {isRoomMode ? (
        <div className='flex items-center gap-2.5 py-2'>
          <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-[#DEFFE2] text-(--success-dark)'>
            <CreditCard size={19} strokeWidth={1.5} />
          </div>
          <div className='flex flex-col'>
            <h3 className='mb-1'>Payments</h3>
            <span className='texts-caption-large text-(--text-secondary)'>
              Tenant payment records for this room
            </span>
          </div>
        </div>
      ) : (
        <div className='py-3'>
          <SectionTab
            options={[
              { label: 'Payments', icon: <CreditCard size={16} /> },
              { label: 'Expenses', icon: <Receipt size={16} /> }
            ]}
            selectedIndex={selectedSection}
            onChange={setSelectedSection}
          />
        </div>
      )}

      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <div className='flex items-center gap-2'>
          {isPaymentsTab && (
            <TableFilter
              attributes={PAYMENT_FILTER_ATTRIBUTES}
              filters={advancedFilters}
              onFiltersChange={handleFiltersChange}
            />
          )}
          <SearchInput
            placeholder={isPaymentsTab ? 'Search payments' : 'Search expenses'}
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          {/* Only show Add Payment button if there's an active lease, always show Add Expense */}
          {(isPaymentsTab ? hasActiveLease : true) && (
            <Link href={isPaymentsTab ? addPaymentUrl : '/expenses/add-expense'}>
              <CustomButton
                icon={<AddButtonIcon className='text-neutral-300' />}
                label={isPaymentsTab ? 'Add Payment' : 'Add Expense'}
              />
            </Link>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      {isPaymentsTab && (
        <TabGroup showButton={true} className='-mx-5 px-5 mb-3'>
          {STATUS_OPTIONS.map((status) => (
            <Tab
              key={status}
              label={status === 'all' ? 'All' : status}
              isSelected={currentStatus === status}
              onClick={() => handleTabClick(status)}
              className='texts-tab-secondary'
            />
          ))}
        </TabGroup>
      )}

      {/* Tables */}
      {isPaymentsTab && (
        <PaymentsTable
          data={data}
          showPropertyColumn={false}
          showLeaseColumn={true}
          activeLeaseId={activeLeaseId}
          isLoading={isLoading}
          currentPage={currentPage}
          totalItems={total}
          pageSize={pageSize}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
          className='-mx-5! rounded-none! border-x-0'
        />
      )}
      {isExpensesTab && (
        <SectionUnderDevelopment />
      )}
    </div>
  )
}