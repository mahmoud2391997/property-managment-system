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
import { useState } from 'react'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'

// Infer the type from Prisma query
export type VendorWithDetails = Prisma.vendorsGetPayload<{
  select: {
    id: true
    name: true
    phone_number: true
    email: true
  }
}>

const getColumns = (canUpdate: boolean, canDelete: boolean): ColumnDef<VendorWithDetails>[] => [
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
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

      return (
        <>
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
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className='text-red-600 focus:text-red-700'
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    Delete Vendor
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ConfirmationDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="Delete Vendor"
            description={`Are you sure you want to delete ${vendor.name}? This action cannot be undone.`}
            confirmationText="DELETE"
            onConfirm={async () => {
              try {
                const response = await fetch(`/api/vendors/${vendor.id}`, {
                  method: 'DELETE'
                })
                
                if (response.ok) {
                  window.location.reload()
                } else {
                  const error = await response.json()
                  console.error('Delete failed:', error.error)
                  alert(`Failed to delete vendor: ${error.error}`)
                }
              } catch (error) {
                console.error('Error deleting vendor:', error)
                alert('Failed to delete vendor. Please try again.')
              }
            }}
            confirmButtonLabel="Delete Vendor"
            confirmButtonLoadingLabel="Deleting..."
            variant="danger"
          />
        </>
      )
    }
  }
]

type VendorsTableProps = {
  data: VendorWithDetails[]
}

export default function VendorsTable({ data }: VendorsTableProps) {
  const { can } = usePermissions()
  return <Table columns={getColumns(can('vendors.update'), can('vendors.delete'))} data={data} />
}
