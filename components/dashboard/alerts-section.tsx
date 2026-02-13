'use client'

import { cn } from '@/lib/utils'
import { DashboardAlert } from '@/lib/dashboard-data'
import Link from 'next/link'
import { AlertTriangle, Clock, ClipboardList, MessageSquare, ArrowRight, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface AlertsSectionProps {
  alerts: DashboardAlert[]
  className?: string
}

const ALERT_ICONS = {
  overdue_payment: AlertTriangle,
  expiring_lease: Clock,
  unassigned_task: ClipboardList,
  pending_ticket: MessageSquare,
}

const SEVERITY_STYLES = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    dot: 'bg-red-500'
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    dot: 'bg-amber-500'
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    dot: 'bg-blue-500'
  }
}

export function AlertsSection({ alerts, className }: AlertsSectionProps) {
  if (alerts.length === 0) {
    return null
  }

  const urgentAlerts = alerts.filter(a => a.severity === 'high')
  const otherAlerts = alerts.filter(a => a.severity !== 'high')
  const urgentCount = urgentAlerts.length

  return (
    <Card className={cn('py-0 gap-0', className)}>
      {/* Header */}
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Bell className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Alerts & Reminders</h3>
          </div>
          {urgentCount > 0 && (
            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {urgentCount} Urgent
            </span>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0">
        {/* Urgent Items */}
        {urgentAlerts.length > 0 && (
          <div className="px-5 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Urgent Items
            </p>
            <div className="space-y-2">
              {urgentAlerts.map((alert) => {
                const Icon = ALERT_ICONS[alert.type]
                const styles = SEVERITY_STYLES[alert.severity]

                return (
                  <Link
                    key={alert.id}
                    href={alert.link}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      'hover:shadow-sm',
                      styles.bg,
                      styles.border
                    )}
                  >
                    <div className={cn('p-2 rounded-lg', styles.iconBg)}>
                      <Icon className={cn('w-4 h-4', styles.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {alert.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Other Reminders */}
        {otherAlerts.length > 0 && (
          <div className="px-5 py-4">
            {urgentAlerts.length > 0 && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Upcoming Reminders
              </p>
            )}
            <div className="space-y-2">
              {otherAlerts.map((alert) => {
                const Icon = ALERT_ICONS[alert.type]
                const styles = SEVERITY_STYLES[alert.severity]

                return (
                  <Link
                    key={alert.id}
                    href={alert.link}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className={cn('p-2 rounded-lg', styles.iconBg)}>
                      <Icon className={cn('w-4 h-4', styles.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {alert.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AlertsSectionSkeleton() {
  return (
    <Card className="py-0 gap-0">
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-5 w-36 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
            <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
