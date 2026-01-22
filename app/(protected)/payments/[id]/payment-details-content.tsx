'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import Button from '@/components/costume-ui/button'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import TimestampWithTooltip from '@/components/costume-ui/timestamp-with-tooltip'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import LogPaymentDialog from '@/components/dialogs/log-payment-dialog'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'
import { formatPaymentTypeLabel } from '@/utils/functions'
import { cn } from '@/lib/utils'
import type { PaymentDetailsData } from './page'
import {
  MoreHorizontal,
  Calendar,
  Building2,
  DoorOpen,
  User,
  CreditCard,
  Receipt,
  Repeat,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Banknote,
  Wallet,
  Globe,
  ExternalLink,
  Copy,
  Trash2,
  Download,
  Phone,
  Mail
} from 'lucide-react'

type Props = {
  payment: PaymentDetailsData
  userType: 'staff' | 'tenant'
}

export default function PaymentDetailsContent({ payment, userType }: Props) {
  const router = useRouter()
  const [deleteLoading, setDeleteLoading] = useState(false)


  // Calculate display status
  const getDisplayStatus = () => {
    if (payment.status === 'Cancelled') return 'Cancelled'

    const now = new Date()
    const dueDate = payment.due_payment_timestamp ? new Date(payment.due_payment_timestamp) : null
    const isFullyPaid = payment.payment_percentage >= 100
    const isPartiallyPaid = payment.payment_percentage > 0 && payment.payment_percentage < 100
    const isOverdue = dueDate ? now > dueDate : false

    if (isFullyPaid) {
      const latestPayment = payment.payment_history.find(h => h.status === 'Success')
      if (dueDate && latestPayment && new Date(latestPayment.paid_at) > dueDate) {
        return 'Paid Late'
      }
      return 'Paid'
    }

    if (isOverdue) return 'Overdue'
    if (isPartiallyPaid) return 'Partially Paid'
    return 'Pending'
  }

  const displayStatus = getDisplayStatus()
  const statusKey = displayStatus.toLowerCase().replace(/\s/g, '-')

  // Check if can perform actions
  const canLogPayment = payment.payment_percentage < 100 && payment.status !== 'Cancelled'
  const canDelete = payment.payment_percentage === 0 && payment.status !== 'Cancelled'

  // Get recurring description
  const getRecurringDescription = () => {
    if (!payment.recurring_config) return null
    const { every, time_unit, event_on } = payment.recurring_config

    if (every === null || time_unit === null) {
      return 'Monthly with rental payment'
    }

    if (time_unit === 'Week' && event_on) {
      const days = event_on.split(',').join(', ')
      return `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''} on ${days}`
    }

    if (time_unit === 'Month' && event_on) {
      const days = event_on.split(',').join(', ')
      return `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''} on day ${days}`
    }

    return `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''}`
  }

  const handleDeletePayment = async () => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/payments/${payment.reference_id}/delete`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete payment')
      }

      FeedbackToasts.deleted('Payment')
      router.push('/payments')
    } catch (error: any) {
      FeedbackToasts.deleteFailed('payment', error.message)
      throw error
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(payment.reference_id)
    toast.success('Copied to clipboard')
  }

  // Payment method icon helper
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Bank_Transfer':
        return <Banknote size={16} className='text-(--text-secondary)' />
      case 'FPX':
        return <CreditCard size={16} className='text-(--text-secondary)' />
      case 'Online_Payment':
        return <Globe size={16} className='text-(--text-secondary)' />
      default:
        return <Wallet size={16} className='text-(--text-secondary)' />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'Bank_Transfer':
        return 'Bank Transfer'
      case 'Online_Payment':
        return 'Online Payment'
      default:
        return method
    }
  }

  // Get timing status for payment history
  const getTimingStatus = (paidAt: string): 'On-Time' | 'Late' => {
    if (!payment.due_payment_timestamp) return 'On-Time'
    return new Date(paidAt) <= new Date(payment.due_payment_timestamp) ? 'On-Time' : 'Late'
  }

  return (
    <div className='flex flex-col gap-5'>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Payments', href: '/payments' },
          { label: payment.reference_id }
        ]}
      />

      {/* Header Section */}
      <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-3'>
            <h2>{payment.reference_id}</h2>
            <div
              data-status={statusKey}
              className={cn(
                'status-styles',
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
          <span className='texts-body-medium text-(--text-secondary)'>
            {formatPaymentTypeLabel(payment.type)}
            {payment.recurring_config && (
              <span className='ml-2 inline-flex items-center gap-1 text-(--info-main)'>
                <Repeat size={12} strokeWidth={2} />
                Recurring
              </span>
            )}
          </span>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2.5'>
          {userType === 'staff' && canLogPayment && (
            <LogPaymentDialog
              paymentId={payment.reference_id}
              paymentReferenceId={payment.reference_id}
              maxAmount={payment.remaining_amount}
              trigger={
                <Button
                  variant='primary'
                  label='Log Payment'
                  icon={<CreditCard size={16} />}
                />
              }
              onSuccess={() => router.refresh()}
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='secondary'
                icon={<MoreHorizontal size={16} />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={handleCopyId}>
                <Copy size={14} className='mr-2' />
                Copy Payment ID
              </DropdownMenuItem>
              {payment.payment_evidence && (
                <DropdownMenuItem onClick={() => window.open(payment.payment_evidence || '', '_blank')}>
                  <FileText size={14} className='mr-2' />
                  View Payment Evidence
                </DropdownMenuItem>
              )}
              {/* {userType === 'staff' && (
                <>
                  <DropdownMenuSeparator />
                  <ConfirmationDialog
                    openDialogButton={
                      <DropdownMenuItem
                        className='text-red-600 focus:text-red-600'
                        disabled={!canDelete}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 size={14} className='mr-2' />
                        Delete Payment
                      </DropdownMenuItem>
                    }
                    title='Delete Payment'
                    description={`Are you sure you want to delete payment ${payment.reference_id}? This action cannot be undone.`}
                    onConfirm={handleDeletePayment}
                    loading={deleteLoading}
                  />
                </>
              )} */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex flex-col lg:flex-row gap-5'>
        {/* Left Column - Main Info */}
        <div className='flex-1 flex flex-col gap-5'>
          {/* Payment Summary Card */}
          <div className='card-styles'>
            {/* Card Header */}
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-[#DEFFE2] text-(--success-dark)'>
                <CreditCard size={19} strokeWidth={1.5} />
              </div>
              <div className='flex flex-col'>
                <span className='texts-body-medium-medium'>Payment Summary</span>
                <span className='texts-caption-large text-(--text-secondary)'>
                  Amount breakdown and progress
                </span>
              </div>
            </div>

            {/* Amount Display */}
            <div className='flex flex-col gap-4 pt-4'>
              <div className='flex items-baseline justify-between'>
                <div className='flex flex-col'>
                  <span className='texts-caption-large text-(--text-secondary)'>Total Amount</span>
                  <span className='texts-heading-h2 text-(--text-primary)'>{formatCurrency(payment.total_amount)}</span>
                </div>
                <div className='flex flex-col items-end'>
                  <span className='texts-caption-large text-(--text-secondary)'>Remaining</span>
                  <span className='texts-body-large-medium text-(--text-primary)'>{formatCurrency(payment.remaining_amount)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small-medium'>{payment.payment_percentage}% Paid</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    {formatCurrency(payment.total_paid)} of {formatCurrency(payment.total_amount)}
                  </span>
                </div>
                <Progress value={payment.payment_percentage} className='h-2.5' />
              </div>
            </div>
          </div>

          {/* Charges Breakdown Card */}
          <div className='card-styles'>
            {/* Card Header */}
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-(--warning-light) text-(--warning-dark)'>
                <Receipt size={19} strokeWidth={1.5} />
              </div>
              <div className='flex flex-col'>
                <span className='texts-body-medium-medium'>Charges Breakdown</span>
                <span className='texts-caption-large text-(--text-secondary)'>
                  {payment.charges.length} {payment.charges.length === 1 ? 'charge' : 'charges'}
                </span>
              </div>
            </div>

            {/* Charges List */}
            <div className='flex flex-col pt-4'>
              <div className='flex flex-col divide-y divide-(--border-light)'>
                {payment.charges.map((charge) => {
                  const amount = charge.amount
                  const tax = charge.is_taxed ? amount * 0.08 : 0
                  const total = amount + tax

                  return (
                    <div key={charge.id} className='flex items-center justify-between py-3 first:pt-0 last:pb-0'>
                      <div className='flex flex-col'>
                        <span className='texts-body-medium-medium'>{charge.title}</span>
                        <div className='flex items-center gap-2'>
                          {charge.is_taxed && (
                            <span className='texts-caption-large px-1.5 py-0.5 rounded bg-amber-50 text-amber-700'>
                              +8% Tax
                            </span>
                          )}
                          {charge.is_refunded && (
                            <span className='texts-caption-large px-1.5 py-0.5 rounded bg-green-50 text-green-700'>
                              Refundable
                            </span>
                          )}
                        </div>
                      </div>
                      <div className='flex flex-col items-end'>
                        <span className='texts-body-medium-medium'>{formatCurrency(total)}</span>
                        {charge.is_taxed && (
                          <span className='texts-caption-large text-(--text-secondary)'>
                            {formatCurrency(amount)} + {formatCurrency(tax)} tax
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              <div className='flex items-center justify-between pt-4 mt-4 border-t border-(--border-default)'>
                <span className='texts-body-large-medium'>Total</span>
                <span className='texts-body-large-medium'>{formatCurrency(payment.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment History Card */}
          {payment.payment_history.length > 0 && (
            <div className='card-styles'>
              {/* Card Header */}
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-(--info-light) text-(--info-main)'>
                  <Clock size={19} strokeWidth={1.5} />
                </div>
                <div className='flex flex-col'>
                  <span className='texts-body-medium-medium'>Payment History</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    {payment.payment_history.length} {payment.payment_history.length === 1 ? 'transaction' : 'transactions'}
                  </span>
                </div>
              </div>

              {/* History Table */}
              <div className='pt-4 overflow-x-auto'>
                <table className='w-full min-w-[600px]'>
                  <thead>
                    <tr className='text-left texts-caption-large text-(--text-secondary)'>
                      <th className='pb-3 font-medium'>#</th>
                      <th className='pb-3 font-medium'>Method</th>
                      <th className='pb-3 font-medium'>Amount</th>
                      <th className='pb-3 font-medium'>Remaining</th>
                      <th className='pb-3 font-medium'>Status</th>
                      <th className='pb-3 font-medium'>Date</th>
                      <th className='pb-3 font-medium'>Receipt</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-(--border-light)'>
                    {payment.payment_history.map((record) => {
                      const timingStatus = record.status === 'Success' ? getTimingStatus(record.paid_at) : null
                      const recordStatusKey = record.status.toLowerCase()

                      return (
                        <tr key={record.id} className='hover:bg-(--background-secondary)'>
                          <td className='py-3 texts-table-cell-primary'>{record.payment_number}</td>
                          <td className='py-3'>
                            <div className='flex items-center gap-2'>
                              {getPaymentMethodIcon(record.payment_method)}
                              <span className='texts-table-cell-primary'>{getPaymentMethodLabel(record.payment_method)}</span>
                            </div>
                          </td>
                          <td className='py-3 texts-table-cell-primary'>{formatCurrency(record.amount)}</td>
                          <td className='py-3 texts-table-cell-secondary text-(--text-secondary)'>{formatCurrency(record.remaining_amount)}</td>
                          <td className='py-3'>
                            <div className='flex items-center gap-2'>
                              <span
                                data-status={recordStatusKey}
                                className={cn(
                                  'px-2 py-0.5 rounded-full texts-caption-large font-medium',
                                  'data-[status=success]:bg-green-100 data-[status=success]:text-green-800',
                                  'data-[status=pending]:bg-yellow-100 data-[status=pending]:text-yellow-800',
                                  'data-[status=failed]:bg-red-100 data-[status=failed]:text-red-800'
                                )}
                              >
                                {record.status}
                              </span>
                              {timingStatus && (
                                <span
                                  data-timing={timingStatus.toLowerCase()}
                                  className={cn(
                                    'px-2 py-0.5 rounded-full texts-caption-large font-medium',
                                    'data-[timing=on-time]:bg-green-50 data-[timing=on-time]:text-green-700',
                                    'data-[timing=late]:bg-amber-50 data-[timing=late]:text-amber-700'
                                  )}
                                >
                                  {timingStatus}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className='py-3'>
                            <TimestampWithTooltip
                              timestamp={record.paid_at}
                              className='texts-table-cell-secondary text-(--text-secondary)'
                            />
                          </td>
                          <td className='py-3'>
                            {record.receipt_image ? (
                              <button
                                onClick={() => window.open(record.receipt_image || '', '_blank')}
                                className='texts-caption-large text-(--info-main) hover:underline flex items-center gap-1'
                              >
                                <ExternalLink size={12} />
                                View
                              </button>
                            ) : (
                              <span className='texts-caption-large text-(--text-muted)'>—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty Payment History */}
          {payment.payment_history.length === 0 && (
            <div className='flex flex-col items-center justify-center p-8 rounded-[12px] bg-(--background-primary) border border-(--border-default)'>
              <Clock size={40} className='text-neutral-300 mb-3' />
              <span className='texts-body-medium text-(--text-secondary)'>No payment transactions yet</span>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className='w-full lg:w-80 flex flex-col gap-5'>
          {/* Dates Card */}
          <div className='card-styles'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-purple-100 text-purple-600'>
                <Calendar size={19} strokeWidth={1.5} />
              </div>
              <span className='texts-body-medium-medium'>Dates</span>
            </div>

            <div className='flex flex-col gap-3 pt-4'>
              <div className='flex items-center justify-between'>
                <span className='texts-body-small text-(--text-secondary)'>Created</span>
                <TimestampWithTooltip
                  timestamp={payment.created_at}
                  className='texts-body-small-medium'
                />
              </div>
              <div className='flex items-center justify-between'>
                <span className='texts-body-small text-(--text-secondary)'>Due Date</span>
                <span className='texts-body-small-medium'>
                  {payment.due_payment_timestamp ? formatDate(payment.due_payment_timestamp) : '—'}
                </span>
              </div>
              {payment.recurring_config && (
                <div className='flex items-start justify-between pt-3 border-t border-(--border-light)'>
                  <span className='texts-body-small text-(--text-secondary)'>Recurring</span>
                  <span className='texts-body-small-medium text-right max-w-[150px]'>
                    {getRecurringDescription()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Property Info Card */}
          {payment.lease && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-blue-100 text-blue-600'>
                  <Building2 size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Property</span>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                <div className='flex flex-col'>
                  {userType === 'staff' ? (
                    <Link
                      href={`/properties/${payment.lease.property.id}/overview`}
                      className='texts-body-medium-medium text-(--text-primary) hover:underline'
                    >
                      {payment.lease.property.code}
                    </Link>
                  ) : (
                    <span className='texts-body-medium-medium'>{payment.lease.property.code}</span>
                  )}
                  <span className='texts-caption-large text-(--text-secondary)'>
                    {payment.lease.property.street_address}, {payment.lease.property.city}
                  </span>
                </div>

                {payment.lease.room && (
                  <div className='flex items-center gap-2 pt-3 border-t border-(--border-light)'>
                    <DoorOpen size={14} className='text-(--text-secondary)' />
                    {userType === 'staff' ? (
                      <Link
                        href={`/rooms/${payment.lease.room.id}/overview`}
                        className='texts-body-small-medium hover:underline'
                      >
                        {payment.lease.room.title}
                      </Link>
                    ) : (
                      <span className='texts-body-small-medium'>{payment.lease.room.title}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tenant Info Card */}
          {payment.lease && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-teal-100 text-teal-600'>
                  <User size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Tenant</span>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                <div className='flex items-center gap-3'>
                  <UserAvatar
                    name={payment.lease.tenant.name}
                    imgSrc={payment.lease.tenant.profile_pic}
                    size={40}
                  />
                  <div className='flex flex-col'>
                    <span className='texts-body-medium-medium'>{payment.lease.tenant.name}</span>
                    <span className='texts-caption-large text-(--text-secondary)'>
                      {payment.lease.tenant.type === 'Company' ? 'Company' : 'Individual'}
                    </span>
                  </div>
                </div>

                {(payment.lease.tenant.phone || payment.lease.tenant.email) && userType === 'staff' && (
                  <div className='flex flex-col gap-2 pt-3 border-t border-(--border-light)'>
                    {payment.lease.tenant.phone && (
                      <a
                        href={`tel:${payment.lease.tenant.phone}`}
                        className='flex items-center gap-2 texts-caption-large text-(--text-secondary) hover:text-(--text-primary)'
                      >
                        <Phone size={12} />
                        {payment.lease.tenant.phone}
                      </a>
                    )}
                    {payment.lease.tenant.email && (
                      <a
                        href={`mailto:${payment.lease.tenant.email}`}
                        className='flex items-center gap-2 texts-caption-large text-(--text-secondary) hover:text-(--text-primary)'
                      >
                        <Mail size={12} />
                        {payment.lease.tenant.email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lease Reference Card */}
          {payment.lease && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-orange-100 text-orange-600'>
                  <FileText size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Lease</span>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Reference</span>
                  {userType === 'staff' ? (
                    <span
                      className='texts-body-small-medium'
                    >
                      {payment.lease.reference_id}
                    </span>
                  ) : (
                    <span className='texts-body-small-medium'>{payment.lease.reference_id}</span>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Monthly Rent</span>
                  <span className='texts-body-small-medium'>{formatCurrency(payment.lease.monthly_rent)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Payment Day</span>
                  <span className='texts-body-small-medium'>Day {payment.lease.payment_day}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Evidence Card */}
          {payment.payment_evidence && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-rose-100 text-rose-600'>
                  <FileText size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Payment Evidence</span>
              </div>

              <div className='pt-4'>
                <button
                  onClick={() => window.open(payment.payment_evidence || '', '_blank')}
                  className='w-full flex items-center justify-center gap-2 py-2.5 texts-button-primary text-(--info-main) bg-(--info-light) rounded-lg hover:opacity-80 transition-opacity'
                >
                  <ExternalLink size={14} />
                  View Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
