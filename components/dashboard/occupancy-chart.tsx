'use client'

import { cn } from '@/lib/utils'
import { OccupancyData } from '@/lib/dashboard-data'
import { Home, CheckCircle2, Wrench, DoorOpen } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface OccupancyChartProps {
  data: OccupancyData[]
  occupancyRate: number
  className?: string
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; lightBg: string; icon: typeof Home; label: string }> = {
  Occupied: { color: '#10b981', bg: 'bg-emerald-500', lightBg: 'bg-emerald-100', icon: CheckCircle2, label: 'Occupied' },
  Ready: { color: '#3b82f6', bg: 'bg-blue-500', lightBg: 'bg-blue-100', icon: DoorOpen, label: 'Ready' },
  Maintenance: { color: '#f59e0b', bg: 'bg-amber-500', lightBg: 'bg-amber-100', icon: Wrench, label: 'Maintenance' },
}

export function OccupancyChart({ data, occupancyRate, className }: OccupancyChartProps) {
  const totalUnits = data.reduce((sum, item) => sum + item.count, 0)
  const occupiedUnits = data.find(d => d.status === 'Occupied')?.count || 0

  return (
    <Card className={cn('py-0 gap-0', className)}>
      {/* Header */}
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Home className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Occupancy Overview</h3>
        </div>
        <p className="text-sm text-gray-500">Current property and room status</p>
      </CardHeader>

      {/* Stats */}
      <CardContent className="p-5">
        {/* Properties Row */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Properties</span>
            <span className="text-lg font-bold text-gray-900">{occupiedUnits} / {totalUnits}</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
            {data.map((item) => {
              const percentage = totalUnits > 0 ? (item.count / totalUnits) * 100 : 0
              const config = STATUS_CONFIG[item.status]
              return (
                <div
                  key={item.status}
                  className={cn('h-full transition-all', config?.bg || 'bg-gray-400')}
                  style={{ width: `${percentage}%` }}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2">
            {data.map((item) => {
              const config = STATUS_CONFIG[item.status]
              return (
                <div key={item.status} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: config?.color || '#9ca3af' }}
                  />
                  <span className="text-xs text-gray-500">
                    {config?.label || item.status}: {item.count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-emerald-800">Occupancy Rate</p>
            <p className="text-xs text-emerald-600">Based on total units</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-emerald-600">{occupancyRate}%</span>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {data.map((item) => {
            const config = STATUS_CONFIG[item.status]
            const Icon = config?.icon || Home
            return (
              <div
                key={item.status}
                className={cn('p-3 rounded-lg text-center', config?.lightBg || 'bg-gray-100')}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: config?.color || '#6b7280' }} />
                <p className="text-lg font-bold text-gray-900">{item.count}</p>
                <p className="text-xs text-gray-600">{config?.label || item.status}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function OccupancyChartSkeleton() {
  return (
    <Card className="py-0 gap-0">
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex justify-between mb-2">
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full animate-pulse mb-4" />
        <div className="h-20 bg-gray-100 rounded-xl animate-pulse mb-5" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
