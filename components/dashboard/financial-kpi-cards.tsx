'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { InfoPopover } from '@/components/info-popover'
import { TrendingUp, TrendingDown } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface BalanceCardProps {
  totalPayments: number
  totalExpenses: number
  previousBalance?: number | null
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

// ── Shared helpers ────────────────────────────────────────────────────

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="texts-caption-large text-(--text-muted) truncate">{label}</span>
      </div>
      <span className="texts-caption-large font-semibold shrink-0" style={{ color }}>{value}</span>
    </div>
  )
}

function fmt(value: number): string {
  return `RM ${value.toLocaleString('en-MY')}`
}

// ── Balance Card ───────────────────────────────────────────────────────

export function BalanceCard({ totalPayments, totalExpenses, previousBalance, className }: BalanceCardProps) {
  const balance = totalPayments - totalExpenses
  const isPositive = balance >= 0

  // Month-over-month change
  const hasComparison = previousBalance !== null && previousBalance !== undefined
  const change = hasComparison ? balance - previousBalance : 0
  const changePct = hasComparison && previousBalance !== 0
    ? Math.abs((change / Math.abs(previousBalance)) * 100)
    : null
  const isGrowth = change >= 0

  return (
    <div className={cn('px-6 flex flex-col', className)}>
      <span className="texts-label-medium text-(--text-secondary) flex items-center">
        Balance
        <InfoPopover
          title="How Balance is calculated"
          description="Accumulated balance since inception. Balance = Total Income − Total Expenses across all months. A positive balance (green) means income exceeds expenses. A negative balance (red) means expenses exceed income."
        />
      </span>
      <p className="texts-caption-large text-(--text-muted) mt-0.5">all time</p>
      <div className="mt-2 mb-auto">
        <span
          className="texts-heading-h2"
          style={{ color: isPositive ? '#0f766e' : '#dc2626' }}
        >
          {isPositive ? '+' : '-'}{fmt(Math.abs(balance))}
        </span>
      </div>
      {hasComparison && changePct !== null && (
        <div className="mt-3 mb-1 flex items-center gap-1.5">
          {isGrowth
            ? <TrendingUp size={14} className="text-emerald-600" />
            : <TrendingDown size={14} className="text-red-500" />
          }
          <span className={cn('text-xs font-semibold', isGrowth ? 'text-emerald-600' : 'text-red-500')}>
            {changePct.toFixed(1)}%
          </span>
          <span className="text-sm text-(--text-muted)">vs last month</span>
        </div>
      )}
      <div className="border-t border-(--border-default) mt-3 pt-3 flex flex-col gap-2">
        <StatRow label="Income" value={fmt(totalPayments)} color="#0f766e" />
        <StatRow label="Expenses" value={fmt(totalExpenses)} color="#475569" />
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
      <div className="mt-2 mb-auto">
        <span className="texts-heading-h2 text-(--text-primary)">
          {fmt(totalReceived)}
        </span>
      </div>
      {/* Progress bar */}
      <div className="mt-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="texts-caption-large text-(--text-muted)">Collection rate</span>
          <span className="texts-caption-large font-semibold text-(--text-primary)">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-(--background-tertiary)">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, backgroundColor: '#0f766e' }}
          />
        </div>
      </div>
      <div className="border-t border-(--border-default) mt-3 pt-3 flex flex-col gap-2">
        <StatRow label="Total Due" value={fmt(totalDue)} color="#b45309" />
        {/* <StatRow label="Received" value={fmt(totalReceived)} color="#0f766e" /> */}
        <StatRow label="Not Received" value={fmt(notReceived)} color="#dc2626" />
      </div>
    </div>
  )
}

// ── Rental Overdue Card ────────────────────────────────────────────────

export function RentalOverdueCard({ overdueAmount, overdueCount, overdueThisMonth, overduePreviousMonths, className }: RentalOverdueCardProps) {
  return (
    <Link
      href="/payments?type=Rental&status=Overdue"
      className={cn('px-6 flex flex-col group cursor-pointer rounded-lg transition-colors hover:bg-(--background-secondary)', className)}
    >
      <span className="texts-label-medium text-(--text-secondary) flex items-center">
        Rental Overdue
        <InfoPopover
          title="How Rental Overdue is calculated"
          description="Total unpaid rental amounts past their due date, including the unpaid portion of partially paid payments. Broken down by overdue from this month and previous months."
        />
      </span>
      <p className="texts-caption-large text-(--text-muted) mt-0.5">past due date</p>
      <div className="mt-2 mb-auto">
        <span className="texts-heading-h2" style={{ color: '#dc2626' }}>
          {fmt(overdueAmount)}
        </span>
      </div>
      <div className="mt-2">
        <span className="inline-flex items-center px-2 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
          {overdueCount} overdue payment{overdueCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="border-t border-(--border-default) mt-3 pt-3 flex flex-col gap-2">
        <StatRow label="This Month" value={fmt(overdueThisMonth)} color="#b45309" />
        <StatRow label="Previous Months" value={fmt(overduePreviousMonths)} color="#475569" />
      </div>
    </Link>
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
      <div className="mt-2 mb-auto">
        <span className="texts-heading-h2 text-(--text-primary)">
          {fmt(paidAmount)}
        </span>
      </div>
      {/* Progress bar */}
      <div className="mt-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="texts-caption-large text-(--text-muted)">Payment rate</span>
          <span className="texts-caption-large font-semibold text-(--text-primary)">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-(--background-tertiary)">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, backgroundColor: '#0f766e' }}
          />
        </div>
      </div>
      <div className="border-t border-(--border-default) mt-3 pt-3 flex flex-col gap-2">
        <StatRow label="Total Due" value={fmt(totalAmount)} color="#b45309" />
        {/* <StatRow label="Paid" value={fmt(paidAmount)} color="#0f766e" /> */}
        <StatRow label="Not Paid" value={fmt(notPaid)} color="#dc2626" />
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
      <div className="mt-2 mb-auto">
        <span className="texts-heading-h2" style={{ color: '#dc2626' }}>
          {fmt(overdueAmount)}
        </span>
      </div>
      <div className="mt-2">
        <span className="inline-flex items-center px-2 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
          {overdueCount} overdue expense{overdueCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="border-t border-(--border-default) mt-3 pt-3 flex flex-col gap-2">
        <StatRow label="This Month" value={fmt(overdueThisMonth)} color="#b45309" />
        <StatRow label="Previous Months" value={fmt(overduePreviousMonths)} color="#475569" />
      </div>
    </div>
  )
}

// ── Skeletons ──────────────────────────────────────────────────────────

export function FinancialKpiCardSkeleton() {
  return (
    <div className="px-6 flex flex-col">
      <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-1" />
      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
      <div className="h-9 w-36 bg-gray-100 rounded animate-pulse mt-2 mb-auto" />
      <div className="border-t border-(--border-default) mt-4 pt-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
