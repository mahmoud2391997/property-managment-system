'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

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

    // Get optional propertyId and roomId filters
    const { searchParams } = new URL(request.url)
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
      include: {
        leases: {
          include: {
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
            paid_at: 'desc'
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
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform data to match Payment type
    const transformedPayments = payments.map(payment => {
      // Calculate total amount from charges
      const totalAmount = payment.charges.reduce((sum, charge) => {
        const amount = charge.amount
        const tax = charge.is_taxed ? amount * 0.08 : 0
        return sum + amount + tax
      }, 0)

      // Only count SUCCESS payments in total paid
      const successfulPayments = payment.payment_history.filter(
        (h: any) => h.status === 'Success'
      )
      const totalPaid = successfulPayments.reduce(
        (sum: number, history: any) => sum + history.amount,
        0
      )
      const paymentPercentage =
        totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

      // Check if there are any Pending payment_history records
      const hasPendingPayments = payment.payment_history.some(
        (h: any) => h.status === 'Pending'
      )

      // Determine status based on payment_history and due date
      let status: 'Paid' | 'Paid Late' | 'Pending' | 'Overdue' = payment.status as any

      // Get recurring pattern info
      const recurringConfig = payment.recurring_configs[0]
      const isRecurring = recurringConfig ? true : false
      let recurringDescription = ''

      if (recurringConfig) {
        const { every, time_unit, event_on } = recurringConfig
        if (time_unit === 'Week' && event_on) {
          const days = event_on.split(',').join(', ')
          recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''} on ${days}`
        } else if (time_unit === 'Month' && event_on) {
          const days = event_on.split(',').join(', ')
          recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''} on day ${days}`
        } else {
          recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''}`
        }
      }

      return {
        id: payment.reference_id,
        type: payment.type,
        property: payment.leases?.properties?.code || 'N/A',
        room: payment.leases?.rooms?.title || 'Whole unit',
        due_date: payment.due_payment_timestamp,
        recurring_pattern: isRecurring ? 'Recurring' : 'One-time',
        recurring_pattern_description: recurringDescription,
        amount: totalAmount,
        status: status,
        payment_percentage: paymentPercentage,
        has_pending_payments: hasPendingPayments,
        tenant_name: payment.leases?.tenants?.individual_tenants
          ? `${payment.leases.tenants.individual_tenants.first_name} ${payment.leases.tenants.individual_tenants.last_name || ''}`.trim()
          : payment.leases?.tenants?.company_tenants?.company_name || 'N/A',
        tenant_picture: payment.leases?.tenants?.profile_pic || '',
        tenant_color: '', // Not in database, can be generated from name
        latest_payment_timestamp:
          successfulPayments[0]?.paid_at?.toISOString() ||
          payment.created_at.toISOString()
      }
    })

    return NextResponse.json(transformedPayments)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
