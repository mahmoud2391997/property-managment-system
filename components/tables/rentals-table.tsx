'use client'

import { useEffect, useRef } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Building2, Calendar, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'

import { Checkbox } from '@/components/ui/checkbox'
import { Table } from '../costume-ui/table'
import { cn } from '@/lib/utils'
import MobileCardContainer from '../costume-ui/mobile-card-container'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

type ScheduledChange = {
  id: string
  old_rent: number
  new_rent: number
  effective_from: string
}

export type RentalWithDetails = {
  id: string
  reference_id: string
  property: string
  unit: string // 'Whole unit' or room name
  start_date: string
  number_of_months: number | null
  monthly_rent: number
  status: 'Scheduled' | 'Current' | 'Expired' | 'Ended'
  scheduled_change?: ScheduledChange | null
}

// Calculate end date from start_date + number_of_months
function calculateEndDate(
  startDate: string,
  numberOfMonths: number | null
): string | null {
  if (numberOfMonths === null) {
    return null // Ongoing
  }

  const start = new Date(startDate)
  const endDate = new Date(start)
  endDate.setMonth(endDate.getMonth() + numberOfMonths)

  return endDate.toISOString()
}

// Format date to display format
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Format currency
function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const columns: ColumnDef<RentalWithDetails>[] = [
  {
    accessorKey: 'reference_id',
    header: () => <div className='text-left'>Rental ID</div>,
    cell: ({ row }) => {
      const { id, reference_id } = row.original
      return (
        <Link
          href={`/rentals/${id}`}
          className='text-left texts-table-cell-primary hover:text-(--info-main) hover:underline'
        >
          {reference_id}
        </Link>
      )
    }
  },

  {
    id: 'property',
    header: () => <div className='text-left'>Property</div>,
    cell: ({ row }) => {
      const { property, unit } = row.original
      return (
        <div>
          <div className='text-left texts-table-cell-primary'>{property}</div>
          <div className='text-left texts-table-cell-secondary text-(--text-secondary)'>
            {unit}
          </div>
        </div>
      )
    }
  },

  {
    accessorKey: 'start_date',
    header: () => <div className='text-left'>Start Date</div>,
    cell: ({ row }) => {
      return (
        <div className='text-left'>
          {formatDate(row.getValue('start_date'))}
        </div>
      )
    }
  },

  {
    id: 'end_date',
    header: () => <div className='text-left'>End Date</div>,
    cell: ({ row }) => {
      const rental = row.original
      const endDate = calculateEndDate(
        rental.start_date,
        rental.number_of_months
      )

      return (
        <div className='text-left'>
          {endDate ? formatDate(endDate) : 'Ongoing'}
        </div>
      )
    }
  },

  {
    accessorKey: 'monthly_rent',
    header: () => <div className='text-left'>Rental</div>,
    cell: ({ row }) => {
      const rental = row.original
      const scheduledChange = rental.scheduled_change
      const currentRent = row.getValue('monthly_rent') as number

      // Only show scheduled change indicator if rent hasn't already changed
      // (i.e., current rent doesn't match the new scheduled rent)
      const showScheduledChange = scheduledChange &&
        Math.abs(currentRent - scheduledChange.new_rent) > 0.01

      if (showScheduledChange && scheduledChange) {
        const isIncrease = scheduledChange.new_rent > scheduledChange.old_rent
        const effectiveDate = new Date(scheduledChange.effective_from)
        const effectiveMonth = effectiveDate.toLocaleDateString('en-GB', {
          month: 'long',
          year: 'numeric'
        })

        return (
          <div className='flex items-center gap-2 text-left'>
            <span>{formatCurrency(currentRent)}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs'>
                    <Clock className='h-3 w-3' />
                    {isIncrease ? (
                      <TrendingUp className='h-3 w-3' />
                    ) : (
                      <TrendingDown className='h-3 w-3' />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side='top' className='max-w-xs'>
                  <p className='text-sm'>
                    Your rental will change to{' '}
                    <span className='font-medium'>
                      {formatCurrency(scheduledChange.new_rent)}
                    </span>{' '}
                    from {effectiveMonth}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      }

      return (
        <div className='text-left'>
          {formatCurrency(currentRent)}
        </div>
      )
    }
  },

  {
    accessorKey: 'status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const status: RentalWithDetails['status'] = row.getValue('status')
      const statusKey = status.toLowerCase()

      return (
        <div className='texts-table-cell-primary text-left'>
          <div
            data-status={statusKey}
            className={cn(
              'status-styles',
              'data-[status=current]:bg-green-100 data-[status=current]:text-green-800',
              'data-[status=scheduled]:bg-blue-100 data-[status=scheduled]:text-blue-800',
              'data-[status=expired]:bg-yellow-100 data-[status=expired]:text-yellow-800',
              'data-[status=ended]:bg-red-100 data-[status=ended]:text-red-800'
            )}
          >
            {status}
          </div>
        </div>
      )
    }
  },
]

// Mobile Card Component
const RentalCard = ({ rental, isHighlighted, cardRef }: {
  rental: RentalWithDetails
  isHighlighted?: boolean
  cardRef?: React.RefObject<HTMLDivElement | null>
}) => {
  const statusKey = rental.status.toLowerCase()
  const endDate = calculateEndDate(rental.start_date, rental.number_of_months)

  return (
    <div ref={cardRef}>
      <Link href={`/rentals/${rental.id}`}>
        <MobileCardContainer
          className={cn(
            isHighlighted && 'animate-highlight-pulse'
          )}
        >
        {/* Header: ID & Status */}
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='texts-body-medium-semibold text-(--text-primary) hover:text-(--info-main) hover:underline'>
                {rental.reference_id}
              </span>
            <div
              data-status={statusKey}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                'data-[status=current]:bg-green-100 data-[status=current]:text-green-800',
                'data-[status=scheduled]:bg-blue-100 data-[status=scheduled]:text-blue-800',
                'data-[status=expired]:bg-yellow-100 data-[status=expired]:text-yellow-800',
                'data-[status=ended]:bg-red-100 data-[status=ended]:text-red-800'
              )}
            >
              {rental.status}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Rent - Prominent display */}
      <div className='flex items-baseline gap-2'>
        <span className='text-2xl font-semibold text-(--text-primary)'>
          {formatCurrency(rental.monthly_rent)}
        </span>
        <span className='texts-caption-large text-(--text-secondary)'>/month</span>
      </div>

      {/* Info Grid */}
      <div className='grid grid-cols-2 gap-3'>
        {/* Property */}
        <div className='flex items-start gap-2'>
          <Building2 className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
          <div className='min-w-0'>
            <div className='texts-caption-small text-(--text-secondary)'>Property</div>
            <div className='texts-body-small-medium text-(--text-primary) truncate'>{rental.property}</div>
            <div className='texts-caption-small text-(--text-secondary) truncate'>{rental.unit}</div>
          </div>
        </div>

        {/* Start Date */}
        <div className='flex items-start gap-2'>
          <Calendar className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
          <div className='min-w-0'>
            <div className='texts-caption-small text-(--text-secondary)'>Start Date</div>
            <div className='texts-body-small-medium text-(--text-primary)'>
              {formatDate(rental.start_date)}
            </div>
          </div>
        </div>
      </div>

      {/* End Date Section */}
      <div className='pt-2 border-t border-(--border-default)'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-(--text-secondary)' />
            <span className='texts-caption-large text-(--text-secondary)'>End Date</span>
          </div>
          <span className='texts-body-small-medium text-(--text-primary)'>
            {endDate ? formatDate(endDate) : 'Ongoing'}
          </span>
        </div>
      </div>

        {/* Scheduled Rental Change Banner - only show if rent hasn't already changed */}
        {rental.scheduled_change &&
          rental.status === 'Current' &&
          Math.abs(rental.monthly_rent - rental.scheduled_change.new_rent) > 0.01 && (
          <div className='flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200'>
            <div className='flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 shrink-0'>
              <Clock className='h-4 w-4 text-blue-600' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='texts-body-small-medium text-blue-900'>
                Rental change scheduled
              </p>
              <p className='texts-caption-large text-blue-700'>
                Your rental will change to{' '}
                <span className='font-medium'>
                  {formatCurrency(rental.scheduled_change.new_rent)}
                </span>{' '}
                from{' '}
                {new Date(rental.scheduled_change.effective_from).toLocaleDateString(
                  'en-GB',
                  { month: 'long', year: 'numeric' }
                )}
              </p>
            </div>
            <div className='shrink-0'>
              {rental.scheduled_change.new_rent > rental.scheduled_change.old_rent ? (
                <TrendingUp className='h-5 w-5 text-blue-600' />
              ) : (
                <TrendingDown className='h-5 w-5 text-blue-600' />
              )}
            </div>
          </div>
        )}
        </MobileCardContainer>
      </Link>
    </div>
  )
}

type Props = {
  data: RentalWithDetails[]
  className?: string
  noPagnitation?: boolean
  highlightReferenceId?: string | null
}

export default function RentalsTable({
  data,
  className = '',
  noPagnitation = false,
  highlightReferenceId
}: Props) {
  const highlightRef = useRef<HTMLDivElement>(null)

  // Scroll to highlighted item
  useEffect(() => {
    if (highlightReferenceId && highlightRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 100)
    }
  }, [highlightReferenceId])

  return (
    <>
      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table
          columns={columns}
          className={className}
          data={data}
          noPagnitation={noPagnitation}
          highlightReferenceId={highlightReferenceId}
        />
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {data.length > 0 ? (
          data.map((rental) => (
            <RentalCard
              key={rental.id}
              rental={rental}
              isHighlighted={highlightReferenceId === rental.reference_id}
              cardRef={highlightReferenceId === rental.reference_id ? highlightRef : undefined}
            />
          ))
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            No rentals found.
          </div>
        )}

        {/* Pagination info for mobile */}
        {data.length > 0 && (
          <div className='text-center py-4 texts-caption-large text-(--text-secondary)'>
            Showing {data.length} rental{data.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  )
}
