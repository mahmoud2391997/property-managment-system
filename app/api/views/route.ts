import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const roomId = searchParams.get('roomId')

    if (!propertyId && !roomId) {
      return NextResponse.json(
        { error: 'Property ID or Room ID is required' },
        { status: 400 }
      )
    }

    // Build where clause based on propertyId or roomId
    let whereClause: any = {}

    if (propertyId) {
      // Verify property belongs to the organization
      const property = await prisma.properties.findFirst({
        where: {
          id: propertyId,
          organization_id: staff.organization_id
        },
        select: { id: true }
      })

      if (!property) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        )
      }
      whereClause.property_id = propertyId
    }

    if (roomId) {
      // Verify room belongs to the organization through its property
      const room = await prisma.rooms.findFirst({
        where: {
          id: roomId,
          properties: {
            organization_id: staff.organization_id
          }
        },
        select: { id: true }
      })

      if (!room) {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        )
      }
      whereClause.room_id = roomId
    }

    // Fetch views
    const views = await prisma.views.findMany({
      where: whereClause,
      select: {
        id: true,
        reference_id: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        email: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({
      views: views.map(view => ({
        id: view.id,
        reference_id: view.reference_id,
        first_name: view.first_name,
        last_name: view.last_name,
        phone_number: view.phone_number,
        email: view.email,
        created_at: view.created_at.toISOString()
      }))
    })
  } catch (error: any) {
    console.error('Error fetching views:', error)
    return NextResponse.json(
      { error: 'Failed to fetch views' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { staff, user, error } = await getUserAndStaff()

    if (error) return error

    const body = await request.json()
    const { propertyId, roomId, date, time, firstName, lastName, phoneNumber, email } =
      body

    // Validation - must have either propertyId OR roomId (XOR constraint)
    if (!propertyId && !roomId) {
      return NextResponse.json(
        { error: 'Property ID or Room ID is required' },
        { status: 400 }
      )
    }

    if (propertyId && roomId) {
      return NextResponse.json(
        { error: 'Cannot specify both Property ID and Room ID' },
        { status: 400 }
      )
    }

    if (!date || !time) {
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 }
      )
    }

    if (!firstName || !firstName.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    // Variables to track the target entity
    let targetPropertyId: string | null = null
    let targetRoomId: string | null = null

    if (propertyId) {
      // Verify property belongs to the organization
      const property = await prisma.properties.findFirst({
        where: {
          id: propertyId,
          organization_id: staff.organization_id
        },
        select: { id: true }
      })

      if (!property) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        )
      }
      targetPropertyId = propertyId
    }

    if (roomId) {
      // Verify room belongs to the organization through its property
      const room = await prisma.rooms.findFirst({
        where: {
          id: roomId,
          properties: {
            organization_id: staff.organization_id
          }
        },
        select: { id: true }
      })

      if (!room) {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        )
      }
      targetRoomId = roomId
    }

    // Generate reference_id (unique per property or room)
    // Format: VW-YYYY-#### (e.g., VW-2025-0001)
    const currentYear = new Date().getFullYear()
    const yearPrefix = `VW-${currentYear}-`

    // Build where clause for finding latest view
    const latestViewWhere: any = {
      reference_id: {
        startsWith: yearPrefix
      }
    }

    if (targetPropertyId) {
      latestViewWhere.property_id = targetPropertyId
    }
    if (targetRoomId) {
      latestViewWhere.room_id = targetRoomId
    }

    // Get the latest view for this property/room and year
    const latestView = await prisma.views.findFirst({
      where: latestViewWhere,
      orderBy: {
        reference_id: 'desc'
      },
      select: {
        reference_id: true
      }
    })

    let nextSequence = 1
    if (latestView) {
      // Extract the last 4 digits and increment
      const lastSequence = parseInt(latestView.reference_id.slice(-4))
      nextSequence = lastSequence + 1
    }

    // Format: VW-YYYY-#### (e.g., VW-2025-0001)
    const reference_id = `${yearPrefix}${nextSequence.toString().padStart(4, '0')}`

    // Combine date and time into a timestamp
    const created_at = new Date(`${date}T${time}`)

    // Create view - property_id is null when room_id is set (XOR constraint)
    const view = await prisma.views.create({
      data: {
        reference_id,
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        phone_number: phoneNumber || null,
        email: email?.trim() || null,
        property_id: targetPropertyId,
        room_id: targetRoomId,
        created_by: user.id,
        created_at
      }
    })

    return NextResponse.json(
      {
        success: true,
        view: {
          id: view.id,
          reference_id: view.reference_id,
          first_name: view.first_name,
          last_name: view.last_name
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating view:', error)
    return NextResponse.json(
      { error: 'Failed to create view' },
      { status: 500 }
    )
  }
}
