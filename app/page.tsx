'use client';

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Page() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-white px-6'>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='w-full max-w-2xl'
      >
        <Card className='rounded-2xl shadow-lg border bg-white'>
          <CardHeader className='text-center space-y-4 py-10'>
            <div className='mx-auto w-16 h-16 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-md'>
              <Building2 size={32} />
            </div>

            <CardTitle className='text-3xl font-semibold text-gray-900'>
              Welcome to EzyFusion
            </CardTitle>

            <CardDescription className='text-gray-600 text-base max-w-md mx-auto'>
              A modern and streamlined property management platform for staff and tenants.
            </CardDescription>
          </CardHeader>

          <CardContent className='px-10 pb-10'>
            <div className='grid gap-4 mt-4'>
              <Button asChild className='w-full h-12 text-base font-medium rounded-lg'>
                <Link href='/login/staff'>Login as Staff</Link>
              </Button>

              <Button asChild variant='outline' className='w-full h-12 text-base font-medium rounded-lg'>
                <Link href='/login'>Login as Tenant</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}