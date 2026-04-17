import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'properties.update'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: propertyId } = await params
    const body = await request.json()
    const { owner_id } = body

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
        { error: 'Property not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    // If unassigning owner (owner_id is null), check for active contracts
    if (!owner_id) {
      const activeContract = await prisma.contracts.findFirst({
        where: {
          property_id: propertyId
        },
        select: { id: true }
      })

      if (activeContract) {
        return NextResponse.json(
          { error: 'Cannot unassign owner while property has an active contract' },
          { status: 400 }
        )
      }

      await prisma.properties.update({
        where: { id: propertyId },
        data: { owner_id: null }
      })

      return NextResponse.json({
        success: true,
        message: 'Owner unassigned successfully'
      })
    }

    // Verify owner belongs to the organization
    const owner = await prisma.owners.findFirst({
      where: {
        id: owner_id,
        organization_id: staff.organization_id
      },
      select: { id: true }
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner not found in organization' },
        { status: 404 }
      )
    }

    // Update property with owner
    await prisma.properties.update({
      where: { id: propertyId },
      data: { owner_id }
    })

    return NextResponse.json({
      success: true,
      message: 'Owner assigned successfully'
    })
  } catch (error: any) {
    console.error('Error assigning owner:', error)
    return NextResponse.json(
      { error: 'Failed to assign owner' },
      { status: 500 }
    )
  }
}
