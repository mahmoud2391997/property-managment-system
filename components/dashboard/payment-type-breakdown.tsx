'use client'

import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import { InfoPopover } from '@/components/info-popover'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
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
import MonthPicker from '@/components/costume-ui/month-picker'

// ── Types ──────────────────────────────────────────────────────────────

export interface PaymentTypeData {
  type: string
  amount: number
  color: string
}

export interface ProjectOption {
  id: string
  name: string
}

interface PaymentTypeBreakdownProps {
  data: PaymentTypeData[]
  projects: ProjectOption[]
  selectedDate: Date
  selectedProject: string
  onDateChange: (date: Date) => void
  onProjectChange: (projectId: string) => void
  className?: string
}

// ── Tooltip ────────────────────────────────────────────────────────────

function CustomPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const { type, amount, color } = payload[0].payload

    return (
      <div className="bg-white border border-(--border-default) rounded-lg px-4 py-3 shadow-lg min-w-[160px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="texts-label-small text-(--text-secondary)">
            {type.replace(/_/g, ' ')}
          </span>
        </div>
        <span className="texts-label-small text-(--text-primary)">
          RM {amount.toLocaleString('en-MY')}
        </span>
      </div>
    )
  }
  return null
}

// ── Component ──────────────────────────────────────────────────────────

export function PaymentTypeBreakdown({
  data,
  projects,
  selectedDate,
  selectedProject,
  onDateChange,
  onProjectChange,
  className,
}: PaymentTypeBreakdownProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0)
  const isProjectFiltered = selectedProject !== 'all'

  return (
    <Card className={cn('py-0 gap-0 flex-1', className)}>
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="texts-label-medium text-(--text-secondary) flex items-center">
              Payment Type Breakdown
              <InfoPopover
                title="Payment Type Breakdown"
                description="Distribution of payments by type (rental, utilities, services, etc.) for the selected month and year. The donut chart shows each type's share of total payments."
              />
            </h3>
            <p className="texts-heading-h3 text-(--text-primary) mt-1">
              RM {total.toLocaleString('en-MY')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className='flex items-center gap-2'>
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
                      Showing payments only from properties in the selected project.
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
            </div>
            <MonthPicker
              variant="compact"
              value={selectedDate}
              onValueChange={(d) => d && onDateChange(d)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {/* Donut chart */}
        <div className="relative cursor-help [&_.recharts-wrapper]:cursor-help!">
          {/* Center label — behind chart so tooltip isn't obscured */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="text-center">
              <p className="texts-caption-large text-(--text-muted)">Total</p>
              <p className="texts-label-medium text-(--text-primary) font-bold">
                RM {total.toLocaleString('en-MY')}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220} className="relative z-10">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
          {data.map((item) => {
            const pct = total > 0 ? (item.amount / total) * 100 : 0
            return (
              <div key={item.type} className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="texts-caption-large text-(--text-muted) truncate">
                  {item.type.replace(/_/g, ' ')}
                </span>
                <span className="texts-caption-large text-(--text-primary) font-medium ml-auto shrink-0">
                  {pct.toFixed(0)}%
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────

export function PaymentTypeBreakdownSkeleton() {
  return (
    <Card className="py-0 gap-0 flex-1">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-36 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-6 w-28 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-[100px] bg-gray-100 rounded-md animate-pulse" />
            <div className="h-8 w-[90px] bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <div className="flex items-center justify-center h-[220px]">
          <div className="w-[180px] h-[180px] rounded-full border-[30px] border-gray-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
