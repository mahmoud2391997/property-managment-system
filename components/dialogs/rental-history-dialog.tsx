'use client'

import { useState, useEffect } from 'react'
import Dialog from '../costume-ui/dialog'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

type RentalChange = {
  id: string
  old_rent: number
  new_rent: number
  effective_from: string
  status: 'Scheduled' | 'Applied' | 'Cancelled'
  applied_at: string | null
  created_at: string
}

type RentalHistoryData = {
  initial_rent: number
  lease_start_date: string
  changes: RentalChange[]
}

type Props = {
  leaseId: string
  trigger: React.ReactElement
}

export default function RentalHistoryDialog ({ leaseId, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RentalHistoryData | null>(null)

  useEffect(() => {
    if (open) {
      fetchRentalHistory()
    } else {
      setData(null)
    }
  }, [open])

  const fetchRentalHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leases/${leaseId}/rental-history`)
      if (!response.ok) {
        throw new Error('Failed to fetch rental history')
      }
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching rental history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    })
  }

  const calculatePercentChange = (oldRent: number, newRent: number) => {
    return ((newRent - oldRent) / oldRent) * 100
  }

  const getStatusConfig = (status: RentalChange['status']) => {
    switch (status) {
      case 'Scheduled':
        return {
          icon: Clock,
          label: 'Scheduled',
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        }
      case 'Applied':
        return {
          icon: CheckCircle,
          label: 'Applied',
          className: 'bg-green-50 text-green-700 border-green-200'
        }
      case 'Cancelled':
        return {
          icon: XCircle,
          label: 'Cancelled',
          className: 'bg-neutral-50 text-neutral-500 border-neutral-200'
        }
    }
  }

  return (
    <Dialog
      openDialogButton={trigger}
      title='Rental History'
      sub_title='View all rental amount changes for this lease'
      cancelButtonLabel='Close'
      className='max-w-[500px]!'
      open={open}
      onOpenChange={setOpen}
    >
      <div className='space-y-4'>
        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin h-6 w-6 border-2 border-(--primary-color) border-t-transparent rounded-full' />
          </div>
        ) : data ? (
          <>
            {/* Changes List */}
            {data.changes.map(change => {
              const percentChange = calculatePercentChange(
                Number(change.old_rent),
                Number(change.new_rent)
              )
              const statusConfig = getStatusConfig(change.status)
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={change.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    change.status === 'Cancelled' && 'opacity-60'
                  )}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-2'>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                            statusConfig.className
                          )}
                        >
                          <StatusIcon className='h-3 w-3' />
                          {statusConfig.label}
                        </span>
                        <span className='texts-caption-large text-(--text-secondary)'>
                          Effective {formatMonth(change.effective_from)}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span
                          className={cn(
                            'texts-body-medium',
                            change.status === 'Cancelled' && 'line-through'
                          )}
                        >
                          {formatCurrency(Number(change.old_rent))}
                        </span>
                        <span className='text-(--text-secondary)'>→</span>
                        <span
                          className={cn(
                            'texts-body-medium-medium',
                            change.status === 'Cancelled' && 'line-through'
                          )}
                        >
                          {formatCurrency(Number(change.new_rent))}
                        </span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        change.status === 'Cancelled'
                          ? 'text-neutral-400'
                          : percentChange > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {percentChange > 0 ? (
                        <TrendingUp className='h-4 w-4' />
                      ) : (
                        <TrendingDown className='h-4 w-4' />
                      )}
                      <span className='text-sm font-medium'>
                        {percentChange > 0 ? '+' : ''}
                        {percentChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {change.status === 'Applied' && change.applied_at && (
                    <p className='texts-caption-large text-(--text-secondary) mt-2'>
                      Applied on {formatDate(change.applied_at)}
                    </p>
                  )}
                </div>
              )
            })}

            <div className='space-y-3'>
              {/* Initial Rent */}
              <div className='p-4 rounded-lg border bg-(--background-secondary)'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-neutral-100 text-neutral-600 border-neutral-200'>
                    Initial
                  </span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    Lease started {formatDate(data.lease_start_date)}
                  </span>
                </div>
                <span className='texts-body-medium-medium'>
                  {formatCurrency(Number(data.initial_rent))}
                </span>
              </div>
            </div>

            {data.changes.length === 0 && (
              <p className='text-center text-(--text-secondary) py-4'>
                No rental changes have been made to this lease.
              </p>
            )}
          </>
        ) : (
          <p className='text-center text-(--text-secondary) py-4'>
            Failed to load rental history.
          </p>
        )}
      </div>
    </Dialog>
  )
}
