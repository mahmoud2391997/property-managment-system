'use client'

import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/formatTime'
import { formatCurrency } from '@/utils/formatCurrency'
import { RecurringPaymentDetails } from '@/app/api/properties/[id]/recurring-configs/route'
import { AlertCircle, Edit } from 'lucide-react'
import { formatPaymentTypeLabel } from '@/utils/functions'
import { Button } from '@/components/ui/button'
import SetChargesDialog from '@/components/dialogs/set-charges-dialog'

type Props = {
  configId: string
  payments: RecurringPaymentDetails[]
  isExpanded: boolean
  onRefresh?: () => void
}

export default function RecurringPaymentsNestedTable({ payments, onRefresh }: Props) {
  const thStyles = 'border-b border-(--border-light) p-[15] px-5'
  const trStyles = 'p-[15] px-5'

  if (payments.length === 0) {
    return (
      <div className="bg-(--background-secondary) p-6 -m-3">
        <div className="bg-white rounded-lg p-4 text-center text-(--text-secondary)">
          No payments generated yet
        </div>
      </div>
    )
  }

  return (
    <div className="bg-(--background-secondary) p-6 -m-3">
      <div className="mb-4 flex items-center gap-2">
        <h3>Generated Payments</h3>
        <span className="texts-body-medium text-(--text-secondary)">
          ({payments.length} {payments.length === 1 ? 'payment' : 'payments'})
        </span>
      </div>
      <div className="bg-white rounded-lg border border-(--border-default) overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left texts-caption-large text-(--text-secondary)">
              <th className={thStyles}>Payment ID</th>
              <th className={thStyles}>Type</th>
              <th className={thStyles}>Due Date</th>
              <th className={thStyles}>Amount</th>
              <th className={thStyles}>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const statusKey = payment.status.toLowerCase().replace(/\s/g, '-')
              const isUnset = payment.status === 'Unset'

              // For Unset status payments, render special UI
              if (isUnset) {
                return (
                  <tr key={payment.id} className="border-b last:border-b-0 bg-amber-50/30">
                    <td colSpan={5} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 shrink-0 mt-0.5">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="texts-body-medium-semibold text-(--text-primary)">
                              {payment.reference_id}
                            </span>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              'bg-amber-100 text-amber-800'
                            )}>
                              Unset
                            </span>
                          </div>
                          <div className="texts-body-small text-(--text-secondary) mb-2">
                            {formatPaymentTypeLabel(payment.type)}
                            {payment.due_date && (
                              <span className="ml-2">
                                • Due: {formatDate(new Date(payment.due_date))}
                              </span>
                            )}
                          </div>
                          <div className="texts-caption-large text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                            <p className="font-medium mb-1">⚠️ Action Required</p>
                            <p className="text-sm">
                              This payment has no charges set yet. Staff need to set the charges before this payment can be issued to the tenant.
                            </p>
                          </div>
                          <SetChargesDialog
                            paymentId={payment.id}
                            paymentReferenceId={payment.reference_id}
                            trigger={
                              <Button size="sm" className="gap-2">
                                <Edit className="w-4 h-4" />
                                Set Charges
                              </Button>
                            }
                            onSuccess={() => {
                              onRefresh?.()
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              }

              // Regular payment row
              return (
                <tr key={payment.id} className="border-b last:border-b-0 hover:bg-(--background-secondary)">
                  <td className={cn(trStyles, "texts-table-cell-primary")}>
                    {payment.reference_id}
                  </td>
                  <td className={cn(trStyles, "texts-table-cell-secondary")}>
                    {formatPaymentTypeLabel(payment.type)}
                  </td>
                  <td className={cn(trStyles, "texts-table-cell-primary")}>
                    {payment.due_date ? formatDate(new Date(payment.due_date)) : '—'}
                  </td>
                  <td className={cn(trStyles, "texts-body-large-medium")}>
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className={trStyles}>
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
                      {payment.status}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
