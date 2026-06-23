'use client'

import React from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  DollarSign,
  Ticket,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import {
  dummyProperties,
  dummyTenants,
  dummyPayments,
  dummyTickets,
  dummyLeases
} from '@/lib/dummy-data'

export default function DemoDashboardPage() {
  // Calculate stats
  const totalProperties = dummyProperties.length
  const occupiedProperties = dummyProperties.filter(p => p.status === 'Occupied').length
  const vacantProperties = dummyProperties.filter(p => p.status === 'Vacant').length
  const totalTenants = dummyTenants.length
  const activeTenants = dummyTenants.filter(t => t.rental_status === 'Renting').length
  const totalPayments = dummyPayments.length
  const paidPayments = dummyPayments.filter(p => p.status === 'Paid' || p.status === 'Paid Late').length
  const pendingPayments = dummyPayments.filter(p => p.status === 'Pending' || p.status === 'Overdue').length
  const totalRevenue = dummyPayments
    .filter(p => p.status === 'Paid' || p.status === 'Paid Late')
    .reduce((sum, p) => sum + p.amount, 0)
  const openTickets = dummyTickets.filter(t => t.status === 'Open').length
  const inProgressTickets = dummyTickets.filter(t => t.status === 'In Progress').length

  const stats = [
    {
      title: 'Total Properties',
      value: totalProperties,
      subtitle: `${occupiedProperties} occupied, ${vacantProperties} vacant`,
      icon: Building2,
      color: 'bg-blue-500',
      trend: '+2 this month',
      trendUp: true
    },
    {
      title: 'Active Tenants',
      value: activeTenants,
      subtitle: `${totalTenants} total tenants`,
      icon: Users,
      color: 'bg-green-500',
      trend: '+3 this month',
      trendUp: true
    },
    {
      title: 'Monthly Revenue',
      value: `RM${totalRevenue.toLocaleString()}`,
      subtitle: `${paidPayments} of ${totalPayments} payments collected`,
      icon: DollarSign,
      color: 'bg-purple-500',
      trend: '+12% vs last month',
      trendUp: true
    },
    {
      title: 'Open Tickets',
      value: openTickets + inProgressTickets,
      subtitle: `${inProgressTickets} in progress`,
      icon: Ticket,
      color: 'bg-orange-500',
      trend: '-5 vs last week',
      trendUp: false
    }
  ]

  const recentPayments = dummyPayments.slice(0, 5)
  const recentTickets = dummyTickets.slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/demo"
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Overview of your property management
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Demo Mode
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center text-sm ${
                  stat.trendUp ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trendUp ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {stat.trend}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {stat.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Recent Payments
            </h2>
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: payment.tenant_color }}
                    >
                      <span className="text-white font-semibold text-sm">
                        {payment.tenant_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {payment.tenant_name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {payment.property} - {payment.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      RM{payment.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-sm">
                      {payment.status === 'Paid' && (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">Paid</span>
                        </>
                      )}
                      {payment.status === 'Paid Late' && (
                        <>
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span className="text-yellow-600">Paid Late</span>
                        </>
                      )}
                      {payment.status === 'Pending' && (
                        <>
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-600">Pending</span>
                        </>
                      )}
                      {payment.status === 'Overdue' && (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">Overdue</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/demo/payments"
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all payments →
            </Link>
          </div>

          {/* Recent Tickets */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Recent Tickets
            </h2>
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {ticket.type}
                      </span>
                      {ticket.status === 'Open' && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                          Open
                        </span>
                      )}
                      {ticket.status === 'In Progress' && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          In Progress
                        </span>
                      )}
                      {ticket.status === 'Resolved' && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-medium text-slate-900 dark:text-white mb-1">
                    {ticket.title}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                    {ticket.property} - {ticket.room}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>{ticket.tenant_name}</span>
                    <span>•</span>
                    <span>{new Date(ticket.issue_timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/demo/tickets"
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all tickets →
            </Link>
          </div>
        </div>

        {/* Property Overview */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Property Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dummyProperties.map((property) => (
              <div
                key={property.id}
                className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {property.code}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      property.status === 'Occupied'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : property.status === 'Vacant'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : property.status === 'Pending_Inspection'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    }`}
                  >
                    {property.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                  {property.address}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {property.project} • {property.type}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/demo/properties"
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all properties →
          </Link>
        </div>
      </div>
    </div>
  )
}
