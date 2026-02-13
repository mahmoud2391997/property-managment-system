'use client'

import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface MonthlyIncomeExpense {
  month: string
  payments: number
  expenses: number
}

export interface ProjectOption {
  id: string
  name: string
}

interface IncomeExpenseChartProps {
  data: MonthlyIncomeExpense[]
  years: number[]
  projects: ProjectOption[]
  selectedYear: number
  selectedProject: string // 'all' or project id
  onYearChange: (year: number) => void
  onProjectChange: (projectId: string) => void
  className?: string
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toFixed(0)
}

// Colors derived from the design system
const CHART_COLORS = {
  payments: '#0d9488',  // --secondary-color (teal)
  expenses: '#1f1f1f',  // --primary-color (black)
  profit: '#10b981',    // --success-main
  loss: '#ef4444',      // --error-main
} as const

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const payments = payload.find((p: any) => p.dataKey === 'payments')?.value ?? 0
    const expenses = payload.find((p: any) => p.dataKey === 'expenses')?.value ?? 0
    const profit = payments - expenses

    return (
      <div className="bg-(--primary-color) text-white rounded-lg px-4 py-3 shadow-lg min-w-[180px]">
        <p className="texts-label-small text-gray-400 mb-2">{label}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.payments }} />
              <span className="texts-caption-large text-gray-300">Payments</span>
            </div>
            <span className="texts-label-small text-white">
              RM {payments.toLocaleString('en-MY')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.expenses }} />
              <span className="texts-caption-large text-gray-300">Expenses</span>
            </div>
            <span className="texts-label-small text-white">
              RM {expenses.toLocaleString('en-MY')}
            </span>
          </div>
          <div className="border-t border-gray-600 mt-1 pt-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="texts-caption-large text-gray-300">Profit</span>
              <span
                className="texts-label-small font-bold"
                style={{ color: profit >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss }}
              >
                {profit >= 0 ? '+' : ''}RM {profit.toLocaleString('en-MY')}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function IncomeExpenseChart({
  data,
  years,
  projects,
  selectedYear,
  selectedProject,
  onYearChange,
  onProjectChange,
  className,
}: IncomeExpenseChartProps) {
  const isProjectFiltered = selectedProject !== 'all'

  return (
    <Card className={cn('py-0 gap-0 flex-2', className)}>
      {/* Header with selectors */}
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="texts-label-medium text-(--text-secondary)">
              Income vs Expenses
            </h3>
            <p className="texts-heading-h3 text-(--text-primary) mt-1">
              Monthly Overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isProjectFiltered && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-1 hover:bg-teal-50 rounded-full transition-colors">
                    <Info className="w-4 h-4 text-[#0d9488]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="end"
                  className="w-64 p-3 bg-white border border-gray-200 shadow-lg"
                >
                  <p className="texts-label-small text-(--text-primary) mb-1">Note</p>
                  <p className="texts-caption-large text-(--text-secondary)">
                    Expenses shown are only those tied to properties under this project.
                    This may not reflect total expenses.
                  </p>
                </PopoverContent>
              </Popover>
            )}
            <Select
              value={selectedProject}
              onValueChange={onProjectChange}
            >
              <SelectTrigger size="sm" className="w-[140px] texts-caption-large">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
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

      {/* Chart */}
      <CardContent className="h-72 w-full p-5 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barCategoryGap="20%"
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={formatCurrency}
              width={50}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: '#f3f4f6', radius: 4 }}
            />
            <Bar
              dataKey="payments"
              name="Payments"
              fill={CHART_COLORS.payments}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill={CHART_COLORS.expenses}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              opacity={0.75}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>

      {/* Legend footer */}
      <div className="px-5 pb-4 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.payments }} />
          <span className="texts-caption-large text-(--text-secondary)">Payments (Income)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.expenses, opacity: 0.75 }} />
          <span className="texts-caption-large text-(--text-secondary)">Expenses (Outcome)</span>
        </div>
      </div>
    </Card>
  )
}

export function IncomeExpenseChartSkeleton() {
  return (
    <Card className="py-0 gap-0">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-[140px] bg-gray-100 rounded-md animate-pulse" />
            <div className="h-8 w-[90px] bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-72 w-full p-5 pt-4 flex items-end gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 flex gap-1 items-end">
            <div
              className="flex-1 bg-teal-100 rounded-t animate-pulse"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
            <div
              className="flex-1 bg-gray-200 rounded-t animate-pulse"
              style={{ height: `${20 + Math.random() * 50}%` }}
            />
          </div>
        ))}
      </CardContent>
      <div className="px-5 pb-4 flex items-center gap-5">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
    </Card>
  )
}
