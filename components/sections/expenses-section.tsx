'use client'

import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon } from '@/components/costume-ui/icon'
import ExpensesTable from '@/components/tables/expenses-table'
import Link from 'next/link'
import { ExpenseWithDetails } from '@/lib/expenses-utils'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'

interface ExpensesSectionProps {
  initialData: ExpenseWithDetails[]
  initialTotal: number
}

export default function ExpensesSection({
  initialData,
  initialTotal
}: ExpensesSectionProps) {
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
  } = usePaginatedSearch<ExpenseWithDetails>({
    apiRoute: '/api/expenses',
    initialData,
    initialTotal,
    pageSize: 10
  })

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
          placeholder='Search expenses'
          value={searchTerm}
          onChange={e => handleSearchChange(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'sm:py-5 py-2')}>
          <Link href='/expenses/add-expense' className='flex-1 sm:flex-none'>
            <Button
              icon={<AddButtonIcon className='text-neutral-300' />}
              label='Add Expense'
              className='w-full'
            />
          </Link>
        </div>
      </div>
      {/* Table */}
      <div>
        <ExpensesTable
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
