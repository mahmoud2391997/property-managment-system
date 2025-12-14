'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { transformPayment } from '@/lib/payments-utils'

// Shared select for payment queries
const paymentSelect = {
  reference_id: true,
  type: true,
  status: true,
  due_payment_timestamp: true,
  created_at: true,
  leases: {
    select: {
      properties: {
        select: {
          code: true,
          projects: {
            select: {
              title: true
            }
          }
        }
      },
      rooms: {
        select: {
          title: true
        }
      },
      tenants: {
        select: {
          id: true,
          type: true,
          profile_pic: true,
          individual_tenants: {
            select: {
              first_name: true,
              last_name: true
            }
          },
          company_tenants: {
            select: {
              company_name: true
            }
          }
        }
      }
    }
  },
  charges: {
    select: {
      amount: true,
      is_taxed: true
    }
  },
  payment_history: {
    orderBy: {
      paid_at: 'desc' as const
    },
    select: {
      paid_at: true,
      amount: true,
      status: true
    }
  },
  recurring_configs: {
    select: {
      every: true,
      time_unit: true,
      event_on: true
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current staff organization
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)

    // Pagination and search params
    const paginate = searchParams.get('paginate') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')?.trim() || ''
    const skipCount = searchParams.get('skipCount') === 'true'

    // If paginate mode is enabled, use pagination/search logic
    if (paginate) {
      // Build where clause with search
      // Note: leases is optional (payments can be for bookings instead)
      // Using 'is' wrapper for optional relation filtering
      const whereClause: any = {
        organization_id: staff.organization_id,
        ...(search && {
          OR: [
            { reference_id: { contains: search, mode: 'insensitive' } },
            { leases: { is: { properties: { code: { contains: search, mode: 'insensitive' } } } } },
            { leases: { is: { tenants: { individual_tenants: { first_name: { contains: search, mode: 'insensitive' } } } } } },
            { leases: { is: { tenants: { individual_tenants: { last_name: { contains: search, mode: 'insensitive' } } } } } },
            { leases: { is: { tenants: { company_tenants: { company_name: { contains: search, mode: 'insensitive' } } } } } }
          ]
        })
      }

      // Fetch payments and optionally total count in parallel
      const [payments, total] = await Promise.all([
        prisma.payments.findMany({
          where: whereClause,
          select: paymentSelect,
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        skipCount ? Promise.resolve(-1) : prisma.payments.count({ where: whereClause })
      ])

      // Transform payments for display
      const transformedPayments = payments.map(transformPayment)

      return NextResponse.json({
        success: true,
        data: transformedPayments,
        total,
        page,
        pageSize: limit
      })
    }

    // Legacy mode: Get optional propertyId and roomId filters
    const propertyId = searchParams.get('propertyId')
    const roomId = searchParams.get('roomId')

    // Build where clause - filter by property/room through leases relation
    const whereClause: any = {
      organization_id: staff.organization_id
    }

    // If propertyId provided, filter payments through leases -> property_id
    if (propertyId) {
      whereClause.leases = {
        property_id: propertyId
      }
    }

    // If roomId provided, filter payments through leases -> room_id
    if (roomId) {
      whereClause.leases = {
        ...whereClause.leases,
        room_id: roomId
      }
    }

    // Fetch payments with related data
    const payments = await prisma.payments.findMany({
      where: whereClause,
      select: paymentSelect,
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform payments for display
    const transformedPayments = payments.map(transformPayment)

    return NextResponse.json(transformedPayments)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
