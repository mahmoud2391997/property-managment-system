'use client'

import React from 'react'
import Link from 'next/link'
import {
  Building2,
  ArrowLeft,
  MapPin,
  Home,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter
} from 'lucide-react'
import { dummyProperties } from '@/lib/dummy-data'

export default function DemoPropertiesPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Occupied':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'Vacant':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'Pending_Inspection':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'Under_Preparation':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Occupied':
        return <CheckCircle className="w-4 h-4" />
      case 'Vacant':
        return <Home className="w-4 h-4" />
      case 'Pending_Inspection':
        return <Clock className="w-4 h-4" />
      case 'Under_Preparation':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

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
                Properties
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Manage your property portfolio
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Total Properties</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {dummyProperties.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Occupied</p>
            <p className="text-2xl font-bold text-green-600">
              {dummyProperties.filter(p => p.status === 'Occupied').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Vacant</p>
            <p className="text-2xl font-bold text-blue-600">
              {dummyProperties.filter(p => p.status === 'Vacant').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">Maintenance</p>
            <p className="text-2xl font-bold text-orange-600">
              {dummyProperties.filter(p => p.status === 'Pending_Inspection' || p.status === 'Under_Preparation').length}
            </p>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {property.code}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {property.type}
                    </p>
                  </div>
                </div>
                <span
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}
                >
                  {getStatusIcon(property.status)}
                  {property.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{property.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Home className="w-4 h-4" />
                  <span>{property.project}</span>
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

        {/* Add Property Button */}
        <div className="mt-8 flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
            <Building2 className="w-5 h-5" />
            Add New Property
          </button>
        </div>
      </div>
    </div>
  )
}
