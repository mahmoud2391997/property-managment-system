import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function GET(request: Request) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'views.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const roomId = searchParams.get('roomId')

    if (!propertyId && !roomId) {
      return NextResponse.json(
        { error: 'Property ID or Room ID is required' },
        { status: 400 }
      )
    }

    // Build where clause
    const whereClause: any = {
      conversion_status: 'Not_Decided'
    }

    if (propertyId) {
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

    const views = await prisma.views.findMany({
      where: whereClause,
      select: {
        id: true,
        reference_id: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        email: true,
        viewed_at: true
      },
      orderBy: {
        viewed_at: 'desc'
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
        viewed_at: view.viewed_at.toISOString()
      }))
    })
  } catch (error: any) {
    console.error('Error fetching undecided views:', error)
    return NextResponse.json(
      { error: 'Failed to fetch undecided views' },
      { status: 500 }
    )
  }
}
