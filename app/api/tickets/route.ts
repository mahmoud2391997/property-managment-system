'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userType = user.user_metadata?.user_type

    let organizationId: string | null = null
    let tenantId: string | null = null

    // Get organization based on user type
    if (userType === 'tenant') {
      const tenant = await prisma.tenants.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          organizations_tenants: {
            select: { organization_id: true },
            take: 1
          }
        }
      })

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }

      organizationId = tenant.organizations_tenants[0]?.organization_id || null
      tenantId = tenant.id
    } else {
      const staff = await prisma.staff.findUnique({
        where: { id: user.id },
        select: { organization_id: true }
      })

      if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
      }

      organizationId = staff.organization_id
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with any organization' },
        { status: 400 }
      )
    }

    // Build where clause
    const whereClause: any = {
      organization_id: organizationId
    }

    // If tenant, only show tickets from their leases
    if (userType === 'tenant' && tenantId) {
      whereClause.leases = {
        tenant_id: tenantId
      }
    }

    // Fetch tickets with related data
    const tickets = await prisma.tickets.findMany({
      where: whereClause,
      include: {
        leases: {
          include: {
            tenants: {
              include: {
                individual_tenants: true,
                company_tenants: true
              }
            },
            properties: {
              select: { id: true, code: true, street_address: true }
            },
            rooms: {
              select: { id: true, title: true }
            }
          }
        },
        ticket_types: {
          orderBy: { created_at: 'desc' },
          take: 1
        },
        ticket_statuses: {
          orderBy: { created_at: 'desc' },
          take: 1
        },
        ticket_assignments: {
          where: {
            status: 'Accepted'
          },
          orderBy: { requested_at: 'desc' },
          take: 1,
          include: {
            staff_ticket_assignments_assigned_idTostaff: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform data to match Ticket type
    const transformedTickets = tickets.map(ticket => {
      // Get tenant from lease
      const tenant = ticket.leases?.tenants
      const tenantName = tenant?.individual_tenants
        ? `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
        : tenant?.company_tenants?.company_name || 'Unknown'

      // Get property and room from lease
      const property = ticket.leases?.properties?.code || 'N/A'
      const room = ticket.leases?.rooms?.title || 'Whole unit'

      // Get latest type
      const type = ticket.ticket_types[0]?.type || 'Other'

      // Get latest status and map to display format
      const rawStatus = ticket.ticket_statuses[0]?.state || 'Open'
      const statusMap: Record<string, string> = {
        Open: 'Open',
        In_Progress: 'In Progress',
        Pending_Tenant: 'Pending Tenant Confirmation',
        Resolved: 'Resolved',
        Closed: 'Closed'
      }
      const status = statusMap[rawStatus] || rawStatus

      // Get assigned staff
      const assignment = ticket.ticket_assignments[0]
      const assignedStaff = assignment?.staff_ticket_assignments_assigned_idTostaff
      const staffName = assignedStaff
        ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
        : undefined

      return {
        id: ticket.reference_id,
        ticket_id: ticket.id,
        type,
        title: ticket.title,
        description: ticket.description,
        property,
        room,
        tenant_name: tenantName,
        tenant_picture: tenant?.profile_pic || '',
        issue_timestamp: ticket.created_at.toISOString(),
        staff_name: staffName,
        staff_picture: assignedStaff?.profile_pic || '',
        assignment_timestamp: assignment?.responded_at?.toISOString() || '',
        status
      }
    })

    return NextResponse.json(transformedTickets)
  } catch (error: any) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}
