'use client'

import { cn } from '@/lib/utils'
import {
  Building2,
  FileText,
  Banknote,
  AlertCircle,
  Users,
  DoorOpen,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const ICONS = {
  Building2,
  FileText,
  Banknote,
  AlertCircle,
  Users,
  DoorOpen,
  TrendingUp,
  Clock
} as const

type IconName = keyof typeof ICONS

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: IconName
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  className?: string
}

const variantStyles = {
  default: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  success: {
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  danger: {
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  purple: {
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  }
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className
}: MetricCardProps) {
  const styles = variantStyles[variant]
  const Icon = ICONS[icon]

  return (
    <Card className={cn('py-0 gap-0', className)}>
      <CardContent className="p-4">
        {/* Top row: Icon and Trend */}
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl',
              styles.iconBg
            )}
          >
            <Icon className={cn('w-5 h-5', styles.iconColor)} strokeWidth={2} />
          </div>

          {trend && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-sm font-semibold',
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="w-4 h-4" strokeWidth={2.5} />
              )}
              <span>{trend.isPositive ? '+' : ''}{trend.value}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-0.5">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            {value}
          </span>
        </div>

        {/* Title */}
        <div className="text-sm font-medium text-gray-500 mb-1">
          {title}
        </div>

        {/* Subtitle - supports bullet separators */}
        {subtitle && (
          <div className="text-xs text-gray-400 leading-relaxed">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MetricCardSkeleton() {
  return (
    <Card className="py-0 gap-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="w-10 h-5 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mb-1" />
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
        <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}
