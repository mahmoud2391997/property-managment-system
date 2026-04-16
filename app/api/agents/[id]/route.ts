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


    if (!hasPermission(permissions, 'agents.update'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    // Verify the agent exists and belongs to the same organization
    const existingAgent = await prisma.agents.findFirst({
      where: {
        id,
        organization_id: staff.organization_id
      }
    })

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, phoneNo, email } = body

    // Validation
    if (firstName !== undefined && !firstName.trim()) {
      return NextResponse.json(
        { error: 'First name cannot be empty' },
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

    if (firstName) updateData.first_name = firstName.trim()
    if (lastName !== undefined) updateData.last_name = lastName?.trim() || null
    if (phoneNo) updateData.phone_number = phoneNo.trim()
    if (email !== undefined) updateData.email = email?.trim() || null

    const updatedAgent = await prisma.agents.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      agent: {
        id: updatedAgent.id,
        firstName: updatedAgent.first_name,
        lastName: updatedAgent.last_name,
        phoneNo: updatedAgent.phone_number,
        email: updatedAgent.email
      }
    })
  } catch (error: any) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}
