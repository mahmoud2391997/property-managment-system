'use client'

import { cn } from '@/lib/utils'
import { ExpiringLease } from '@/lib/dashboard-data'
import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface ExpiringLeasesProps {
  leases: ExpiringLease[]
  className?: string
}

function getUrgencyConfig(days: number) {
  if (days <= 7) {
    return {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      avatarBg: 'bg-red-500'
    }
  }
  if (days <= 14) {
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      avatarBg: 'bg-amber-500'
    }
  }
  return {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    avatarBg: 'bg-blue-500'
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ExpiringLeases({ leases, className }: ExpiringLeasesProps) {
  return (
    <Card className={cn('py-0 gap-0 flex flex-col', className)}>
      {/* Header */}
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Expiring Leases</h3>
              <p className="text-sm text-gray-500">Leases expiring in the next 30 days</p>
            </div>
          </div>
          <Link
            href="/rentals"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 overflow-auto p-0">
        {leases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 bg-gray-100 rounded-full mb-3">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No expiring leases</p>
            <p className="text-xs text-gray-400 mt-1">All leases are in good standing</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {leases.map((lease) => {
              const config = getUrgencyConfig(lease.daysUntilExpiry)
              return (
                <Link
                  key={lease.id}
                  href={`/rentals/${lease.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0',
                    config.avatarBg
                  )}>
                    {getInitials(lease.tenantName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {lease.tenantName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {lease.propertyCode}
                      {lease.roomTitle && ` · ${lease.roomTitle}`}
                    </p>
                  </div>

                  {/* Days Badge & Amount */}
                  <div className="text-right shrink-0">
                    <span className={cn(
                      'inline-block px-2.5 py-1 text-xs font-bold rounded-full mb-1',
                      config.bg, config.text
                    )}>
                      {lease.daysUntilExpiry} days
                    </span>
                    <p className="text-sm font-semibold text-gray-900">
                      RM {lease.monthlyRent.toLocaleString('en-MY', { minimumFractionDigits: 0 })}/mo
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ExpiringLeasesSkeleton() {
  return (
    <Card className="py-0 gap-0 flex flex-col">
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
            <div>
              <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-1" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="text-right">
                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse mb-1" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
