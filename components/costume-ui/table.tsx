import React from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  ExpandedState,
  Row
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type Props<TData extends object> = {
  columns: ColumnDef<TData>[]
  data: TData[]
  className?: string
  getRowCanExpand?: (row: Row<TData>) => boolean
  renderSubComponent?: (row: Row<TData>) => React.ReactElement
  noPagnitation?: boolean
  loadingRowId?: string | null
  getRowId?: (row: TData) => string
  meta?: Record<string, unknown>
  /** Show skeleton loading state for rows */
  isLoadingRows?: boolean
  /** Number of skeleton rows to show when loading */
  loadingRowsCount?: number
}

function Table<TData extends object> ({
  columns,
  data,
  className = '',
  getRowCanExpand,
  renderSubComponent,
  noPagnitation = false,
  loadingRowId = null,
  getRowId,
  meta,
  isLoadingRows = false,
  loadingRowsCount = 10
}: Props<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [rowSelection, setRowSelection] = React.useState({})
  const [expanded, setExpanded] = React.useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getRowCanExpand: getRowCanExpand,
    meta,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      expanded
    }
  })

  return (
    <div className='w-full'>
      <div className={cn('overflow-hidden rounded-xl border', className)}>
        <ShadcnTable>
          <TableHeader className='bg-(--background-secondary)'>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className='bg-(--background-primary)'>
            {isLoadingRows ? (
              // Skeleton loading rows
              Array.from({ length: loadingRowsCount }).map((_, rowIndex) => (
                <TableRow
                  key={`skeleton-${rowIndex}`}
                  className={cn(
                    'animate-in fade-in slide-in-from-left-1 duration-300'
                  )}
                  style={{ animationDelay: `${rowIndex * 50}ms` }}
                >
                  {columns.map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${colIndex}`} className='p-4'>
                      <Skeleton className='h-4 w-full bg-neutral-200' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => {
                const rowId = getRowId ? getRowId(row.original) : null
                const isLoading = loadingRowId && rowId === loadingRowId

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      className='relative'
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className={cn(isLoading && 'opacity-30')}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                      {isLoading && (
                        <td className='absolute inset-0 flex items-center justify-center pointer-events-none' style={{ background: 'rgba(255,255,255,0.8)' }}>
                          <div className='flex items-center gap-2 text-sm text-gray-500'>
                            <div className='h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin' />
                            Updating...
                          </div>
                        </td>
                      )}
                    </TableRow>
                    {row.getCanExpand() && renderSubComponent && (
                      <TableRow className={row.getIsExpanded() ? '' : 'hidden'}>
                        <TableCell colSpan={row.getVisibleCells().length}>
                          {renderSubComponent(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ShadcnTable>
      </div>

      {!noPagnitation && (
        <div className='flex items-center justify-end space-x-2 py-4'>
          <div className='text-muted-foreground flex-1 text-sm'>
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className='space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
export { Table }
