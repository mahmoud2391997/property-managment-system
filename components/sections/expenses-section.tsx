'use client'

import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon } from '@/components/costume-ui/icon'
import { Repeat } from 'lucide-react'
import ExpensesTable from '@/components/tables/expenses-table'
import Link from 'next/link'
import { ExpenseWithDetails } from '@/lib/expenses-utils'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'
import SectionTab from '../costume-ui/section-tab'
import { Building2, FileText, User, Briefcase, ShoppingCart } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'
import { NoAccessCard } from '@/components/no-access-card'

const CATEGORY_TABS = [
  { key: 'Property_Related', label: 'Property', icon: <Building2 size={14} /> },
  { key: 'Contract_Related', label: 'Contract', icon: <FileText size={14} /> },
  { key: 'Staff_Related', label: 'Staff', icon: <User size={14} /> },
  { key: 'Company_Related', label: 'Company', icon: <Briefcase size={14} /> },
  { key: 'Purchase_Related', label: 'Purchase', icon: <ShoppingCart size={14} /> }
]

interface ExpensesSectionProps {
  initialData: ExpenseWithDetails[]
  initialTotal: number
}

export default function ExpensesSection({
  initialData,
  initialTotal
}: ExpensesSectionProps) {
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
  } = usePaginatedSearch<ExpenseWithDetails>({
    apiRoute: '/api/expenses',
    initialData,
    initialTotal,
    pageSize: 10,
    defaultFilters: {
      category: 'Property_Related'
    }
  })

  const currentCategory = activeFilters.category || 'Property_Related'
  const selectedIndex = CATEGORY_TABS.findIndex(tab => tab.key === currentCategory)

  const handleTabChange = (index: number) => {
    updateFilters({ category: CATEGORY_TABS[index].key })
  }

  return (
    <PermissionGate 
      permission="expenses.access" 
      fallback={
        <NoAccessCard label="Expenses" />
      }
    >
      <>
        {/* Category Filter */}
        <div className={cn('flex flex-col gap-5', 'w-full')}>
          <SectionTab
            options={CATEGORY_TABS}
            selectedIndex={selectedIndex}
            onChange={handleTabChange}
          />
        </div>

        {/* Search and Actions */}
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
            <PermissionGate permission="recurring.access" fallback={null}>
              <Link href='/expenses/recurring-configs' className='flex-1 sm:flex-none'>
                <Button
                  variant='secondary'
                  icon={<Repeat size={16} />}
                  label='Recurring Configs'
                  className='w-full'
                />
              </Link>
            </PermissionGate>
            <PermissionGate permission="expenses.create" fallback={null}>
              <Link href='/expenses/add-expense' className='flex-1 sm:flex-none'>
                <Button
                  icon={<AddButtonIcon />}
                  label='Add Expense'
                  className='w-full'
                />
              </Link>
            </PermissionGate>
          </div>
        </div>

        {/* Table */}
        <ExpensesTable
          data={data}
          className='-mx-5! rounded-none! border-x-0 mb-5'
          isLoadingRows={isLoading}
          loadingRowsCount={pageSize}
        />
      </>
    </PermissionGate>
  )
}
