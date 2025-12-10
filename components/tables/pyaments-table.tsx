'use client'

import {
  ColumnDef
} from '@tanstack/react-table'
import { MoreHorizontal, ChevronRight, ChevronDown, Calendar, Building2, Repeat, CreditCard, History, Banknote, Wallet, Globe, X } from 'lucide-react'
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
import { Payment } from '@/types'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/formatTime'
import { formatCurrency } from '@/utils/formatCurrency'
import { Progress } from '../ui/progress'
import { Table } from '../costume-ui/table'
import PaymentHistoryRow from './payment-history-row'
import { useState } from 'react'
import { LoadingOverlay } from '../costume-ui/page-loader'
import Swal from 'sweetalert2'
import LogPaymentDialog from '../dialogs/log-payment-dialog'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'
import { FeedbackToasts } from '../costume-ui/feedback-toast'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { PaymentHistory } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import TimestampWithTooltip from '../costume-ui/timestamp-with-tooltip'

type Props = {
  data: Payment[]
  showPropertyColumn?: boolean
  className?: string
  userType?: 'staff' | 'tenant'
  onDataRefresh?: () => void
}

// // Skeleton component for a refreshing row
// const PaymentRowSkeleton = ({ showPropertyColumn }: { showPropertyColumn: boolean }) => (
//   <tr className='animate-pulse'>
//     <td className='p-4'><div className='h-4 w-4 bg-gray-200 rounded' /></td>
//     <td className='p-4'><div className='h-6 w-6 bg-gray-200 rounded' /></td>
//     <td className='p-4'>
//       <div className='h-4 w-24 bg-gray-200 rounded mb-1' />
//       <div className='h-3 w-16 bg-gray-100 rounded' />
//     </td>
//     {showPropertyColumn && (
//       <td className='p-4'>
//         <div className='h-4 w-28 bg-gray-200 rounded mb-1' />
//         <div className='h-3 w-20 bg-gray-100 rounded' />
//       </td>
//     )}
//     <td className='p-4'>
//       <div className='h-4 w-20 bg-gray-200 rounded mb-1' />
//       <div className='h-5 w-16 bg-gray-100 rounded-full' />
//     </td>
//     <td className='p-4'>
//       <div className='h-5 w-20 bg-gray-200 rounded mb-1' />
//       <div className='h-5 w-14 bg-gray-100 rounded-full' />
//     </td>
//     <td className='p-4'>
//       <div className='flex items-center justify-between mb-1'>
//         <div className='h-3 w-16 bg-gray-200 rounded' />
//         <div className='h-3 w-20 bg-gray-100 rounded' />
//       </div>
//       <div className='h-2 w-full bg-gray-200 rounded-full' />
//     </td>
//     <td className='p-4'><div className='h-8 w-8 bg-gray-200 rounded' /></td>
//   </tr>
// )

