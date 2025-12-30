'use client'

import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import PaymentsTable from '@/components/tables/pyaments-table'
import Link from 'next/link'
import { PaymentWithDetails } from '@/lib/payments-utils'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import { Tab, TabGroup } from '../costume-ui/tab'

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
    pageSize
  } = usePaginatedSearch<PaymentWithDetails>({
    apiRoute: '/api/payments',
    initialData,
    initialTotal,
    pageSize: 10
  })

  const {
    options: filterTabs,
    selectByIndex: selectFilterByIndex,
    selectedIndex: selectedFilterIndex
  } = useSingleSelectOption([
    {
      label: 'All',
      isSelected: true
    },
    {
      label: 'Paid',
      isSelected: false
    },
    {
      label: 'Paid Late',
      isSelected: false
    },
    {
      label: 'Overdue',
      isSelected: false
    },
    {
      label: 'Pending',
      isSelected: false
    }
  ])

  return (
    <>
      {/* Actions */}
      <div
        className={cn(
          'flex flex-col sm:flex-row justify-between sm:items-center gap-3',
          'w-full'
        )}
      >
        <SearchInput
          placeholder='Search payments'
          value={searchTerm}
          onChange={e => handleSearchChange(e.target.value)}
        />
        {/* Buttons */}
        {userType === 'staff' && (
          <div className={cn('flex items-center gap-2.5', 'sm:py-5 py-2')}>
            <Button
              icon={<DeleteButtonIcon />}
              label='Delete'
              className='bg-(--error-main)! flex-1 sm:flex-none'
            />

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

      {/* Filters */}
      <TabGroup showButton={true} className='-mx-5 px-5 mb-3'>
        {filterTabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            isSelected={tab.isSelected}
            onClick={() => selectFilterByIndex(index)}
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
