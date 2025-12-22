'use client'

import { ColumnDef } from '@tanstack/react-table'
import {
  MoreHorizontal,
  Repeat,
  Calendar,
  CircleCheck,
  CirclePause,
  Play,
  Pause,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import Tooltip from '../costume-ui/tooltip'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/formatTime'
import { formatCurrency } from '@/utils/formatCurrency'
import { Table } from '../costume-ui/table'
import { RecurringConfigWithDetails } from '@/app/api/properties/[id]/recurring-configs/route'

type Props = {
  data: RecurringConfigWithDetails[]
  className?: string
  onRefresh?: () => void
}

export default function RecurringExpensesTable({
  data,
  className = '',
  onRefresh
}: Props) {
  // Format recurring pattern description
  const formatRecurringPattern = (
    every: number,
    timeUnit: string,
    eventOn: string | null
  ): string => {
    let description = `Every ${every} ${timeUnit.toLowerCase()}${every > 1 ? 's' : ''}`

    if (timeUnit === 'Week' && eventOn) {
      const days = eventOn.split(',').join(', ')
      description += ` on ${days}`
    } else if (timeUnit === 'Month' && eventOn) {
      const days = eventOn.split(',').join(', ')
      description += ` on day ${days}`
    }

    return description
  }

  const columns: ColumnDef<RecurringConfigWithDetails>[] = [
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

    // Title & Expense Type
    {
      accessorKey: 'title',
      header: () => <div className='text-left'>Recurring Event</div>,
      cell: ({ row }) => {
        const { title, payment_type } = row.original

        return (
          <div>
            <div className='text-left texts-table-cell-primary'>{title}</div>
            {payment_type && (
              <div className='text-left texts-table-cell-secondary text-(--text-secondary)'>
                {payment_type.replace(/_/g, ' ')}
              </div>
            )}
          </div>
        )
      }
    },

    // Recurring Pattern
    {
      accessorKey: 'every',
      header: () => <div className='text-left'>Pattern</div>,
      cell: ({ row }) => {
        const { every, time_unit, event_on } = row.original
        const patternDescription = formatRecurringPattern(every, time_unit, event_on)

        return (
          <div className='flex items-center gap-2'>
            <div
              className={cn(
                'flex items-center gap-[5]',
                'text-left texts-table-cell-secondary',
                'bg-amber-100 text-amber-700',
                'py-[3px] px-2 w-fit',
                'rounded-full select-none'
              )}
            >
              <Repeat strokeWidth={2} size={12} />
              <span>{patternDescription}</span>
            </div>
          </div>
        )
      }
    },

    // Next Expense Date
    {
      accessorKey: 'next_payment_date',
      header: () => <div className='text-left'>Next Due</div>,
      cell: ({ row }) => {
        const { next_payment_date, is_active } = row.original

        if (!is_active) {
          return (
            <div className='text-left texts-table-cell-secondary text-(--text-secondary)'>
              —
            </div>
          )
        }

        return (
          <div className='flex items-center gap-2'>
            <Calendar size={14} className='text-(--text-secondary)' />
            <span className='texts-table-cell-primary'>
              {next_payment_date ? formatDate(new Date(next_payment_date)) : '—'}
            </span>
          </div>
        )
      }
    },

    // Amount
    {
      accessorKey: 'amount',
      header: () => <div className='text-left'>Amount</div>,
      cell: ({ row }) => {
        const { amount, is_payment_fixed } = row.original

        if (!is_payment_fixed || amount === null) {
          return (
            <Tooltip
              variant='description'
              content='Amount will be determined by staff when generating the expense'
            >
              <div className='texts-table-cell-secondary text-(--text-secondary) italic cursor-help'>
                Determined by staff
              </div>
            </Tooltip>
          )
        }

        return (
          <div className='texts-body-large-medium text-left'>
            {formatCurrency(amount)}
          </div>
        )
      }
    },

    // Status (Active/Inactive)
    {
      accessorKey: 'is_active',
      header: () => <div className='text-left'>Status</div>,
      cell: ({ row }) => {
        const { is_active } = row.original
        const statusKey = is_active ? 'active' : 'inactive'

        return (
          <div
            data-status={statusKey}
            className={cn(
              'status-styles',
              'data-[status=active]:bg-green-100 data-[status=active]:text-green-800',
              'data-[status=inactive]:bg-neutral-200 data-[status=inactive]:text-neutral-600'
            )}
          >
            {is_active ? (
              <span className='flex items-center gap-1'>
                <CircleCheck size={12} />
                Active
              </span>
            ) : (
              <span className='flex items-center gap-1'>
                <CirclePause size={12} />
                Paused
              </span>
            )}
          </div>
        )
      }
    },

    // Added On
    {
      accessorKey: 'created_at',
      header: () => <div className='text-left'>Added On</div>,
      cell: ({ row }) => {
        const { created_at } = row.original

        return (
          <div className='texts-table-cell-secondary text-(--text-secondary)'>
            {formatDate(new Date(created_at))}
          </div>
        )
      }
    },

    // Actions
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => {
        const config = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal strokeWidth={1.5} className='w-6! h-6!' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(config.id)}
              >
                Copy config ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                {config.is_active ? (
                  <>
                    <Pause size={14} className='mr-2' />
                    Pause recurring
                  </>
                ) : (
                  <>
                    <Play size={14} className='mr-2' />
                    Resume recurring
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                View expense history
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className='text-red-600 focus:text-red-600' disabled>
                <Trash2 size={14} className='mr-2' />
                Delete recurring
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  // Mobile Card Component
  const RecurringCard = ({ config }: { config: RecurringConfigWithDetails }) => {
    const patternDescription = formatRecurringPattern(
      config.every,
      config.time_unit,
      config.event_on
    )
    const statusKey = config.is_active ? 'active' : 'inactive'

    return (
      <div
        className={cn(
          'bg-(--background-primary) rounded-xl border border-(--border-default)',
          'p-4 space-y-3'
        )}
      >
        {/* Header: Title & Status */}
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='texts-body-medium-semibold text-(--text-primary)'>
                {config.title}
              </span>
              <div
                data-status={statusKey}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
                  'data-[status=active]:bg-green-100 data-[status=active]:text-green-800',
                  'data-[status=inactive]:bg-neutral-200 data-[status=inactive]:text-neutral-600'
                )}
              >
                {config.is_active ? (
                  <>
                    <CircleCheck size={10} />
                    Active
                  </>
                ) : (
                  <>
                    <CirclePause size={10} />
                    Paused
                  </>
                )}
              </div>
            </div>
            {config.payment_type && (
              <span className='texts-caption-large text-(--text-secondary)'>
                {config.payment_type.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <MoreHorizontal strokeWidth={1.5} className='w-5 h-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(config.id)}
              >
                Copy config ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                {config.is_active ? 'Pause recurring' : 'Resume recurring'}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>View expense history</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className='text-red-600' disabled>
                Delete recurring
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Recurring Pattern Badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs w-fit',
            'bg-amber-100 text-amber-700'
          )}
        >
          <Repeat strokeWidth={2} size={12} />
          {patternDescription}
        </div>

        {/* Amount */}
        <div className='flex items-baseline gap-2'>
          {config.is_payment_fixed && config.amount !== null ? (
            <span className='text-2xl font-semibold text-(--text-primary)'>
              {formatCurrency(config.amount)}
            </span>
          ) : (
            <span className='texts-body-medium text-(--text-secondary) italic'>
              Determined by staff
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div className='grid grid-cols-2 gap-3 pt-2 border-t border-(--border-default)'>
          {/* Next Due */}
          <div className='flex items-start gap-2'>
            <Calendar className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
            <div className='min-w-0'>
              <div className='texts-caption-small text-(--text-secondary)'>
                Next Due
              </div>
              <div className='texts-body-small-medium text-(--text-primary)'>
                {config.is_active && config.next_payment_date
                  ? formatDate(new Date(config.next_payment_date))
                  : '—'}
              </div>
            </div>
          </div>

          {/* Added On */}
          <div className='flex items-start gap-2'>
            <Calendar className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
            <div className='min-w-0'>
              <div className='texts-caption-small text-(--text-secondary)'>
                Added On
              </div>
              <div className='texts-body-small-medium text-(--text-primary)'>
                {formatDate(new Date(config.created_at))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table
          columns={columns}
          data={data}
          className={className}
          emptyMessage='No recurring expenses configured for this property.'
        />
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {data.length > 0 ? (
          data.map(config => <RecurringCard key={config.id} config={config} />)
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            No recurring expenses configured for this property.
          </div>
        )}
      </div>
    </>
  )
}