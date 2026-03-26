'use client'

import {
  ColumnDef
} from '@tanstack/react-table'
import { MoreHorizontal, ChevronRight, ChevronDown, Calendar, Building2, FileText, User, Repeat, CreditCard, Pencil, Eye, Copy, Trash2, Banknote } from 'lucide-react'
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
import { ExpenseWithDetails } from '@/lib/expenses-utils'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/formatTime'
import { formatCurrency } from '@/utils/formatCurrency'
import { Progress } from '../ui/progress'
import { Table } from '../costume-ui/table'
import PaymentHistoryRow from './payment-history-row'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'
import { FeedbackToasts } from '../costume-ui/feedback-toast'
import LogExpensePaymentDialog from '../dialogs/log-expense-payment-dialog'

type Props = {
  data: ExpenseWithDetails[]
  category?: string
  className?: string
  isLoading?: boolean
  currentPage?: number
  totalItems?: number
  pageSize?: number
  canGoNext?: boolean
  canGoPrevious?: boolean
  onNextPage?: () => void
  onPreviousPage?: () => void
}

const CONTEXT_COLUMN_HEADER: Record<string, string> = {
  Property_Related: 'Property',
  Contract_Related: 'Contract',
  Staff_Related: 'Staff'
}

const CONTEXT_COLUMN_CATEGORIES = ['Property_Related', 'Contract_Related', 'Staff_Related']

