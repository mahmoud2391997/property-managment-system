'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import SectionTab from './costume-ui/section-tab'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import TableSectionSkeleton from './loading-ui/table-section-skeleton'
import RecurringPaymentsTable from './tables/recurring-payments-table'
import RecurringExpensesTable from './tables/recurring-expenses-table'
import { Repeat, CreditCard, Receipt } from 'lucide-react'

type Props = {
  propertyId: string
}

export default function RecurringSection({ propertyId }: Props) {
  const [recurringPayments, setRecurringPayments] = useState<RecurringConfigWithDetails[]>([])
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringConfigWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const {
    selectByIndex,
    selectedIndex
  } = useSingleSelectOption([
    {
      label: 'Payments',
      isSelected: true
    },
    {
      label: 'Expenses',
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
      id="recurring"
      className={cn(
        'flex flex-col gap-5',
        'p-5 pt-4 pb-2.5 rounded-[12px]',
        'bg-(--background-primary)'
      )}
    >
      {/* Section Header */}
      <div className='flex items-center gap-2.5'>
        <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-(--info-light) text-(--info-main)'>
          <Repeat size={18} strokeWidth={2} />
        </div>
        <div className='flex flex-col'>
          <h3 className='mb-1'>Recurring Payments</h3>
          <span className='texts-caption-large text-(--text-secondary)'>
            Scheduled automatic payments and expenses
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <SectionTab
          options={[
            { label: 'Payments', icon: <CreditCard size={14} /> },
            { label: 'Expenses', icon: <Receipt size={14} /> }
          ]}
          selectedIndex={selectedIndex ?? 0}
          onChange={selectByIndex}
        />
      </div>

      {/* Content based on selected tab */}
      {selectedIndex === 0 ? (
        <RecurringPaymentsTable
          data={recurringPayments}
          onRefresh={fetchRecurringConfigs}
          className='-mx-5! rounded-none! border-x-0'
        />
      ) : (
        <RecurringExpensesTable
          data={recurringExpenses}
          onRefresh={fetchRecurringConfigs}
          className='-mx-5! rounded-none! border-x-0'
        />
      )}
      
    </div>
  )
}