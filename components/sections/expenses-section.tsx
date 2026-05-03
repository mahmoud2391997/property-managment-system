'use client'

import { useCallback, useMemo, useState } from 'react'
import TableFilter, { ActiveFilterChips, FilterAttribute, FilterValue } from '@/components/costume-ui/table-filter'
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
import { Tab, TabGroup } from '../costume-ui/tab'
import { Building2, FileText, User, Briefcase, ShoppingCart } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'
import { NoAccessCard } from '@/components/no-access-card'


const GLOBAL_EXPENSE_FILTERS: FilterAttribute[] = [
  { key: 'reference_id', label: 'Expense ID', type: 'text' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'Paid', label: 'Paid' },
      { value: 'Paid Late', label: 'Paid Late' },
      { value: 'Partially Paid', label: 'Partially Paid' },
      { value: 'Pending', label: 'Pending' },
      { value: 'Overdue', label: 'Overdue' },
      { value: 'Cancelled', label: 'Cancelled' }
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
  { key: 'due_month', label: 'Due Month', type: 'month' },
  { key: 'due_date', label: 'Due Date', type: 'date' },
  { key: 'due_date_range', label: 'Due Date Range', type: 'dateRange' },
  { key: 'dueDateFrom', label: 'Due From', type: 'date' },
  { key: 'dueDateTo', label: 'Due To', type: 'date' }
]

const CATEGORY_FILTERS: Record<string, FilterAttribute[]> = {
  Property_Related: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Refund', label: 'Refund' },
        { value: 'Agent_Commission', label: 'Agent Commission' },
        { value: 'Maintenance', label: 'Maintenance' },
        { value: 'Cleaning_Service', label: 'Cleaning Service' },
        { value: 'Internet_Bill', label: 'Internet Bill' },
        { value: 'Water_Bill', label: 'Water Bill' },
        { value: 'Electricity_Bill', label: 'Electricity Bill' },
        { value: 'Sewerage_Bill', label: 'Sewerage Bill' },
        { value: 'Management_Fees', label: 'Management Fees' },
        { value: 'Renovation', label: 'Renovation' },
        { value: 'Painting_Service', label: 'Painting Service' },
        { value: 'AC_Service_Installation', label: 'AC Service/Installation' },
        { value: 'Wiring_Electrical', label: 'Wiring/Electrical' },
        { value: 'Plumbing', label: 'Plumbing' },
        { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
      ]
    },
    { key: 'property', label: 'Property', type: 'text' },
    { key: 'lease_id', label: 'Lease Ref', type: 'text' },
    { key: 'vendor', label: 'Vendor', type: 'text' },
    {
      key: 'is_claimed',
      label: 'Claimed',
      type: 'select',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
    }
  ],
  Contract_Related: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Rental', label: 'Rental' },
        { value: 'Contract_Initial_Charges', label: 'Contract Initial Charges' }
      ]
    },
    { key: 'contract_id', label: 'Contract Ref', type: 'text' },
    { key: 'owner_name', label: 'Owner', type: 'text' }
  ],
  Staff_Related: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Salary', label: 'Salary' },
        { value: 'Allowances', label: 'Allowances' },
        { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
      ]
    },
    { key: 'staff_name', label: 'Staff', type: 'text' },
    { key: 'month', label: 'Salary Month', type: 'month' }
  ],
  Company_Related: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Office_Rent', label: 'Office Rent' },
        { value: 'ICT_Equipment', label: 'ICT Equipment' },
        { value: 'Office_Stationary', label: 'Office Stationary' },
        { value: 'Software_Subscription', label: 'Software Subscription' },
        { value: 'Professional_Fees', label: 'Professional Fees' },
        { value: 'Bank_Charges', label: 'Bank Charges' },
        { value: 'Marketing___Advertising', label: 'Marketing & Advertising' },
        { value: 'Insurance', label: 'Insurance' },
        { value: 'Licenses___Government_Fees', label: 'Licenses & Government Fees' },
        { value: 'Plant___Machinery', label: 'Plant & Machinery' },
        { value: 'Company_Equipment', label: 'Company Equipment' },
        { value: 'Vehicle_Repair___Servicing', label: 'Vehicle Repair & Servicing' },
        { value: 'Transportation', label: 'Transportation' },
        { value: 'Vehicle_Purchase', label: 'Vehicle Purchase' },
        { value: 'Property_Purchase', label: 'Property Purchase' },
        { value: 'Loan', label: 'Loan' },
        { value: 'Tax', label: 'Tax' },
        { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
      ]
    },
    {
      key: 'is_asset',
      label: 'Asset',
      type: 'select',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
    },
    {
      key: 'is_claimed',
      label: 'Claimed',
      type: 'select',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
    },
    { key: 'vendor', label: 'Vendor', type: 'text' }
  ],
  Purchase_Related: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Furniture', label: 'Furniture' },
        { value: 'Home_Appliances', label: 'Home Appliances' },
        { value: 'Office_Appliances', label: 'Office Appliances' },
        { value: 'Tools', label: 'Tools' },
        { value: 'Electrical_Items', label: 'Electrical Items' },
        { value: 'Plumbing_Items', label: 'Plumbing Items' },
        { value: 'Lighting___Bulbs', label: 'Lighting & Bulbs' },
        { value: 'Paint___Renovation_Materials', label: 'Paint & Renovation Materials' },
        { value: 'Maintenance_Consumables', label: 'Maintenance Consumables' },
        { value: 'Safety_Items', label: 'Safety Items' },
        { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
      ]
    },
    {
      key: 'is_asset',
      label: 'Asset',
      type: 'select',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
    },
    { key: 'property', label: 'Property', type: 'text' },
    { key: 'vendor', label: 'Vendor', type: 'text' },
    {
      key: 'is_claimed',
      label: 'Claimed',
      type: 'select',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
    }
  ]
}

