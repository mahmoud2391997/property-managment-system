'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Building2,
  DoorOpen,
  ExternalLink,
  History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

// Types
type LeaseData = {
  id: string
  reference_id: string
  status: 'Current' | 'Ended'
  monthly_rent: number
  payment_day: number
  start_date: string
  number_of_months: number | null
  ended_at: string | null
  property: {
    id: string
    code: string
    address: string
    city: string
    type: string
  }
  room: {
    id: string
    title: string
  } | null
  isRoomLease: boolean
}

// Lease Card Component
type LeaseCardProps = {
  lease: LeaseData
}

const LeaseCard = ({ lease }: LeaseCardProps) => {
  const isRoomLease = lease.isRoomLease
  const isCurrent = lease.status === 'Current'
  const displayTitle = isRoomLease
    ? `${lease.property.code} - ${lease.room?.title}`
    : lease.property.code
  const href = isRoomLease
    ? `/rooms/${lease.room?.id}/overview`
    : `/properties/${lease.property.id}/overview`

  // Calculate end date if we have number_of_months
  const calculateEndDate = () => {
    if (!lease.number_of_months) return null
    const startDate = new Date(lease.start_date)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + lease.number_of_months)
    return endDate.toISOString()
  }

  const endDate = lease.ended_at || calculateEndDate()

  return (
    <div
      className={cn(
        'flex flex-col gap-4 w-full',
        'p-5 rounded-[12px]',
        'bg-(--background-primary)',
        'border border-(--border-light)',
        !isCurrent && 'opacity-75'
      )}
    >
      {/* Header */}
      <div className='flex justify-between items-start'>
        <div className='flex gap-3'>
          <div
            className={cn(
              'flex items-center justify-center rounded-[10px]',
              'h-10 w-10',
              isCurrent
                ? isRoomLease
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-blue-100 text-blue-600'
                : 'bg-neutral-100 text-neutral-500'
            )}
          >
            {isRoomLease ? (
              <DoorOpen size={20} strokeWidth={1.5} />
            ) : (
              <Building2 size={20} strokeWidth={1.5} />
            )}
          </div>
          <div className='flex flex-col'>
            <div className='flex items-center gap-2'>
              <span className='texts-body-large-medium'>{displayTitle}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  isCurrent
                    ? 'bg-green-100 text-green-800'
                    : 'bg-neutral-100 text-neutral-600'
                )}
              >
                {lease.status}
              </span>
            </div>
            <span className='texts-caption-large text-(--text-secondary)'>
              {lease.property.address}, {lease.property.city}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreVertical className='h-5! w-5! text-neutral-600' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={href} className='flex items-center gap-2'>
                <ExternalLink size={14} />
                View {isRoomLease ? 'Room' : 'Property'}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(lease.reference_id)}
            >
              Copy Lease ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Details Grid */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Monthly Rent
          </span>
          <span className='texts-body-medium-semibold'>
            {formatCurrency(lease.monthly_rent)}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Payment Day
          </span>
          <span className='texts-body-medium-semibold'>
            {lease.payment_day}
            {lease.payment_day === 1
              ? 'st'
              : lease.payment_day === 2
              ? 'nd'
              : lease.payment_day === 3
              ? 'rd'
              : 'th'}{' '}
            of month
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Start Date
          </span>
          <span className='texts-body-medium-semibold'>
            {formatDate(lease.start_date)}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            {isCurrent ? 'Duration' : 'End Date'}
          </span>
          <span className='texts-body-medium-semibold'>
            {isCurrent
              ? lease.number_of_months
                ? `${lease.number_of_months} months`
                : 'Ongoing'
              : endDate
              ? formatDate(endDate)
              : '-'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className='flex items-center justify-between pt-3 border-t border-(--border-light)'>
        <div className='flex items-center gap-2'>
          <span className='texts-caption-large text-(--text-secondary)'>
            {lease.reference_id}
          </span>
          {!isCurrent && lease.ended_at && (
            <span className='texts-caption-small text-(--text-secondary)'>
              Ended on {formatDate(lease.ended_at)}
            </span>
          )}
        </div>
        <Link
          href={href}
          className='flex items-center gap-1 texts-body-small-medium text-(--text-link) hover:underline'
        >
          View {isRoomLease ? 'Room' : 'Property'}
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  )
}

// Empty state
const EmptyState = () => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        'p-12 rounded-[12px]',
        'bg-(--background-primary)',
        'border-2 border-dashed border-neutral-200'
      )}
    >
      <div className='flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100'>
        <History className='w-6 h-6 text-neutral-400' />
      </div>
      <div className='text-center'>
        <h4 className='texts-body-medium-semibold text-(--text-primary)'>
          No Lease History
        </h4>
        <p className='texts-body-small text-(--text-secondary) mt-1'>
          This tenant has no lease records yet.
        </p>
      </div>
    </div>
  )
}

// Loading skeleton
const LoadingSkeleton = () => {
  return (
    <div className='flex flex-col gap-4'>
      {[...Array(3)].map((_, i) => (
        <div key={i} className='p-5 rounded-[12px] bg-(--background-primary)'>
          <div className='flex items-start gap-3 mb-4'>
            <Skeleton className='h-10 w-10 rounded-[10px] bg-neutral-200' />
            <div className='flex flex-col gap-1'>
              <Skeleton className='h-5 w-32 bg-neutral-200' />
              <Skeleton className='h-3 w-48 bg-neutral-200' />
            </div>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} className='h-12 bg-neutral-200' />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

type Props = {
  tenantId: string
}

export default function LeasesContent({ tenantId }: Props) {
  const [leases, setLeases] = useState<LeaseData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`)
      if (response.ok) {
        const result = await response.json()
        setLeases(result.leases || [])
      }
    } catch (error) {
      console.error('Error fetching leases:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (leases.length === 0) {
    return <EmptyState />
  }

  const currentLeases = leases.filter(l => l.status === 'Current')
  const endedLeases = leases.filter(l => l.status === 'Ended')

  return (
    <div className='flex flex-col gap-6'>
      {/* Current Leases */}
      {currentLeases.length > 0 && (
        <div className='flex flex-col gap-4'>
          <h2 className='texts-body-large-medium'>
            Active Leases ({currentLeases.length})
          </h2>
          {currentLeases.map(lease => (
            <LeaseCard key={lease.id} lease={lease} />
          ))}
        </div>
      )}

      {/* Past Leases */}
      {endedLeases.length > 0 && (
        <div className='flex flex-col gap-4'>
          <h2 className='texts-body-large-medium text-(--text-secondary)'>
            Past Leases ({endedLeases.length})
          </h2>
          {endedLeases.map(lease => (
            <LeaseCard key={lease.id} lease={lease} />
          ))}
        </div>
      )}
    </div>
  )
}
