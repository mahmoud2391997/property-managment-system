'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import Button from '@/components/costume-ui/button'
import TimestampWithTooltip from '@/components/costume-ui/timestamp-with-tooltip'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import LogExpensePaymentDialog from '@/components/dialogs/log-expense-payment-dialog'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
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
import type { ExpenseDetailsData } from './page'
import {
  MoreHorizontal,
  Calendar,
  Building2,
  CreditCard,
  Receipt,
  Repeat,
  FileText,
  Clock,
  User,
  Banknote,
  Wallet,
  Globe,
  ExternalLink,
  Copy,
  Pencil,
  ShoppingCart,
  Briefcase
} from 'lucide-react'

type Props = {
  expense: ExpenseDetailsData
}

const CATEGORY_LABELS: Record<string, string> = {
  Property_Related: 'Property Related',
  Contract_Related: 'Contract Related',
  Staff_Related: 'Staff Related',
  Company_Related: 'Company Related',
  Purchase_Related: 'Purchase Related'
}

export default function ExpenseDetailsContent({ expense }: Props) {
  const router = useRouter()
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Get expense type from the category-specific subtype
  const getExpenseType = (): string => {
    if (expense.property_expense) return expense.property_expense.type
    if (expense.contract_expense) return expense.contract_expense.type
    if (expense.company_expense) return expense.company_expense.type
    if (expense.purchase_expense) return expense.purchase_expense.type
    if (expense.staff_expense) return expense.staff_expense.type
    return 'Unknown'
  }

  const expenseType = getExpenseType()
  const isStaffSalary = expense.category === 'Staff_Related' && expenseType === 'Salary'

  // Calculate display status
  const getDisplayStatus = () => {
    if (expense.status === 'Cancelled') return 'Cancelled'

    const now = new Date()
    const dueDate = expense.due_payment_date ? new Date(expense.due_payment_date) : null
    const isFullyPaid = expense.payment_percentage >= 100
    const isOverdue = dueDate ? now > dueDate : false

    if (isFullyPaid) {
      const latestPayment = expense.payment_history.find(h => h.status === 'Success')
      if (dueDate && latestPayment && new Date(latestPayment.paid_at) > dueDate) {
        return 'Paid Late'
      }
      return 'Paid'
    }

    if (isOverdue) return 'Overdue'
    return 'Pending'
  }

  const displayStatus = getDisplayStatus()
  const statusKey = displayStatus.toLowerCase().replace(/\s/g, '-')

  // Actions
  const canLogPayment = expense.payment_percentage < 100 && expense.status !== 'Cancelled'
  const canDelete = expense.payment_percentage === 0 && expense.status !== 'Cancelled'

  // Recurring description
  const getRecurringDescription = () => {
    if (!expense.recurring_config) return null
    const { every, time_unit, event_on } = expense.recurring_config

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

  const handleDeleteExpense = async () => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/expenses/${expense.reference_id}/delete`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete expense')
      }

      FeedbackToasts.deleted('Expense')
      router.push('/expenses')
    } catch (error: any) {
      FeedbackToasts.deleteFailed('expense', error.message)
      throw error
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(expense.reference_id)
    toast.success('Copied to clipboard')
  }

  // Payment method helpers
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
      case 'Bank_Transfer': return 'Bank Transfer'
      case 'Online_Payment': return 'Online Payment'
      default: return method
    }
  }

  const getTimingStatus = (paidAt: string): 'On-Time' | 'Late' => {
    if (!expense.due_payment_date) return 'On-Time'
    return new Date(paidAt) <= new Date(expense.due_payment_date) ? 'On-Time' : 'Late'
  }

  return (
    <div className='flex flex-col gap-5'>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Expenses', href: '/expenses' },
          { label: expense.reference_id }
        ]}
      />

      {/* Header Section */}
      <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-3'>
            <h2>{expense.reference_id}</h2>
            <div
              data-status={statusKey}
              className={cn(
                'status-styles',
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
          <span className='texts-body-medium text-(--text-secondary)'>
            {CATEGORY_LABELS[expense.category] || expense.category} — {formatPaymentTypeLabel(expenseType)}
            {expense.recurring_config && (
              <span className='ml-2 inline-flex items-center gap-1 text-(--info-main)'>
                <Repeat size={12} strokeWidth={2} />
                Recurring
              </span>
            )}
          </span>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2.5'>
          {expense.can_edit && (
            <Link href={`/expenses/${expense.reference_id}/edit`}>
              <Button
                variant='secondary'
                label='Edit'
                icon={<Pencil size={16} />}
              />
            </Link>
          )}

          {canLogPayment && (
            <LogExpensePaymentDialog
              expenseId={expense.reference_id}
              expenseReferenceId={expense.reference_id}
              maxAmount={expense.remaining_amount}
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
                Copy Expense ID
              </DropdownMenuItem>
              {expense.expense_evidence && (
                <DropdownMenuItem onClick={() => window.open(expense.expense_evidence || '', '_blank')}>
                  <FileText size={14} className='mr-2' />
                  View Expense Proof
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <ConfirmationDialog
                    openDialogButton={
                      <DropdownMenuItem
                        className='text-red-600 focus:text-red-600'
                        onSelect={(e) => e.preventDefault()}
                      >
                        Delete Expense
                      </DropdownMenuItem>
                    }
                    title='Delete Expense'
                    description={`Are you sure you want to delete expense ${expense.reference_id}? This action cannot be undone.`}
                    onConfirm={handleDeleteExpense}
                    loading={deleteLoading}
                  />
                </>
              )}
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

            <div className='flex flex-col gap-4 pt-4'>
              <div className='flex items-baseline justify-between'>
                <div className='flex flex-col'>
                  <span className='texts-caption-large text-(--text-secondary)'>Total Amount</span>
                  <span className='texts-heading-h2 text-(--text-primary)'>{formatCurrency(expense.total_amount)}</span>
                </div>
                <div className='flex flex-col items-end'>
                  <span className='texts-caption-large text-(--text-secondary)'>Remaining</span>
                  <span className='texts-body-large-medium text-(--text-primary)'>{formatCurrency(expense.remaining_amount)}</span>
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small-medium'>{expense.payment_percentage}% Paid</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    {formatCurrency(expense.total_paid)} of {formatCurrency(expense.total_amount)}
                  </span>
                </div>
                <Progress value={expense.payment_percentage} className='h-2.5' />
              </div>
            </div>
          </div>

          {/* Charges Breakdown / Salary Breakdown */}
          {isStaffSalary && expense.staff_expense ? (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-(--warning-light) text-(--warning-dark)'>
                  <Receipt size={19} strokeWidth={1.5} />
                </div>
                <div className='flex flex-col'>
                  <span className='texts-body-medium-medium'>Salary Breakdown</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    {new Date(expense.staff_expense.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                {/* Gross Salary */}
                <div className='flex items-center justify-between'>
                  <span className='texts-body-medium'>Gross Salary</span>
                  <span className='texts-body-medium-medium'>{formatCurrency(expense.staff_expense.gross_salary)}</span>
                </div>

                {/* Employer Contributions */}
                {(expense.staff_expense.epf_employer > 0 || expense.staff_expense.socso_employer > 0) && (
                  <>
                    <div className='border-t border-dashed border-(--border-default) my-0.5' />
                    <span className='texts-caption-large text-(--text-tertiary) uppercase tracking-wide'>Employer Contributions</span>
                    {expense.staff_expense.epf_employer > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>EPF (Employer)</span>
                        <span className='texts-body-small-medium'>{formatCurrency(expense.staff_expense.epf_employer)}</span>
                      </div>
                    )}
                    {expense.staff_expense.socso_employer > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>SOCSO (Employer)</span>
                        <span className='texts-body-small-medium'>{formatCurrency(expense.staff_expense.socso_employer)}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Employee Deductions */}
                {(expense.staff_expense.epf_employee > 0 || expense.staff_expense.socso_employee > 0 || expense.staff_expense.tax > 0 || expense.deduction_charges.length > 0) && (
                  <>
                    <div className='border-t border-dashed border-(--border-default) my-0.5' />
                    <span className='texts-caption-large text-(--text-tertiary) uppercase tracking-wide'>Employee Deductions</span>
                    {expense.staff_expense.epf_employee > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>EPF (Employee)</span>
                        <span className='texts-body-small text-red-600'>- {formatCurrency(expense.staff_expense.epf_employee)}</span>
                      </div>
                    )}
                    {expense.staff_expense.socso_employee > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>SOCSO (Employee)</span>
                        <span className='texts-body-small text-red-600'>- {formatCurrency(expense.staff_expense.socso_employee)}</span>
                      </div>
                    )}
                    {expense.staff_expense.tax > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>Tax (PCB)</span>
                        <span className='texts-body-small text-red-600'>- {formatCurrency(expense.staff_expense.tax)}</span>
                      </div>
                    )}
                    {expense.deduction_charges.map((d) => (
                      <div key={d.id} className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>{d.title}</span>
                        <span className='texts-body-small text-red-600'>- {formatCurrency(d.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Allowances */}
                {expense.charges.length > 0 && (
                  <>
                    <div className='border-t border-dashed border-(--border-default) my-0.5' />
                    <span className='texts-caption-large text-(--text-tertiary) uppercase tracking-wide'>Allowances</span>
                    {expense.charges.map((c) => (
                      <div key={c.id} className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>{c.title}</span>
                        <span className='texts-body-small text-green-600'>+ {formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Totals */}
                <div className='border-t border-(--border-default) mt-1 pt-3 flex flex-col gap-2'>
                  <div className='flex items-center justify-between'>
                    <span className='texts-body-small text-(--text-secondary)'>Net Salary</span>
                    <span className='texts-body-medium-medium'>
                      {formatCurrency(
                        expense.staff_expense.gross_salary
                        - expense.staff_expense.epf_employee
                        - expense.staff_expense.socso_employee
                        - expense.staff_expense.tax
                        - expense.deduction_charges.reduce((sum, d) => sum + d.amount, 0)
                      )}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='texts-body-medium-medium'>Cost to Company</span>
                    <span className='texts-body-large-medium'>{formatCurrency(expense.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : expense.charges.length > 0 ? (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-(--warning-light) text-(--warning-dark)'>
                  <Receipt size={19} strokeWidth={1.5} />
                </div>
                <div className='flex flex-col'>
                  <span className='texts-body-medium-medium'>Charges Breakdown</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    {expense.charges.length} {expense.charges.length === 1 ? 'charge' : 'charges'}
                  </span>
                </div>
              </div>

              <div className='flex flex-col pt-4'>
                <div className='flex flex-col divide-y divide-(--border-light)'>
                  {expense.charges.map((charge) => {
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

                <div className='flex items-center justify-between pt-4 mt-4 border-t border-(--border-default)'>
                  <span className='texts-body-large-medium'>Total</span>
                  <span className='texts-body-large-medium'>{formatCurrency(expense.total_amount)}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Description Card */}
          {expense.description && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-neutral-100 text-neutral-600'>
                  <FileText size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Description</span>
              </div>
              <p className='texts-body-medium text-(--text-secondary) pt-4 whitespace-pre-wrap'>
                {expense.description}
              </p>
            </div>
          )}

          {/* Payment History Card */}
          {expense.payment_history.length > 0 && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-(--info-light) text-(--info-main)'>
                  <Clock size={19} strokeWidth={1.5} />
                </div>
                <div className='flex flex-col'>
                  <span className='texts-body-medium-medium'>Payment History</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    {expense.payment_history.length} {expense.payment_history.length === 1 ? 'transaction' : 'transactions'}
                  </span>
                </div>
              </div>

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
                    {expense.payment_history.map((record) => {
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
          {expense.payment_history.length === 0 && (
            <div className='flex flex-col items-center justify-center p-8 rounded-[12px] bg-(--background-primary) border border-(--border-default)'>
              <Clock size={40} className='text-neutral-300 mb-3' />
              <span className='texts-body-medium text-(--text-secondary)'>No payment transactions yet</span>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className='w-full lg:w-80 flex flex-col gap-5'>
          {/* Expense Proof Card */}
          {expense.expense_evidence && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-rose-100 text-rose-600'>
                  <FileText size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Expense Proof</span>
              </div>

              <div className='pt-4'>
                <button
                  onClick={() => window.open(expense.expense_evidence || '', '_blank')}
                  className='w-full flex items-center justify-center gap-2 py-2.5 texts-button-primary text-(--info-main) bg-(--info-light) rounded-lg hover:opacity-80 transition-opacity'
                >
                  <ExternalLink size={14} />
                  View Document
                </button>
              </div>
            </div>
          )}

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
                  timestamp={expense.created_at}
                  className='texts-body-small-medium'
                />
              </div>
              <div className='flex items-center justify-between'>
                <span className='texts-body-small text-(--text-secondary)'>Due Date</span>
                <span className='texts-body-small-medium'>
                  {expense.due_payment_date ? formatDate(expense.due_payment_date) : '—'}
                </span>
              </div>
              {expense.recurring_config && (
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
          {expense.property_expense && expense.property_expense.property && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-blue-100 text-blue-600'>
                  <Building2 size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Property</span>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                <div className='flex flex-col'>
                  <Link
                    href={`/properties/${expense.property_expense.property.id}/overview`}
                    className='texts-body-medium-medium text-(--text-primary) hover:underline'
                  >
                    {expense.property_expense.property.code}
                  </Link>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    {expense.property_expense.property.street_address}, {expense.property_expense.property.city}
                  </span>
                </div>
                {expense.property_expense.property.project_title && (
                  <div className='flex items-center justify-between pt-3 border-t border-(--border-light)'>
                    <span className='texts-body-small text-(--text-secondary)'>Project</span>
                    <span className='texts-body-small-medium'>{expense.property_expense.property.project_title}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lease Info Card (for Refund type) */}
          {expense.property_expense && expense.property_expense.lease && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-blue-100 text-blue-600'>
                  <FileText size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Lease</span>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Reference</span>
                  <span className='texts-body-small-medium'>{expense.property_expense.lease.reference_id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Contract Info Card */}
          {expense.contract_expense && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-orange-100 text-orange-600'>
                  <FileText size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Contract</span>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Reference</span>
                  <span className='texts-body-small-medium'>{expense.contract_expense.contract.reference_id}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Owner</span>
                  <span className='texts-body-small-medium'>{expense.contract_expense.contract.owner_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Staff Info Card */}
          {expense.staff_expense && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-teal-100 text-teal-600'>
                  <User size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Staff</span>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Name</span>
                  <span className='texts-body-small-medium'>{expense.staff_expense.staff_name}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Month</span>
                  <span className='texts-body-small-medium'>
                    {new Date(expense.staff_expense.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Company Expense Card */}
          {expense.company_expense && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-indigo-100 text-indigo-600'>
                  <Briefcase size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Company Expense</span>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Type</span>
                  <span className='texts-body-small-medium'>{formatPaymentTypeLabel(expense.company_expense.type)}</span>
                </div>
                {expense.company_expense.is_asset && (
                  <div className='flex items-center justify-between pt-3 border-t border-(--border-light)'>
                    <span className='texts-body-small text-(--text-secondary)'>Asset</span>
                    <span className='px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800'>Asset</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purchase Expense Card */}
          {expense.purchase_expense && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-amber-100 text-amber-600'>
                  <ShoppingCart size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Purchase</span>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Type</span>
                  <span className='texts-body-small-medium'>{formatPaymentTypeLabel(expense.purchase_expense.type)}</span>
                </div>
                {expense.purchase_expense.property && (
                  <>
                    <div className='flex flex-col pt-3 border-t border-(--border-light)'>
                      <Link
                        href={`/properties/${expense.purchase_expense.property.id}/overview`}
                        className='texts-body-medium-medium text-(--text-primary) hover:underline'
                      >
                        {expense.purchase_expense.property.code}
                      </Link>
                      <span className='texts-caption-large text-(--text-secondary)'>
                        {expense.purchase_expense.property.street_address}, {expense.purchase_expense.property.city}
                      </span>
                    </div>
                    {expense.purchase_expense.property.project_title && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>Project</span>
                        <span className='texts-body-small-medium'>{expense.purchase_expense.property.project_title}</span>
                      </div>
                    )}
                  </>
                )}
                {expense.purchase_expense.is_asset && (
                  <>
                    <div className='flex items-center justify-between pt-3 border-t border-(--border-light)'>
                      <span className='texts-body-small text-(--text-secondary)'>Asset</span>
                      <span className='px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800'>Asset</span>
                    </div>
                    {expense.purchase_expense.depreciation_percentage !== null && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>Depreciation</span>
                        <span className='texts-body-small-medium'>{expense.purchase_expense.depreciation_percentage}%</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