export default function PaymentsTable ({ data, showPropertyColumn = true, className = '', userType = 'staff', onDataRefresh }: Props) {
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<'checking' | 'redirecting' | null>(null)
  const [refreshingPaymentId, setRefreshingPaymentId] = useState<string | null>(null)
  const [isDeletingPayment, setIsDeletingPayment] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Mobile payment history bottom sheet state
  const [historySheetOpen, setHistorySheetOpen] = useState(false)
  const [historySheetPaymentId, setHistorySheetPaymentId] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<PaymentHistory[]>([])
  const [historyDueDate, setHistoryDueDate] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // Function to open payment history bottom sheet
  const openPaymentHistory = async (paymentId: string) => {
    setHistorySheetPaymentId(paymentId)
    setHistorySheetOpen(true)
    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const response = await fetch(`/api/payments/${paymentId}/history`)
      if (!response.ok) {
        throw new Error('Failed to fetch payment history')
      }
      const data = await response.json()
      setHistoryData(data.payment_history || [])
      setHistoryDueDate(data.due_date || null)
    } catch (err: any) {
      setHistoryError(err.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Helper to determine if payment was on-time or late
  const getTimingStatus = (paidAt: string): 'On-Time' | 'Late' => {
    if (!historyDueDate) return 'On-Time'
    return new Date(paidAt) <= new Date(historyDueDate) ? 'On-Time' : 'Late'
  }

  const handleLogPayment = async (paymentId: string) => {
    try {
      setIsProcessingPayment(paymentId)
      setLoadingState('checking')

      // Call API to create Billplz bill
      const response = await fetch(`/api/payments/${paymentId}/create-bill`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment bill')
      }

      const data = await response.json()

      // Check if API wants us to check payment status instead
      if (data.redirect_to_check) {
        // Store the bill info for status check
        if (data.payment_id && data.bill_id) {
          localStorage.setItem(`pending_bill_${data.payment_id}`, data.bill_id)
          localStorage.setItem(`payment_uuid_${paymentId}`, data.payment_id)
        }
        // Trigger check status (keeps the loading state as 'checking')
        setIsProcessingPayment(null)
        handleCheckStatus(paymentId)
        return
      }

      // Store bill info and UUID mapping in localStorage for later status check
      if (data.payment_id && data.bill_id) {
        localStorage.setItem(`pending_bill_${data.payment_id}`, data.bill_id)
        // Also store mapping from reference_id to UUID for lookup
        localStorage.setItem(`payment_uuid_${paymentId}`, data.payment_id)
      }

      // Change to redirecting state
      setLoadingState('redirecting')

      // Redirect user to Billplz payment page in the same tab
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        throw new Error('Payment URL not received')
      }
    } catch (error: any) {
      console.error('Error creating payment:', error)
      alert(`Failed to create payment: ${error.message}`)
      setIsProcessingPayment(null)
      setLoadingState(null)
    }
  }

  const handleCheckStatus = async (paymentReferenceId: string) => {
    try {
      setIsCheckingStatus(paymentReferenceId)
      setLoadingState('checking')

      // Call API to check payment status using reference_id
      // The API will automatically find the pending bill from the database
      const response = await fetch('/api/payments/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference_id: paymentReferenceId
        })
      })

      const result = await response.json()

      setLoadingState(null)

      // Handle payment failed (Billplz marked payment as failed)
      if (result.payment_failed) {
        await Swal.fire({
          icon: 'error',
          title: 'Payment Failed',
          text: result.message || 'Payment failed due to an issue with the payment gateway. Please try again.',
          confirmButtonColor: '#ef4444'
        })
        // Show row loading state and refresh data
        setRefreshingPaymentId(paymentReferenceId)
        if (onDataRefresh) {
          onDataRefresh()
        } else {
          window.location.reload()
        }
        setTimeout(() => setRefreshingPaymentId(null), 1500)
        return
      }

      // Handle payment not completed (Pending/due state - payment not done yet)
      if (result.payment_not_completed) {
        await Swal.fire({
          icon: 'info',
          title: 'Payment Not Completed',
          text: result.message || 'No successful payment made yet. Please try making payment again.',
          confirmButtonColor: '#3085d6'
        })
        setIsCheckingStatus(null)
        return
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check payment status')
      }

      // Handle successful payment check results
      if (result.success) {
        if (result.already_recorded) {
          await Swal.fire({
            icon: 'info',
            title: 'Already Recorded',
            text: 'This payment was already recorded!',
            confirmButtonColor: '#3085d6'
          })
        } else if (result.newly_recorded) {
          await Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            text: `Payment verified! Amount: RM ${result.amount_paid}`,
            confirmButtonColor: '#10b981'
          })
        }
        // Show row loading state and refresh data
        setRefreshingPaymentId(paymentReferenceId)
        if (onDataRefresh) {
          onDataRefresh()
        } else {
          window.location.reload()
        }
        setTimeout(() => setRefreshingPaymentId(null), 1500)
      }
      // Handle no payment made yet
      else if (result.no_payment_made) {
        await Swal.fire({
          icon: 'info',
          title: 'No Payment Made',
          text: 'No payment has been made yet for this bill. Please click "Log payment" to make a payment.',
          confirmButtonColor: '#3085d6'
        })
      }
      // Handle payment still pending (not yet paid)
      else if (result.state) {
        await Swal.fire({
          icon: 'warning',
          title: 'Payment Not Completed',
          text: `Payment not completed yet. Status: ${result.state}`,
          confirmButtonColor: '#f59e0b'
        })
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error)
      setLoadingState(null)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to check payment status',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setIsCheckingStatus(null)
    }
  }

  const handleDeletePayment = async (paymentReferenceId: string) => {
    setDeleteLoading(true)
    setIsDeletingPayment(paymentReferenceId)

    try {
      const response = await fetch(`/api/payments/${paymentReferenceId}/delete`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        // Check if payment was completed externally (via Billplz)
        if (result.payment_completed_externally) {
          setDeleteLoading(false)
          setIsDeletingPayment(null)
          await Swal.fire({
            icon: 'error',
            title: 'Cannot Delete Payment',
            text: result.message || 'A payment has been completed through the payment gateway. This payment cannot be deleted.',
            confirmButtonColor: '#ef4444'
          })
          // Refresh data since there might be a payment to record
          onDataRefresh?.()
          throw new Error('blocked') // Keep dialog closed after Swal
        }

        // Check if there's already a successful payment
        if (result.has_successful_payment) {
          setDeleteLoading(false)
          setIsDeletingPayment(null)
          await Swal.fire({
            icon: 'error',
            title: 'Cannot Delete Payment',
            text: 'This payment has successful payment history and cannot be deleted.',
            confirmButtonColor: '#ef4444'
          })
          throw new Error('blocked') // Keep dialog closed after Swal
        }

        throw new Error(result.error || 'Failed to delete payment')
      }

      // Success - dialog will close automatically
      FeedbackToasts.deleted('Payment')
      onDataRefresh?.()
    } catch (error: any) {
      if (error.message !== 'blocked') {
        console.error('Error deleting payment:', error)
        FeedbackToasts.deleteFailed('payment', error.message)
      }
      throw error // Re-throw to keep dialog open on actual errors
    } finally {
      setDeleteLoading(false)
      setIsDeletingPayment(null)
    }
  }

  const columns: ColumnDef<Payment>[] = [
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

    //Expand
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

    {
      accessorKey: 'type',
      header: () => <div className='text-left'>Transaction</div>,
      cell: ({ row }) => {
        const { id, type } = row.original

        return (
          <div>
            <div className='text-left texts-table-cell-primary'>{'#' + id}</div>
            <div className='text-left texts-table-cell-secondary text-(--text-secondary)'>
              {type}
            </div>
          </div>
        )
      }
    },
    ...(showPropertyColumn
      ? ([
          {
            accessorKey: 'property',
            header: () => <div className='text-left'>Property</div>,
            cell: ({ row }) => {
              const { property, room } = row.original
              return (
                <div>
                  <div className='text-left texts-table-cell-primary'>
                    {property}
                  </div>
                  <div className='text-left texts-table-cell-secondary'>
                    {room}
                  </div>
                </div>
              )
            }
          } as ColumnDef<Payment>
        ] as ColumnDef<Payment>[])
      : []),

    {
      accessorKey: 'due_date',
      header: () => <div className='text-left'>Due Date</div>,
      cell: ({ row }) => {
        const { due_date, recurring_pattern, recurring_pattern_description } =
          row.original
        const rawPattern: Payment['recurring_pattern'] = recurring_pattern
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
                  className={cn(
                    'status-styles',
                    'bg-neutral-200 text-neutral-600'
                  )}
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

        let displayStatus: Payment['status']
        if (isFullyPaid) {
          // Check if last payment was after due date
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
    },

    {
      accessorKey: 'payment_percentage',
      header: () => <div className='text-left'>Payment</div>,
      cell: ({ row }) => {
        const {
          amount,
          payment_percentage,
          latest_payment_timestamp
        } = row.original
        const remaindingAmount = amount * ((100 - payment_percentage) / 100)

        return (
          <div>
            <>
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
            </>
          </div>
        )
      }
    },

    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original
        // Enable button if: payment not 100% OR has pending payments to check
        const hasRemainingAmount = payment.payment_percentage < 100 || payment.has_pending_payments
        const isCancelled = payment.status === 'Cancelled'

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
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(payment.id)}
              >
                Copy payment ID
              </DropdownMenuItem>
              {!isCancelled && (
                <>
                  <DropdownMenuSeparator />
                  {userType === 'staff' ? (
                    <>
                      <LogPaymentDialog
                        paymentId={payment.id}
                        paymentReferenceId={payment.id}
                        maxAmount={payment.amount * (1 - payment.payment_percentage / 100)}
                        trigger={
                          <DropdownMenuItem
                            disabled={!hasRemainingAmount}
                            onSelect={(e) => e.preventDefault()}
                          >
                            Log payment
                          </DropdownMenuItem>
                        }
                        onSuccess={() => {
                          setRefreshingPaymentId(payment.id)
                          onDataRefresh?.()
                          // Clear refreshing state after a short delay to allow data to update
                          setTimeout(() => setRefreshingPaymentId(null), 1500)
                        }}
                      />
                      <DropdownMenuItem
                        disabled={!hasRemainingAmount || isCheckingStatus === payment.id}
                        onClick={() => handleCheckStatus(payment.id)}
                      >
                        {isCheckingStatus === payment.id ? 'Checking...' : 'Check payment status'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <ConfirmationDialog
                        openDialogButton={
                          <DropdownMenuItem
                            className='text-red-600 focus:text-red-600'
                            disabled={payment.payment_percentage > 0 || isDeletingPayment === payment.id}
                            onSelect={(e) => e.preventDefault()}
                          >
                            Delete payment
                          </DropdownMenuItem>
                        }
                        title='Delete Payment'
                        description={`Are you sure you want to delete payment ${payment.id}? This action cannot be undone.`}
                        onConfirm={() => handleDeletePayment(payment.id)}
                        loading={deleteLoading}
                      />
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        disabled={!hasRemainingAmount || isProcessingPayment === payment.id}
                        onClick={() => handleLogPayment(payment.id)}
                      >
                        {isProcessingPayment === payment.id ? 'Processing...' : 'Pay now'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!payment.has_pending_payments || isCheckingStatus === payment.id}
                        onClick={() => handleCheckStatus(payment.id)}
                      >
                        {isCheckingStatus === payment.id ? 'Checking...' : 'Check payment status'}
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  // Helper function to get display status
  const getDisplayStatus = (payment: Payment) => {
    // Check if cancelled first
    if (payment.status === 'Cancelled') {
      return 'Cancelled'
    }

    const now = new Date()
    const dueDate = payment.due_date ? new Date(payment.due_date) : null
    const isFullyPaid = payment.payment_percentage >= 100
    const isOverdue = dueDate ? now > dueDate : false
    const latestPaymentDate = payment.latest_payment_timestamp ? new Date(payment.latest_payment_timestamp) : null

    if (isFullyPaid) {
      return (dueDate && latestPaymentDate && latestPaymentDate > dueDate) ? 'Paid Late' : 'Paid'
    }
    return isOverdue ? 'Overdue' : 'Pending'
  }

  // Mobile Card Component
  const PaymentCard = ({ payment }: { payment: Payment }) => {
    const displayStatus = getDisplayStatus(payment)
    const statusKey = displayStatus.toLowerCase().replace(/\s/g, '-')
    const remainingAmount = payment.amount * ((100 - payment.payment_percentage) / 100)
    const hasRemainingAmount = payment.payment_percentage < 100 || payment.has_pending_payments
    const patternKey = payment.recurring_pattern.toLowerCase().replace(/\s/g, '-')

    return (
      <div className={cn(
        'bg-(--background-primary) rounded-xl border border-(--border-default)',
        'p-4 space-y-3',
        refreshingPaymentId === payment.id && 'opacity-50'
      )}>
        {/* Header: ID, Status, Actions */}
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='texts-body-medium-semibold text-(--text-primary)'>
                #{payment.id}
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
            <span className='texts-caption-large text-(--text-secondary)'>{payment.type}</span>
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
                Copy payment ID
              </DropdownMenuItem>
              {payment.status !== 'Cancelled' && (
                <>
                  <DropdownMenuSeparator />
                  {userType === 'staff' ? (
                    <>
                      <LogPaymentDialog
                        paymentId={payment.id}
                        paymentReferenceId={payment.id}
                        maxAmount={payment.amount * (1 - payment.payment_percentage / 100)}
                        trigger={
                          <DropdownMenuItem
                            disabled={!hasRemainingAmount}
                            onSelect={(e) => e.preventDefault()}
                          >
                            Log payment
                          </DropdownMenuItem>
                        }
                        onSuccess={() => {
                          setRefreshingPaymentId(payment.id)
                          onDataRefresh?.()
                          setTimeout(() => setRefreshingPaymentId(null), 1500)
                        }}
                      />
                      <DropdownMenuItem
                        disabled={!hasRemainingAmount || isCheckingStatus === payment.id}
                        onClick={() => handleCheckStatus(payment.id)}
                      >
                        {isCheckingStatus === payment.id ? 'Checking...' : 'Check payment status'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <ConfirmationDialog
                        openDialogButton={
                          <DropdownMenuItem
                            className='text-red-600 focus:text-red-600'
                            disabled={payment.payment_percentage > 0 || isDeletingPayment === payment.id}
                            onSelect={(e) => e.preventDefault()}
                          >
                            Delete payment
                          </DropdownMenuItem>
                        }
                        title='Delete Payment'
                        description={`Are you sure you want to delete payment ${payment.id}? This action cannot be undone.`}
                        onConfirm={() => handleDeletePayment(payment.id)}
                        loading={deleteLoading}
                      />
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        disabled={!hasRemainingAmount || isProcessingPayment === payment.id}
                        onClick={() => handleLogPayment(payment.id)}
                      >
                        {isProcessingPayment === payment.id ? 'Processing...' : 'Pay now'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!payment.has_pending_payments || isCheckingStatus === payment.id}
                        onClick={() => handleCheckStatus(payment.id)}
                      >
                        {isCheckingStatus === payment.id ? 'Checking...' : 'Check payment status'}
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Amount - Prominent display */}
        <div className='flex items-baseline gap-2'>
          <span className='text-2xl font-semibold text-(--text-primary)'>
            {formatCurrency(payment.amount)}
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
            {payment.recurring_pattern}
          </div>
        </div>

        {/* Info Grid */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Property */}
          {showPropertyColumn && (
            <div className='flex items-start gap-2'>
              <Building2 className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
              <div className='min-w-0'>
                <div className='texts-caption-small text-(--text-secondary)'>Property</div>
                <div className='texts-body-small-medium text-(--text-primary) truncate'>{payment.property}</div>
                <div className='texts-caption-small text-(--text-secondary) truncate'>{payment.room}</div>
              </div>
            </div>
          )}

          {/* Due Date */}
          <div className='flex items-start gap-2'>
            <Calendar className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
            <div className='min-w-0'>
              <div className='texts-caption-small text-(--text-secondary)'>Due Date</div>
              <div className='texts-body-small-medium text-(--text-primary)'>{formatDate(payment.due_date)}</div>
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className='pt-2 border-t border-(--border-default)'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-1.5'>
              <CreditCard className='w-4 h-4 text-(--text-secondary)' />
              <span className='texts-caption-large text-(--text-primary) font-medium'>
                {payment.payment_percentage}% Paid
              </span>
            </div>
            <span className='texts-caption-small text-(--text-secondary)'>
              {formatCurrency(remainingAmount)} remaining
            </span>
          </div>
          <Progress value={payment.payment_percentage} className='h-2' />
        </div>

        {/* Quick Action Button for Mobile */}
        {userType === 'tenant' && hasRemainingAmount && payment.status !== 'Cancelled' && (
          <Button
            className='w-full mt-2'
            disabled={isProcessingPayment === payment.id}
            onClick={() => handleLogPayment(payment.id)}
          >
            {isProcessingPayment === payment.id ? 'Processing...' : 'Pay Now'}
          </Button>
        )}

        {/* View History Button - only show if there's payment history */}
        {payment.payment_percentage > 0 && (
          <button
            onClick={() => openPaymentHistory(payment.id)}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 mt-2',
              'text-sm font-medium text-(--text-secondary)',
              'bg-(--background-secondary) hover:bg-neutral-200/70',
              'rounded-lg transition-colors'
            )}
          >
            <History className='w-4 h-4' />
            View Payment History
          </button>
        )}
      </div>
    )
  }

  // Mobile Payment History Bottom Sheet Content
  const MobilePaymentHistorySheet = () => {
    const currentPayment = data.find(p => p.id === historySheetPaymentId)

    return (
      <Drawer open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <DrawerContent
          className={cn(
            'px-0 pb-8',
            'h-[85vh] max-h-[85vh]',
            'flex flex-col'
          )}
        >
          <DrawerHeader className='px-4 pb-4 border-b border-(--border-default) shrink-0'>
            <div className='flex items-center justify-between'>
              <div>
                <DrawerTitle className='text-left'>Payment History</DrawerTitle>
                {currentPayment && (
                  <p className='text-sm text-(--text-secondary) mt-1'>
                    #{currentPayment.id} · {currentPayment.type}
                  </p>
                )}
              </div>
              <button
                onClick={() => setHistorySheetOpen(false)}
                className='p-2 hover:bg-neutral-100 rounded-full transition-colors'
              >
                <X className='w-5 h-5 text-(--text-secondary)' />
              </button>
            </div>
          </DrawerHeader>

          <div className='flex-1 overflow-auto px-4 pt-4 min-h-0'>
            {historyLoading ? (
              // Loading skeleton
              <div className='space-y-3'>
                {[1, 2].map((i) => (
                  <div key={i} className='bg-(--background-secondary) rounded-lg p-4'>
                    <div className='flex justify-between items-start mb-3'>
                      <Skeleton className='h-5 w-24 bg-neutral-200/70' />
                      <Skeleton className='h-5 w-16 bg-neutral-200/70 rounded-full' />
                    </div>
                    <Skeleton className='h-4 w-32 bg-neutral-200/50 mb-2' />
                    <Skeleton className='h-4 w-40 bg-neutral-200/50' />
                  </div>
                ))}
              </div>
            ) : historyError ? (
              // Error state
              <div className='text-center py-8'>
                <p className='text-red-600 mb-2'>Error loading history</p>
                <p className='text-sm text-(--text-secondary)'>{historyError}</p>
              </div>
            ) : historyData.length === 0 ? (
              // Empty state
              <div className='text-center py-8'>
                <History className='w-12 h-12 text-neutral-300 mx-auto mb-3' />
                <p className='text-(--text-secondary)'>No payment history found</p>
              </div>
            ) : (
              // Payment history list
              <div className='space-y-3'>
                {historyData.map((record) => {
                  const timingStatus = getTimingStatus(record.paid_at)
                  const statusKey = record.status.toLowerCase()

                  return (
                    <div
                      key={record.id}
                      className='bg-(--background-secondary) rounded-lg p-4'
                    >
                      {/* Header: Payment number & Status */}
                      <div className='flex items-center justify-between mb-3'>
                        <span className='font-medium text-(--text-primary)'>
                          Payment #{record.payment_number}
                        </span>
                        <div className='flex items-center gap-2'>
                          {record.status === 'Success' && (
                            <span
                              data-timing={timingStatus.toLowerCase()}
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                'data-[timing=on-time]:bg-green-100 data-[timing=on-time]:text-green-800',
                                'data-[timing=late]:bg-yellow-100 data-[timing=late]:text-yellow-800'
                              )}
                            >
                              {timingStatus}
                            </span>
                          )}
                          <span
                            data-status={statusKey}
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              'data-[status=success]:bg-green-100 data-[status=success]:text-green-800',
                              'data-[status=pending]:bg-yellow-100 data-[status=pending]:text-yellow-800',
                              'data-[status=failed]:bg-red-100 data-[status=failed]:text-red-800'
                            )}
                          >
                            {record.status}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm text-(--text-secondary)'>Amount Paid</span>
                        <span className='font-semibold text-(--text-primary)'>
                          {formatCurrency(record.amount_paid)}
                        </span>
                      </div>

                      {/* Remaining */}
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm text-(--text-secondary)'>Remaining</span>
                        <span className='text-(--text-primary)'>
                          {formatCurrency(record.remaining_amount)}
                        </span>
                      </div>

                      {/* Payment Method */}
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm text-(--text-secondary)'>Method</span>
                        <div className='flex items-center gap-1.5'>
                          {record.payment_method === 'Bank_Transfer' ? (
                            <>
                              <Banknote size={14} className='text-(--text-secondary)' />
                              <span className='text-sm'>Bank Transfer</span>
                            </>
                          ) : record.payment_method === 'FPX' ? (
                            <>
                              <CreditCard size={14} className='text-(--text-secondary)' />
                              <span className='text-sm'>FPX</span>
                            </>
                          ) : record.payment_method === 'Online_Payment' ? (
                            <>
                              <Globe size={14} className='text-(--text-secondary)' />
                              <span className='text-sm'>Online Payment</span>
                            </>
                          ) : (
                            <>
                              <Wallet size={14} className='text-(--text-secondary)' />
                              <span className='text-sm'>Cash</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className='flex items-center justify-between pt-2 border-t border-(--border-default) mt-2'>
                        <span className='text-sm text-(--text-secondary)'>Paid at</span>
                        <TimestampWithTooltip
                          timestamp={record.paid_at}
                          className='text-sm text-(--text-secondary)'
                        />
                      </div>

                      {/* View Receipt Button */}
                      {record.payment_method === 'Bank_Transfer' && record.receipt_image && (
                        <button
                          onClick={() => window.open(record.receipt_image || '', '_blank')}
                          className={cn(
                            'w-full mt-3 py-2 text-sm font-medium',
                            'text-(--info-main) bg-(--info-light)',
                            'rounded-lg hover:opacity-80 transition-opacity'
                          )}
                        >
                          View Receipt
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <>
      {loadingState && <LoadingOverlay state={loadingState} />}

      {/* Mobile Payment History Bottom Sheet */}
      <MobilePaymentHistorySheet />

      {/* Desktop Table View */}
      <div className='hidden md:block'>
        <Table
          columns={columns}
          data={data}
          className={className}
          getRowCanExpand={(row) => row.original.payment_percentage > 0}
          loadingRowId={refreshingPaymentId}
          getRowId={(row) => row.id}
          renderSubComponent={(row) => (
            <PaymentHistoryRow
              key={`history-${row.original.id}`}
              referenceId={row.original.id}
              isExpanded={row.getIsExpanded()}
            />
          )}
        />
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {data.length > 0 ? (
          data.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            No payments found.
          </div>
        )}

        {/* Pagination info for mobile */}
        {data.length > 0 && (
          <div className='text-center py-4 texts-caption-large text-(--text-secondary)'>
            Showing {data.length} payment{data.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  )
}
