'use client';

import React from 'react'
import { motion } from 'framer-motion'
import { Building2, Users, FileText, Bell } from 'lucide-react'

export default function Page() {
  const features = [
    { icon: Building2, label: 'Property Management' },
    { icon: Users, label: 'Tenant Portal' },
    { icon: FileText, label: 'Digital Contracts' },
    { icon: Bell, label: 'Smart Notifications' },
  ]

  return (
    <div
      className='min-h-screen flex flex-col items-center justify-center px-6 py-16'
      style={{ backgroundColor: 'var(--background-primary)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='text-center max-w-xl'
      >
        {/* Brand name */}
        <h1
          className='text-4xl md:text-5xl font-bold mb-3'
          style={{ color: 'var(--primary-color)' }}
        >
          TenancyPilot
        </h1>

        {/* Tagline */}
        <p
          className='text-lg mb-10'
          style={{ color: 'var(--text-secondary)' }}
        >
          Property Management Platform
        </p>

        {/* Coming Soon badge */}
        <div
          className='inline-block px-6 py-2.5 rounded-full mb-8'
          style={{
            backgroundColor: 'var(--secondary-color)',
            color: 'white'
          }}
        >
          <span className='text-sm font-semibold tracking-wide'>COMING SOON</span>
        </div>

        {/* Description */}
        <p
          className='text-base leading-relaxed mb-12'
          style={{ color: 'var(--text-secondary)' }}
        >
          We&apos;re building a modern platform that streamlines property management
          for landlords/property managers and tenants. Simplify operations, enhance communication, and
          manage everything in one place.
        </p>

        {/* Features preview */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-12'>
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              className='flex flex-col items-center gap-3 p-4 rounded-xl'
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <feature.icon
                size={24}
                style={{ color: 'var(--secondary-color)' }}
              />
              <span
                className='text-xs font-medium'
                style={{ color: 'var(--text-secondary)' }}
              >
                {feature.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Decorative line */}
        <div
          className='w-16 h-1 mx-auto rounded-full mb-8'
          style={{ backgroundColor: 'var(--secondary-color)', opacity: 0.5 }}
        />

        {/* Status message */}
        <p
          className='text-sm mb-2'
          style={{ color: 'var(--text-muted)' }}
        >
          We&apos;re putting the finishing touches on our platform.
        </p>
        <p
          className='text-sm font-medium'
          style={{ color: 'var(--secondary-color)' }}
        >
          Stay tuned — launching soon.
        </p>
      </motion.div>

      {/* Footer */}
      <div className='mt-auto pt-16'>
        <p
          className='text-xs'
          style={{ color: 'var(--text-muted)' }}
        >
          © {new Date().getFullYear()} EzyFusion. All rights reserved.
        </p>
      </div>
    </div>
  )
}
