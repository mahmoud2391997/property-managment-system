'use client'

import { useState, useMemo } from 'react'
import SearchInput from '@/components/costume-ui/search-input'
import RecurringExpensesTable from '@/components/tables/recurring-expenses-table'
import { Tab, TabGroup } from '../costume-ui/tab'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'
import { NoAccessCard } from '@/components/no-access-card'

const STATUS_OPTIONS = ['all', 'Active', 'Paused']

interface RecurringExpensesConfigsSectionProps {
  initialData: RecurringExpenseConfigWithProperty[]
  initialTotal: number
  onRefresh?: () => void
}

export default function RecurringExpensesConfigsSection({
  initialData,
  initialTotal,
  onRefresh
}: RecurringExpensesConfigsSectionProps) {
  const { can } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredData = useMemo(() => {
    let result = initialData

    // Status filter
    if (statusFilter === 'Active') {
      result = result.filter(item => item.is_active)
    } else if (statusFilter === 'Paused') {
      result = result.filter(item => !item.is_active)
    }

    // Search filter
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(item =>
        item.title.toLowerCase().includes(lower) ||
        (item.property_name && item.property_name.toLowerCase().includes(lower)) ||
        (item.payment_type && item.payment_type.replace(/_/g, ' ').toLowerCase().includes(lower))
      )
    }

    return result
  }, [initialData, searchTerm, statusFilter])

  return (
    <PermissionGate 
      permission="recurring.access" 
      fallback={
        <NoAccessCard label="Recurring Expenses" />
      }
    >
      <>
        {/* Search */}
        <div className='w-full'>
          <SearchInput
            placeholder='Search by title, property, or type...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Tabs */}
        <TabGroup className='-mx-5 px-5 mb-1'>
          {STATUS_OPTIONS.map(status => (
            <Tab
              key={status}
              label={status === 'all' ? 'All' : status}
              isSelected={statusFilter === status}
              onClick={() => setStatusFilter(status)}
              className='texts-tab-secondary'
            />
          ))}
        </TabGroup>

        {/* Table */}
        <RecurringExpensesTable
          data={filteredData}
          onRefresh={onRefresh}
          showProperty
        />
      </>
    </PermissionGate>
  )
}
