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

    // Get tenant and their organization through the junction table
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        organizations_tenants: {
          select: {
            organization_id: true
          },
          take: 1
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const organizationId = tenant.organizations_tenants[0]?.organization_id
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Tenant is not associated with any organization' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, type, description, attachment } = body

    // Validation
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
          created_by: tenant.id
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
