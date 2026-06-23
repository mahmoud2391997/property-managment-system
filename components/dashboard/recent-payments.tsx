'use client'

import { cn } from '@/lib/utils'
import { RecentPayment } from '@/lib/dashboard-data'
import Link from 'next/link'
import { ArrowRight, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface RecentPaymentsProps {
  payments: RecentPayment[]
  className?: string
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; darkBg: string }> = {
  Paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', darkBg: 'bg-emerald-500' },
  Partial: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'bg-blue-500' },
  Pending: { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'bg-amber-500' },
  Unpaid: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'bg-red-500' },
  Overdue: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'bg-red-600' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function RecentPayments({ payments, className }: RecentPaymentsProps) {
  return (
    <Card className={cn('py-0 gap-0 flex flex-col', className)}>
      {/* Header */}
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Receipt className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Recent Payments</h3>
              <p className="text-sm text-gray-500">Latest payment activity</p>
            </div>
          </div>
          <Link
            href="/payments"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 overflow-auto p-0">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 bg-gray-100 rounded-full mb-3">
              <Receipt className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No recent payments</p>
            <p className="text-xs text-gray-400 mt-1">Payments will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map((payment) => {
              const config = STATUS_CONFIG[payment.status] || STATUS_CONFIG.Pending
              return (
                <Link
                  key={payment.id}
                  href={`/payments/${payment.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0',
                    config.darkBg
                  )}>
                    {getInitials(payment.tenantName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {payment.tenantName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {payment.propertyCode}
                      {payment.roomTitle && ` · ${payment.roomTitle}`}
                    </p>
                  </div>

                  {/* Amount & Status */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      RM {payment.amount.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
                    </p>
                    <span className={cn(
                      'inline-block px-2 py-0.5 text-xs font-semibold rounded-full',
                      config.bg, config.text
                    )}>
                      {payment.status}
                    </span>
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

export function RecentPaymentsSkeleton() {
  return (
    <Card className="py-0 gap-0 flex flex-col">
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
            <div>
              <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
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
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mb-1" />
                <div className="h-5 w-12 bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
