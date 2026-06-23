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
  ExternalLink,
  FileText,
  History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

type ContractData = {
  id: string
  reference_id: string
  status: string
  start_date: string
  monthly_rent: number
  number_of_months: number | null
  ended_at: string | null
  rental_period: string
  frequency: number
  property: {
    id: string
    code: string
    street_address: string
    city: string
  }
}

// Contract Card Component
const ContractCard = ({ contract }: { contract: ContractData }) => {
  const isCurrent = contract.status === 'Current'

  const calculateEndDate = () => {
    if (!contract.number_of_months) return null
    const startDate = new Date(contract.start_date)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + contract.number_of_months)
    return endDate.toISOString()
  }

  const endDate = contract.ended_at || calculateEndDate()

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
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-neutral-100 text-neutral-500'
            )}
          >
            <FileText size={20} strokeWidth={1.5} />
          </div>
          <div className='flex flex-col'>
            <div className='flex items-center gap-2'>
              <span className='texts-body-large-medium'>
                {contract.property.code}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  isCurrent
                    ? 'bg-green-100 text-green-800'
                    : 'bg-neutral-100 text-neutral-600'
                )}
              >
                {isCurrent ? 'Active' : contract.status}
              </span>
            </div>
            <span className='texts-caption-large text-(--text-secondary)'>
              {contract.property.street_address}, {contract.property.city}
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
              <Link href={`/properties/${contract.property.id}/overview`} className='flex items-center gap-2'>
                <ExternalLink size={14} />
                View Property
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(contract.reference_id)}
            >
              Copy Contract ID
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
            {formatCurrency(contract.monthly_rent)}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Period
          </span>
          <span className='texts-body-medium-semibold'>
            {contract.rental_period}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Start Date
          </span>
          <span className='texts-body-medium-semibold'>
            {formatDate(contract.start_date)}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            {isCurrent ? 'Duration' : 'End Date'}
          </span>
          <span className='texts-body-medium-semibold'>
            {isCurrent
              ? contract.number_of_months
                ? `${contract.number_of_months} months`
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
            {contract.reference_id}
          </span>
          {!isCurrent && contract.ended_at && (
            <span className='texts-caption-small text-(--text-secondary)'>
              Ended on {formatDate(contract.ended_at)}
            </span>
          )}
        </div>
        <Link
          href={`/properties/${contract.property.id}/overview`}
          className='flex items-center gap-1 texts-body-small-medium text-(--text-link) hover:underline'
        >
          View Property
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  )
}

// Empty state
const EmptyState = () => (
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
        No Contract History
      </h4>
      <p className='texts-body-small text-(--text-secondary) mt-1'>
        This owner has no contract records yet.
      </p>
    </div>
  </div>
)

// Loading skeleton
const LoadingSkeleton = () => (
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

type Props = {
  ownerId: string
}

export default function ContractsContent({ ownerId }: Props) {
  const [contracts, setContracts] = useState<ContractData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/owners/${ownerId}`)
      if (response.ok) {
        const result = await response.json()
        setContracts(result.contracts || [])
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }, [ownerId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (contracts.length === 0) {
    return <EmptyState />
  }

  const currentContracts = contracts.filter((c: any) => c.status === 'Current')
  const pastContracts = contracts.filter((c: any) => c.status !== 'Current')

  return (
    <div className='flex flex-col gap-6'>
      {/* Current Contracts */}
      {currentContracts.length > 0 && (
        <div className='flex flex-col gap-4'>
          <h2 className='texts-body-large-medium'>
            Active Contracts ({currentContracts.length})
          </h2>
          {currentContracts.map(contract => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      )}

      {/* Past Contracts */}
      {pastContracts.length > 0 && (
        <div className='flex flex-col gap-4'>
          <h2 className='texts-body-large-medium text-(--text-secondary)'>
            Past Contracts ({pastContracts.length})
          </h2>
          {pastContracts.map(contract => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      )}
    </div>
  )
}
