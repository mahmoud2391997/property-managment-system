'use client'

import { useEffect, useState } from 'react'
import { PaymentHistory } from '@/types'
import { formatCurrency } from '@/utils/formatCurrency'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Banknote, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import TimestampWithTooltip from '../costume-ui/timestamp-with-tooltip'

type Props = {
  referenceId: string
  isExpanded: boolean
}

export default function PaymentHistoryRow({ referenceId, isExpanded }: Props) {
  const [history, setHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const thStyles = 'border-b border-(--border-light) p-[15] px-5'
  const trStyles = 'p-[15] px-5'
  const CACHE_DURATION = 60 * 1000 // 60 seconds in milliseconds

  useEffect(() => {
    // Only fetch if expanded
    if (!isExpanded) {
      return
    }

    const fetchHistory = async () => {
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetch

      // Skip fetch if data was fetched within the last 60 seconds
      if (timeSinceLastFetch < CACHE_DURATION && history.length > 0) {
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/payments/${referenceId}/history`)

        if (!response.ok) {
          throw new Error('Failed to fetch payment history')
        }

        const data = await response.json()
        setHistory(data.payment_history || [])
        setLastFetch(now)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [referenceId, isExpanded])

  if (loading) {
    return (
      <div className="bg-(--background-secondary) p-6 -m-3">
        <div className="mb-4 flex items-center gap-2">
          <h3>Payment History</h3>
          <Skeleton className="h-5 w-24 bg-neutral-200/50" />
        </div>
        <div className="bg-white rounded-lg border border-(--border-default) overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left texts-caption-large text-(--text-secondary)">
                <th className={thStyles}>#</th>
                <th className={thStyles}>Payment Method</th>
                <th className={thStyles}>Amount Paid</th>
                <th className={thStyles}>Remaining</th>
                <th className={thStyles}>Status</th>
                <th className={thStyles}>Performed at</th>
                <th className={thStyles}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1].map((i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="py-3 px-2">
                    <Skeleton className="h-4 w-6 bg-neutral-200/70" />
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 bg-neutral-200/70" />
                      <Skeleton className="h-4 w-24 bg-neutral-200/70" />
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Skeleton className="h-4 w-20 bg-neutral-200/70" />
                  </td>
                  <td className="py-3 px-2">
                    <Skeleton className="h-4 w-20 bg-neutral-200/70" />
                  </td>
                  <td className="py-3 px-2">
                    <Skeleton className="h-6 w-16 bg-neutral-200/70 rounded-full" />
                  </td>
                  <td className="py-3 px-2">
                    <Skeleton className="h-4 w-32 bg-neutral-200/70" />
                  </td>
                  <td className="py-3 px-2">
                    <Skeleton className="h-8 w-8 bg-neutral-200/70 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-(--background-secondary) p-6">
        <div className="bg-white rounded-lg p-4 text-center text-red-600">
          Error loading payment history: {error}
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-(--background-secondary) p-6">
        <div className="bg-white rounded-lg p-4 text-center text-(--text-secondary)">
          No payment history found
        </div>
      </div>
    )
  }

  return (
    <div className="bg-(--background-secondary) p-6 -m-3">
      <div className="mb-4 flex items-center gap-2">
        <h3>Payment History</h3>
        <span className="texts-body-medium text-(--text-secondary)">
          ({history.length} {history.length === 1 ? 'payment' : 'payments'})
        </span>
      </div>
      <div className="bg-white rounded-lg border border-(--border-default) overflow-hidden">
        <table className="w-full">
        <thead className=''>
          <tr className=" text-left texts-caption-large text-(--text-secondary)">
            <th className={thStyles}>#</th>
            <th className={thStyles}>Payment Method</th>
            <th className={thStyles}>Amount Paid</th>
            <th className={thStyles}>Remaining</th>
            <th className={thStyles}>Status</th>
            <th className={thStyles}>Performed at</th>
            <th className={thStyles}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((record) => {
            const statusKey = record.status.toLowerCase()

            return (
              <tr key={record.id} className="border-b last:border-b-0 hover:bg-(--background-secondary)">
                <td className={cn(trStyles, "texts-table-cell-primary")}>
                  {record.payment_number}
                </td>
                <td className={cn(trStyles)}>
                  <div className="flex items-center gap-2">
                    {record.payment_method === 'Bank_Transfer' ? (
                      <>
                        <Banknote size={16} className="text-(--text-secondary)" />
                        <span className="texts-table-cell-primary">Bank Transfer</span>
                      </>
                    ) : (
                      <>
                        <Wallet size={16} className="text-(--text-secondary)" />
                        <span className="texts-table-cell-primary">Cash</span>
                      </>
                    )}
                  </div>
                </td>
                <td className={cn(trStyles, "texts-table-cell-primary")}>
                  {formatCurrency(record.amount_paid)}
                </td>
                <td className={cn(trStyles, "texts-table-cell-primary")}>
                  {formatCurrency(record.remaining_amount)}
                </td>
                <td className={trStyles}>
                  <div
                    data-status={statusKey}
                    className={cn(
                      'status-styles inline-block',
                      'data-[status=paid]:bg-green-100 data-[status=paid]:text-green-800',
                      'data-[status=failed]:bg-red-100 data-[status=failed]:text-red-800'
                    )}
                  >
                    {record.status}
                  </div>
                </td>
                <td className={cn(trStyles)}>
                  <TimestampWithTooltip
                    timestamp={record.paid_at}
                    className="texts-table-cell-secondary text-(--text-secondary)"
                  />
                </td>
                <td className={trStyles}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {record.payment_method === 'Bank_Transfer' && record.receipt_image && (
                        <DropdownMenuItem
                          onClick={() => window.open(record.receipt_image || '', '_blank')}
                        >
                          View Receipt
                        </DropdownMenuItem>
                      )}
                      {(!record.receipt_image || record.payment_method !== 'Bank_Transfer') && (
                        <DropdownMenuItem disabled>
                          No actions available
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}