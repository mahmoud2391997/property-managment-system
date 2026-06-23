'use client'

import { cn } from '@/lib/utils'
import { MonthlyRevenue } from '@/lib/dashboard-data'
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'

interface RevenueChartProps {
  data: MonthlyRevenue[]
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

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold">
          RM {payload[0].value.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
        </p>
      </div>
    )
  }
  return null
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const currentMonth = data[data.length - 1]?.revenue || 0
  const previousMonth = data[data.length - 2]?.revenue || 0
  const percentChange = previousMonth > 0
    ? ((currentMonth - previousMonth) / previousMonth * 100)
    : 0
  const isPositive = currentMonth >= previousMonth

  return (
    <Card className={cn('py-0 gap-0 ', className)}>
      {/* Header */}
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Financial Overview</h3>
            </div>
            <p className="text-sm text-gray-500">Revenue and payment analytics</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              RM {currentMonth.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
            </p>
            <div className={cn(
              'flex items-center justify-end gap-1 text-sm font-medium',
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="w-4 h-4" strokeWidth={2.5} />
              )}
              <span>{isPositive ? '+' : ''}{percentChange.toFixed(1)}%</span>
              <span className="text-gray-400 font-normal">vs last month</span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Chart */}
      <CardContent className="h-60 w-full p-4 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d1d5db', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#10b981',
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>

      {/* Footer */}
      <CardFooter className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <div className="flex items-center justify-between text-sm w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-gray-600">Revenue</span>
            </div>
          </div>
          <div className="text-gray-500">
            6-month total: <span className="font-semibold text-gray-900">RM {totalRevenue.toLocaleString('en-MY', { minimumFractionDigits: 0 })}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export function RevenueChartSkeleton() {
  return (
    <Card className="py-0 gap-0">
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
            <div>
              <div className="h-5 w-36 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="text-right">
            <div className="h-7 w-28 bg-gray-100 rounded animate-pulse mb-1" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-60 w-full p-4 flex items-end gap-2">
        {[40, 60, 45, 80, 65, 90].map((h, i) => (
          <div key={i} className="flex-1 bg-gray-100 rounded-t animate-pulse" style={{ height: `${h}%` }} />
        ))}
      </CardContent>
      <CardFooter className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </CardFooter>
    </Card>
  )
}
