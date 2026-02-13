'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import { InfoPopover } from '@/components/info-popover'
import {
  ComposedChart,
  Bar,
  Line,
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

// ── Types ──────────────────────────────────────────────────────────────

export interface MonthlyOverviewData {
  month: string
  income: number | null
  outcome: number | null
}

export interface ProjectOption {
  id: string
  name: string
}

interface FinancialMonthlyOverviewProps {
  data: MonthlyOverviewData[]
  years: number[]
  projects: ProjectOption[]
  selectedYear: number
  selectedProject: string
  onYearChange: (year: number) => void
  onProjectChange: (projectId: string) => void
  className?: string
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toFixed(0)
}

const CHART_COLORS = {
  income: '#0d9488',
  outcome: '#1f1f1f',
  profit: '#10b981',
  loss: '#ef4444',
  balance: '#3b82f6',
} as const

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const income = payload.find((p: any) => p.dataKey === 'income')?.value
    const outcome = payload.find((p: any) => p.dataKey === 'outcome')?.value
    const hasData = income != null && outcome != null
    const profit = hasData ? income - outcome : null
    const balance = payload.find((p: any) => p.dataKey === 'balance')?.value

    if (!hasData) {
      return (
        <div className="bg-white border border-(--border-default) rounded-lg px-4 py-3 shadow-lg min-w-[160px]">
          <p className="texts-label-small text-(--text-muted) mb-1">{label}</p>
          <p className="texts-caption-large text-(--text-muted)">No data</p>
        </div>
      )
    }

    return (
      <div className="bg-white border border-(--border-default) rounded-lg px-4 py-3 shadow-lg min-w-[180px]">
        <p className="texts-label-small text-(--text-muted) mb-2">{label}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.income }} />
              <span className="texts-caption-large text-(--text-secondary)">Income</span>
            </div>
            <span className="texts-label-small text-(--text-primary)">
              RM {income.toLocaleString('en-MY')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.outcome }} />
              <span className="texts-caption-large text-(--text-secondary)">Outcome</span>
            </div>
            <span className="texts-label-small text-(--text-primary)">
              RM {outcome.toLocaleString('en-MY')}
            </span>
          </div>
          <div className="border-t border-(--border-default) mt-1 pt-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="texts-caption-large text-(--text-secondary)">Profit</span>
              <span
                className="texts-label-small font-bold"
                style={{ color: profit! >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss }}
              >
                {profit! >= 0 ? '+' : ''}RM {profit!.toLocaleString('en-MY')}
              </span>
            </div>
          </div>
          {balance !== undefined && (
            <div className="flex items-center justify-between gap-4 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.balance }} />
                <span className="texts-caption-large text-(--text-secondary)">Balance (YTD)</span>
              </div>
              <span className="texts-label-small text-(--text-primary)">
                RM {balance.toLocaleString('en-MY')}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

// ── Component ──────────────────────────────────────────────────────────

export function FinancialMonthlyOverview({
  data,
  years,
  projects,
  selectedYear,
  selectedProject,
  onYearChange,
  onProjectChange,
  className,
}: FinancialMonthlyOverviewProps) {
  const isProjectFiltered = selectedProject !== 'all'

  // Compute cumulative balance for the line (skip months with no data)
  const dataWithBalance = useMemo(() => {
    let cumulative = 0
    return data.map((d) => {
      if (d.income == null || d.outcome == null) {
        return { ...d, balance: null }
      }
      cumulative += d.income - d.outcome
      return { ...d, balance: cumulative }
    })
  }, [data])

  return (
    <Card className={cn('py-0 gap-0 flex-2', className)}>
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="texts-label-medium text-(--text-secondary) flex items-center">
              Income vs Outcome
              <InfoPopover
                title="Income vs Outcome"
                description="Monthly comparison of total income (rental payments, fees) versus total expenses (maintenance, utilities, salaries). The blue line tracks cumulative balance throughout the year."
              />
            </h3>
            <p className="texts-heading-h3 text-(--text-primary) mt-1">
              Monthly Overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isProjectFiltered && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-1 hover:bg-teal-50 rounded-full transition-colors cursor-pointer">
                    <Info className="w-4 h-4 text-[#0d9488]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-64 p-3 bg-white border border-gray-200 shadow-lg">
                  <p className="texts-label-small text-(--text-primary) mb-1">Note</p>
                  <p className="texts-caption-large text-(--text-secondary)">
                    Showing income and expenses only from properties in the selected project. Company and staff expenses are excluded.
                  </p>
                </PopoverContent>
              </Popover>
            )}
            <Select value={selectedProject} onValueChange={onProjectChange}>
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

      <CardContent className="h-72 w-full p-5 pt-4 cursor-help [&_.recharts-wrapper]:cursor-help!">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dataWithBalance}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barCategoryGap="20%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={formatCurrency}
              width={50}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#93c5fd', fontSize: 11 }}
              tickFormatter={formatCurrency}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', radius: 4 }} />
            <Bar
              yAxisId="left"
              dataKey="income"
              name="Income"
              fill={CHART_COLORS.income}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              yAxisId="left"
              dataKey="outcome"
              name="Outcome"
              fill={CHART_COLORS.outcome}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              opacity={0.75}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="balance"
              name="Cumulative Balance"
              stroke={CHART_COLORS.balance}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.balance, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>

      <div className="px-5 pb-4 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.income }} />
          <span className="texts-caption-large text-(--text-secondary)">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.outcome, opacity: 0.75 }} />
          <span className="texts-caption-large text-(--text-secondary)">Outcome</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: CHART_COLORS.balance }} />
          <span className="texts-caption-large text-(--text-secondary)">Cumulative Balance</span>
        </div>
      </div>
    </Card>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────

export function FinancialMonthlyOverviewSkeleton() {
  return (
    <Card className="py-0 gap-0 flex-2">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-8 w-[90px] bg-gray-100 rounded-md animate-pulse" />
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
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
      </div>
    </Card>
  )
}
