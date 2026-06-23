'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import {
  MoreHorizontal,
  Building2,
  Calendar,
  User,
  Clock,
  Check,
  X,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
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
import { useState } from 'react'
import { toast } from 'sonner'
import MobileCardSkeleton from '../loading-ui/mobile-card-skeleton'

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

// // Component for pending assignment actions
// const PendingAssignmentActions = ({
//   taskId,
//   onAccept,
//   onReject
// }: {
//   taskId: string
//   onAccept: () => Promise<void>
//   onReject: () => Promise<void>
// }) => {
//   const [isAccepting, setIsAccepting] = useState(false)
//   const [isRejecting, setIsRejecting] = useState(false)

//   const handleAccept = async () => {
//     setIsAccepting(true)
//     try {
//       await onAccept()
//       toast.success('Assignment accepted successfully')
//     } catch (error) {
//       toast.error('Failed to accept assignment')
//     } finally {
//       setIsAccepting(false)
//     }
//   }

//   const handleReject = async () => {
//     setIsRejecting(true)
//     try {
//       await onReject()
//       toast.success('Assignment rejected')
//     } catch (error) {
//       toast.error('Failed to reject assignment')
//     } finally {
//       setIsRejecting(false)
//     }
//   }

//   return (
//     <div className='flex items-center gap-2'>
//       <Button
//         size='sm'
//         onClick={handleAccept}
//         disabled={isAccepting || isRejecting}
//         className='h-7 px-2 text-xs bg-green-600 hover:bg-green-700'
//       >
//         {isAccepting ? (
//           'Accepting...'
//         ) : (
//           <>
//             <Check className='w-3 h-3 mr-1' />
//             Accept
//           </>
//         )}
//       </Button>
//       <Button
//         size='sm'
//         variant='outline'
//         onClick={handleReject}
//         disabled={isAccepting || isRejecting}
//         className='h-7 px-2 text-xs border-red-300 text-red-600 hover:bg-red-50'
//       >
//         {isRejecting ? (
//           'Rejecting...'
//         ) : (
//           <>
//             <X className='w-3 h-3 mr-1' />
//             Reject
//           </>
//         )}
//       </Button>
//     </div>
//   )
// }

