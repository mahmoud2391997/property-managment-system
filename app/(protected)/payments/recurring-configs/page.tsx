'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import RecurringPaymentConfigsSection from '@/components/sections/recurring-payment-configs-section'
import TablePageSkeleton from '@/components/loading-ui/table-page-skeleton'
import { PermissionGuard } from '@/components/permission-guard'
import { RecurringPaymentConfigItem } from '@/types'

export default function RecurringPaymentConfigsPage() {
  const [data, setData] = useState<RecurringPaymentConfigItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchConfigs = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/recurring-configs')
      if (response.ok) {
        const result = await response.json()
        const configs = result.configs || []
        setData(configs)
        setTotal(configs.length)
      }
    } catch (error) {
      console.error('Error fetching recurring payment configs:', error)
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
    <PermissionGuard permission="payments.access">
      <div className={cn('flex flex-col gap-2.5', 'h-full')}>
        <div>
          <Breadcrumb
            items={[
              { label: 'Payments', href: '/payments' },
              { label: 'Recurring Configs' }
            ]}
          />
          <div className='flex items-baseline gap-2 mt-1'>
            <h2>Recurring Configs</h2>
          </div>
        </div>
        <RecurringPaymentConfigsSection
          initialData={data}
          initialTotal={total}
          onRefresh={fetchConfigs}
        />
      </div>
    </PermissionGuard>
  )
}
