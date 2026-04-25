'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { transformPayment } from '@/lib/payments-utils'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

// Shared select for payment queries
// Build dynamic payment select object based on permissions
const buildPaymentSelect = (hasTenantAccess: boolean) => ({
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
          // Only include detailed tenant info if user has tenant access permission
          ...(hasTenantAccess && {
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
          })
        }
      },
      late_payment_charges: {
        select: {
          days_after_due: true,
          amount: true
        },
        orderBy: {
          days_after_due: 'asc' as const
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
      status: true,
      payment_method: true,
      created_at: true
    }
  },
  recurring_configs: {
    select: {
      every: true,
      time_unit: true,
      event_on: true
    }
  },
  bookings: {
    select: {
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
          // Only include detailed tenant info if user has tenant access permission
          ...(hasTenantAccess && {
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
          })
        }
      }
    }
  }
})

export async function GET (request: NextRequest) {
  try {
    const { user, staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'payments.access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user has tenant access permission
    const hasTenantAccess = hasPermission(permissions, 'tenants.access')

    // Check if user is tenant (for tenant-specific access)
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    const { searchParams } = new URL(request.url)

    // Pagination and search params
    const paginate = searchParams.get('paginate') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')?.trim() || ''
    const skipCount = searchParams.get('skipCount') === 'true'
    const statusFilter = searchParams.get('status')?.trim() || ''

    // Advanced filter params
    const paymentIdFilter = searchParams.get('payment_id')?.trim() || ''
    const leaseIdFilter = searchParams.get('lease_id')?.trim() || ''
    const typeFilter = searchParams.get('type')?.trim() || ''
    const recurringPatternFilter = searchParams.get('recurring_pattern')?.trim() || ''
    const propertyFilter = searchParams.get('property')?.trim() || ''
    const tenantNameFilter = searchParams.get('tenant_name')?.trim() || ''

    // Property/Room context filters (for property/room overview pages)
    const propertyId = searchParams.get('propertyId')?.trim() || ''
    const roomId = searchParams.get('roomId')?.trim() || ''

    // If paginate mode is enabled, use pagination/search logic
    if (paginate) {
      // Build where clause with search and filters
      // Note: leases is optional (payments can be for bookings instead)
      // Using 'is' wrapper for optional relation filtering

      // Build AND conditions for advanced filters
      const buildAdvancedFilters = () => {
        const filters: any[] = []

        // Payment ID filter
        if (paymentIdFilter) {
          filters.push({ reference_id: { contains: paymentIdFilter, mode: 'insensitive' } })
        }

        // Lease ID filter
        if (leaseIdFilter) {
          filters.push({
            leases: {
              is: {
                reference_id: { contains: leaseIdFilter, mode: 'insensitive' }
              }
            }
          })
        }

        // Type filter
        if (typeFilter) {
          filters.push({ type: typeFilter })
        }

        // Property filter
        if (propertyFilter) {
          filters.push({
            leases: {
              is: {
                OR: [
                  { properties: { code: { contains: propertyFilter, mode: 'insensitive' } } },
                  { rooms: { title: { contains: propertyFilter, mode: 'insensitive' } } }
                ]
              }
            }
          })
        }

        // Tenant name filter
        if (tenantNameFilter) {
          filters.push({
            leases: {
              is: {
                tenants: {
                  OR: [
                    { individual_tenants: { first_name: { contains: tenantNameFilter, mode: 'insensitive' } } },
                    { individual_tenants: { last_name: { contains: tenantNameFilter, mode: 'insensitive' } } },
                    { company_tenants: { company_name: { contains: tenantNameFilter, mode: 'insensitive' } } }
                  ]
                }
              }
            }
          })
        }

        // Property ID filter (for property overview page - only property-level leases and bookings)
        if (propertyId) {
          filters.push({
            OR: [
              {
                leases: {
                  is: {
                    property_id: propertyId,
                    room_id: null
                  }
                }
              },
              {
                bookings: {
                  is: {
                    property_id: propertyId,
                    room_id: null
                  }
                }
              }
            ]
          })
        }

        // Room ID filter (for room overview page)
        if (roomId) {
          filters.push({
            OR: [
              {
                leases: {
                  is: {
                    room_id: roomId
                  }
                }
              },
              {
                bookings: {
                  is: {
                    room_id: roomId
                  }
                }
              }
            ]
          })
        }

        return filters
      }

      const advancedFilters = buildAdvancedFilters()

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
                : []),
              ...advancedFilters
            ]
          }
        : {
            leases: { tenant_id: tenant?.id },
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
                : []),
              ...advancedFilters
            ]
          }

      // Fetch payments - for calculated fields (Paid Late, Partially Paid, Overdue, recurring_pattern),
      // we need to fetch more data and filter after transformation
      const needsCalculatedStatusFilter =
        statusFilter &&
        !['Paid', 'Pending', 'Cancelled', 'all'].includes(statusFilter)

      const needsFrontendFiltering = needsCalculatedStatusFilter || recurringPatternFilter

      // Build payment select object based on permissions
      const paymentSelect = buildPaymentSelect(hasTenantAccess)

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

      // Apply frontend filtering for calculated fields
      if (needsFrontendFiltering) {
        // Filter by calculated status
        if (needsCalculatedStatusFilter) {
          transformedPayments = transformedPayments.filter(
            payment => payment.status === statusFilter
          )
        }

        // Filter by recurring pattern
        if (recurringPatternFilter) {
          transformedPayments = transformedPayments.filter(
            payment => payment.recurring_pattern === recurringPatternFilter
          )
        }

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

    // Legacy mode: propertyId and roomId already extracted above

    // Build where clause - filter by property/room through leases relation
    const whereClause: any = staff
      ? { organization_id: staff.organization_id, status: { not: 'Unset' } }
      : { leases: { tenant_id: tenant?.id }, status: { not: 'Unset' } }

    // If propertyId provided, filter payments through leases or bookings -> property_id
    // Also filter room_id: null to only get property-level payments (not room payments)
    if (propertyId) {
      whereClause.OR = [
        {
          leases: {
            property_id: propertyId,
            room_id: null
          }
        },
        {
          bookings: {
            property_id: propertyId,
            room_id: null
          }
        }
      ]
    }

    // If roomId provided, filter payments through leases or bookings -> room_id
    if (roomId) {
      whereClause.OR = [
        {
          leases: {
            room_id: roomId
          }
        },
        {
          bookings: {
            room_id: roomId
          }
        }
      ]
    }

    // Build payment select object based on permissions
    const paymentSelect = buildPaymentSelect(hasTenantAccess)

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
