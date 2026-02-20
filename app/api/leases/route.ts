import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { computeLeaseStatus } from '@/utils/lease-status'

export async function GET(request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const roomId = searchParams.get('roomId')
    const all = searchParams.get('all')

    // Fetch all active leases for the organization (lightweight)
    if (all === 'true') {
      const includeAgent = searchParams.get('includeAgent') === 'true'
      const includeTenant = searchParams.get('includeTenant') === 'true'

      const leases = await prisma.leases.findMany({
        where: {
          organization_id: staff.organization_id,
          status: 'Current',
          ...(propertyId && { property_id: propertyId }),
          ...(roomId && { room_id: roomId })
        },
        select: {
          id: true,
          reference_id: true,
          properties: { select: { code: true } },
          rooms: { select: { title: true } },
          ...(includeAgent && {
            agent_id: true,
            agents: {
              select: {
                id: true,
                first_name: true,
                last_name: true
              }
            }
          }),
          ...(includeTenant && {
            tenants: {
              select: {
                individual_tenants: {
                  select: { first_name: true, last_name: true }
                },
                company_tenants: {
                  select: { company_name: true }
                }
              }
            }
          })
        },
        orderBy: { created_at: 'desc' }
      })

      return NextResponse.json({
        leases: leases.map((l: any) => ({
          id: l.id,
          reference_id: l.reference_id,
          property: l.properties ? { code: l.properties.code } : null,
          room: l.rooms ? { title: l.rooms.title } : null,
          ...(includeAgent && {
            agent_id: l.agent_id || null,
            agent: l.agents
              ? { id: l.agents.id, name: `${l.agents.first_name} ${l.agents.last_name || ''}`.trim() }
              : null
          }),
          ...(includeTenant && {
            tenant: l.tenants?.individual_tenants
              ? `${l.tenants.individual_tenants.first_name} ${l.tenants.individual_tenants.last_name || ''}`.trim()
              : l.tenants?.company_tenants?.company_name || null
          })
        }))
      })
    }

    if (!propertyId && !roomId) {
      return NextResponse.json(
        { error: 'Property ID or Room ID is required' },
        { status: 400 }
      )
    }

    // Build where clause based on propertyId or roomId
    let whereClause: any = {}

    if (propertyId) {
      // Verify property belongs to the organization
      const property = await prisma.properties.findFirst({
        where: {
          id: propertyId,
          organization_id: staff.organization_id
        },
        select: { id: true }
      })

      if (!property) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        )
      }
      // For property leases, get leases where property_id matches AND room_id is null
      whereClause.property_id = propertyId
      whereClause.room_id = null
    }

    if (roomId) {
      // Verify room belongs to the organization through its property
      const room = await prisma.rooms.findFirst({
        where: {
          id: roomId,
          properties: {
            organization_id: staff.organization_id
          }
        },
        select: { id: true }
      })

      if (!room) {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        )
      }
      // For room leases, get leases where room_id matches
      whereClause.room_id = roomId
    }

    // Fetch leases with tenant details, scheduled changes, and pending payments
    const leases = await prisma.leases.findMany({
      where: whereClause,
      select: {
        id: true,
        reference_id: true,
        start_date: true,
        number_of_months: true,
        monthly_rent: true,
        payment_day: true,
        status: true,
        property_id: true,
        room_id: true,
        // Transfer tracking
        transferred_from: true,
        is_transferred_from: true,
        transferred_to: true,
        is_transferred_to: true,
        // Relation to the lease this was transferred from
        leases_leases_transferred_fromToleases: {
          select: {
            id: true,
            property_id: true,
            room_id: true,
            properties: {
              select: {
                code: true
              }
            },
            rooms: {
              select: {
                title: true
              }
            }
          }
        },
        // Relation to the lease this was transferred to
        leases_leases_transferred_toToleases: {
          select: {
            id: true,
            property_id: true,
            room_id: true,
            properties: {
              select: {
                code: true
              }
            },
            rooms: {
              select: {
                title: true
              }
            }
          }
        },
        tenants: {
          select: {
            id: true,
            profile_thumb: true,
            individual_tenants: {
              select: {
                first_name: true,
                last_name: true
              }
            },
            company_tenants: {
              select: {
                company_name: true,
                contact_person_first_name: true,
                contact_person_last_name: true
              }
            }
          }
        },
        properties: {
          select: {
            code: true
          }
        },
        rooms: {
          select: {
            title: true
          }
        },
        scheduled_rental_changes: {
          where: {
            status: 'Scheduled'
          },
          select: {
            id: true,
            old_monthly_rent: true,
            new_monthly_rent: true,
            effective_from: true
          },
          take: 1
        },
        payments: {
          where: {
            type: 'Rental',
            status: 'Pending'
          },
          select: {
            id: true,
            due_payment_timestamp: true,
            charges: {
              select: {
                amount: true,
                is_taxed: true
              }
            }
          },
          orderBy: {
            due_payment_timestamp: 'asc'
          },
          take: 1
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({
      leases: leases.map(lease => {
        // Get tenant name - either from individual or company tenant
        const tenant = lease.tenants
        let firstName = ''
        let lastName: string | null = null

        if (tenant.individual_tenants) {
          firstName = tenant.individual_tenants.first_name
          lastName = tenant.individual_tenants.last_name
        } else if (tenant.company_tenants) {
          firstName = tenant.company_tenants.contact_person_first_name
          lastName = tenant.company_tenants.contact_person_last_name
        }

        // Compute display status based on dates
        const displayStatus = computeLeaseStatus({
          status: lease.status,
          start_date: lease.start_date,
          number_of_months: lease.number_of_months
        })

        // Get scheduled change if any
        const scheduledChange = lease.scheduled_rental_changes[0]

        // Calculate rental amount from pending payment if available
        const pendingPayment = lease.payments[0]
        let monthlyRent = Number(lease.monthly_rent)

        if (pendingPayment) {
          monthlyRent = pendingPayment.charges.reduce((sum, charge) => {
            const chargeAmount = Number(charge.amount)
            const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
            return sum + chargeAmount + tax
          }, 0)
        }

        return {
          id: lease.id,
          reference_id: lease.reference_id,
          start_date: lease.start_date.toISOString(),
          number_of_months: lease.number_of_months,
          monthly_rent: monthlyRent,
          payment_day: lease.payment_day,
          property_id: lease.property_id,
          room_id: lease.room_id,
          status: displayStatus,
          tenant: {
            id: tenant.id,
            first_name: firstName,
            last_name: lastName,
            profile_thumb: tenant.profile_thumb
          },
          property: lease.properties ? { code: lease.properties.code } : undefined,
          room: lease.rooms ? { title: lease.rooms.title } : undefined,
          scheduled_change: scheduledChange
            ? {
                id: scheduledChange.id,
                old_rent: Number(scheduledChange.old_monthly_rent),
                new_rent: Number(scheduledChange.new_monthly_rent),
                effective_from: scheduledChange.effective_from.toISOString()
              }
            : null,
          // Transfer tracking
          transferred_from: lease.transferred_from,
          is_transferred_from: lease.is_transferred_from,
          transferred_to: lease.transferred_to,
          is_transferred_to: lease.is_transferred_to,
          transferred_from_lease: lease.leases_leases_transferred_fromToleases ? {
            id: lease.leases_leases_transferred_fromToleases.id,
            property_id: lease.leases_leases_transferred_fromToleases.property_id,
            room_id: lease.leases_leases_transferred_fromToleases.room_id,
            property_code: lease.leases_leases_transferred_fromToleases.properties?.code,
            room_title: lease.leases_leases_transferred_fromToleases.rooms?.title
          } : null,
          transferred_to_lease: lease.leases_leases_transferred_toToleases ? {
            id: lease.leases_leases_transferred_toToleases.id,
            property_id: lease.leases_leases_transferred_toToleases.property_id,
            room_id: lease.leases_leases_transferred_toToleases.room_id,
            property_code: lease.leases_leases_transferred_toToleases.properties?.code,
            room_title: lease.leases_leases_transferred_toToleases.rooms?.title
          } : null
        }
      })
    })
  } catch (error: any) {
    console.error('Error fetching leases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leases' },
      { status: 500 }
    )
  }
}
