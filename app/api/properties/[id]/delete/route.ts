'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

/**
 * Delete a property - Staff only
 * Only allowed if property has no leases at all
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()
    if (error) return error
    if (!hasPermission(permissions, 'properties.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId } = await params

    // Find the property and verify it belongs to staff's organization
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        code: true,
        _count: {
          select: {
            leases: true
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      )
    }

    // Check if property has any leases
    if (property._count.leases > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete property with leases',
          has_leases: true,
          message: 'This property has leases associated with it. Properties with lease history cannot be deleted.'
        },
        { status: 400 }
      )
    }

    // Delete the property (cascade will handle related records)
    await prisma.properties.delete({
      where: { id: property.id }
    })

    console.log(`Property deleted: ${property.code} by staff ${staff.id}`)

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    )
  }
}
