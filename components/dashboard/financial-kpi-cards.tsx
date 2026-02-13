'use client'

import { cn } from '@/lib/utils'
import { InfoPopover } from '@/components/info-popover'

// ── Types ──────────────────────────────────────────────────────────────

interface BalanceCardProps {
  totalPayments: number
  totalExpenses: number
  className?: string
}

interface RentalReceivedCardProps {
  totalDue: number
  totalReceived: number
  className?: string
}

interface RentalOverdueCardProps {
  overdueAmount: number
  overdueCount: number
  overdueThisMonth: number
  overduePreviousMonths: number
  className?: string
}

interface ExpensePaidCardProps {
  totalAmount: number
  paidAmount: number
  className?: string
}

interface ExpenseOverdueCardProps {
  overdueAmount: number
  overdueCount: number
  overdueThisMonth: number
  overduePreviousMonths: number
  className?: string
}

// ── Shared badge helper ────────────────────────────────────────────────

function StatBadge({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md"
      style={{ backgroundColor: `${color}14` }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span
        className="texts-caption-large font-bold leading-none"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Balance Card ───────────────────────────────────────────────────────

export function BalanceCard({ totalPayments, totalExpenses, className }: BalanceCardProps) {
  const balance = totalPayments - totalExpenses
  const isPositive = balance >= 0

  return (
    <div className={cn('px-6 flex flex-col', className)}>
      <span className="texts-label-medium text-(--text-secondary) flex items-center">
        Balance
        <InfoPopover
          title="How Balance is calculated"
          description="Balance = Total Payments Received − Total Expenses. A positive balance (green) means income exceeds expenses. A negative balance (red) means expenses exceed income."
        />
      </span>
      <p className="texts-caption-large text-(--text-muted) mt-0.5">net income</p>
      <div className="mt-1 mb-auto">
        <span
          className="texts-heading-h2"
          style={{ color: isPositive ? '#0f766e' : '#dc2626' }}
        >
          {isPositive ? '+' : '-'}RM {Math.abs(balance).toLocaleString('en-MY')}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        <StatBadge label={`RM ${totalPayments.toLocaleString('en-MY')} Income`} color="#0f766e" />
        <StatBadge label={`RM ${totalExpenses.toLocaleString('en-MY')} Expenses`} color="#475569" />
      </div>
    </div>
  )
}

// ── Rental Received Card ───────────────────────────────────────────────

export function RentalReceivedCard({ totalDue, totalReceived, className }: RentalReceivedCardProps) {
  const pct = totalDue > 0 ? Math.min((totalReceived / totalDue) * 100, 100) : 0
  const notReceived = totalDue - totalReceived

  return (
    <div className={cn('px-6 flex flex-col', className)}>
      <span className="texts-label-medium text-(--text-secondary) flex items-center">
        Rental Received
        <InfoPopover
          title="How Rental Received is calculated"
          description="Total rental payments collected from tenants for the current month, including partial payments. The progress bar shows how much has been received relative to the total amount due."
        />
      </span>
      <p className="texts-caption-large text-(--text-muted) mt-0.5">due this month</p>
      <div className="mt-1 mb-auto">
        <span className="texts-heading-h2 text-(--text-primary)">
          RM {totalReceived.toLocaleString('en-MY')}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-(--background-tertiary) mb-3 mt-3">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: '#0f766e' }}
        />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <StatBadge label={`RM ${totalDue.toLocaleString('en-MY')} Total`} color="#b45309" />
        <StatBadge label={`RM ${totalReceived.toLocaleString('en-MY')} Received`} color="#0f766e" />
        <StatBadge label={`RM ${notReceived.toLocaleString('en-MY')} Not Received`} color="#dc2626" />
      </div>
    </div>
  )
}

// ── Rental Overdue Card ────────────────────────────────────────────────

export function RentalOverdueCard({ overdueAmount, overdueCount, overdueThisMonth, overduePreviousMonths, className }: RentalOverdueCardProps) {
  return (
    <div className={cn('px-6 flex flex-col', className)}>
      <span className="texts-label-medium text-(--text-secondary) flex items-center">
        Rental Overdue
        <InfoPopover
          title="How Rental Overdue is calculated"
          description="Total unpaid rental amounts past their due date, including the unpaid portion of partially paid payments. Broken down by overdue from this month and previous months."
        />
      </span>
      <p className="texts-caption-large text-(--text-muted) mt-0.5">past due date</p>
      <div className="mt-1 mb-auto">
        <span className="texts-heading-h2" style={{ color: '#dc2626' }}>
          RM {overdueAmount.toLocaleString('en-MY')}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        <StatBadge label={`${overdueCount} Overdue`} color="#dc2626" />
        <StatBadge label={`RM ${overdueThisMonth.toLocaleString('en-MY')} This Month`} color="#b45309" />
        <StatBadge label={`RM ${overduePreviousMonths.toLocaleString('en-MY')} Previous`} color="#475569" />
      </div>
    </div>
  )
}

// ── Expense Paid Card ──────────────────────────────────────────────────

export function ExpensePaidCard({ totalAmount, paidAmount, className }: ExpensePaidCardProps) {
  const pct = totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0
  const notPaid = totalAmount - paidAmount

  return (
    <div className={cn('px-6 flex flex-col', className)}>
      <span className="texts-label-medium text-(--text-secondary) flex items-center">
        Expense Paid
        <InfoPopover
          title="How Expense Paid is calculated"
          description="Total expenses due this month and how much has been paid, including partial payments. The progress bar shows the paid amount relative to total."
        />
      </span>
      <p className="texts-caption-large text-(--text-muted) mt-0.5">due this month</p>
      <div className="mt-1 mb-auto">
        <span className="texts-heading-h2 text-(--text-primary)">
          RM {paidAmount.toLocaleString('en-MY')}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-(--background-tertiary) mb-3 mt-3">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: '#0f766e' }}
        />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <StatBadge label={`RM ${totalAmount.toLocaleString('en-MY')} Total`} color="#b45309" />
        <StatBadge label={`RM ${paidAmount.toLocaleString('en-MY')} Paid`} color="#0f766e" />
        <StatBadge label={`RM ${notPaid.toLocaleString('en-MY')} Not Paid`} color="#dc2626" />
      </div>
    </div>
  )
}

// ── Expense Overdue Card ───────────────────────────────────────────────

export function ExpenseOverdueCard({ overdueAmount, overdueCount, overdueThisMonth, overduePreviousMonths, className }: ExpenseOverdueCardProps) {
  return (
    <div className={cn('px-6 flex flex-col', className)}>
      <span className="texts-label-medium text-(--text-secondary) flex items-center">
        Expense Overdue
        <InfoPopover
          title="How Expense Overdue is calculated"
          description="Total unpaid expense amounts past their due date, including the unpaid portion of partially paid expenses. Broken down by overdue from this month and previous months."
        />
      </span>
      <p className="texts-caption-large text-(--text-muted) mt-0.5">past due date</p>
      <div className="mt-1 mb-auto">
        <span className="texts-heading-h2" style={{ color: '#dc2626' }}>
          RM {overdueAmount.toLocaleString('en-MY')}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        <StatBadge label={`${overdueCount} Overdue`} color="#dc2626" />
        <StatBadge label={`RM ${overdueThisMonth.toLocaleString('en-MY')} This Month`} color="#b45309" />
        <StatBadge label={`RM ${overduePreviousMonths.toLocaleString('en-MY')} Previous`} color="#475569" />
      </div>
    </div>
  )
}

// ── Skeletons ──────────────────────────────────────────────────────────

export function FinancialKpiCardSkeleton() {
  return (
    <div className="px-6">
      <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-1" />
      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-2" />
      <div className="h-9 w-32 bg-gray-100 rounded animate-pulse mb-3" />
      <div className="h-2 w-full bg-gray-100 rounded-full animate-pulse mb-3" />
      <div className="flex items-center gap-1.5">
        <div className="h-6 w-24 bg-gray-100 rounded-md animate-pulse" />
        <div className="h-6 w-24 bg-gray-100 rounded-md animate-pulse" />
      </div>
    </div>
  )
}
