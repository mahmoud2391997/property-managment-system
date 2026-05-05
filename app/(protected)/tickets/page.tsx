export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import TicketsSection from '@/components/tickets-section'
import TablePageSkeleton from '@/components/loading-ui/table-page-skeleton'
import { Ticket } from '@/types'
import { requirePermission } from '@/lib/server-permissions'

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

  const transformed = {
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

  console.log('🎫 Transformed ticket:', {
    reference_id: ticket.reference_id,
    title: ticket.title,
    tenantName,
    property,
    status
  })

  return transformed
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
    console.log('🎫 User metadata:', { userId: user.id, userMetaType, allMeta: JSON.stringify(user.user_metadata) })
    
    let organizationId: string | null = null
    let tenantId: string | null = null
    let userType: 'staff' | 'tenant' = 'staff'

    // Try to determine if user is tenant by checking both metadata and database
    // First try metadata, then fall back to database lookup
    const isTenantFromMeta = userMetaType === 'tenant'
    
    // Check if user exists as tenant in database
    const tenantCheck = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })
    
    const isTenantInDb = !!tenantCheck
    console.log('🎫 User type detection:', { isTenantFromMeta, isTenantInDb })

    // Get organization based on user type
    if (isTenantFromMeta || isTenantInDb) {
      console.log('🎫 User is tenant, fetching tenant data...')
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

      console.log('🎫 Tenant lookup result:', { found: !!tenant, tenantId: tenant?.id })

      if (!tenant) {
        return { data: [], total: 0, userType: 'tenant' }
      }

      organizationId = tenant.organizations_tenants[0]?.organization_id || null
      tenantId = tenant.id
      userType = 'tenant'

      // Fallback: if no organizations_tenants entry, get org from tenant's leases
      if (!organizationId) {
        const tenantLease = await prisma.leases.findFirst({
          where: { tenant_id: tenant.id },
          select: { organization_id: true },
          orderBy: { created_at: 'desc' }
        })
        if (tenantLease) {
          organizationId = tenantLease.organization_id
        }
      }
    } else {
      console.log('🎫 User is staff')
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
        is: {
          tenant_id: tenantId
        }
      }
    }

    console.log('🎫 Fetching tickets:', {
      userType,
      tenantId,
      organizationId,
      whereClause: JSON.stringify(whereClause, null, 2)
    })

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

    console.log('🎫 Tickets result:', { count: tickets.length, total })

    return {
      data: tickets.map(transformTicket),
      total,
      userType
    }
  } catch (error) {
    console.error('❌ Error fetching tickets:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return { data: [], total: 0, userType: 'staff' }
  }
}

const Tickets = async () => {
  console.log('🎫 Tickets page rendering...')
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userType = user?.user_metadata?.user_type

  console.log('🎫 User info:', { userId: user?.id, userType })

  if (userType !== 'tenant') {
    await requirePermission('tickets.access')
  }

  const {
    data: initialData,
    total: initialTotal,
    userType: resolvedUserType
  } = await getTickets()
  
  console.log('🎫 Tickets page loaded with data:', { count: initialData.length, total: initialTotal })
  
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
          userType={resolvedUserType}
        />
      </div>
    </Suspense>
  )
}

export default Tickets
