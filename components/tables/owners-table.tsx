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
import EditOwnerDialog from '../dialogs/edit-owner-dialog'
import Link from 'next/link'
import { usePermissions } from '@/hooks/use-permissions'

// Infer the type from Prisma query and extend with computed fields
export type OwnerWithDetails = Prisma.ownersGetPayload<{
  select: {
    id: true
    first_name: true
    last_name: true
    phone_number: true
    email: true
    profile_pic: true
    profile_thumb: true
    _count: {
      select: {
        properties: true
      }
    }
  }
}> & {
  currentContractCount: number
}

const getColumns = (canUpdate: boolean): ColumnDef<OwnerWithDetails>[] => [
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
    accessorKey: 'first_name',
    header: () => <div className='text-left'>Name</div>,
    cell: ({ row }) => {
      const { id, first_name, last_name, profile_thumb } = row.original
      const fullName = `${first_name}${last_name ? ` ${last_name}` : ''}`
      return (
        <Link href={`/owners/${id}/overview`} className={cn('flex items-center gap-[5]', 'text-left')}>
          {profile_thumb ? (
            <img
              src={profile_thumb}
              alt={fullName}
              className='w-[25px] h-[25px] rounded-full object-cover'
            />
          ) : (
            <UserAvatar name={fullName} size={25} className='text-[11px]!' />
          )}
          <span className='texts-table-cell-primary hover:underline'>{fullName}</span>
        </Link>
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
    accessorKey: '_count',
    header: () => <div className='text-left'>Properties</div>,
    cell: ({ row }) => {
      const { _count } = row.original

      return (
        <div className='text-left texts-table-cell-data'>{_count.properties}</div>
      )
    }
  },

  {
    accessorKey: 'currentContractCount',
    header: () => <div className='text-left'>Contracts</div>,
    cell: ({ row }) => {
      const contractCount = row.original.currentContractCount || 0

      const badge = contractCount > 0
        ? {
            label: contractCount === 1 ? 'Active' : `Active (${contractCount})`,
            className: 'bg-green-100 text-green-800'
          }
        : {
            label: 'None',
            className: 'bg-gray-100 text-gray-800'
          }

      return (
        <div className='texts-table-cell-primary text-left'>
          <div className={cn('status-styles', badge.className)}>
            {badge.label}
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
      const owner = row.original

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
              <EditOwnerDialog
                ownerId={owner.id}
                initialData={{
                  id: owner.id,
                  first_name: owner.first_name,
                  last_name: owner.last_name,
                  phone_number: owner.phone_number,
                  email: owner.email,
                  profile_pic: owner.profile_pic,
                  profile_thumb: owner.profile_thumb
                }}
                trigger={
                  <DropdownMenuItem onSelect={e => e.preventDefault()}>
                    Edit Owner
                  </DropdownMenuItem>
                }
                onSuccess={() => window.location.reload()}
              />
            )}
            <Link href={`/owners/${owner.id}/overview`}>
              <DropdownMenuItem>View details</DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(owner.phone_number)}
            >
              Copy phone number
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(owner.email ?? '')}
            >
              Copy email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

type OwnersTableProps = {
  data: OwnerWithDetails[]
}

export default function OwnersTable({ data }: OwnersTableProps) {
  const { can } = usePermissions()
  return <Table columns={getColumns(can('owners.update'))} data={data} />
}
