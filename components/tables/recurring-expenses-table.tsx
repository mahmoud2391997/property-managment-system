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
  Trash2,
  ChevronRight,
  ChevronDown,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { formatPaymentTypeLabel } from '@/utils/functions'
import { Table } from '../costume-ui/table'
import { RecurringConfigWithDetails } from '@/app/api/properties/[id]/recurring-configs/route'
import { RecurringExpenseConfigWithProperty } from '@/app/api/expenses/recurring-configs/route'
import RecurringExpensesNestedTable from './recurring-expenses-nested-table'
import RecurringExpenseConfigsNested from './recurring-expense-configs-nested'
import Link from 'next/link'

type Props = {
  data: (RecurringConfigWithDetails | RecurringExpenseConfigWithProperty)[]
  className?: string
  onRefresh?: () => void
  showProperty?: boolean
}

export default function RecurringExpensesTable({
  data,
  className = '',
  onRefresh,
  showProperty = false
}: Props) {
  const formatExpensePattern = (eventOn: string | null): string => {
    if (eventOn) return `Monthly on day ${eventOn}`
    return 'Monthly'
  }

  const columns: ColumnDef<RecurringConfigWithDetails | RecurringExpenseConfigWithProperty>[] = [
    // Expand
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => {
        const hasExpenses = row.original.expenses_count > 0

        if (!hasExpenses) return null

        return (
          <Button
            variant='ghost'
            className='h-6 w-6 p-0'
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown strokeWidth={1.5} className='h-6! w-6!' />
            ) : (
              <ChevronRight strokeWidth={1.5} className='h-6! w-6!' />
            )}
          </Button>
        )
      },
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
                {formatPaymentTypeLabel(payment_type)}
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
        const { event_on } = row.original

        return (
          <div
            className={cn(
              'flex items-center gap-[5] w-fit',
              'text-left texts-table-cell-secondary',
              'bg-amber-100 text-amber-700',
              'py-[3px] px-2',
              'rounded-full select-none'
            )}
          >
            <Repeat strokeWidth={2} size={12} />
            <span>{formatExpensePattern(event_on)}</span>
          </div>
        )
      }
    },

    // Property (conditional)
    ...(showProperty
      ? [
          {
            id: 'property',
            header: () => <div className='text-left'>Property</div>,
            cell: ({ row }: { row: any }) => {
              const config = row.original as RecurringExpenseConfigWithProperty
              if (!config.property_name) {
                return (
                  <span className='texts-table-cell-secondary text-(--text-secondary)'>
                    —
                  </span>
                )
              }
              return (
                <Link
                  href={`/properties/${config.property_id}/overview`}
                  className='flex items-center gap-1.5 texts-table-cell-primary text-(--info-main) hover:underline'
                >
                  <Building2 size={14} />
                  {config.property_name}
                </Link>
              )
            }
          } as ColumnDef<RecurringConfigWithDetails | RecurringExpenseConfigWithProperty>
        ]
      : []),

    // Next Expense Date
    {
      accessorKey: 'next_payment_date',
      header: () => <div className='text-left'>Next Due</div>,
      cell: ({ row }) => {
        const { next_payment_date, is_active } = row.original

        if (!is_active) {
          return (
            <div className='texts-table-cell-secondary text-(--text-secondary)'>
              —
            </div>
          )
        }

        return (
          <div className='flex items-center gap-1.5'>
            <Calendar size={13} className='text-(--text-secondary)' />
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
                Set by staff
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

    // Actions
    {
      id: 'actions',
      header: () => null,
      enableHiding: false,
      cell: ({ row }) => {
        const config = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal strokeWidth={1.5} className='w-5! h-5!' />
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
  const RecurringCard = ({ config }: { config: RecurringConfigWithDetails | RecurringExpenseConfigWithProperty }) => {
    const patternDescription = formatExpensePattern(config.event_on)
    const statusKey = config.is_active ? 'active' : 'inactive'

    return (
      <div
        className={cn(
          'bg-(--background-primary) rounded-xl border border-(--border-default)',
          'p-4 space-y-3'
        )}
      >
        {/* Header: Title & Status */}
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-0.5'>
              <span className='texts-body-medium-semibold text-(--text-primary) truncate'>
                {config.title}
              </span>
              <div
                data-status={statusKey}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 shrink-0',
                  'data-[status=active]:bg-green-100 data-[status=active]:text-green-800',
                  'data-[status=inactive]:bg-neutral-200 data-[status=inactive]:text-neutral-600'
                )}
              >
                {config.is_active ? (
                  <><CircleCheck size={10} /> Active</>
                ) : (
                  <><CirclePause size={10} /> Paused</>
                )}
              </div>
            </div>
            {config.payment_type && (
              <div className='texts-caption-large text-(--text-secondary)'>
                {formatPaymentTypeLabel(config.payment_type)}
              </div>
            )}
            {showProperty && 'property_name' in config && config.property_name && (
              <Link
                href={`/properties/${config.property_id}/overview`}
                className='flex items-center gap-1 texts-caption-large text-(--info-main) mt-1'
              >
                <Building2 size={12} />
                <span className='truncate'>{config.property_name}</span>
              </Link>
            )}
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0 shrink-0'>
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

        {/* Bottom row: pattern + amount + next due */}
        <div className='flex items-center justify-between pt-2 border-t border-(--border-default)'>
          <div className='flex items-center gap-1.5 texts-caption-large text-amber-700'>
            <Repeat strokeWidth={2} size={11} />
            {patternDescription}
          </div>
          <div className='texts-body-medium-semibold text-(--text-primary)'>
            {config.is_payment_fixed && config.amount !== null
              ? formatCurrency(config.amount)
              : <span className='texts-caption-large text-(--text-secondary) italic font-normal'>Set by staff</span>
            }
          </div>
        </div>

        {/* Next Due */}
        {config.is_active && config.next_payment_date && (
          <div className='flex items-center gap-1.5 texts-caption-large text-(--text-secondary)'>
            <Calendar size={12} />
            Next due: {formatDate(new Date(config.next_payment_date))}
          </div>
        )}
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
          emptyMessage={showProperty ? 'No recurring expense configs found.' : 'No recurring expenses configured for this property.'}
          noPagnitation
          getRowCanExpand={(row) => row.original.expenses_count > 0}
          getRowId={(row) => row.id}
          renderSubComponent={(row) => (
            showProperty ? (
              <RecurringExpenseConfigsNested
                key={`nested-${row.original.id}`}
                configId={row.original.id}
                isExpanded={row.getIsExpanded()}
              />
            ) : (
              <RecurringExpensesNestedTable
                key={`nested-${row.original.id}`}
                expenses={(row.original as RecurringConfigWithDetails).expenses}
              />
            )
          )}
        />
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {data.length > 0 ? (
          data.map(config => <RecurringCard key={config.id} config={config} />)
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            {showProperty ? 'No recurring expense configs found.' : 'No recurring expenses configured for this property.'}
          </div>
        )}
      </div>
    </>
  )
}
