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
import { RecurringPaymentConfigItem } from '@/app/api/payments/recurring-configs/route'
import RecurringPaymentConfigsNested from './recurring-payment-configs-nested'
import Link from 'next/link'

type Props = {
  data: RecurringPaymentConfigItem[]
  className?: string
  onRefresh?: () => void
}

export default function RecurringPaymentConfigsTable({
  data,
  className = '',
  onRefresh
}: Props) {
  const columns: ColumnDef<RecurringPaymentConfigItem>[] = [
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

    // Expand
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => {
        if (row.original.payments_count === 0) return null

        return (
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
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

    // Title & Payment Type
    {
      accessorKey: 'title',
      header: () => <div className='text-left'>Recurring Event</div>,
      cell: ({ row }) => {
        const { title, payment_type, payments_count } = row.original

        return (
          <div>
            <div className='flex items-center gap-2 text-left texts-table-cell-primary'>
              <span>{title}</span>
              {payments_count > 0 && (
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  'bg-(--info-light) text-(--info-main)'
                )}>
                  {payments_count}
                </span>
              )}
            </div>
            {payment_type && (
              <div className='text-left texts-table-cell-secondary text-(--text-secondary)'>
                {payment_type.replace(/_/g, ' ')}
              </div>
            )}
          </div>
        )
      }
    },

    // Property / Room
    {
      id: 'property',
      header: () => <div className='text-left'>Property</div>,
      cell: ({ row }) => {
        const { property_name, property_id, room_name } = row.original
        if (!property_name) {
          return (
            <span className='texts-table-cell-secondary text-(--text-secondary)'>
              —
            </span>
          )
        }
        return (
          <div>
            <Link
              href={`/properties/${property_id}/overview`}
              className='flex items-center gap-1.5 texts-table-cell-primary text-(--info-main) hover:underline'
            >
              <Building2 size={14} />
              {property_name}
            </Link>
            {room_name && (
              <div className='texts-table-cell-secondary text-(--text-secondary) ml-5'>
                {room_name}
              </div>
            )}
          </div>
        )
      }
    },

    // Pattern
    {
      accessorKey: 'every',
      header: () => <div className='text-left'>Pattern</div>,
      cell: () => (
        <div className='flex items-center gap-2'>
          <div
            className={cn(
              'flex items-center gap-[5]',
              'text-left texts-table-cell-secondary',
              'bg-(--info-light) text-(--info-main)',
              'py-[3px] px-2 w-fit',
              'rounded-full select-none'
            )}
          >
            <Repeat strokeWidth={2} size={12} />
            <span>Monthly with rental payment</span>
          </div>
        </div>
      )
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
              content='Amount will be determined by staff when generating the bill'
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

    // Status
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
                View payment history
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

  // Mobile Card
  const RecurringCard = ({ config }: { config: RecurringPaymentConfigItem }) => {
    const statusKey = config.is_active ? 'active' : 'inactive'

    return (
      <div
        className={cn(
          'bg-(--background-primary) rounded-xl border border-(--border-default)',
          'p-4 space-y-3'
        )}
      >
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
                  <><CircleCheck size={10} /> Active</>
                ) : (
                  <><CirclePause size={10} /> Paused</>
                )}
              </div>
            </div>
            {config.payment_type && (
              <span className='texts-caption-large text-(--text-secondary)'>
                {config.payment_type.replace(/_/g, ' ')}
              </span>
            )}
            {config.property_name && (
              <Link
                href={`/properties/${config.property_id}/overview`}
                className='flex items-center gap-1 texts-caption-large text-(--info-main) mt-0.5'
              >
                <Building2 size={12} />
                {config.property_name}
                {config.room_name && <span className='text-(--text-secondary)'>/ {config.room_name}</span>}
              </Link>
            )}
          </div>

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
              <DropdownMenuItem disabled>View payment history</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className='text-red-600' disabled>
                Delete recurring
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs w-fit',
            'bg-(--info-light) text-(--info-main)'
          )}
        >
          <Repeat strokeWidth={2} size={12} />
          Monthly with rental payment
        </div>

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

        <div className='grid grid-cols-2 gap-3 pt-2 border-t border-(--border-default)'>
          <div className='flex items-start gap-2'>
            <Calendar className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
            <div className='min-w-0'>
              <div className='texts-caption-small text-(--text-secondary)'>Added On</div>
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
      <div className='hidden md:block'>
        <Table
          columns={columns}
          data={data}
          className={className}
          emptyMessage='No recurring payment configs found.'
          getRowCanExpand={(row) => row.original.payments_count > 0}
          getRowId={(row) => row.id}
          renderSubComponent={(row) => (
            <RecurringPaymentConfigsNested
              key={`nested-${row.original.id}`}
              configId={row.original.id}
              isExpanded={row.getIsExpanded()}
              onRefresh={onRefresh}
            />
          )}
        />
      </div>

      <div className='md:hidden space-y-3'>
        {data.length > 0 ? (
          data.map(config => <RecurringCard key={config.id} config={config} />)
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            No recurring payment configs found.
          </div>
        )}
      </div>
    </>
  )
}
