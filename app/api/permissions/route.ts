import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { user, staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'roles.access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all permissions grouped by module
    const allPermissions = await prisma.permissions.findMany({
      orderBy: [
        { module: 'asc' },
        { action: 'asc' }
      ]
    })

    // Group permissions by module
    const permissionsByModule = allPermissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = []
      }
      acc[permission.module].push({
        id: permission.id,
        action: permission.action,
        title: permission.title,
        description: permission.description
      })
      return acc
    }, {} as Record<string, Array<{
      id: string
      action: string
      title: string
      description: string
    }>>)

    return NextResponse.json({
      success: true,
      permissions: permissionsByModule
    })

  } catch (error: any) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}
