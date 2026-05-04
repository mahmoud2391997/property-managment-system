import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { NextResponse } from 'next/server'
import { invalidate } from '@/lib/permissions-cache'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: staffId } = await params
    const { user, staff: currentStaff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'staff.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { first_name, last_name, phone_number, role_id } = body

    // Get current staff record to check role and organization
    const targetStaff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { role_id: true, organization_id: true, roles: { select: { title: true } } }
    })

    if (!targetStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Check if this staff belongs to the same organization
    if (targetStaff.organization_id !== currentStaff.organization_id) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Only Owner can edit other Owner staff
    const isTargetOwner = targetStaff.roles?.title === 'Owner'
    const isCurrentUserOwner = await prisma.staff.findFirst({
      where: { id: user.id, roles: { title: 'Owner' } }
    })
    
    if (isTargetOwner && !isCurrentUserOwner) {
      return NextResponse.json({ error: 'Only Owner can edit Owner staff members' }, { status: 403 })
    }

    // Update staff record
    const updateData: any = {}
    
    if (first_name !== undefined) {
      if (!first_name || typeof first_name !== 'string') {
        return NextResponse.json({ error: 'Invalid first name' }, { status: 400 })
      }
      updateData.first_name = first_name.trim()
    }

    if (last_name !== undefined) {
      if (last_name !== null && (typeof last_name !== 'string' || last_name.trim() === '')) {
        return NextResponse.json({ error: 'Invalid last name' }, { status: 400 })
      }
      updateData.last_name = last_name ? last_name.trim() : null
    }

    if (phone_number !== undefined) {
      if (!phone_number || typeof phone_number !== 'string') {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
      }
      updateData.phone_number = phone_number.trim()
    }

    if (role_id !== undefined) {
      // Requires staff.change_role permission
      if (!hasPermission(permissions, 'staff.change_role')) {
        return NextResponse.json({ error: 'Forbidden: change role permission required' }, { status: 403 })
      }

      if (!role_id || typeof role_id !== 'string') {
        return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
      }
      
      // Verify the role exists and belongs to the same organization
      const role = await prisma.roles.findUnique({
        where: { 
          id: role_id,
          organization_id: currentStaff.organization_id 
        }
      })

      if (!role) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      updateData.role_id = role_id
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: updateData
    })

    // Invalidate cache for this staff member if their role changed
    const roleIdChanged = role_id !== undefined && role_id !== targetStaff.role_id
    if (roleIdChanged) {
      invalidate(staffId)
    }

    return NextResponse.json({ 
      success: true, 
      staff: updatedStaff 
    })

  } catch (error: any) {
    console.error('Error updating staff:', error)
    return NextResponse.json(
      { error: 'Failed to update staff' },
      { status: 500 }
    )
  }
}
