'use client'

import React from 'react'
import Link from 'next/link'
import {
  Users,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  User,
  Filter
} from 'lucide-react'
import { dummyTenants } from '@/lib/dummy-data'

export default function Tenants() {
  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case 'Activated':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'Pending Activation':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getRentalStatusColor = (status: string) => {
    switch (status) {
      case 'Renting':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'Booking':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'Pending Refund':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'Not Renting':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Tenants
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage tenant information and rental status
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
            <p className="text-sm text-slate-600 dark:text-slate-300">Total Tenants</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {dummyTenants.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Active Renters</p>
            <p className="text-2xl font-bold text-blue-600">
              {dummyTenants.filter(t => t.rental_status === 'Renting').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Bookings</p>
            <p className="text-2xl font-bold text-purple-600">
              {dummyTenants.filter(t => t.rental_status === 'Booking').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Pending Activation</p>
            <p className="text-2xl font-bold text-yellow-600">
              {dummyTenants.filter(t => t.account_status === 'Pending Activation').length}
            </p>
          </div>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  {tenant.tenant_picture ? (
                    <img
                      src={tenant.tenant_picture}
                      alt={tenant.tenant_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {tenant.tenant_name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${getAccountStatusColor(tenant.account_status)}`}
                    >
                      {tenant.account_status}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRentalStatusColor(tenant.rental_status)}`}
                    >
                      {tenant.rental_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{tenant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Phone className="w-4 h-4" />
                  <span>{tenant.phone_no}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4" />
                  <span className="truncate">{tenant.identity_no}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button className="w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Tenant Button */}
        <div className="mt-8 flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
            <Users className="w-5 h-5" />
            Add New Tenant
          </button>
        </div>
      </div>
    </div>
  )
}
