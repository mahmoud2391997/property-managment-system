'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

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
import { Table } from '../costume-ui/table'
import Tooltip from '@/components/costume-ui/tooltip'
import { Expense } from '@/types'
import { expensesData } from '@/utils/data'
import { cn } from '@/lib/utils'
import { formatDate, formatTimestamp } from '@/utils/formatTime'
import { Repeat } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { Progress } from '../ui/progress'

export const columns: ColumnDef<Expense>[] = [
  //Checkbox
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
    accessorKey: 'type',
    header: () => <div className='text-left'>Transaction</div>,
    cell: ({ row }) => {
      const { id, type } = row.original

      return (
        <div>
          <div className='text-left texts-table-cell-primary'>{'#' + id}</div>
          <div className='text-left texts-table-cell-secondary text-(--text-secondary)'>{type}</div>
        </div>
      )
    }
  },

  {
    accessorKey: 'property',
    header: () => <div className='text-left'>Property</div>,
    cell: ({ row }) => {
      const { property } = row.original

      return (
        <div className='text-left texts-table-cell-primary'>{property}</div>
      )
    }
  },

  {
    accessorKey: 'due_date',
    header: () => <div className='text-left'>Due Date</div>,
    cell: ({ row }) => {
      const { due_date, recurring_pattern, recurring_pattern_description } =
        row.original
      const rawPattern: Expense['recurring_pattern'] = recurring_pattern
      const patternKey = rawPattern.toLowerCase().replace(/\s/g, '-')

      return (
        <>
          <div className='text-left mb-1'>{formatDate(due_date)}</div>
          <div
            data-pattern={patternKey}
            className={cn(
              'flex items-center gap-[5]',
              'text-left texts-table-cell-secondary',
              'data-[pattern=one-time]:bg-neutral-100 data-[pattern=one-time]:text-(--text-secondary)',
              'data-[pattern=recurring]:bg-(--info-light) data-[pattern=recurring]:text-(--info-main)',
              'py-[3px] px-2 w-fit',
              'rounded-full select-none'
            )}
          >
            {patternKey === 'recurring' ? (
              <>
                <Tooltip
                  variant='description'
                  content={recurring_pattern_description}
                  className='flex items-center gap-[5]'
                >
                  <Repeat strokeWidth={2} size={12} />
                  {recurring_pattern}
                </Tooltip>
              </>
            ) : (
              recurring_pattern
            )}
          </div>
        </>
      )
    }
  },

  {
    accessorKey: 'amount',
    header: () => <div className='text-left'>Amount</div>,
    cell: ({ row }) => {
      const { amount, status } = row.original
      const rawStatus: Expense['status'] = status // e.g., "Under Preparation"
      const statusKey = rawStatus.toLowerCase().replace(/\s/g, '-') // "under-preparation"

      return (
        <>
          <div className='texts-body-large-medium text-left mb-1'>{amount}</div>
          <div className='text-left'>
            <div
              data-status={statusKey}
              className={cn(
                'status-styles',
                'data-[status=paid]:bg-green-100 data-[status=paid]:text-green-800',
                'data-[status=paid-late]:bg-yellow-100 data-[status=paid-late]:text-yellow-800',
                'data-[status=pending]:bg-gray-100 data-[status=pending]:text-gray-800',
                'data-[status=overdue]:bg-red-100 data-[status=overdue]:text-red-800'
              )}
            >
              {status}
            </div>
          </div>
        </>
      )
    }
  },

  {
    accessorKey: 'payment_percentage',
    header: () => <div className='text-left'>Payment & Tenant</div>,
    cell: ({ row }) => {
      const { amount, payment_percentage } = row.original
      const remaindingAmount = amount * (payment_percentage / 100)

      return (
        <>
          <div className='flex items-center justify-between mb-1'>
            <div className='text-left texts-caption-large mr-4'>
              {payment_percentage}% Paid
            </div>
            <div className='text-left texts-caption-small text-(--text-secondary)'>
              {formatCurrency(remaindingAmount)} remaining
            </div>
          </div>
          <Progress value={payment_percentage} />
        </>
      )
    }
  },

  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const property = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(property.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

export default function ExpensesTable () {
  return (
    <Table columns={columns} data={expensesData} />
  )
}