const createColumns = (
  onAcceptAssignment?: (taskId: string) => Promise<void>,
  onRejectAssignment?: (taskId: string) => Promise<void>
): ColumnDef<Task>[] => [
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
            <UserAvatar
              name={created_by_name}
              imgSrc={created_by_picture}
              size={30}
            />
            <div className='flex flex-col'>
              <span className='texts-table-cell-primary'>
                {created_by_name}
              </span>
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

  // Assigned To / Pending Assignment
  {
    accessorKey: 'staff_name',
    header: () => <div className='text-left'>Assigned to</div>,
    cell: ({ row }) => {
      const {
        staff_name,
        staff_picture,
        assignment_timestamp,
        has_pending_assignment,
        task_id
      } = row.original

      // Show pending assignment with accept/reject buttons
      if (has_pending_assignment && onAcceptAssignment && onRejectAssignment) {
        return (
          <div className='flex flex-col gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='w-4 h-4 text-orange-600 shrink-0' />
              <span className='texts-table-cell-primary font-medium text-orange-700'>
                Pending Assignment
              </span>
            </div>

            <Link href={`/tasks/${task_id}`} className='w-full'>
              <Button
                variant='outline'
                size='sm'
                className={cn(
                  'h-7 w-full px-3 text-xs',
                  'border-orange-300 text-orange-700',
                  'hover:bg-orange-100 hover:text-orange-800'
                )}
              >
                View task details
              </Button>
            </Link>
          </div>
        )
      }

      // Show assigned staff
      if (!staff_name)
        return <span className='text-left text-(--text-secondary)'>—</span>
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
  isLoading?: boolean
  currentPage?: number
  totalItems?: number
  pageSize?: number
  canGoNext?: boolean
  canGoPrevious?: boolean
  onNextPage?: () => void
  onPreviousPage?: () => void
  updateItem?: (id: string, updates: Partial<Task>) => void
}

// Mobile Card Component
const TaskCard = ({
  task,
  onAcceptAssignment,
  onRejectAssignment
}: {
  task: Task
  onAcceptAssignment?: (taskId: string) => Promise<void>
  onRejectAssignment?: (taskId: string) => Promise<void>
}) => {
  const statusKey = task.status.toLowerCase().replace(/\s/g, '-')

  return (
    <div
      className={cn(
        'bg-(--background-primary) rounded-xl border border-(--border-default)',
        'p-4 space-y-3',
        task.has_pending_assignment && 'border-orange-300 border-2'
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
      <div className='grid grid-cols-2'>
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
                  variant='date'
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
          {task.staff_name && !task.has_pending_assignment && (
            <div className='flex items-center gap-1.5'>
              {/* Clean, low-opacity chevron instead of text arrow */}
              <ChevronRight
                strokeWidth={2}
                className='w-3.5 h-3.5 text-(--text-secondary) opacity-40'
              />
              <UserAvatar
                name={task.staff_name}
                imgSrc={task.staff_picture}
                size={24}
              />
              <span className='texts-caption-large text-(--text-primary) font-medium'>
                {task.staff_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pending Assignment Banner */}
      {task.has_pending_assignment && onAcceptAssignment && onRejectAssignment && (
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-3'>
          <div className='flex items-center gap-2 mb-2'>
            <AlertCircle className='w-4 h-4 text-orange-600 shrink-0' />
            <span className='texts-body-small-semibold text-orange-800'>
              Pending Assignment
            </span>
          </div>

          <Link href={`/tasks/${task.task_id}`} className='block'>
            <Button
              variant='outline'
              size='sm'
              className={cn(
                'h-8 w-full text-xs',
                'border-orange-300 text-orange-700',
                'hover:bg-orange-100 hover:text-orange-800'
              )}
            >
              View task details
            </Button>
          </Link>
        </div>
      )}

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

export default function TasksTable ({
  data,
  onDataRefresh,
  isLoading = false,
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  canGoNext = false,
  canGoPrevious = false,
  onNextPage,
  onPreviousPage,
  updateItem
}: Props) {
  const hasServerPagination = totalItems > pageSize

  // Handle accepting assignment
  const handleAcceptAssignment = async (taskId: string) => {
    const response = await fetch(`/api/tasks/${taskId}/accept`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to accept assignment')
    }

    // Refresh the data
    if (onDataRefresh) {
      onDataRefresh()
    }
  }

  // Handle rejecting assignment
  const handleRejectAssignment = async (taskId: string) => {
    const response = await fetch(`/api/tasks/${taskId}/reject`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error('Failed to reject assignment')
    }

    // Refresh the data
    if (onDataRefresh) {
      onDataRefresh()
    }
  }

  // Create columns with handlers
  const columns = createColumns(handleAcceptAssignment, handleRejectAssignment)

  return (
    <>
      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table
          columns={columns}
          data={data}
          noPagnitation={hasServerPagination}
          isLoadingRows={isLoading}
          loadingRowsCount={pageSize}
          getRowId={row => row.id}
        />

        {/* Server-side Pagination Controls */}
        {hasServerPagination && (
          <div className='flex items-center justify-end space-x-2 py-4'>
            <div className='text-muted-foreground flex-1 text-sm'>
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} tasks
            </div>
            <div className='space-x-2'>
              <button
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3'
                onClick={onPreviousPage}
                disabled={!canGoPrevious || isLoading}
              >
                Previous
              </button>
              <button
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3'
                onClick={onNextPage}
                disabled={!canGoNext || isLoading}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {isLoading ? (
          <MobileCardSkeleton count={pageSize} />
        ) : data.length > 0 ? (
          data.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onAcceptAssignment={handleAcceptAssignment}
              onRejectAssignment={handleRejectAssignment}
            />
          ))
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            No tasks found.
          </div>
        )}

        {/* Server-side Pagination Controls for Mobile */}
        {hasServerPagination && data.length > 0 && (
          <div className='flex flex-col gap-3 py-4'>
            <div className='text-center texts-caption-large text-(--text-secondary)'>
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} tasks
            </div>
            <div className='flex justify-center gap-2'>
              <button
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4'
                onClick={onPreviousPage}
                disabled={!canGoPrevious || isLoading}
              >
                Previous
              </button>
              <button
                className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4'
                onClick={onNextPage}
                disabled={!canGoNext || isLoading}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
