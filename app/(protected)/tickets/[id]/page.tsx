import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import TicketDetailsContent from './ticket-details-content'

type Props = {
  params: Promise<{ id: string }>
}

async function getTicketData(ticketId: string) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const userType = user.user_metadata?.user_type

  // Fetch ticket with all related data
  const ticket = await prisma.tickets.findUnique({
    where: { id: ticketId },
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
      ticket_statuses: {
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          state: true,
          performer_type: true,
          performer_id: true,
          created_at: true
        }
      },
      ticket_types: {
        orderBy: { created_at: 'asc' },
        include: {
          staff: {
            select: { first_name: true, last_name: true, profile_pic: true }
          }
        }
      },
      ticket_assignments: {
        orderBy: { requested_at: 'asc' },
        include: {
          staff_ticket_assignments_assigned_idTostaff: true,
          staff_ticket_assignments_assigner_idTostaff: true,
          staff_ticket_assignments_unassigned_byTostaff: {
            select: { id: true, first_name: true, last_name: true, profile_pic: true }
          },
          staff_ticket_assignments_cancelled_byTostaff: {
            select: { id: true, first_name: true, last_name: true, profile_pic: true }
          }
        }
      },
      ticket_comments: {
        orderBy: { created_at: 'asc' }
      }
    }
  })

  if (!ticket) {
    return null
  }

  // Access check for tenants - can only see tickets from their own leases
  if (userType === 'tenant' && ticket.leases?.tenants?.id !== user.id) {
    return null
  }

  // Access check for staff - must be in same organization
  if (userType !== 'tenant') {
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff || staff.organization_id !== ticket.organization_id) {
      return null
    }
  }

  // Fetch performer names for status changes
  const statusPerformers: Record<string, { name: string; avatar?: string }> = {}
  for (const status of ticket.ticket_statuses) {
    if (status.performer_id && status.performer_type !== 'system') {
      // Skip if already fetched
      if (statusPerformers[status.performer_id]) continue

      if (status.performer_type === 'staff') {
        const staff = await prisma.staff.findUnique({
          where: { id: status.performer_id },
          select: { first_name: true, last_name: true, profile_pic: true }
        })
        if (staff) {
          statusPerformers[status.performer_id] = {
            name: `${staff.first_name} ${staff.last_name || ''}`.trim(),
            avatar: staff.profile_pic || undefined
          }
        }
      } else if (status.performer_type === 'tenant') {
        const tenant = await prisma.tenants.findUnique({
          where: { id: status.performer_id },
          include: { individual_tenants: true, company_tenants: true }
        })
        if (tenant) {
          statusPerformers[status.performer_id] = {
            name: tenant.individual_tenants
              ? `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
              : tenant.company_tenants?.company_name || 'Unknown',
            avatar: tenant.profile_pic || undefined
          }
        }
      }
    }
  }

  // Fetch sender names for comments
  const commentSenders: Record<string, { name: string; avatar?: string }> = {}
  for (const comment of ticket.ticket_comments) {
    // Skip if already fetched
    if (commentSenders[comment.sender_id]) continue

    if (comment.sender_type === 'staff') {
      const staff = await prisma.staff.findUnique({
        where: { id: comment.sender_id },
        select: { first_name: true, last_name: true, profile_pic: true }
      })
      if (staff) {
        commentSenders[comment.sender_id] = {
          name: `${staff.first_name} ${staff.last_name || ''}`.trim(),
          avatar: staff.profile_pic || undefined
        }
      }
    } else if (comment.sender_type === 'tenant') {
      const tenant = await prisma.tenants.findUnique({
        where: { id: comment.sender_id },
        include: { individual_tenants: true, company_tenants: true }
      })
      if (tenant) {
        commentSenders[comment.sender_id] = {
          name: tenant.individual_tenants
            ? `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
            : tenant.company_tenants?.company_name || 'Unknown',
          avatar: tenant.profile_pic || undefined
        }
      }
    }
  }

  // Get staff list for assignment (only for staff users)
  let staffList: { id: string; label: string; subtitle?: string }[] = []
  if (userType !== 'tenant') {
    const staffMembers = await prisma.staff.findMany({
      where: { organization_id: ticket.organization_id },
      include: {
        users: {
          select: { email: true }
        }
      }
    })
    staffList = staffMembers.map(s => {
      const isCurrentUser = s.id === user.id
      const name = `${s.first_name} ${s.last_name || ''}`.trim()
      return {
        id: s.id,
        label: isCurrentUser ? `${name} (You)` : name,
        subtitle: s.users?.email || undefined
      }
    })
  }

  // Get current user info
  let currentUserName = 'Unknown'
  let currentUserAvatar: string | undefined

  if (userType === 'tenant') {
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      include: { individual_tenants: true, company_tenants: true }
    })
    if (tenant) {
      currentUserName = tenant.individual_tenants
        ? `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
        : tenant.company_tenants?.company_name || 'Unknown'
      currentUserAvatar = tenant.profile_pic || undefined
    }
  } else {
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { first_name: true, last_name: true, profile_pic: true }
    })
    if (staff) {
      currentUserName = `${staff.first_name} ${staff.last_name || ''}`.trim()
      currentUserAvatar = staff.profile_pic || undefined
    }
  }

  // Serialize ticket data to convert Decimal types to strings
  const serializedTicket = JSON.parse(
    JSON.stringify(ticket, (key, value) => {
      // Convert Decimal to string
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
        return value.toString()
      }
      return value
    })
  )

  return {
    ticket: serializedTicket,
    userType: userType as 'staff' | 'tenant',
    staffList,
    currentUserName,
    currentUserAvatar,
    currentUserId: user.id,
    statusPerformers,
    commentSenders
  }
}

export default async function TicketDetailsPage({ params }: Props) {
  const { id } = await params
  const data = await getTicketData(id)

  if (!data) {
    notFound()
  }

  return (
    <TicketDetailsContent
      ticket={data.ticket}
      userType={data.userType}
      staffList={data.staffList}
      currentUserName={data.currentUserName}
      currentUserAvatar={data.currentUserAvatar}
      currentUserId={data.currentUserId}
      statusPerformers={data.statusPerformers}
      commentSenders={data.commentSenders}
    />
  )
}
