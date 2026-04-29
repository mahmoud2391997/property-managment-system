import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { NextResponse } from 'next/server'
import { invalidateByRole } from '@/lib/permissions-cache'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roleId } = await params
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'roles.access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = await prisma.roles.findFirst({
      where: {
        id: roleId,
        organization_id: staff.organization_id
      },
      include: {
        roles_permissions: {
          select: {
            permission_id: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        title: role.title,
        permissionIds: role.roles_permissions.map(rp => rp.permission_id)
      }
    })
  } catch (error: any) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roleId } = await params
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'roles.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { title, permissionIds } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
    }

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: 'Invalid permission IDs' }, { status: 400 })
    }

    const existingRole = await prisma.roles.findFirst({
      where: {
        id: roleId,
        organization_id: staff.organization_id
      }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (existingRole.title === 'Owner') {
      return NextResponse.json({ error: 'Cannot update the Owner role' }, { status: 400 })
    }

    // Update role title and permissions together
    const updatedRole = await prisma.roles.update({
      where: {
        id: roleId
      },
      data: {
        title: title.trim(),
        roles_permissions: {
          deleteMany: {},
          createMany: {
            data: permissionIds.map((permissionId: string) => ({
              permission_id: permissionId
            })),
            skipDuplicates: true
          }
        }
      }
    })

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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: roleId } = await params
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'roles.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = await prisma.roles.findFirst({
      where: {
        id: roleId,
        organization_id: staff.organization_id
      },
      include: {
        _count: {
          select: {
            staff: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (role.title === 'Owner') {
      return NextResponse.json({ error: 'Cannot delete the Owner role' }, { status: 400 })
    }

    if (role._count.staff > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned staff members' },
        { status: 400 }
      )
    }

    await prisma.roles.delete({
      where: {
        id: roleId
      }
    })

    await invalidateByRole(roleId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
