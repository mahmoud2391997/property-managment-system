import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id: propertyId } = await params
    const body = await req.json()
    const { status } = body

    // Validate status
    const validStatuses = ['Ready', 'Under_Preparation']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "Ready" or "Under_Preparation"' },
        { status: 400 }
      )
    }

    // Verify property belongs to the organization
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        code: true,
        status: true
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Update property status
    await prisma.properties.update({
      where: { id: propertyId },
      data: { status }
    })

    return NextResponse.json({
      success: true,
      message: `Property status updated to ${status.replace(/_/g, ' ')}`
    })
  } catch (error) {
    console.error('Error updating property status:', error)
    return NextResponse.json(
      { error: 'Failed to update property status' },
      { status: 500 }
    )
  }
}
