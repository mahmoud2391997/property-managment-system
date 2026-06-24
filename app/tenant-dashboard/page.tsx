'use client'

import React from 'react'
import Link from 'next/link'
import {
  Home,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TenantDashboard() {
  // Dummy tenant data
  const tenantData = {
    name: 'Ahmad bin Ali',
    email: 'ahmad@example.com',
    property: 'A-101',
    room: 'Master Bedroom',
    monthlyRent: 2500,
    leaseStartDate: '2024-01-15',
    leaseEndDate: '2025-01-14'
  }

  const recentPayments = [
    {
      id: '1',
      date: '2026-06-20',
      amount: 2500,
      status: 'Paid',
      month: 'June 2026'
    },
    {
      id: '2',
      date: '2026-05-18',
      amount: 2500,
      status: 'Paid',
      month: 'May 2026'
    },
    {
      id: '3',
      date: '2026-04-22',
      amount: 2500,
      status: 'Paid',
      month: 'April 2026'
    },
    {
      id: '4',
      date: '2026-07-20',
      amount: 2500,
      status: 'Pending',
      month: 'July 2026'
    }
  ]

  const upcomingPayments = [
    {
      date: '2026-08-20',
      amount: 2500,
      daysUntilDue: 27
    },
    {
      date: '2026-09-20',
      amount: 2500,
      daysUntilDue: 58
    }
  ]

  const maintenanceRequests = [
    {
      id: '1',
      title: 'Air conditioning repair',
      status: 'Open',
      date: '2026-06-18',
      priority: 'High'
    },
    {
      id: '2',
      title: 'Bathroom faucet leak',
      status: 'In Progress',
      date: '2026-06-10',
      priority: 'Medium'
    },
    {
      id: '3',
      title: 'Door lock replacement',
      status: 'Resolved',
      date: '2026-06-05',
      priority: 'Low'
    }
  ]

  return (
    <div className={cn('flex flex-col gap-6 p-6', 'min-h-screen bg-gray-50')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenant Portal</h1>
          <p className="text-sm text-gray-600">Welcome back, {tenantData.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Demo Mode</p>
          <p className="text-xs text-gray-400">Logged in as: {tenantData.email}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Monthly Rent</h3>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">RM{tenantData.monthlyRent.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Due on 20th of each month</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Current Lease</h3>
            <FileText className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold">Active</p>
          <p className="text-xs text-gray-500 mt-1">Expires: Jan 14, 2025</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Payment Status</h3>
            <CheckCircle className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-2xl font-bold">Current</p>
          <p className="text-xs text-gray-500 mt-1">No overdue payments</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Lease & Payment Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Property Information */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Property Information</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Property Code</span>
                <span className="font-medium">{tenantData.property}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Room Type</span>
                <span className="font-medium">{tenantData.room}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Monthly Rent</span>
                <span className="font-medium">RM{tenantData.monthlyRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Lease Period</span>
                <span className="font-medium text-sm">
                  {new Date(tenantData.leaseStartDate).toLocaleDateString()} -{' '}
                  {new Date(tenantData.leaseEndDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{payment.month}</p>
                    <p className="text-xs text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">RM{payment.amount.toLocaleString()}</p>
                    {payment.status === 'Paid' ? (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Paid
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Clock className="w-4 h-4" />
                        Pending
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Upcoming Payments */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Upcoming Payments</h2>
            <div className="space-y-3">
              {upcomingPayments.map((payment, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">RM{payment.amount.toLocaleString()}</p>
                    <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">
                      {payment.daysUntilDue} days
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Due: {new Date(payment.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Requests */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Maintenance Requests</h2>
            <div className="space-y-3">
              {maintenanceRequests.map((request) => (
                <div key={request.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm">{request.title}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        request.status === 'Open'
                          ? 'bg-yellow-100 text-yellow-700'
                          : request.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(request.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                View Full Lease Agreement
              </button>
              <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                Submit Maintenance Request
              </button>
              <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
