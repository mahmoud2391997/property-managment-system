'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only staff can change ticket type
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Only staff can change ticket type' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type } = body

    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 })
    }

    // Verify ticket exists and belongs to same organization
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        ticket_statuses: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.organization_id !== staff.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if ticket is Resolved or Closed
    const currentStatus = ticket.ticket_statuses[0]?.state
    if (currentStatus === 'Resolved' || currentStatus === 'Closed') {
      return NextResponse.json(
        { error: 'Cannot change type of resolved or closed tickets' },
        { status: 400 }
      )
    }

    // Get current type to avoid duplicate entries
    const currentType = await prisma.ticket_types.findFirst({
      where: { ticket_id: ticketId },
      orderBy: { created_at: 'desc' }
    })

    if (currentType?.type === type) {
      return NextResponse.json({ success: true, message: 'Type unchanged' })
    }

    // Create new type entry (keeping history)
    const newTypeEntry = await prisma.ticket_types.create({
      data: {
        ticket_id: ticketId,
        type,
        created_by: staff.id
      }
    })

    // Return event data for optimistic UI update
    const staffName = `${staff.first_name} ${staff.last_name || ''}`.trim()

    return NextResponse.json({
      success: true,
      event: {
        type: 'type_changed',
        performerName: staffName,
        performerAvatar: staff.profile_pic || undefined,
        typeName: type,
        createdAt: newTypeEntry.created_at.toISOString()
      }
    })
  } catch (error: any) {
    console.error('Error updating ticket type:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket type' },
      { status: 500 }
    )
  }
}