export default function ExpensesTable({
  data,
  category = 'Property_Related',
  className = '',
  isLoading = false,
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  canGoNext = false,
  canGoPrevious = false,
  onNextPage,
  onPreviousPage
}: Props) {
  const hasServerPagination = onNextPage !== undefined || onPreviousPage !== undefined
  const [refreshingExpenseId, setRefreshingExpenseId] = useState<string | null>(null)
  const [isDeletingExpense, setIsDeletingExpense] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDeleteExpense = async (expenseReferenceId: string) => {
    setDeleteLoading(true)
    setIsDeletingExpense(expenseReferenceId)

    try {
      const response = await fetch(`/api/expenses/${expenseReferenceId}/delete`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete expense')
      }

      FeedbackToasts.deleted('Expense')
      window.location.reload()
    } catch (error: any) {
      console.error('Error deleting expense:', error)
      FeedbackToasts.deleteFailed('expense', error.message)
      throw error
    } finally {
      setDeleteLoading(false)
      setIsDeletingExpense(null)
    }
  }

  const showContextColumn = CONTEXT_COLUMN_CATEGORIES.includes(category)
  const contextHeader = CONTEXT_COLUMN_HEADER[category] || ''

  const columns: ColumnDef<ExpenseWithDetails>[] = useMemo(() => {
    const base: ColumnDef<ExpenseWithDetails>[] = [
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
          const hasHistory = row.original.payment_percentage > 0

          if (!hasHistory) {
            return null
          }

          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => row.toggleExpanded()}
              className="h-6 w-6 p-0"
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

      // Transaction
      {
        accessorKey: 'type',
        header: () => <div className='text-left'>Transaction</div>,
        cell: ({ row }) => {
          const { id, type, is_asset } = row.original

          return (
            <div>
              <Link href={`/expenses/${id}`} className='text-left texts-table-cell-primary hover:underline hover:text-(--info-main)'>
                {id}
              </Link>
              <div className='flex items-center gap-1.5 text-left texts-table-cell-secondary text-(--text-secondary)'>
                {type}
                {is_asset && (
                  <span className='px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800'>
                    Asset
                  </span>
                )}
              </div>
            </div>
          )
        }
      }
    ]

    // Context column (Property / Contract) — only for categories that have context
    if (showContextColumn) {
      base.push({
        accessorKey: 'context_label',
        header: () => <div className='text-left'>{contextHeader}</div>,
        cell: ({ row }) => {
          const { context_label, context_label_href, context_id, context_subtitle, context_subtitle_href } = row.original

          // If there are individual hrefs for label/subtitle, render them separately
          if (context_label_href || context_subtitle_href) {
            return (
              <div>
                {context_label_href ? (
                  <Link href={context_label_href} className='text-left texts-table-cell-primary hover:underline'>
                    {context_label}
                  </Link>
                ) : (
                  <div className='text-left texts-table-cell-primary'>{context_label}</div>
                )}
                {context_subtitle && (
                  context_subtitle_href ? (
                    <Link href={context_subtitle_href} className='text-left texts-table-cell-secondary hover:underline block'>
                      {context_subtitle}
                    </Link>
                  ) : (
                    <div className='text-left texts-table-cell-secondary'>{context_subtitle}</div>
                  )
                )}
              </div>
            )
          }

          // Legacy: single link wrapping both label and subtitle
          const href = context_id ? `/properties/${context_id}/overview` : null

          if (href) {
            return (
              <Link href={href} className='block group hover:underline'>
                <div className='text-left texts-table-cell-primary group-hover:underline'>
                  {context_label}
                </div>
                <div className='text-left texts-table-cell-secondary group-hover:underline'>
                  {context_subtitle}
                </div>
              </Link>
            )
          }

          return (
            <div>
              <div className='text-left texts-table-cell-primary'>{context_label}</div>
              {context_subtitle && (
                <div className='text-left texts-table-cell-secondary'>{context_subtitle}</div>
              )}
            </div>
          )
        }
      })
    }

    // Due Date
    base.push({
      accessorKey: 'due_date',
      header: () => <div className='text-left'>Due Date</div>,
      cell: ({ row }) => {
        const { due_date, recurring_pattern, recurring_pattern_description } = row.original
        const rawPattern: ExpenseWithDetails['recurring_pattern'] = recurring_pattern
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
                <Tooltip
                  variant='description'
                  content={recurring_pattern_description}
                  className='flex items-center gap-[5]'
                >
                  <Repeat strokeWidth={2} size={12} />
                  {recurring_pattern}
                </Tooltip>
              ) : (
                recurring_pattern
              )}
            </div>
          </>
        )
      }
    })

    // Amount
    base.push({
      accessorKey: 'amount',
      header: () => <div className='text-left'>Amount</div>,
      cell: ({ row }) => {
        const { amount, due_date, payment_percentage, latest_payment_timestamp, status } = row.original

        // Check if cancelled first
        if (status === 'Cancelled') {
          return (
            <>
              <div className='texts-body-large-medium text-left mb-1'>
                {formatCurrency(amount)}
              </div>
              <div className='texts-table-cell-primary text-left'>
                <div
                  data-status='cancelled'
                  className={cn('status-styles', 'bg-neutral-200 text-neutral-600')}
                >
                  Cancelled
                </div>
              </div>
            </>
          )
        }

        // Calculate display status based on due date and payment
        const now = new Date()
        const dueDate = due_date ? new Date(due_date) : null
        const isFullyPaid = payment_percentage >= 100
        const isOverdue = dueDate ? now > dueDate : false
        const latestPaymentDate = latest_payment_timestamp ? new Date(latest_payment_timestamp) : null

        let displayStatus: ExpenseWithDetails['status']
        if (isFullyPaid) {
          displayStatus = (dueDate && latestPaymentDate && latestPaymentDate > dueDate) ? 'Paid Late' : 'Paid'
        } else {
          displayStatus = isOverdue ? 'Overdue' : 'Pending'
        }

        const statusKey = displayStatus.toLowerCase().replace(/\s/g, '-')

        return (
          <>
            <div className='texts-body-large-medium text-left mb-1'>
              {formatCurrency(amount)}
            </div>
            <div className='texts-table-cell-primary text-left'>
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
                {displayStatus}
              </div>
            </div>
          </>
        )
      }
    })

    // Payment
    base.push({
      accessorKey: 'payment_percentage',
      header: () => <div className='text-left'>Payment</div>,
      cell: ({ row }) => {
        const { amount, payment_percentage } = row.original
        const remainingAmount = amount * ((100 - payment_percentage) / 100)

        return (
          <div>
            <div className='flex items-center justify-between mb-1'>
              <div className='text-left texts-caption-large mr-4'>
                {payment_percentage}% Paid
              </div>
              <div className='text-left texts-caption-small text-(--text-secondary)'>
                {formatCurrency(remainingAmount)} remaining
              </div>
            </div>
            <Progress value={payment_percentage} />
          </div>
        )
      }
    })

    // Actions
    base.push({
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => {
        const expense = row.original
        const hasRemainingAmount = expense.payment_percentage < 100
        const isCancelled = expense.status === 'Cancelled'

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
              <DropdownMenuItem asChild>
                <Link href={`/expenses/${expense.id}`}>
                  <Eye size={14} className='mr-2' />
                  View details
                </Link>
              </DropdownMenuItem>
              {expense.payment_percentage === 0 && !isCancelled && (
                <DropdownMenuItem asChild>
                  <Link href={`/expenses/${expense.id}/edit`}>
                    <Pencil size={14} className='mr-2' />
                    Edit expense
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(expense.id)}
              >
                <Copy size={14} className='mr-2' />
                Copy expense ID
              </DropdownMenuItem>
              {!isCancelled && (
                <>
                  <DropdownMenuSeparator />
                  <LogExpensePaymentDialog
                    expenseId={expense.id}
                    expenseReferenceId={expense.id}
                    maxAmount={expense.amount * (1 - expense.payment_percentage / 100)}
                    trigger={
                      <DropdownMenuItem
                        disabled={!hasRemainingAmount}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Banknote size={14} className='mr-2' />
                        Log payment
                      </DropdownMenuItem>
                    }
                    onSuccess={() => {
                      setRefreshingExpenseId(expense.id)
                      window.location.reload()
                    }}
                  />
                  <DropdownMenuSeparator />
                  <ConfirmationDialog
                    openDialogButton={
                      <DropdownMenuItem
                        className='text-red-600 focus:text-red-600'
                        disabled={expense.payment_percentage > 0 || isDeletingExpense === expense.id}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 size={14} className='mr-2' />
                        Delete expense
                      </DropdownMenuItem>
                    }
                    title='Delete Expense'
                    description={`Are you sure you want to delete expense ${expense.id}? This action cannot be undone.`}
                    onConfirm={() => handleDeleteExpense(expense.id)}
                    loading={deleteLoading}
                  />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    })

    return base
  }, [category, showContextColumn, contextHeader])

  // Helper function to get display status
  const getDisplayStatus = (expense: ExpenseWithDetails) => {
    if (expense.status === 'Cancelled') return 'Cancelled'

    const now = new Date()
    const dueDate = expense.due_date ? new Date(expense.due_date) : null
    const isFullyPaid = expense.payment_percentage >= 100
    const isOverdue = dueDate ? now > dueDate : false
    const latestPaymentDate = expense.latest_payment_timestamp ? new Date(expense.latest_payment_timestamp) : null

    if (isFullyPaid) {
      return (dueDate && latestPaymentDate && latestPaymentDate > dueDate) ? 'Paid Late' : 'Paid'
    }
    return isOverdue ? 'Overdue' : 'Pending'
  }

  // Mobile Card Component
  const ExpenseCard = ({ expense }: { expense: ExpenseWithDetails }) => {
    const displayStatus = getDisplayStatus(expense)
    const statusKey = displayStatus.toLowerCase().replace(/\s/g, '-')
    const remainingAmount = expense.amount * ((100 - expense.payment_percentage) / 100)
    const hasRemainingAmount = expense.payment_percentage < 100
    const patternKey = expense.recurring_pattern.toLowerCase().replace(/\s/g, '-')

    return (
      <div className={cn(
        'bg-(--background-primary) rounded-xl border border-(--border-default)',
        'p-4 space-y-3',
        refreshingExpenseId === expense.id && 'opacity-50'
      )}>
        {/* Header: ID, Status, Actions */}
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='texts-body-medium-semibold text-(--text-primary)'>
                #{expense.id}
              </span>
              <div
                data-status={statusKey}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  'data-[status=paid]:bg-green-100 data-[status=paid]:text-green-800',
                  'data-[status=paid-late]:bg-yellow-100 data-[status=paid-late]:text-yellow-800',
                  'data-[status=pending]:bg-gray-100 data-[status=pending]:text-gray-800',
                  'data-[status=overdue]:bg-red-100 data-[status=overdue]:text-red-800',
                  'data-[status=cancelled]:bg-neutral-200 data-[status=cancelled]:text-neutral-600'
                )}
              >
                {displayStatus}
              </div>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='texts-caption-large text-(--text-secondary)'>
                {expense.type}
              </span>
              {expense.is_asset && (
                <span className='px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800'>
                  Asset
                </span>
              )}
            </div>
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
              <DropdownMenuItem asChild>
                <Link href={`/expenses/${expense.id}`}>
                  <Eye size={14} className='mr-2' />
                  View details
                </Link>
              </DropdownMenuItem>
              {expense.payment_percentage === 0 && expense.status !== 'Cancelled' && (
                <DropdownMenuItem asChild>
                  <Link href={`/expenses/${expense.id}/edit`}>
                    <Pencil size={14} className='mr-2' />
                    Edit expense
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(expense.id)}>
                <Copy size={14} className='mr-2' />
                Copy expense ID
              </DropdownMenuItem>
              {expense.status !== 'Cancelled' && (
                <>
                  <DropdownMenuSeparator />
                  <LogExpensePaymentDialog
                    expenseId={expense.id}
                    expenseReferenceId={expense.id}
                    maxAmount={expense.amount * (1 - expense.payment_percentage / 100)}
                    trigger={
                      <DropdownMenuItem
                        disabled={!hasRemainingAmount}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Banknote size={14} className='mr-2' />
                        Log payment
                      </DropdownMenuItem>
                    }
                    onSuccess={() => {
                      setRefreshingExpenseId(expense.id)
                      window.location.reload()
                    }}
                  />
                  <DropdownMenuSeparator />
                  <ConfirmationDialog
                    openDialogButton={
                      <DropdownMenuItem
                        className='text-red-600 focus:text-red-600'
                        disabled={expense.payment_percentage > 0 || isDeletingExpense === expense.id}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 size={14} className='mr-2' />
                        Delete expense
                      </DropdownMenuItem>
                    }
                    title='Delete Expense'
                    description={`Are you sure you want to delete expense ${expense.id}? This action cannot be undone.`}
                    onConfirm={() => handleDeleteExpense(expense.id)}
                    loading={deleteLoading}
                  />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Amount - Prominent display */}
        <div className='flex items-baseline gap-2'>
          <span className='text-2xl font-semibold text-(--text-primary)'>
            {formatCurrency(expense.amount)}
          </span>
          <div
            data-pattern={patternKey}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
              'data-[pattern=one-time]:bg-neutral-100 data-[pattern=one-time]:text-(--text-secondary)',
              'data-[pattern=recurring]:bg-(--info-light) data-[pattern=recurring]:text-(--info-main)'
            )}
          >
            {patternKey === 'recurring' && <Repeat strokeWidth={2} size={10} />}
            {expense.recurring_pattern}
          </div>
        </div>

        {/* Info Grid */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Context (Property / Contract) */}
          {showContextColumn && (() => {
            const iconMap: Record<string, React.ReactNode> = {
              Property_Related: <Building2 className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />,
              Contract_Related: <FileText className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />,
              Staff_Related: <User className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
            }
            const icon = iconMap[category] || <Building2 className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />

            // If there are individual hrefs for label/subtitle, render them separately
            if (expense.context_label_href || expense.context_subtitle_href) {
              return (
                <div className='flex items-start gap-2'>
                  {icon}
                  <div className='min-w-0'>
                    <div className='texts-caption-small text-(--text-secondary)'>{contextHeader}</div>
                    {expense.context_label_href ? (
                      <Link href={expense.context_label_href} className='texts-body-small-medium text-(--text-primary) truncate hover:underline block'>
                        {expense.context_label}
                      </Link>
                    ) : (
                      <div className='texts-body-small-medium text-(--text-primary) truncate'>{expense.context_label}</div>
                    )}
                    {expense.context_subtitle && (
                      expense.context_subtitle_href ? (
                        <Link href={expense.context_subtitle_href} className='texts-caption-small text-(--text-secondary) truncate hover:underline block'>
                          {expense.context_subtitle}
                        </Link>
                      ) : (
                        <div className='texts-caption-small text-(--text-secondary) truncate'>{expense.context_subtitle}</div>
                      )
                    )}
                  </div>
                </div>
              )
            }

            // Legacy: single link wrapping both label and subtitle
            const href = expense.context_id ? `/properties/${expense.context_id}/overview` : null

            const content = (
              <>
                {icon}
                <div className='min-w-0'>
                  <div className='texts-caption-small text-(--text-secondary)'>{contextHeader}</div>
                  <div className='texts-body-small-medium text-(--text-primary) truncate group-hover:underline'>{expense.context_label}</div>
                  {expense.context_subtitle && (
                    <div className='texts-caption-small text-(--text-secondary) truncate group-hover:underline'>{expense.context_subtitle}</div>
                  )}
                </div>
              </>
            )

            if (href) {
              return (
                <Link href={href} className='flex items-start gap-2 group'>
                  {content}
                </Link>
              )
            }

            return (
              <div className='flex items-start gap-2'>
                {content}
              </div>
            )
          })()}

          {/* Due Date */}
          <div className='flex items-start gap-2'>
            <Calendar className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
            <div className='min-w-0'>
              <div className='texts-caption-small text-(--text-secondary)'>Due Date</div>
              <div className='texts-body-small-medium text-(--text-primary)'>{formatDate(expense.due_date)}</div>
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className='pt-2 border-t border-(--border-default)'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-1.5'>
              <CreditCard className='w-4 h-4 text-(--text-secondary)' />
              <span className='texts-caption-large text-(--text-primary) font-medium'>
                {expense.payment_percentage}% Paid
              </span>
            </div>
            <span className='texts-caption-small text-(--text-secondary)'>
              {formatCurrency(remainingAmount)} remaining
            </span>
          </div>
          <Progress value={expense.payment_percentage} className='h-2' />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table
          columns={columns}
          data={data}
          className={className}
          noPagnitation={hasServerPagination}
          getRowCanExpand={(row) => row.original.payment_percentage > 0}
          loadingRowId={refreshingExpenseId}
          getRowId={(row) => row.id}
          isLoadingRows={isLoading}
          loadingRowsCount={pageSize}
          renderSubComponent={(row) => (
            <PaymentHistoryRow
              key={`history-${row.original.id}`}
              referenceId={row.original.id}
              isExpanded={row.getIsExpanded()}
              type='expense'
            />
          )}
        />
        {hasServerPagination && (
          <div className='flex items-center justify-end space-x-2 py-4'>
            <div className='text-muted-foreground flex-1 text-sm'>
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} expenses
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
          Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className='bg-white rounded-lg border border-(--border-default) p-4 animate-pulse'>
              <div className='flex justify-between items-start mb-3'>
                <div className='h-5 w-24 bg-gray-200 rounded' />
                <div className='h-6 w-16 bg-gray-200 rounded-full' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 w-32 bg-gray-200 rounded' />
                <div className='h-4 w-40 bg-gray-200 rounded' />
                <div className='h-4 w-28 bg-gray-200 rounded' />
              </div>
            </div>
          ))
        ) : data.length > 0 ? (
          data.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            No expenses found.
          </div>
        )}

        {/* Pagination controls for mobile */}
        {hasServerPagination && (
          <div className='flex flex-col gap-3 py-4'>
            <div className='text-center texts-caption-large text-(--text-secondary)'>
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} expenses
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
