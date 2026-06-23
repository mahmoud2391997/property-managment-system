'use client'

import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/formatTime'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatPaymentTypeLabel } from '@/utils/functions'
import { RecurringConfigExpenseItem } from '@/types'

type Props = {
  expenses: RecurringConfigExpenseItem[]
}

export default function RecurringExpensesNestedTable({ expenses }: Props) {
  const thStyles = 'border-b border-(--border-light) p-[15] px-5'
  const trStyles = 'p-[15] px-5'

  if (expenses.length === 0) {
    return (
      <div className="bg-(--background-secondary) p-6 -m-3">
        <div className="bg-white rounded-lg p-4 text-center text-(--text-secondary)">
          No expenses generated yet
        </div>
      </div>
    )
  }

  return (
    <div className="bg-(--background-secondary) p-6 -m-3">
      <div className="mb-4 flex items-center gap-2">
        <h3>Generated Expenses</h3>
        <span className="texts-body-medium text-(--text-secondary)">
          ({expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'})
        </span>
      </div>
      <div className="bg-white rounded-lg border border-(--border-default) overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left texts-caption-large text-(--text-secondary)">
              <th className={thStyles}>Expense ID</th>
              <th className={thStyles}>Type</th>
              <th className={thStyles}>Due Date</th>
              <th className={thStyles}>Amount</th>
              <th className={thStyles}>Status</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const statusKey = expense.status.toLowerCase().replace(/\s/g, '-')

              return (
                <tr key={expense.id} className="border-b last:border-b-0 hover:bg-(--background-secondary)">
                  <td className={cn(trStyles, "texts-table-cell-primary")}>
                    {expense.reference_id}
                  </td>
                  <td className={cn(trStyles, "texts-table-cell-secondary")}>
                    {expense.type ? formatPaymentTypeLabel(expense.type) : '—'}
                  </td>
                  <td className={cn(trStyles, "texts-table-cell-primary")}>
                    {expense.due_date ? formatDate(new Date(expense.due_date)) : '—'}
                  </td>
                  <td className={cn(trStyles, "texts-body-large-medium")}>
                    {expense.amount > 0 ? formatCurrency(expense.amount) : '—'}
                  </td>
                  <td className={trStyles}>
                    <div
                      data-status={statusKey}
                      className={cn(
                        'status-styles',
                        'data-[status=paid]:bg-green-100 data-[status=paid]:text-green-800',
                        'data-[status=pending]:bg-gray-100 data-[status=pending]:text-gray-800',
                        'data-[status=unset]:bg-amber-100 data-[status=unset]:text-amber-800',
                        'data-[status=cancelled]:bg-neutral-200 data-[status=cancelled]:text-neutral-600'
                      )}
                    >
                      {expense.status}
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