'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Building2, Calendar } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Table } from '../costume-ui/table'
import { cn } from '@/lib/utils'
import MobileCardContainer from '../costume-ui/mobile-card-container'

export type RentalWithDetails = {
  id: string
  reference_id: string
  property: string
  unit: string // 'Whole unit' or room name
  start_date: string
  number_of_months: number | null
  monthly_rent: number
  status: 'Scheduled' | 'Current' | 'Expired' | 'Ended'
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
  // Checkbox
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false
  },

  {
    accessorKey: 'reference_id',
    header: () => <div className='text-left'>Rental ID</div>,
    cell: ({ row }) => {
      return <div className='text-left'>{row.getValue('reference_id')}</div>
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
      return (
        <div className='text-left'>
          {formatCurrency(row.getValue('monthly_rent'))}
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
const RentalCard = ({ rental }: { rental: RentalWithDetails }) => {
  const statusKey = rental.status.toLowerCase()
  const endDate = calculateEndDate(rental.start_date, rental.number_of_months)

  return (
    <MobileCardContainer>
      {/* Header: ID & Status */}
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='texts-body-medium-semibold text-(--text-primary)'>
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
    </MobileCardContainer>
  )
}

type Props = {
  data: RentalWithDetails[]
  className?: string
  noPagnitation?: boolean
}

export default function RentalsTable({
  data,
  className = '',
  noPagnitation = false
}: Props) {
  return (
    <>
      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table
          columns={columns}
          className={className}
          data={data}
          noPagnitation={noPagnitation}
        />
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {data.length > 0 ? (
          data.map((rental) => (
            <RentalCard key={rental.id} rental={rental} />
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
