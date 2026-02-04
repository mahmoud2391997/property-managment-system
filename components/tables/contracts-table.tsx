'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Table } from '../costume-ui/table'
import { UserAvatar } from '../costume-ui/name-avatar'
import { cn } from '@/lib/utils'

export type ContractWithDetails = {
  id: string
  reference_id: string
  start_date: string
  number_of_months: number | null
  monthly_rent: number
  frequency: number
  payment_day: number
  property_id: string
  owner_id: string
  status: 'Current' | 'Ended' | 'Expired' | 'Scheduled'
  owners: {
    id: string
    first_name: string
    last_name: string | null
    profile_thumb: string | null
  }
}

function calculateEndDate(
  startDate: string,
  numberOfMonths: number | null
): string | null {
  if (numberOfMonths === null) return null
  const start = new Date(startDate)
  const endDate = new Date(start)
  endDate.setMonth(endDate.getMonth() + numberOfMonths)
  return endDate.toISOString()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const columns: ColumnDef<ContractWithDetails>[] = [
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
    header: () => <div className='text-left'>Contract ID</div>,
    cell: ({ row }) => (
      <div className='text-left texts-body-small-medium text-(--info-main)'>
        {row.getValue('reference_id')}
      </div>
    )
  },

  {
    accessorKey: 'start_date',
    header: () => <div className='text-left'>Start Date</div>,
    cell: ({ row }) => (
      <div className='text-left'>{formatDate(row.getValue('start_date'))}</div>
    )
  },

  {
    id: 'end_date',
    header: () => <div className='text-left'>End Date</div>,
    cell: ({ row }) => {
      const contract = row.original
      const endDate = calculateEndDate(
        contract.start_date,
        contract.number_of_months
      )
      return (
        <div className='text-left'>
          {endDate ? formatDate(endDate) : 'Ongoing'}
        </div>
      )
    }
  },

  {
    id: 'owner',
    header: () => <div className='text-left'>Owner</div>,
    cell: ({ row }) => {
      const { owners } = row.original
      const fullName = owners.last_name
        ? `${owners.first_name} ${owners.last_name}`
        : owners.first_name

      return (
        <div className={cn('flex items-center gap-[5]', 'text-left')}>
          <UserAvatar
            name={fullName}
            imgSrc={owners.profile_thumb || undefined}
            size={25}
            className='text-[11px]!'
          />
          <span className='texts-table-cell-primary'>{fullName}</span>
        </div>
      )
    }
  },

  {
    accessorKey: 'monthly_rent',
    header: () => <div className='text-left'>Rental</div>,
    cell: ({ row }) => {
      const contract = row.original
      const freq = contract.frequency
      return (
        <div className='text-left'>
          <span>{formatCurrency(row.getValue('monthly_rent'))}</span>
          {freq > 1 && (
            <span className='text-xs text-(--text-secondary) ml-1'>/ {freq} mo</span>
          )}
        </div>
      )
    }
  },

  {
    accessorKey: 'status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const status: string = row.getValue('status')
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

  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const contract = row.original

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
              onClick={() =>
                navigator.clipboard.writeText(contract.reference_id)
              }
            >
              Copy contract ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

type Props = {
  data: ContractWithDetails[]
  className?: string
  noPagnitation?: boolean
}

export default function ContractsTable({
  data,
  className = '',
  noPagnitation = false
}: Props) {
  return (
    <Table
      columns={columns}
      className={className}
      data={data}
      noPagnitation={noPagnitation}
    />
  )
}
