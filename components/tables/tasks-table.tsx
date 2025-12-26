'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Building2, Calendar, User, Clock } from 'lucide-react'
import Link from 'next/link'
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
import { Task } from '@/types'
import { cn } from '@/lib/utils'
import { UserAvatar } from '../costume-ui/name-avatar'
import Tooltip from '../costume-ui/tooltip'
import TimestampWithTooltip from '../costume-ui/timestamp-with-tooltip'

// Priority badge colors
const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-100 text-red-800'
    case 'High':
      return 'bg-orange-100 text-orange-800'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'Low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const columns: ColumnDef<Task>[] = [
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

  // Task ID + Type
  {
    accessorKey: 'type',
    header: () => <div className='text-left'>Task</div>,
    cell: ({ row }) => {
      const { id, task_id, type } = row.original

      return (
        <div>
          <Link
            href={`/tasks/${task_id}`}
            className='text-left texts-table-cell-primary text-blue-600 hover:text-blue-800 hover:underline'
          >
            {'#' + id}
          </Link>
          <div className='text-left texts-table-cell-secondary text-(--text-secondary)'>
            {type}
          </div>
        </div>
      )
    }
  },

  // Title + Description
  {
    accessorKey: 'title',
    header: () => <div className='text-left'>Details</div>,
    cell: ({ row }) => {
      const { title, description } = row.original

      return (
        <div>
          <span className='texts-table-cell-primary'>{title}</span>
          <Tooltip
            content={description}
            maxWidth='200px'
            className='texts-table-cell-secondary text-(--text-secondary)'
          >
            {description}
          </Tooltip>
        </div>
      )
    }
  },

  // Property + Room
  {
    accessorKey: 'property',
    header: () => <div className='text-left'>Location</div>,
    cell: ({ row }) => {
      const { property, room } = row.original

      if (!property) {
        return <span className='text-left text-(--text-secondary)'>—</span>
      }

      return (
        <div>
          <div className='text-left texts-table-cell-primary'>{property}</div>
          {room && (
            <div className='text-left texts-table-cell-secondary text-(--text-secondary)'>
              {room}
            </div>
          )}
        </div>
      )
    }
  },

  // Priority
  {
    accessorKey: 'priority',
    header: () => <div className='text-left'>Priority</div>,
    cell: ({ row }) => {
      const { priority } = row.original

      return (
        <div className='text-left'>
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              getPriorityStyles(priority)
            )}
          >
            {priority}
          </span>
        </div>
      )
    }
  },

  // Created By
  {
    accessorKey: 'created_by_name',
    header: () => <div className='text-left'>Created by</div>,
    cell: ({ row }) => {
      const { created_by_name, created_by_picture, created_at } = row.original
      return (
        <div className='flex items-end mt-2'>
          <div className={cn('flex items-center gap-[5]', 'text-left')}>
            <UserAvatar name={created_by_name} imgSrc={created_by_picture} size={30} />
            <div className='flex flex-col'>
              <span className='texts-table-cell-primary'>{created_by_name}</span>
              <TimestampWithTooltip
                timestamp={created_at}
                className='texts-caption-large text-(--text-secondary)'
              />
            </div>
          </div>
        </div>
      )
    }
  },

  // Assigned To
  {
    accessorKey: 'staff_name',
    header: () => <div className='text-left'>Assigned to</div>,
    cell: ({ row }) => {
      const { staff_name, staff_picture, assignment_timestamp } = row.original

      if (!staff_name) return <span className='text-left text-(--text-secondary)'>—</span>
      return (
        <div className='flex items-end mt-2'>
          <div className={cn('flex items-center gap-[5]', 'text-left')}>
            <UserAvatar name={staff_name} imgSrc={staff_picture} size={30} />
            <div className='flex flex-col'>
              <span className='texts-table-cell-primary'>{staff_name}</span>
              {assignment_timestamp && (
                <TimestampWithTooltip
                  timestamp={assignment_timestamp}
                  className='texts-caption-large text-(--text-secondary)'
                />
              )}
            </div>
          </div>
        </div>
      )
    }
  },

  // Status
  {
    accessorKey: 'status',
    header: () => <div className='text-left'>Status</div>,
    cell: ({ row }) => {
      const { status } = row.original
      const statusKey = status.toLowerCase().replace(/\s/g, '-')

      return (
        <div className='text-left'>
          <div
            data-status={statusKey}
            className={cn(
              'status-styles',
              'data-[status=resolved]:bg-green-100 data-[status=resolved]:text-green-800',
              'data-[status=open]:bg-gray-100 data-[status=open]:text-gray-800',
              'data-[status=in-progress]:bg-blue-100 data-[status=in-progress]:text-blue-800'
            )}
          >
            {status}
          </div>
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
      const task = row.original

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
              onClick={() => navigator.clipboard.writeText(task.id)}
            >
              Copy task ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/tasks/${task.task_id}`}>View task details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

type Props = {
  data: Task[]
  onDataRefresh?: () => void
}

// Mobile Card Component
const TaskCard = ({ task }: { task: Task }) => {
  const statusKey = task.status.toLowerCase().replace(/\s/g, '-')

  return (
    <div
      className={cn(
        'bg-(--background-primary) rounded-xl border border-(--border-default)',
        'p-4 space-y-3'
      )}
    >
      {/* Header: ID, Priority, Status, Actions */}
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1 flex-wrap'>
            <Link
              href={`/tasks/${task.task_id}`}
              className='texts-body-medium-semibold text-blue-600 hover:text-blue-800 hover:underline'
            >
              #{task.id}
            </Link>
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                getPriorityStyles(task.priority)
              )}
            >
              {task.priority}
            </span>
            <div
              data-status={statusKey}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                'data-[status=resolved]:bg-green-100 data-[status=resolved]:text-green-800',
                'data-[status=open]:bg-gray-100 data-[status=open]:text-gray-800',
                'data-[status=in-progress]:bg-blue-100 data-[status=in-progress]:text-blue-800'
              )}
            >
              {task.status}
            </div>
          </div>
          <span className='texts-caption-large text-(--text-secondary)'>
            {task.type}
          </span>
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
              onClick={() => navigator.clipboard.writeText(task.id)}
            >
              Copy task ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/tasks/${task.task_id}`}>View task details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title & Description */}
      <div>
        <p className='texts-body-medium-medium text-(--text-primary) mb-1'>
          {task.title}
        </p>
        <p className='texts-caption-large text-(--text-secondary) line-clamp-2'>
          {task.description}
        </p>
      </div>

      {/* Info Grid */}
      <div className='grid grid-cols-2 gap-3'>
        {/* Location */}
        <div className='flex items-start gap-2'>
          <Building2 className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
          <div className='min-w-0'>
            <div className='texts-caption-small text-(--text-secondary)'>
              Location
            </div>
            {task.property ? (
              <>
                <div className='texts-body-small-medium text-(--text-primary) truncate'>
                  {task.property}
                </div>
                {task.room && (
                  <div className='texts-caption-small text-(--text-secondary) truncate'>
                    {task.room}
                  </div>
                )}
              </>
            ) : (
              <div className='texts-body-small text-(--text-secondary)'>—</div>
            )}
          </div>
        </div>

        {/* Due Date or Created Date */}
        <div className='flex items-start gap-2'>
          {task.due_date ? (
            <>
              <Clock className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
              <div className='min-w-0'>
                <div className='texts-caption-small text-(--text-secondary)'>
                  Due
                </div>
                <TimestampWithTooltip
                  timestamp={task.due_date}
                  className='texts-body-small-medium text-(--text-primary)'
                />
              </div>
            </>
          ) : (
            <>
              <Calendar className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
              <div className='min-w-0'>
                <div className='texts-caption-small text-(--text-secondary)'>
                  Created
                </div>
                <TimestampWithTooltip
                  timestamp={task.created_at}
                  className='texts-body-small-medium text-(--text-primary)'
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Created By / Assigned To */}
      <div className='pt-2 border-t border-(--border-default)'>
        <div className='flex items-center justify-between'>
          {/* Created By */}
          <div className='flex items-center gap-2'>
            <User className='w-4 h-4 text-(--text-secondary)' />
            <div className='flex items-center gap-1.5'>
              <UserAvatar
                name={task.created_by_name}
                imgSrc={task.created_by_picture}
                size={24}
              />
              <span className='texts-caption-large text-(--text-primary)'>
                {task.created_by_name}
              </span>
            </div>
          </div>

          {/* Assigned To */}
          {task.staff_name && (
            <div className='flex items-center gap-1.5'>
              <span className='texts-caption-small text-(--text-secondary)'>
                →
              </span>
              <UserAvatar
                name={task.staff_name}
                imgSrc={task.staff_picture}
                size={24}
              />
              <span className='texts-caption-large text-(--text-primary)'>
                {task.staff_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* View Details Button */}
      <Link
        href={`/tasks/${task.task_id}`}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5',
          'text-sm font-medium text-(--text-secondary)',
          'bg-(--background-secondary) hover:bg-neutral-200/70',
          'rounded-lg transition-colors'
        )}
      >
        View Details
      </Link>
    </div>
  )
}

export default function TasksTable({ data, onDataRefresh }: Props) {
  return (
    <>
      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table columns={columns} data={data} />
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {data.length > 0 ? (
          data.map(task => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            No tasks found.
          </div>
        )}

        {/* Pagination info for mobile */}
        {data.length > 0 && (
          <div className='text-center py-4 texts-caption-large text-(--text-secondary)'>
            Showing {data.length} task{data.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  )
}
