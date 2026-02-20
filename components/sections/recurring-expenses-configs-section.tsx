'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import RecurringExpensesTable from '@/components/tables/recurring-expenses-table'
import { RecurringExpenseConfigWithProperty } from '@/app/api/expenses/recurring-configs/route'
import { Tab, TabGroup } from '../costume-ui/tab'

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
    <>
      {/* Actions */}
      <div
        className={cn(
          'flex flex-col sm:flex-row justify-between sm:items-center gap-3',
          'w-full'
        )}
      >
        <SearchInput
          placeholder='Search configs'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Status Tabs */}
      <TabGroup className='-mx-5 px-5 mb-3'>
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
      <div>
        <RecurringExpensesTable
          data={filteredData}
          onRefresh={onRefresh}
          showProperty
        />
      </div>
    </>
  )
}
