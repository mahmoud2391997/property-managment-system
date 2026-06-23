'use client'

import React from 'react'
import Link from 'next/link'
import {
  Ticket,
  MapPin,
  User,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { dummyTickets } from '@/lib/dummy-data'

export default function Tickets() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'Pending Tenant Confirmation':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'Resolved':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'Closed':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertTriangle className="w-4 h-4" />
      case 'In Progress':
        return <Clock className="w-4 h-4" />
      case 'Pending Tenant Confirmation':
        return <Clock className="w-4 h-4" />
      case 'Resolved':
        return <CheckCircle className="w-4 h-4" />
      case 'Closed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Maintenance':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'Complaint':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      case 'Billing':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'Aircon Top-Up':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300'
      case 'Others':
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
              Tickets
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage maintenance and support tickets
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
            <p className="text-sm text-slate-600 dark:text-slate-300">Total Tickets</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {dummyTickets.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Open</p>
            <p className="text-2xl font-bold text-yellow-600">
              {dummyTickets.filter(t => t.status === 'Open').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {dummyTickets.filter(t => t.status === 'In Progress').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Resolved</p>
            <p className="text-2xl font-bold text-green-600">
              {dummyTickets.filter(t => t.status === 'Resolved').length}
            </p>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dummyTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(ticket.type)}`}
                      >
                        {ticket.type}
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {ticket.id}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {ticket.title}
                    </h3>
                  </div>
                </div>
                <span
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}
                >
                  {getStatusIcon(ticket.status)}
                  {ticket.status}
                </span>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                {ticket.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4" />
                  <span>{ticket.property} - {ticket.room}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4" />
                  <span>{ticket.tenant_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(ticket.issue_timestamp).toLocaleDateString()}</span>
                </div>
              </div>

              {ticket.staff_name && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span>Assigned to:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {ticket.staff_name}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                <button className="w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Ticket Button */}
        <div className="mt-8 flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
            <Ticket className="w-5 h-5" />
            Create New Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
