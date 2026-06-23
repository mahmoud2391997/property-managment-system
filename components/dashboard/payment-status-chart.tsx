'use client'

import { cn } from '@/lib/utils'
import { PaymentStatusDistribution } from '@/lib/dashboard-data'
import { DollarSign, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'

interface PaymentStatusChartProps {
  data: PaymentStatusDistribution[]
  className?: string
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  Paid: { color: '#10b981', bg: 'bg-emerald-500', icon: CheckCircle2 },
  Partial: { color: '#3b82f6', bg: 'bg-blue-500', icon: Clock },
  Pending: { color: '#f59e0b', bg: 'bg-amber-500', icon: Clock },
  Unpaid: { color: '#ef4444', bg: 'bg-red-500', icon: XCircle },
  Overdue: { color: '#dc2626', bg: 'bg-red-600', icon: AlertTriangle },
}

export function PaymentStatusChart({ data, className }: PaymentStatusChartProps) {
  const totalPayments = data.reduce((sum, item) => sum + item.count, 0)
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)
  const paidData = data.find(item => item.status === 'Paid')
  const collectionRate = totalAmount > 0 && paidData
    ? ((paidData.amount / totalAmount) * 100).toFixed(0)
    : '0'

  return (
    <Card className={cn('py-0 gap-0', className)}>
      {/* Header */}
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Payment Status</h3>
        </div>
        <p className="text-sm text-gray-500">{totalPayments} payments this month</p>
      </CardHeader>

      {/* Collection Rate & Status List */}
      <CardContent className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Collection Rate</span>
          <span className="text-lg font-bold text-gray-900">{collectionRate}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex mb-4">
          {data.map((item) => {
            const percentage = totalPayments > 0 ? (item.count / totalPayments) * 100 : 0
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

        {/* Status List */}
        <div className="space-y-3">
          {data.map((item) => {
            const config = STATUS_CONFIG[item.status]
            const percentage = totalPayments > 0 ? ((item.count / totalPayments) * 100).toFixed(0) : '0'

            return (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config?.color || '#9ca3af' }}
                  />
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{item.count}</span>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">{percentage}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <div className="flex items-center justify-between text-sm w-full">
          <span className="text-gray-500">Total Amount</span>
          <span className="font-semibold text-gray-900">
            RM {totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}

export function PaymentStatusChartSkeleton() {
  return (
    <Card className="py-0 gap-0">
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="flex justify-between mb-2">
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="h-5 w-12 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-3 bg-gray-100 rounded-full animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
