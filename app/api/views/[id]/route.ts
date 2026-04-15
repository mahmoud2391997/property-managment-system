import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { parseLocalDateTime } from '@/utils/formatTime'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id } = await params

    // Fetch view with property/room to verify organization access
    const view = await prisma.views.findFirst({
      where: {
        id,
        OR: [
          {
            properties: {
              organization_id: staff.organization_id
            }
          },
          {
            rooms: {
              properties: {
                organization_id: staff.organization_id
              }
            }
          }
        ]
      },
      select: {
        id: true,
        reference_id: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        email: true,
        viewed_at: true,
        created_at: true,
        property_id: true,
        room_id: true
      }
    })

    if (!view) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      view: {
        id: view.id,
        reference_id: view.reference_id,
        first_name: view.first_name,
        last_name: view.last_name,
        phone_number: view.phone_number,
        email: view.email,
        viewed_at: view.viewed_at.toISOString(),
        created_at: view.created_at.toISOString(),
        property_id: view.property_id,
        room_id: view.room_id
      }
    })
  } catch (error: any) {
    console.error('Error fetching view:', error)
    return NextResponse.json(
      { error: 'Failed to fetch view' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id } = await params
    const body = await request.json()
    const { date, time, firstName, lastName, phoneNumber, email, timezone_offset } = body

    // Validate required fields
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

    // Verify view exists and belongs to organization
    const existingView = await prisma.views.findFirst({
      where: {
        id,
        OR: [
          {
            properties: {
              organization_id: staff.organization_id
            }
          },
          {
            rooms: {
              properties: {
                organization_id: staff.organization_id
              }
            }
          }
        ]
      },
      select: { id: true, created_at: true }
    })

    if (!existingView) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      )
    }

    // Combine date and time into a timestamp for viewed_at (with client timezone)
    const viewed_at = parseLocalDateTime(date, time, timezone_offset ?? 0)

    // Validate that viewed_at is not after created_at (record creation time)
    if (viewed_at > existingView.created_at) {
      return NextResponse.json(
        { error: 'View date and time cannot be after the record was created' },
        { status: 400 }
      )
    }

    // Update view
    const view = await prisma.views.update({
      where: { id },
      data: {
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        phone_number: phoneNumber || null,
        email: email?.trim() || null,
        viewed_at
      }
    })

    return NextResponse.json({
      success: true,
      view: {
        id: view.id,
        reference_id: view.reference_id,
        first_name: view.first_name,
        last_name: view.last_name
      }
    })
  } catch (error: any) {
    console.error('Error updating view:', error)
    return NextResponse.json(
      { error: 'Failed to update view' },
      { status: 500 }
    )
  }
}
