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
import EditAgentDialog from '../dialogs/edit-agent-dialog'

// Infer the type from Prisma query and extend with computed fields
export type AgentWithDetails = Prisma.agentsGetPayload<{
  select: {
    id: true
    first_name: true
    last_name: true
    phone_number: true
    email: true
    _count: {
      select: {
        leases: true
      }
    }
  }
}>

export const columns: ColumnDef<AgentWithDetails>[] = [
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
      const { first_name, last_name } = row.original
      const fullName = `${first_name}${last_name ? ` ${last_name}` : ''}`
      return (
        <div className={cn('flex items-center gap-[5]', 'text-left')}>
          <UserAvatar name={fullName} size={25} className='text-[11px]!' />
          <span className='texts-table-cell-primary'>{fullName}</span>
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
    accessorKey: '_count',
    header: () => <div className='text-left'>Leases Secured</div>,
    cell: ({ row }) => {
      const leaseCount = row.original._count.leases

      const badge = leaseCount > 0
        ? {
            label: leaseCount.toString(),
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
      const agent = row.original

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
            <EditAgentDialog
              agentId={agent.id}
              initialData={{
                id: agent.id,
                first_name: agent.first_name,
                last_name: agent.last_name,
                phone_number: agent.phone_number,
                email: agent.email
              }}
              trigger={
                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                  Edit Agent
                </DropdownMenuItem>
              }
              onSuccess={() => window.location.reload()}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(agent.phone_number)}
            >
              Copy phone number
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(agent.email ?? '')}
            >
              Copy email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

type AgentsTableProps = {
  data: AgentWithDetails[]
}

export default function AgentsTable({ data }: AgentsTableProps) {
  return <Table columns={columns} data={data} />
}
