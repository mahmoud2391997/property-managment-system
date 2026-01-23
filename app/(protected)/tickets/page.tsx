export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import TicketsSection from '@/components/tickets-section'
import TablePageSkeleton from '@/components/loading-ui/table-page-skeleton'
import { Ticket } from '@/types'

const PAGE_SIZE = 10

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
function transformTicket(ticket: any): Ticket {
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
  } as Ticket
}

async function getTickets(): Promise<{
  data: Ticket[]
  total: number
  userType: 'staff' | 'tenant'
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], total: 0, userType: 'staff' }
    }

    const userMetaType = user.user_metadata?.user_type
    let organizationId: string | null = null
    let tenantId: string | null = null
    let userType: 'staff' | 'tenant' = 'staff'

    // Get organization based on user type
    if (userMetaType === 'tenant') {
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
        return { data: [], total: 0, userType: 'staff' }
      }

      organizationId = tenant.organizations_tenants[0]?.organization_id || null
      tenantId = tenant.id
      userType = 'tenant'
    } else {
      const staff = await prisma.staff.findUnique({
        where: { id: user.id },
        select: { organization_id: true }
      })

      if (!staff) {
        return { data: [], total: 0, userType: 'staff' }
      }

      organizationId = staff.organization_id
      userType = 'staff'
    }

    if (!organizationId) {
      return { data: [], total: 0, userType }
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

    // Fetch first page of tickets and total count in parallel
    const [tickets, total] = await Promise.all([
      prisma.tickets.findMany({
        where: whereClause,
        include: ticketInclude,
        orderBy: { created_at: 'desc' },
        take: PAGE_SIZE
      }),
      prisma.tickets.count({ where: whereClause })
    ])

    return {
      data: tickets.map(transformTicket),
      total,
      userType
    }
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return { data: [], total: 0, userType: 'staff' }
  }
}

const Tickets = async () => {
  const {
    data: initialData,
    total: initialTotal,
    userType
  } = await getTickets()

  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <div className={cn('flex flex-col gap-2.5', 'h-full')}>
        {/* Heading */}
        <div>
          <h1>Tickets</h1>
        </div>
        <TicketsSection
          initialData={initialData}
          initialTotal={initialTotal}
          userType={userType}
        />
      </div>
    </Suspense>
  )
}

export default Tickets
