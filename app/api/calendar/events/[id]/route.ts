import { NextRequest, NextResponse } from 'next/server'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { id } = await params

    const event = await prisma.calendar_events.findUnique({
      where: { id, organization_id: staff.organization_id },
      include: {
        calendar_event_attendees: {
          include: { staff: { select: { id: true, first_name: true, last_name: true } } }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error fetching calendar event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const { title, timestamp, duration_minutes, description, is_for_all_staff, attendee_ids } = body

    const existing = await prisma.calendar_events.findUnique({
      where: { id, organization_id: staff.organization_id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = await prisma.calendar_events.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(timestamp !== undefined && { timestamp: new Date(timestamp) }),
        ...(duration_minutes !== undefined && { duration_minutes }),
        ...(description !== undefined && { description }),
        ...(is_for_all_staff !== undefined && { is_for_all_staff })
      }
    })

    if (attendee_ids !== undefined) {
      await prisma.calendar_event_attendees.deleteMany({ where: { event_id: id } })
      if (attendee_ids.length > 0) {
        await prisma.calendar_event_attendees.createMany({
          data: attendee_ids.map((staffId: string) => ({ event_id: id, staff_id: staffId }))
        })
      }
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error updating calendar event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { id } = await params

    const existing = await prisma.calendar_events.findUnique({
      where: { id, organization_id: staff.organization_id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await prisma.calendar_events.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