const ALL_CATEGORY_FILTER_KEYS = Array.from(
  new Set(Object.values(CATEGORY_FILTERS).flat().map(a => a.key))
)

const CATEGORY_TABS = [
  { key: 'Property_Related', label: 'Property', icon: <Building2 size={14} /> },
  { key: 'Contract_Related', label: 'Contract', icon: <FileText size={14} /> },
  { key: 'Staff_Related', label: 'Staff', icon: <User size={14} /> },
  { key: 'Company_Related', label: 'Company', icon: <Briefcase size={14} /> },
  { key: 'Purchase_Related', label: 'Purchase', icon: <ShoppingCart size={14} /> }
]

const STATUS_OPTIONS = ['all', 'Paid', 'Paid Late', 'Partially Paid', 'Overdue', 'Pending', 'Cancelled']

interface ExpensesSectionProps {
  initialData: ExpenseWithDetails[]
  initialTotal: number
}

export default function ExpensesSection({
  initialData,
  initialTotal
}: ExpensesSectionProps) {
  const { can } = usePermissions()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
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
    activeFilters,
    resetSearch
  } = usePaginatedSearch<ExpenseWithDetails>({
    apiRoute: '/api/expenses',
    initialData,
    initialTotal,
    pageSize: 10,
    defaultFilters: {
      category: 'Property_Related',
      status: '',
      reference_id: '',
      recurring_pattern: '',
      due_month: '',
      due_date: '',
      dueDateFrom: '',
      dueDateTo: '',
      type: '',
      property: '',
      lease_id: '',
      vendor: '',
      is_claimed: '',
      contract_id: '',
      owner_name: '',
      staff_name: '',
      month: '',
      is_asset: ''
    },
    filterKeyMapping: {
      lease_id: 'context_label',
      contract_id: 'context_label',
      property: 'context_label',
      owner_name: 'context_subtitle',
      staff_name: 'context_label',
      due_month: 'due_date',
      due_date: 'due_date',
      dueDateFrom: 'due_date',
      dueDateTo: 'due_date'
    },
    textFilterKeys: [
      'reference_id', 'property', 'lease_id', 'vendor',
      'contract_id', 'owner_name', 'staff_name', 'status'
    ],
    monthFilterKeys: ['due_month', 'month'],
    dateFilterKeys: ['due_date', 'dueDateFrom', 'dueDateTo']
  })

  const currentCategory = activeFilters.category || 'Property_Related'
  const selectedIndex = CATEGORY_TABS.findIndex(tab => tab.key === currentCategory)

  // Status tabs
  const currentStatus = activeFilters.status || 'all'
  const handleStatusTabClick = (status: string) => {
    updateFilters({ status })
  }

  const currentAttributes = useMemo(() => {
    return [...GLOBAL_EXPENSE_FILTERS, ...(CATEGORY_FILTERS[currentCategory] || [])]
  }, [currentCategory])

  const advancedFilters = useMemo(() => {
    const filters: FilterValue[] = []
    const from = activeFilters.dueDateFrom
    const to = activeFilters.dueDateTo
    
    // Combine dueDateFrom/dueDateTo into single due_date_range filter for display
    if (from || to) {
      filters.push({ id: 'due_date_range', attribute: 'due_date_range', value: `${from || ''},${to || ''}` })
    }
    
    // Add all other filters
    Object.entries(activeFilters)
      .filter(([key, value]) => value && key !== 'category' && key !== 'status' && key !== 'dueDateFrom' && key !== 'dueDateTo' && currentAttributes.some(a => a.key === key))
      .forEach(([key, value]) => {
        filters.push({ id: key, attribute: key, value })
      })
    
    return filters
  }, [activeFilters, currentAttributes])

  const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
    const filterObj: Record<string, string> = {}

    // Set values for active filters
    newFilters.forEach(f => {
      if (f.attribute && f.value) {
        if (f.attribute === 'due_date_range') {
          const parts = f.value.split(',')
          if (parts[0]) filterObj.dueDateFrom = parts[0].trim()
          if (parts[1]) filterObj.dueDateTo = parts[1].trim()
        } else {
          filterObj[f.attribute] = f.value
        }
      }
    })

    // Clear filters that were removed
    currentAttributes.forEach(attr => {
      if (!filterObj[attr.key]) {
        filterObj[attr.key] = ''
      }
    })
    // Also clear expanded date range filters
    if (!filterObj.dueDateFrom) filterObj.dueDateFrom = ''
    if (!filterObj.dueDateTo) filterObj.dueDateTo = ''

    updateFilters(filterObj)
  }, [updateFilters, currentAttributes])

  const handleRemoveFilter = useCallback((id: string) => {
    const filterToRemove = advancedFilters.find(f => f.id === id)
    if (filterToRemove) {
      if (filterToRemove.attribute === 'due_date_range') {
        updateFilters({ dueDateFrom: '', dueDateTo: '' })
      } else {
        updateFilters({ [filterToRemove.attribute]: '' })
      }
    }
  }, [advancedFilters, updateFilters])

  const handleClearAllFilters = useCallback(() => {
    const filterObj: Record<string, string> = {}
    currentAttributes.forEach(attr => {
      filterObj[attr.key] = ''
    })
    filterObj.dueDateFrom = ''
    filterObj.dueDateTo = ''
    updateFilters(filterObj)
  }, [currentAttributes, updateFilters])

  const handleCategoryChange = (index: number) => {
    const newCategory = CATEGORY_TABS[index].key
    const cleared: Record<string, string> = { category: newCategory }
    for (const key of ALL_CATEGORY_FILTER_KEYS) cleared[key] = ''
    for (const filter of GLOBAL_EXPENSE_FILTERS) {
      if (filter.key !== 'category') cleared[filter.key] = ''
    }
    resetSearch()
    updateFilters(cleared)
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
        <div className={cn('flex justify-center w-full')}>
          <SectionTab
            options={CATEGORY_TABS}
            selectedIndex={selectedIndex}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Search and Actions */}
        <div
          className={cn(
            'flex flex-col sm:flex-row justify-between sm:items-center gap-3',
            'w-full'
          )}
        >
          <div className='flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md'>
            <TableFilter
              attributes={currentAttributes}
              filters={advancedFilters}
              onFiltersChange={handleFiltersChange}
              open={isFilterOpen}
              onOpenChange={setIsFilterOpen}
            />
            <SearchInput
              placeholder={`Search ${currentCategory.split('_')[0].toLowerCase()} expenses`}
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              className='flex-1'
            />
          </div>
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

        {/* Status Tabs */}
        <TabGroup showButton={true} className='-mx-5 px-5 mb-3'>
          {STATUS_OPTIONS.map((status) => (
            <Tab
              key={status}
              label={status === 'all' ? 'All' : status}
              isSelected={currentStatus === status}
              onClick={() => handleStatusTabClick(status)}
              className='texts-tab-secondary'
            />
          ))}
        </TabGroup>

        
        {/* Table */}
        <ExpensesTable
          data={data}
          className='-mx-5! rounded-none! border-x-0 mb-5'
          isLoading={isLoading}
          isLoadingRows={isLoading}
          loadingRowsCount={pageSize}
          currentPage={currentPage}
          totalItems={total}
          pageSize={pageSize}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
          canDelete={can('expenses.delete')}
          canUpdate={can('expenses.update')}
          canApprove={can('expenses.approve')}
        />
      </>
    </PermissionGate>
  )
}
