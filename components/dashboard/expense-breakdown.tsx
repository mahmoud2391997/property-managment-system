'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface ExpenseCategoryData {
  category: string
  amount: number
  color: string
}

interface ExpenseBreakdownProps {
  data: ExpenseCategoryData[]
  months: { value: string; label: string }[]
  years: number[]
  selectedMonth: string
  selectedYear: number
  onMonthChange: (month: string) => void
  onYearChange: (year: number) => void
  className?: string
}

export function ExpenseBreakdown({
  data,
  months,
  years,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  className,
}: ExpenseBreakdownProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0)
  const maxAmount = Math.max(...data.map((d) => d.amount))

  return (
    <Card className={cn('py-0 gap-0 flex-1', className)}>
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="texts-label-medium text-(--text-secondary)">
              Expense Breakdown
            </h3>
            <p className="texts-heading-h3 text-(--text-primary) mt-1">
              RM {total.toLocaleString('en-MY')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={onMonthChange}>
              <SelectTrigger size="sm" className="w-[100px] texts-caption-large">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => onYearChange(Number(v))}
            >
              <SelectTrigger size="sm" className="w-[90px] texts-caption-large">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-4">
        <div className="flex flex-col gap-4">
          {data.map((item) => {
            const percentage = total > 0 ? (item.amount / total) * 100 : 0
            const barWidth = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0

            return (
              <div key={item.category} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="texts-label-small text-(--text-primary)">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="texts-label-small text-(--text-primary)">
                      RM {item.amount.toLocaleString('en-MY')}
                    </span>
                    <span className="texts-caption-large text-(--text-muted) w-10 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-(--background-tertiary)">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function ExpenseBreakdownSkeleton() {
  return (
    <Card className="py-0 gap-0">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-6 w-36 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-[100px] bg-gray-100 rounded-md animate-pulse" />
            <div className="h-8 w-[90px] bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        <div className="flex flex-col gap-4">
          {[80, 60, 45, 30, 20].map((w, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-200 animate-pulse"
                  style={{ width: `${w}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
