'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import TableSectionSkeleton from './loading-ui/table-section-skeleton'
import RecurringPaymentsTable from './tables/recurring-payments-table'
import { Repeat } from 'lucide-react'

type Props = {
  roomId: string
}

export default function RecurringSectionRoom({ roomId }: Props) {
  const [recurringPayments, setRecurringPayments] = useState<RecurringConfigWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecurringConfigs = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/recurring-configs`)
      if (response.ok) {
        const data = await response.json()
        setRecurringPayments(data.recurringPayments || [])
      }
    } catch (error) {
      console.error('Error fetching recurring configs:', error)
    } finally {
      setLoading(false)
    }
  }, [roomId])

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
        'p-5 py-2.5 rounded-[12px]',
        'bg-(--background-primary)'
      )}
    >
      {/* Section header */}
      <div className='flex items-center gap-2.5 py-2'>
        <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-(--info-light) text-(--info-main)'>
          <Repeat size={19} strokeWidth={1.5} />
        </div>
        <div className='flex flex-col'>
          <h3 className='mb-1'>Recurring Payments</h3>
          <span className='texts-caption-large text-(--text-secondary)'>
            Automated payment schedules for this room's lease
          </span>
        </div>
      </div>

      {/* Table */}
      <RecurringPaymentsTable
        data={recurringPayments}
        onRefresh={fetchRecurringConfigs}
        className='-mx-5! rounded-none! border-x-0'
      />
    </div>
  )
}
