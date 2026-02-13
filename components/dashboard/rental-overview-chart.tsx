'use client'

import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import { InfoPopover } from '@/components/info-popover'
import {
  LineChart,
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

export interface RentalOverviewData {
  month: string
  rentalReceived: number
  ownerPaid: number
  occupancyRate: number   // percentage 0–100
  propertyCount: number   // avg properties for tooltip
}

export interface ProjectOption {
  id: string
  name: string
}

interface RentalOverviewChartProps {
  data: RentalOverviewData[]
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
  rentalReceived: '#0d9488',
  ownerPaid: '#7c3aed',
  occupancy: '#d97706',
} as const

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const received = payload.find((p: any) => p.dataKey === 'rentalReceived')?.value ?? 0
    const paid = payload.find((p: any) => p.dataKey === 'ownerPaid')?.value ?? 0
    const diff = received - paid
    const occupancy = payload.find((p: any) => p.dataKey === 'occupancyRate')?.value
    const properties = payload[0]?.payload?.propertyCount

    return (
      <div className="bg-white border border-(--border-default) rounded-lg px-4 py-3 shadow-lg min-w-[200px]">
        <p className="texts-label-small text-(--text-muted) mb-2">{label}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.rentalReceived }} />
              <span className="texts-caption-large text-(--text-secondary)">Received</span>
            </div>
            <span className="texts-label-small text-(--text-primary)">
              RM {received.toLocaleString('en-MY')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.ownerPaid }} />
              <span className="texts-caption-large text-(--text-secondary)">Owner Paid</span>
            </div>
            <span className="texts-label-small text-(--text-primary)">
              RM {paid.toLocaleString('en-MY')}
            </span>
          </div>
          <div className="border-t border-(--border-default) mt-1 pt-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="texts-caption-large text-(--text-secondary)">Difference</span>
              <span
                className="texts-label-small font-bold"
                style={{ color: diff >= 0 ? '#0d9488' : '#ef4444' }}
              >
                {diff >= 0 ? '+' : ''}RM {diff.toLocaleString('en-MY')}
              </span>
            </div>
          </div>
          {occupancy !== undefined && (
            <div className="border-t border-(--border-default) mt-1 pt-1.5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.occupancy }} />
                  <span className="texts-caption-large text-(--text-secondary)">Occupancy Rate</span>
                </div>
                <span className="texts-label-small text-(--text-primary)">
                  {occupancy.toFixed(1)}%
                </span>
              </div>
              {properties !== undefined && (
                <div className="flex items-center justify-between gap-4 mt-1">
                  <span className="texts-caption-large text-(--text-muted) pl-4">Properties</span>
                  <span className="texts-label-small text-(--text-secondary)">
                    {properties}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

// ── Component ──────────────────────────────────────────────────────────

export function RentalOverviewChart({
  data,
  years,
  projects,
  selectedYear,
  selectedProject,
  onYearChange,
  onProjectChange,
  className,
}: RentalOverviewChartProps) {
  const isProjectFiltered = selectedProject !== 'all'

  return (
    <Card className={cn('py-0 gap-0', className)}>
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="texts-label-medium text-(--text-secondary) flex items-center">
              Rental Received vs Owner Paid
              <InfoPopover
                title="Rental Received vs Owner Paid"
                description="Monthly comparison of total rental collected from tenants versus total amounts disbursed to property owners. The difference represents the company's management margin."
              />
            </h3>
            <p className="texts-heading-h3 text-(--text-primary) mt-1">
              Monthly Comparison
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
                    Showing rental data only from properties in the selected project.
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
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
              tick={{ fill: '#d97706', fontSize: 11 }}
              tickFormatter={(v: number) => `${v}%`}
              domain={[0, 100]}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rentalReceived"
              name="Rental Received"
              stroke={CHART_COLORS.rentalReceived}
              strokeWidth={2.5}
              dot={{ fill: CHART_COLORS.rentalReceived, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="ownerPaid"
              name="Owner Paid"
              stroke={CHART_COLORS.ownerPaid}
              strokeWidth={2.5}
              dot={{ fill: CHART_COLORS.ownerPaid, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="occupancyRate"
              name="Occupancy Rate"
              stroke={CHART_COLORS.occupancy}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ fill: CHART_COLORS.occupancy, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>

      <div className="px-5 pb-4 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.rentalReceived }} />
          <span className="texts-caption-large text-(--text-secondary)">Rental Received</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.ownerPaid }} />
          <span className="texts-caption-large text-(--text-secondary)">Owner Paid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-0 border-t-2 border-dashed" style={{ borderColor: CHART_COLORS.occupancy }} />
          <span className="texts-caption-large text-(--text-secondary)">Occupancy Rate</span>
        </div>
      </div>
    </Card>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────

export function RentalOverviewChartSkeleton() {
  return (
    <Card className="py-0 gap-0">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-44 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-8 w-[90px] bg-gray-100 rounded-md animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="h-72 w-full p-5 pt-4 flex items-center justify-center">
        <div className="w-full h-full bg-gray-50 rounded animate-pulse" />
      </CardContent>
      <div className="px-5 pb-4 flex items-center gap-5">
        <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
      </div>
    </Card>
  )
}
