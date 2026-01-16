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
  payment_evidence: true,
  leases: {
    select: {
      id: true,
      reference_id: true,
      property_id: true,
      room_id: true,
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

export async function GET (request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    // Check if user is tenant
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!staff && !tenant) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)

    // Pagination and search params
    const paginate = searchParams.get('paginate') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')?.trim() || ''
    const skipCount = searchParams.get('skipCount') === 'true'
    const statusFilter = searchParams.get('status')?.trim() || ''

    // If paginate mode is enabled, use pagination/search logic
    if (paginate) {
      // Build where clause with search and filters
      // Note: leases is optional (payments can be for bookings instead)
      // Using 'is' wrapper for optional relation filtering
      const whereClause: any = staff
        ? {
            organization_id: staff.organization_id,
            ...(search && {
              OR: [
                { reference_id: { contains: search, mode: 'insensitive' } },
                {
                  leases: {
                    is: {
                      properties: {
                        code: { contains: search, mode: 'insensitive' }
                      }
                    }
                  }
                },
                {
                  leases: {
                    is: {
                      tenants: {
                        individual_tenants: {
                          first_name: { contains: search, mode: 'insensitive' }
                        }
                      }
                    }
                  }
                },
                {
                  leases: {
                    is: {
                      tenants: {
                        individual_tenants: {
                          last_name: { contains: search, mode: 'insensitive' }
                        }
                      }
                    }
                  }
                },
                {
                  leases: {
                    is: {
                      tenants: {
                        company_tenants: {
                          company_name: {
                            contains: search,
                            mode: 'insensitive'
                          }
                        }
                      }
                    }
                  }
                }
              ]
            }),
            // Filter by DB status (Paid, Pending, Cancelled) if provided and not 'all'
            AND: [
              { status: { not: 'Unset' } },
              ...(statusFilter &&
              statusFilter !== 'all' &&
              ['Paid', 'Pending', 'Cancelled'].includes(statusFilter)
                ? [{ status: statusFilter }]
                : [])
            ]
          }
        : {
            leases: { tenant_id: tenant!.id },
            ...(search && {
              OR: [
                { reference_id: { contains: search, mode: 'insensitive' } },
                {
                  leases: {
                    properties: {
                      code: { contains: search, mode: 'insensitive' }
                    }
                  }
                },
                {
                  leases: {
                    rooms: { title: { contains: search, mode: 'insensitive' } }
                  }
                }
              ]
            }),
            // Filter by DB status (Paid, Pending, Cancelled) if provided and not 'all'
            AND: [
              { status: { not: 'Unset' } },
              ...(statusFilter &&
              statusFilter !== 'all' &&
              ['Paid', 'Pending', 'Cancelled'].includes(statusFilter)
                ? [{ status: statusFilter }]
                : [])
            ]
          }

      // Fetch payments - for calculated statuses (Paid Late, Partially Paid, Overdue),
      // we need to fetch more data and filter on frontend after transformation
      const needsFrontendFiltering =
        statusFilter &&
        !['Paid', 'Pending', 'Cancelled', 'all'].includes(statusFilter)

      // If we need frontend filtering, fetch all matching records (without pagination)
      // Then apply pagination after filtering
      const [payments, total] = await Promise.all([
        prisma.payments.findMany({
          where: whereClause,
          select: paymentSelect,
          orderBy: { created_at: 'desc' },
          ...(needsFrontendFiltering
            ? {}
            : {
                skip: (page - 1) * limit,
                take: limit
              })
        }),
        skipCount
          ? Promise.resolve(-1)
          : prisma.payments.count({ where: whereClause })
      ])

      // Transform payments for display
      let transformedPayments = payments.map(transformPayment)

      // Apply frontend filtering for calculated statuses
      if (needsFrontendFiltering) {
        transformedPayments = transformedPayments.filter(
          payment => payment.status === statusFilter
        )

        // Apply pagination after filtering
        const startIndex = (page - 1) * limit
        const paginatedPayments = transformedPayments.slice(
          startIndex,
          startIndex + limit
        )

        return NextResponse.json({
          success: true,
          data: paginatedPayments,
          total: transformedPayments.length,
          page,
          pageSize: limit
        })
      }

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
    const whereClause: any = staff
      ? { organization_id: staff.organization_id, status: { not: 'Unset' } }
      : { leases: { tenant_id: tenant!.id }, status: { not: 'Unset' } }

    // If propertyId provided, filter payments through leases -> property_id
    // Also filter room_id: null to only get property-level lease payments (not room payments)
    if (propertyId) {
      whereClause.leases = {
        ...whereClause.leases,
        property_id: propertyId,
        room_id: null
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
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
