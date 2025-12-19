'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Tab, TabGroup } from './costume-ui/tab'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import TableSectionSkeleton from './loading-ui/table-section-skeleton'
import RecurringPaymentsTable from './tables/recurring-payments-table'
import { RecurringConfigWithDetails } from '@/app/api/properties/[id]/recurring-configs/route'

type Props = {
  propertyId: string
}

export default function RecurringSection({ propertyId }: Props) {
  const [recurringPayments, setRecurringPayments] = useState<RecurringConfigWithDetails[]>([])
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringConfigWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const {
    options: tabs,
    selectByIndex,
    selectedIndex
  } = useSingleSelectOption([
    {
      label: 'Recurring Payments',
      isSelected: true
    },
    {
      label: 'Recurring Expenses',
      isSelected: false
    }
  ])

  const fetchRecurringConfigs = useCallback(async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/recurring-configs`)
      if (response.ok) {
        const data = await response.json()
        setRecurringPayments(data.recurringPayments || [])
        setRecurringExpenses(data.recurringExpenses || [])
      }
    } catch (error) {
      console.error('Error fetching recurring configs:', error)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchRecurringConfigs()
  }, [fetchRecurringConfigs])

  if (loading) {
    return <TableSectionSkeleton />
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        'p-5 py-2.5 rounded-[12px]',
        'bg-(--background-primary)'
      )}
    >
      <TabGroup className='-mx-5 px-5'>
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            isSelected={tab.isSelected}
            onClick={() => selectByIndex(index)}
          />
        ))}
      </TabGroup>

      {/* Content based on selected tab */}
      {selectedIndex === 0 ? (
        <RecurringPaymentsTable
          data={recurringPayments}
          onRefresh={fetchRecurringConfigs}
          className='-mx-5! rounded-none! border-x-0'
        />
      ) : (
        <div className='py-12 text-center text-(--text-secondary)'>
          Recurring expenses coming soon
        </div>
      )}
    </div>
  )
}