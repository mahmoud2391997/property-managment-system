'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import RecurringExpensesConfigsSection from '@/components/sections/recurring-expenses-configs-section'
import TablePageSkeleton from '@/components/loading-ui/table-page-skeleton'
import { RecurringExpenseConfigWithProperty } from '@/app/api/expenses/recurring-configs/route'
import { PermissionGuard } from '@/components/permission-guard'

export default function RecurringExpenseConfigsPage() {
  const [data, setData] = useState<RecurringExpenseConfigWithProperty[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchConfigs = useCallback(async () => {
    try {
      const response = await fetch('/api/expenses/recurring-configs')
      if (response.ok) {
        const result = await response.json()
        const configs = result.recurringExpenses || []
        setData(configs)
        setTotal(configs.length)
      }
    } catch (error) {
      console.error('Error fetching recurring expense configs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  if (loading) {
    return <TablePageSkeleton />
  }

  return (
    <PermissionGuard permission="expenses.access">
      <div className={cn('flex flex-col gap-2.5', 'h-full')}>
        <div>
          <Breadcrumb
            items={[
              { label: 'Expenses', href: '/expenses' },
              { label: 'Recurring Configs' }
            ]}
          />
          <div className='flex items-baseline gap-2 mt-1'>
            <h2>Recurring Configs</h2>
          </div>
        </div>
        <RecurringExpensesConfigsSection
          initialData={data}
          initialTotal={total}
          onRefresh={fetchConfigs}
        />
      </div>
    </PermissionGuard>
  )
}
