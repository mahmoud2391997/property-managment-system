'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

// Shared include for ticket queries
const ticketInclude = {
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
    orderBy: { created_at: 'desc' as const },
    take: 1
  },
  ticket_statuses: {
    orderBy: { created_at: 'desc' as const },
    take: 1
  },
  ticket_assignments: {
    where: {
      status: 'Accepted' as const
    },
    orderBy: { requested_at: 'desc' as const },
    take: 1,
    include: {
      staff_ticket_assignments_assigned_idTostaff: true,
      staff_ticket_assignments_assigner_idTostaff: true
    }
  }
}

// Status mapping from DB enum to display format
const statusMap: Record<string, string> = {
  Open: 'Open',
  In_Progress: 'In Progress',
  Pending_Tenant: 'Pending Tenant Confirmation',
  Resolved: 'Resolved',
  Closed: 'Closed'
}

// Transform ticket to API response format
function transformTicket(ticket: any) {
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
  const status = statusMap[rawStatus] || rawStatus

  // Get assigned staff (assigned_to)
  const assignment = ticket.ticket_assignments[0]
  const assignedStaff = assignment?.staff_ticket_assignments_assigned_idTostaff
  const staffName = assignedStaff
    ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
    : undefined

  // Get assigner staff (assigned_by)
  const assignerStaff = assignment?.staff_ticket_assignments_assigner_idTostaff
  const assignerName = assignerStaff
    ? `${assignerStaff.first_name} ${assignerStaff.last_name || ''}`.trim()
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
    assigner_name: assignerName,
    assignment_timestamp: assignment?.responded_at?.toISOString() || '',
    status
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)

    // Pagination and search params
    const paginate = searchParams.get('paginate') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')?.trim() || ''

    // Filter params
    const statusFilter = searchParams.get('status')?.trim() || ''
    const ticketIdFilter = searchParams.get('ticket_id')?.trim() || ''
    const typeFilter = searchParams.get('type')?.trim() || ''
    const propertyFilter = searchParams.get('property')?.trim() || ''
    const tenantNameFilter = searchParams.get('tenant_name')?.trim() || ''
    const assignedToFilter = searchParams.get('assigned_to')?.trim() || ''
    const assignedByFilter = searchParams.get('assigned_by')?.trim() || ''

    // Build base where clause
    const whereClause: any = {
      organization_id: organizationId
    }

    // If tenant, only show tickets from their leases
    if (userType === 'tenant' && tenantId) {
      whereClause.leases = {
        tenant_id: tenantId
      }
    }

    // Add DB-level search filter
    if (search) {
      whereClause.OR = [
        { reference_id: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add DB-level ticket_id filter
    if (ticketIdFilter) {
      whereClause.reference_id = { contains: ticketIdFilter, mode: 'insensitive' }
    }

    // Add DB-level property filter (via lease)
    if (propertyFilter) {
      whereClause.leases = {
        ...whereClause.leases,
        properties: {
          code: { contains: propertyFilter, mode: 'insensitive' }
        }
      }
    }

    // Add DB-level tenant name filter (via lease)
    if (tenantNameFilter) {
      whereClause.leases = {
        ...whereClause.leases,
        tenants: {
          OR: [
            { individual_tenants: { first_name: { contains: tenantNameFilter, mode: 'insensitive' } } },
            { individual_tenants: { last_name: { contains: tenantNameFilter, mode: 'insensitive' } } },
            { company_tenants: { company_name: { contains: tenantNameFilter, mode: 'insensitive' } } }
          ]
        }
      }
    }

    // Fetch tickets - type, status, assigned_to, assigned_by need frontend filtering
    // because they're derived from related tables (latest record)
    const needsFrontendFiltering = statusFilter && statusFilter !== 'all' ||
      typeFilter ||
      assignedToFilter ||
      assignedByFilter

    const tickets = await prisma.tickets.findMany({
      where: whereClause,
      include: ticketInclude,
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform tickets
    let transformedTickets = tickets.map(transformTicket)

    // Apply frontend filtering for derived fields
    if (needsFrontendFiltering) {
      // Filter by status (derived from latest ticket_statuses)
      if (statusFilter && statusFilter !== 'all') {
        transformedTickets = transformedTickets.filter(
          ticket => ticket.status === statusFilter
        )
      }

      // Filter by type (derived from latest ticket_types)
      if (typeFilter) {
        transformedTickets = transformedTickets.filter(
          ticket => ticket.type === typeFilter
        )
      }

      // Filter by assigned_to (derived from latest accepted assignment)
      if (assignedToFilter) {
        transformedTickets = transformedTickets.filter(
          ticket => ticket.staff_name?.toLowerCase().includes(assignedToFilter.toLowerCase())
        )
      }

      // Filter by assigned_by (derived from latest accepted assignment)
      if (assignedByFilter) {
        transformedTickets = transformedTickets.filter(
          ticket => ticket.assigner_name?.toLowerCase().includes(assignedByFilter.toLowerCase())
        )
      }
    }

    // If pagination mode is enabled
    if (paginate) {
      const total = transformedTickets.length
      const startIndex = (page - 1) * limit
      const paginatedTickets = transformedTickets.slice(startIndex, startIndex + limit)

      return NextResponse.json({
        success: true,
        data: paginatedTickets,
        total,
        page,
        pageSize: limit
      })
    }

    // Legacy mode: return all tickets
    return NextResponse.json(transformedTickets)
  } catch (error: any) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}
