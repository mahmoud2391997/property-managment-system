'use client'

import {
  ColumnDef
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
import { cn } from '@/lib/utils'
import { UserAvatar } from '../costume-ui/name-avatar'
import { Prisma } from '@prisma/client'
import EditVendorDialog from '../dialogs/edit-vendor-dialog'
import { usePermissions } from '@/hooks/use-permissions'

// Infer the type from Prisma query
export type VendorWithDetails = Prisma.vendorsGetPayload<{
  select: {
    id: true
    name: true
    phone_number: true
    email: true
  }
}>

const getColumns = (canUpdate: boolean): ColumnDef<VendorWithDetails>[] => [
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
    accessorKey: 'name',
    header: () => <div className='text-left'>Name</div>,
    cell: ({ row }) => {
      const { name } = row.original
      return (
        <div className={cn('flex items-center gap-[5]', 'text-left')}>
          <UserAvatar name={name} size={25} className='text-[11px]!' />
          <span className='texts-table-cell-primary'>{name}</span>
        </div>
      )
    }
  },

  {
    accessorKey: 'phone_number',
    header: () => <div className='text-left'>Phone No</div>,
    cell: ({ row }) => {
      const { phone_number } = row.original

      return <div className='text-left texts-table-cell-data'>{phone_number}</div>
    }
  },

  {
    accessorKey: 'email',
    header: () => <div className='text-left'>Email</div>,
    cell: ({ row }) => {
      const { email } = row.original

      return <div className='text-left texts-table-cell-data'>{email ?? '-'}</div>
    }
  },

  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row }) => {
      const vendor = row.original

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
            {canUpdate && (
              <>
                <EditVendorDialog
                  vendorId={vendor.id}
                  initialData={{
                    id: vendor.id,
                    name: vendor.name,
                    phone_number: vendor.phone_number,
                    email: vendor.email
                  }}
                  trigger={
                    <DropdownMenuItem onSelect={e => e.preventDefault()}>
                      Edit Vendor
                    </DropdownMenuItem>
                  }
                  onSuccess={() => window.location.reload()}
                />
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(vendor.phone_number)}
            >
              Copy phone number
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(vendor.email ?? '')}
            >
              Copy email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

type VendorsTableProps = {
  data: VendorWithDetails[]
}

export default function VendorsTable({ data }: VendorsTableProps) {
  const { can } = usePermissions()
  return <Table columns={getColumns(can('vendors.update'))} data={data} />
}
