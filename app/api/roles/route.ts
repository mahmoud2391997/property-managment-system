import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { user, staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (
      !hasPermission(permissions, 'roles.access') &&
      !hasPermission(permissions, 'staff.create')
    )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Use raw SQL to avoid schema drift issues in the generated Prisma model.
    const formattedRoles = await prisma.$queryRaw<
      Array<{
        id: string
        title: string
        is_owner: boolean
        permission_count: number
        staff_count: number
      }>
    >`
      SELECT
        r.id,
        r.title,
        (r.title = 'Owner') AS is_owner,
        COUNT(DISTINCT rp.permission_id)::int AS permission_count,
        COUNT(DISTINCT s.id)::int AS staff_count
      FROM public.roles r
      LEFT JOIN public.roles_permissions rp ON rp.role_id = r.id
      LEFT JOIN public.staff s ON s.role_id = r.id
      WHERE r.organization_id = ${staff.organization_id}::uuid
      GROUP BY r.id, r.title
      ORDER BY r.title ASC
    `

    return NextResponse.json({
      success: true,
      roles: formattedRoles
    })

  } catch (error: any) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user, staff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'roles.create'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { title, permissionIds } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
    }

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: 'Invalid permission IDs' }, { status: 400 })
    }

    // Check if role with this title already exists
    const existingRole = await prisma.roles.findFirst({
      where: {
        organization_id: staff.organization_id,
        title: title.trim()
      }
    })

    if (existingRole) {
      return NextResponse.json({ error: 'Role with this title already exists' }, { status: 400 })
    }

    // Create the role
    const newRole = await prisma.roles.create({
      data: {
        title: title.trim(),
        organization_id: staff.organization_id
      }
    })

    // Attach permissions to the role
    if (permissionIds.length > 0) {
      await prisma.roles_permissions.createMany({
        data: permissionIds.map((permissionId: string) => ({
          role_id: newRole.id,
          permission_id: permissionId
        })),
        skipDuplicates: true
      })
    }

    return NextResponse.json({
      success: true,
      role: newRole
    })

  } catch (error: any) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}
