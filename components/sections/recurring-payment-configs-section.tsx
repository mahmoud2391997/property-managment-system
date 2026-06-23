'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import RecurringPaymentConfigsTable from '@/components/tables/recurring-payment-configs-table'
import { Tab, TabGroup } from '../costume-ui/tab'
import { RecurringPaymentConfigItem } from '@/types'

const STATUS_OPTIONS = ['all', 'Active', 'Paused']

interface Props {
  initialData: RecurringPaymentConfigItem[]
  initialTotal: number
  onRefresh?: () => void
}

export default function RecurringPaymentConfigsSection({
  initialData,
  initialTotal,
  onRefresh
}: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredData = useMemo(() => {
    let result = initialData

    if (statusFilter === 'Active') {
      result = result.filter(item => item.is_active)
    } else if (statusFilter === 'Paused') {
      result = result.filter(item => !item.is_active)
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(item =>
        item.title.toLowerCase().includes(lower) ||
        (item.property_name && item.property_name.toLowerCase().includes(lower)) ||
        (item.room_name && item.room_name.toLowerCase().includes(lower)) ||
        (item.payment_type && item.payment_type.replace(/_/g, ' ').toLowerCase().includes(lower)) ||
        (item.lease_reference_id && item.lease_reference_id.toLowerCase().includes(lower))
      )
    }

    return result
  }, [initialData, searchTerm, statusFilter])

  return (
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
      <RecurringPaymentConfigsTable
        data={filteredData}
        onRefresh={onRefresh}
      />
    </>
  )
}
