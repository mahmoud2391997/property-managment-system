import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'vendors.update'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    // Verify the vendor exists and belongs to the same organization
    const existingVendor = await prisma.vendors.findFirst({
      where: {
        id,
        organization_id: staff.organization_id
      }
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found or unauthorized' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, phoneNo, email } = body

    // Validation
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      )
    }

    if (phoneNo !== undefined && !phoneNo.trim()) {
      return NextResponse.json(
        { error: 'Phone number cannot be empty' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (name) updateData.name = name.trim()
    if (phoneNo) updateData.phone_number = phoneNo.trim()
    if (email !== undefined) updateData.email = email?.trim() || null

    const updatedVendor = await prisma.vendors.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      vendor: {
        id: updatedVendor.id,
        name: updatedVendor.name,
        phoneNo: updatedVendor.phone_number,
        email: updatedVendor.email
      }
    })
  } catch (error: any) {
    console.error('Error updating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'vendors.delete'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const existingVendor = await prisma.vendors.findFirst({
      where: {
        id,
        organization_id: staff.organization_id
      }
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.vendors.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}
