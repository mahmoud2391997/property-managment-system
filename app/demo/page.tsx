'use client'

import React from 'react'
import Link from 'next/link'
import { Building2, Users, DollarSign, Ticket, LayoutDashboard, ArrowRight } from 'lucide-react'

export default function DemoPage() {
  const demoSections = [
    {
      title: 'Dashboard',
      description: 'Overview of properties, tenants, payments, and tickets',
      icon: LayoutDashboard,
      href: '/demo/dashboard',
      color: 'bg-blue-500'
    },
    {
      title: 'Properties',
      description: 'View and manage all properties',
      icon: Building2,
      href: '/demo/properties',
      color: 'bg-green-500'
    },
    {
      title: 'Tenants',
      description: 'Tenant information and rental status',
      icon: Users,
      href: '/demo/tenants',
      color: 'bg-purple-500'
    },
    {
      title: 'Payments',
      description: 'Payment history and status',
      icon: DollarSign,
      href: '/demo/payments',
      color: 'bg-yellow-500'
    },
    {
      title: 'Tickets',
      description: 'Maintenance and support tickets',
      icon: Ticket,
      href: '/demo/tickets',
      color: 'bg-red-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            TenancyPilot Demo
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-2">
            Frontend Demo with Dummy Data
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No backend required - all data is simulated
          </p>
        </div>

        {/* Demo Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`${section.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <section.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {section.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                {section.description}
              </p>
              <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                Explore
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-16 bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-700 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
            About This Demo
          </h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-300">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              This is a frontend-only demo with simulated data
 </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              No database or backend connection required
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              All data is stored in dummy data files
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              Perfect for UI/UX demonstrations and testing
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-slate-500 dark:text-slate-400 text-sm">
          © {new Date().getFullYear()} EzyFusion. All rights reserved.
        </div>
      </div>
    </div>
  )
}
