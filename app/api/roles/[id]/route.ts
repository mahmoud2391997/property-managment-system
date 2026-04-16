import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { NextResponse } from 'next/server'
import { invalidateByRole } from '@/lib/permissions-cache'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roleId } = await params
    const { user, staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'roles.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { title } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
    }

    // Update role title
    const updatedRole = await prisma.roles.update({
      where: {
        id: roleId,
        organization_id: staff.organization_id
      },
      data: {
        title: title.trim()
      }
    })

    // TODO: Add role permissions sync logic here if needed
    // This would update the roles_permissions table based on new role title

    // Invalidate cache for every staff member on this role
    await invalidateByRole(roleId)

    return NextResponse.json({ 
      success: true, 
      role: updatedRole 
    })

  } catch (error: any) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}
