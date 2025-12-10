'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userType = user.user_metadata?.user_type
    const body = await request.json()
    const { ticketId, message, attachment } = body as {
      ticketId: string
      message: string
      attachment?: string
    }

    if (!ticketId || !message?.trim()) {
      return NextResponse.json(
        { error: 'ticketId and message are required' },
        { status: 400 }
      )
    }

    // Fetch ticket to verify access and check status
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        leases: {
          include: { tenants: true }
        },
        ticket_statuses: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check current status - can't comment on closed/resolved tickets
    const currentStatus = ticket.ticket_statuses[0]?.state
    if (currentStatus === 'Resolved' || currentStatus === 'Closed') {
      return NextResponse.json(
        { error: 'Cannot add comments to closed tickets' },
        { status: 400 }
      )
    }

    // Access check
    let senderType: 'staff' | 'tenant'
    let senderName: string = ''
    let senderAvatar: string | undefined

    if (userType === 'tenant') {
      // Tenant must own the lease
      if (ticket.leases?.tenants?.id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      senderType = 'tenant'

      // Get tenant name
      const tenant = await prisma.tenants.findUnique({
        where: { id: user.id },
        include: { individual_tenants: true, company_tenants: true }
      })
      if (tenant) {
        senderName = tenant.individual_tenants
          ? `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
          : tenant.company_tenants?.company_name || 'Unknown'
        senderAvatar = tenant.profile_pic || undefined
      }
    } else {
      // Staff must be in same organization
      const staff = await prisma.staff.findUnique({
        where: { id: user.id },
        select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
      })

      if (!staff || staff.organization_id !== ticket.organization_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      senderType = 'staff'
      senderName = `${staff.first_name} ${staff.last_name || ''}`.trim()
      senderAvatar = staff.profile_pic || undefined
    }

    // Create comment
    const comment = await prisma.ticket_comments.create({
      data: {
        ticket_id: ticketId,
        message: message.trim(),
        attachment: attachment || null,
        sender_type: senderType,
        sender_id: user.id
      }
    })

    // Return comment with sender info for optimistic UI update
    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        message: comment.message,
        attachment: comment.attachment,
        createdAt: comment.created_at.toISOString(),
        senderName,
        senderAvatar
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
