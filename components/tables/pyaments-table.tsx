'use client'

import {
  ColumnDef
} from '@tanstack/react-table'
import { MoreHorizontal, ChevronRight, ChevronDown, Calendar, Building2, Repeat, CreditCard, History, Banknote, Wallet, Globe, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import Tooltip from '../costume-ui/tooltip'
import { PaymentWithDetails } from '@/lib/payments-utils'
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
import { toast } from 'sonner'
import Link from 'next/link'
import MobileCardSkeleton from '../loading-ui/mobile-card-skeleton'
import { formatPaymentTypeLabel } from '@/utils/functions'
import MobileCardContainer from '../costume-ui/mobile-card-container'

type Props = {
  data: PaymentWithDetails[]
  showPropertyColumn?: boolean
  showLeaseColumn?: boolean
  activeLeaseId?: string
  className?: string
  userType?: 'staff' | 'tenant'
  isLoading?: boolean
  currentPage?: number
  totalItems?: number
  pageSize?: number
  canGoNext?: boolean
  canGoPrevious?: boolean
  onNextPage?: () => void
  onPreviousPage?: () => void
}

// // Skeleton component for a refreshing row
// const PaymentWithDetailsRowSkeleton = ({ showPropertyColumn }: { showPropertyColumn: boolean }) => (
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

export default function PaymentsTable ({
  data,
  showPropertyColumn = true,
  showLeaseColumn = false,
  activeLeaseId,
  className = '',
  userType = 'staff',
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
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<'checking' | 'redirecting' | null>(null)
  const [refreshingPaymentId, setRefreshingPaymentId] = useState<string | null>(null)
  const [isDeletingPayment, setIsDeletingPayment] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Log payment dialog state (for staff - checking pending FPX before opening)
  const [isCheckingForLogPayment, setIsCheckingForLogPayment] = useState<string | null>(null)
  const [logPaymentDialogOpen, setLogPaymentDialogOpen] = useState(false)
  const [logPaymentTarget, setLogPaymentTarget] = useState<{
    paymentId: string
    maxAmount: number
  } | null>(null)

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

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error: payment already fully paid
        if (data.error === 'Payment is already fully paid') {
          toast.info('This payment has already been fully paid')
          setRefreshingPaymentId(paymentId)
          window.location.reload()
          return
        }
        // For other errors, throw to be caught by catch block
        throw new Error(data.error || 'Failed to create payment bill')
      }

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
      toast.error(`Failed to create payment`)
      setIsProcessingPayment(null)
      setLoadingState(null)
    }
  }

  // Handler for staff "Log Payment" button - checks for pending FPX payments first
  const handleLogPaymentClick = async (paymentId: string, maxAmount: number) => {
    try {
      setIsCheckingForLogPayment(paymentId)
      setLoadingState('checking')

      // Check if there are any pending FPX payments
      const response = await fetch('/api/payments/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference_id: paymentId })
      })

      const result = await response.json()

      setLoadingState(null)

      // If payment was already made via FPX, show message and refresh
      if (result.success && result.newly_recorded) {
        await Swal.fire({
          icon: 'success',
          title: 'Payment Already Made',
          text: `A payment of RM ${result.amount_paid} was already made via FPX and has been recorded.`,
          confirmButtonColor: '#10b981'
        })
        setRefreshingPaymentId(paymentId)
        window.location.reload()
        return
      }

      // If payment was already recorded before
      if (result.success && result.already_recorded) {
        await Swal.fire({
          icon: 'info',
          title: 'Payment Already Recorded',
          text: 'This FPX payment was already recorded.',
          confirmButtonColor: '#3085d6'
        })
        setRefreshingPaymentId(paymentId)
        window.location.reload()
        return
      }
      // No pending FPX payment or it's not completed - open the dialog
      setLogPaymentTarget({ paymentId, maxAmount })
      setLogPaymentDialogOpen(true)
    } catch (error: any) {
      console.error('Error checking payment status:', error)
      setLoadingState(null)
      // On error, still allow opening the dialog
      setLogPaymentTarget({ paymentId, maxAmount })
      setLogPaymentDialogOpen(true)
    } finally {
      setIsCheckingForLogPayment(null)
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
        // Show row loading state and refresh page
        setRefreshingPaymentId(paymentReferenceId)
        window.location.reload()
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
        // Show row loading state and refresh page
        setRefreshingPaymentId(paymentReferenceId)
        window.location.reload()
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
          // Refresh page since there might be a payment to record
          window.location.reload()
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
      window.location.reload()
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

  const columns: ColumnDef<PaymentWithDetails>[] = [
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
          <Link href={`/payments/${id}`} className='block group'>
            <div className='text-left texts-table-cell-primary group-hover:underline'>{id}</div>
            <div className='text-left texts-table-cell-secondary text-(--text-secondary)'>
              {formatPaymentTypeLabel(type)}
            </div>
          </Link>
        )
      }
    },
    ...(showPropertyColumn
      ? ([
          {
            accessorKey: 'property',
            header: () => <div className='text-left'>Property</div>,
            cell: ({ row }) => {
              const { property, property_id, room, room_id, lease_id } = row.original

              // Build navigation URL based on user type
              // Staff: navigate to property/room overview
              // Tenant: navigate to rentals lease details page
              const staffHref = property_id
                ? room_id
                  ? `/rooms/${room_id}/overview`
                  : `/properties/${property_id}/overview`
                : null

              // Tenant uses /rentals/[leaseId]/details path
              const tenantHref = lease_id ? `/rentals/${lease_id}` : null

              // Staff navigation to property/room
              if (userType === 'staff' && staffHref) {
                return (
                  <Link
                    href={staffHref}
                    className='block group hover:underline'
                  >
                    <div className='text-left texts-table-cell-primary group-hover:underline'>
                      {property}
                    </div>
                    <div className='text-left texts-table-cell-secondary group-hover:underline'>
                      {room}
                    </div>
                  </Link>
                )
              }

              // Tenant navigation to lease details
              if (userType === 'tenant' && tenantHref) {
                return (
                  <Link
                    href={tenantHref}
                    className='block group hover:underline'
                  >
                    <div className='text-left texts-table-cell-primary group-hover:underline'>
                      {property}
                    </div>
                    <div className='text-left texts-table-cell-secondary group-hover:underline'>
                      {room}
                    </div>
                  </Link>
                )
              }

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
          } as ColumnDef<PaymentWithDetails>
        ] as ColumnDef<PaymentWithDetails>[])
      : []),

    // Lease column - shows lease reference with "Current" indicator if active
    ...(showLeaseColumn
      ? ([
          {
            accessorKey: 'lease_reference_id',
            header: () => <div className='text-left'>Lease</div>,
            cell: ({ row }) => {
              const { lease_id, lease_reference_id } = row.original
              const isCurrentLease = activeLeaseId && lease_id === activeLeaseId

              if (!lease_reference_id) {
                return <span className='text-(--text-secondary)'>—</span>
              }

              return (
                <div className='flex flex-col items-start gap-1'>
                  <span className='texts-table-cell-primary'>{lease_reference_id}</span>
                  {isCurrentLease && (
                    <span className='px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700'>
                      Current
                    </span>
                  )}
                </div>
              )
            }
          } as ColumnDef<PaymentWithDetails>
        ] as ColumnDef<PaymentWithDetails>[])
      : []),

    {
      accessorKey: 'due_date',
      header: () => <div className='text-left'>Due Date</div>,
      cell: ({ row }) => {
        const { due_date, recurring_pattern, recurring_pattern_description } =
          row.original
        const rawPattern: PaymentWithDetails['recurring_pattern'] = recurring_pattern
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
      accessorKey: 'issued_at',
      header: () => <div className='text-left'>Issued at</div>,
      cell: ({ row }) => {
        const { issued_at } = row.original

        return (
          <TimestampWithTooltip
            timestamp={issued_at}
            className='texts-table-cell-secondary text-(--text-secondary)'
          />
        )
      }
    },

    {
      accessorKey: 'amount',
      header: () => <div className='text-left'>Amount</div>,
      cell: ({ row }) => {
        const { amount, due_date, payment_percentage, latest_payment_timestamp, status, late_payment_charges, type } = row.original

        // Helper to build late charges tooltip content
        const buildLateChargesContent = () => {
          if (!late_payment_charges || late_payment_charges.length === 0) return ''
          const chargesText = late_payment_charges
            .map(c => `${formatCurrency(c.amount)} after ${c.days_after_due} days`)
            .join(', ')
          return `Late fee if not paid on time: ${chargesText}`
        }

        // Only show late charges info for Rental payments
        const showLateChargesInfo = type === 'Rental' && late_payment_charges && late_payment_charges.length > 0

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
        const isPartiallyPaid = payment_percentage > 0 && payment_percentage < 100
        const isOverdue = dueDate ? now > dueDate : false
        const latestPaymentDate = latest_payment_timestamp ? new Date(latest_payment_timestamp) : null

        let displayStatus: PaymentWithDetails['status']
        if (isFullyPaid) {
          // Check if last payment was after due date
          displayStatus = (dueDate && latestPaymentDate && latestPaymentDate > dueDate) ? 'Paid Late' : 'Paid'
        } else {
          // Not fully paid - check priority: Overdue > Partially Paid > Pending
          if (isOverdue) {
            displayStatus = 'Overdue'
          } else if (isPartiallyPaid) {
            displayStatus = 'Partially Paid'
          } else {
            displayStatus = 'Pending'
          }
        }

        const statusKey = displayStatus.toLowerCase().replace(/\s/g, '-')
        const shouldShowLateChargesIcon = showLateChargesInfo && ['Pending', 'Partially Paid', 'Overdue'].includes(displayStatus)

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
                  'data-[status=partially-paid]:bg-orange-100 data-[status=partially-paid]:text-orange-800',
                  'data-[status=overdue]:bg-red-100 data-[status=overdue]:text-red-800',
                  shouldShowLateChargesIcon && 'flex items-center gap-1'
                )}
              >
                {displayStatus}
                {shouldShowLateChargesIcon && (
                  <Tooltip
                    variant='description'
                    content={buildLateChargesContent()}
                  >
                    <Info size={12} strokeWidth={2} className='cursor-help' />
                  </Tooltip>
                )}
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
          payment_percentage,
          remaining_amount
        } = row.original

        return (
          <div>
            <>
              <>
                <div className='flex items-center justify-between mb-1'>
                  <div className='text-left texts-caption-large mr-4'>
                    {payment_percentage}% Paid
                  </div>
                  <div className='text-left texts-caption-small text-(--text-secondary)'>
                    {formatCurrency(remaining_amount)} remaining
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
              <DropdownMenuItem asChild>
                <Link href={`/payments/${payment.id}`}>
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(payment.id)}
              >
                Copy payment ID
              </DropdownMenuItem>
              {payment.payment_evidence && (
                <DropdownMenuItem
                  onClick={() => window.open(payment.payment_evidence || '', '_blank')}
                >
                  View Payment Evidence
                </DropdownMenuItem>
              )}
              {!isCancelled && (
                <>
                  <DropdownMenuSeparator />
                  {userType === 'staff' ? (
                    <>
                      <DropdownMenuItem
                        disabled={!hasRemainingAmount || isCheckingForLogPayment === payment.id}
                        onClick={() => handleLogPaymentClick(
                          payment.id,
                          payment.amount * (1 - payment.payment_percentage / 100)
                        )}
                      >
                        {isCheckingForLogPayment === payment.id ? 'Checking...' : 'Log payment'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!hasRemainingAmount || isCheckingStatus === payment.id}
                        onClick={() => handleCheckStatus(payment.id)}
                      >
                        {isCheckingStatus === payment.id ? 'Checking...' : 'Check payment status'}
                      </DropdownMenuItem>
                      {/* <DropdownMenuSeparator />
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
                      /> */}
                    </>
                  ) : (
                    <>
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
  const getDisplayStatus = (payment: PaymentWithDetails) => {
    // Check if cancelled first
    if (payment.status === 'Cancelled') {
      return 'Cancelled'
    }

    const now = new Date()
    const dueDate = payment.due_date ? new Date(payment.due_date) : null
    const isFullyPaid = payment.payment_percentage >= 100
    const isPartiallyPaid = payment.payment_percentage > 0 && payment.payment_percentage < 100
    const isOverdue = dueDate ? now > dueDate : false
    const latestPaymentDate = payment.latest_payment_timestamp ? new Date(payment.latest_payment_timestamp) : null

    if (isFullyPaid) {
      return (dueDate && latestPaymentDate && latestPaymentDate > dueDate) ? 'Paid Late' : 'Paid'
    }
    // Not fully paid - check priority: Overdue > Partially Paid > Pending
    if (isOverdue) {
      return 'Overdue'
    } else if (isPartiallyPaid) {
      return 'Partially Paid'
    } else {
      return 'Pending'
    }
  }

  // Mobile Card Component
  const PaymentCard = ({ payment }: { payment: PaymentWithDetails }) => {
    const displayStatus = getDisplayStatus(payment)
    const statusKey = displayStatus.toLowerCase().replace(/\s/g, '-')
    const hasRemainingAmount = payment.payment_percentage < 100 || payment.has_pending_payments
    const patternKey = payment.recurring_pattern.toLowerCase().replace(/\s/g, '-')
    // Only show late charges info for Rental payments
    const showLateChargesInfo = payment.type === 'Rental' &&
      payment.late_payment_charges &&
      payment.late_payment_charges.length > 0 &&
      ['Pending', 'Partially Paid', 'Overdue'].includes(displayStatus)

    return (
      <MobileCardContainer
      className={`${refreshingPaymentId === payment.id && 'opacity-50'}`}>
        {/* Header: ID, Status, Actions */}
        <div className='flex items-start justify-between'>
          <Link href={`/payments/${payment.id}`} className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='texts-body-medium-semibold text-(--text-primary) hover:text-(--info-main) hover:underline'>
                #{payment.id}
              </span>
              <div
                data-status={statusKey}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  'data-[status=paid]:bg-green-100 data-[status=paid]:text-green-800',
                  'data-[status=paid-late]:bg-yellow-100 data-[status=paid-late]:text-yellow-800',
                  'data-[status=pending]:bg-gray-100 data-[status=pending]:text-gray-800',
                  'data-[status=partially-paid]:bg-orange-100 data-[status=partially-paid]:text-orange-800',
                  'data-[status=overdue]:bg-red-100 data-[status=overdue]:text-red-800',
                  'data-[status=cancelled]:bg-neutral-200 data-[status=cancelled]:text-neutral-600'
                )}
              >
                {displayStatus}
              </div>
            </div>
            <span className='texts-caption-large text-(--text-secondary)'>{payment.type}</span>
          </Link>

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
                <Link href={`/payments/${payment.id}`}>
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
                Copy payment ID
              </DropdownMenuItem>
              {payment.payment_evidence && (
                <DropdownMenuItem
                  onClick={() => window.open(payment.payment_evidence || '', '_blank')}
                >
                  View Payment Evidence
                </DropdownMenuItem>
              )}
              {payment.status !== 'Cancelled' && (
                <>
                  <DropdownMenuSeparator />
                  {userType === 'staff' ? (
                    <>
                      <DropdownMenuItem
                        disabled={!hasRemainingAmount || isCheckingForLogPayment === payment.id}
                        onClick={() => handleLogPaymentClick(
                          payment.id,
                          payment.amount * (1 - payment.payment_percentage / 100)
                        )}
                      >
                        {isCheckingForLogPayment === payment.id ? 'Checking...' : 'Log payment'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!hasRemainingAmount || isCheckingStatus === payment.id}
                        onClick={() => handleCheckStatus(payment.id)}
                      >
                        {isCheckingStatus === payment.id ? 'Checking...' : 'Check payment status'}
                      </DropdownMenuItem>
                      {/* <DropdownMenuSeparator />
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
                      /> */}
                    </>
                  ) : (
                    <>
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

        {/* Late Payment Charges Info Banner - Mobile */}
        {showLateChargesInfo && (
          <div className='flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200'>
            <Info size={14} className='text-amber-600 mt-0.5 shrink-0' />
            <div className='flex flex-col gap-1'>
              <span className='texts-caption-large font-medium text-amber-800'>
                Late fee if not paid on time
              </span>
              <div className='flex flex-wrap gap-x-3 gap-y-1'>
                {payment.late_payment_charges.map((charge, idx) => (
                  <span key={idx} className='texts-caption-small text-amber-700'>
                    {formatCurrency(charge.amount)} after {charge.days_after_due} days
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

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
            (() => {
              // Staff: navigate to property/room overview
              const staffHref = payment.property_id
                ? payment.room_id
                  ? `/rooms/${payment.room_id}/overview`
                  : `/properties/${payment.property_id}/overview`
                : null

              // Tenant: navigate to rentals lease details page
              const tenantHref = payment.lease_id ? `/rentals/${payment.lease_id}` : null

              const content = (
                <>
                  <Building2 className='w-4 h-4 text-(--text-secondary) mt-0.5 shrink-0' />
                  <div className='min-w-0'>
                    <div className='texts-caption-small text-(--text-secondary)'>Property</div>
                    <div className='texts-body-small-medium text-(--text-primary) truncate group-hover:underline'>{payment.property}</div>
                    <div className='texts-caption-small text-(--text-secondary) truncate group-hover:underline'>{payment.room}</div>
                  </div>
                </>
              )

              // Staff navigation to property/room
              if (userType === 'staff' && staffHref) {
                return (
                  <Link href={staffHref} className='flex items-start gap-2 group'>
                    {content}
                  </Link>
                )
              }

              // Tenant navigation to lease details
              if (userType === 'tenant' && tenantHref) {
                return (
                  <Link href={tenantHref} className='flex items-start gap-2 group'>
                    {content}
                  </Link>
                )
              }

              return (
                <div className='flex items-start gap-2'>
                  {content}
                </div>
              )
            })()
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
              {formatCurrency(payment.remaining_amount)} remaining
            </span>
          </div>
          <Progress value={payment.payment_percentage} className='h-2' />
        </div>


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
      </MobileCardContainer>
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
          noPagnitation={hasServerPagination}
          getRowCanExpand={(row) => row.original.payment_percentage > 0}
          loadingRowId={refreshingPaymentId}
          getRowId={(row) => row.id}
          isLoadingRows={isLoading}
          loadingRowsCount={pageSize}
          renderSubComponent={(row) => (
            <PaymentHistoryRow
              key={`history-${row.original.id}`}
              referenceId={row.original.id}
              isExpanded={row.getIsExpanded()}
            />
          )}
        />
        {hasServerPagination && (
          <div className='flex items-center justify-end space-x-2 py-4'>
            <div className='text-muted-foreground flex-1 text-sm'>
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} payments
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
          data.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))
        ) : (
          <div className='text-center py-12 text-(--text-secondary)'>
            No payments found.
          </div>
        )}

        {/* Pagination controls for mobile */}
        {hasServerPagination && (
          <div className='flex flex-col gap-3 py-4'>
            <div className='text-center texts-caption-large text-(--text-secondary)'>
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} payments
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

      {/* Log Payment Dialog - Controlled by state after FPX check */}
      {logPaymentTarget && (
        <LogPaymentDialog
          paymentId={logPaymentTarget.paymentId}
          paymentReferenceId={logPaymentTarget.paymentId}
          maxAmount={logPaymentTarget.maxAmount}
          trigger={<span className='hidden' />}
          open={logPaymentDialogOpen}
          onOpenChange={(open) => {
            setLogPaymentDialogOpen(open)
            if (!open) {
              setLogPaymentTarget(null)
            }
          }}
          onSuccess={() => {
            setRefreshingPaymentId(logPaymentTarget.paymentId)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
