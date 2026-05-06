import { NextRequest, NextResponse } from 'next/server'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { prisma } from '@/lib/prisma'

// Get manual events for a date range
export async function GET(request: NextRequest) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 })
    }

    const [year, month, day] = date.split('-').map(Number)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)

    const events = await prisma.calendar_events.findMany({
      where: {
        organization_id: staff.organization_id,
        timestamp: { gte: startOfDay, lte: endOfDay }
      },
      include: { calendar_event_attendees: { include: { staff: true } } },
      orderBy: { timestamp: 'asc' }
    })
    
    return NextResponse.json({ events })
  } catch (error: any) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch events', stack: error?.stack }, { status: 500 })
  }
}

// Create a manual event
export async function POST(request: NextRequest) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()
    if (error) return error

    if (!permissions.has('calendar.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, timestamp, duration_minutes, description, is_for_all_staff, attendee_ids } = body

    console.log('[CalendarEvents POST] Body:', { title, timestamp, duration_minutes, description, is_for_all_staff, attendee_ids })

    if (!title || !timestamp) {
      return NextResponse.json({ error: 'Title and timestamp are required' }, { status: 400 })
    }

    // Validate that the event is not in the past
    const eventDateTime = new Date(timestamp)
    const now = new Date()
    
    if (eventDateTime < now) {
      return NextResponse.json({ error: 'Cannot create events in the past' }, { status: 400 })
    }

    const eventData: any = {
      organization_id: staff.organization_id,
      title,
      timestamp: new Date(timestamp),
      duration_minutes: duration_minutes || null,
      description: description || null,
      is_for_all_staff: is_for_all_staff || false,
      created_by: staff.id
    }

    if (!is_for_all_staff && attendee_ids && attendee_ids.length > 0) {
      eventData.calendar_event_attendees = {
        create: attendee_ids.map((staffId: string) => ({
          staff_id: staffId
        }))
      }
    }

    console.log('[CalendarEvents POST] Event data:', JSON.stringify(eventData, null, 2))

    const event = await prisma.calendar_events.create({
      data: eventData,
      include: { calendar_event_attendees: true }
    })

    console.log('[CalendarEvents POST] Created event:', event)

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
