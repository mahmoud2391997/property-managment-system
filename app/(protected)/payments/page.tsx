'use client'

import React from 'react'
import Link from 'next/link'
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Filter
} from 'lucide-react'
import { dummyPayments } from '@/lib/dummy-data'

export default function Payments() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'Paid Late':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'Pending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'Overdue':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="w-4 h-4" />
      case 'Paid Late':
        return <Clock className="w-4 h-4" />
      case 'Pending':
        return <Clock className="w-4 h-4" />
      case 'Overdue':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const totalRevenue = dummyPayments
    .filter(p => p.status === 'Paid' || p.status === 'Paid Late')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const pendingAmount = dummyPayments
    .filter(p => p.status === 'Pending' || p.status === 'Overdue')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Payments
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Track rent and other payments
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              RM{totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              RM{pendingAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Paid This Month</p>
            <p className="text-2xl font-bold text-blue-600">
              {dummyPayments.filter(p => p.status === 'Paid' || p.status === 'Paid Late').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Overdue</p>
            <p className="text-2xl font-bold text-red-600">
              {dummyPayments.filter(p => p.status === 'Overdue').length}
            </p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Tenant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Property
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {dummyPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: payment.tenant_color }}
                        >
                          {payment.tenant_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {payment.tenant_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {payment.property}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {payment.room}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {payment.type}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {payment.recurring_pattern_description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        RM{payment.amount.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Calendar className="w-4 h-4" />
                        {payment.due_date ? new Date(payment.due_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}
                      >
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Payment Button */}
        <div className="mt-8 flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
            <DollarSign className="w-5 h-5" />
            Record Payment
          </button>
        </div>
      </div>
    </div>
  )
}
