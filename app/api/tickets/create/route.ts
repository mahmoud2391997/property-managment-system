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

    // Get tenant
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, type, description, attachment, lease_id } = body

    // Validation
    if (!lease_id) {
      return NextResponse.json(
        { error: 'Please select a property' },
        { status: 400 }
      )
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!type || !type.trim()) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    // Verify the lease belongs to this tenant and has valid status (Current or Expired)
    const lease = await prisma.leases.findFirst({
      where: {
        id: lease_id,
        tenant_id: tenant.id,
        status: {
          in: ['Current', 'Expired']
        }
      },
      select: { id: true, organization_id: true }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Invalid lease or lease status does not allow ticket creation' },
        { status: 400 }
      )
    }

    const organizationId = lease.organization_id

    // Generate reference_id: TK-YYYYNNNNNNN (11 digits after TK-)
    const currentYear = new Date().getFullYear()
    const yearPrefix = `TK-${currentYear}`

    // Get the latest ticket for this year and organization
    const latestTicket = await prisma.tickets.findFirst({
      where: {
        organization_id: organizationId,
        reference_id: {
          startsWith: yearPrefix
        }
      },
      orderBy: {
        reference_id: 'desc'
      },
      select: {
        reference_id: true
      }
    })

    let nextSequence = 1
    if (latestTicket) {
      // Extract the last 7 digits and increment
      const lastSequence = parseInt(latestTicket.reference_id.slice(-7))
      nextSequence = lastSequence + 1
    }

    // Format: TK-YYYYNNNNNNN (TK-20250000001)
    const reference_id = `${yearPrefix}${nextSequence.toString().padStart(7, '0')}`

    // Create ticket with initial status and type in a transaction
    const result = await prisma.$transaction(async tx => {
      // Create ticket
      const ticket = await tx.tickets.create({
        data: {
          reference_id,
          title: title.trim(),
          description: description.trim(),
          attachment: attachment || null,
          organization_id: organizationId,
          lease_id: lease.id
        }
      })

      // Create initial ticket status (Open)
      await tx.ticket_statuses.create({
        data: {
          ticket_id: ticket.id,
          state: 'Open',
          performer_type: 'tenant',
          performer_id: tenant.id
        }
      })

      // Create initial ticket type
      await tx.ticket_types.create({
        data: {
          ticket_id: ticket.id,
          type: type.trim(),
          created_by: null // Tenant created it, but created_by references staff
        }
      })

      return ticket
    })

    return NextResponse.json(
      {
        success: true,
        ticket: {
          id: result.id,
          reference_id: result.reference_id,
          title: result.title
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
