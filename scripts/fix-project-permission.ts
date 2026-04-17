// Fix Projects Permission - Add the missing 'projects.access' permission

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixProjectPermission() {
  console.log('Fixing projects permission...')

  try {
    // Get Admin role
    const adminRole = await prisma.roles.findFirst({
      where: { title: 'Admin' },
      select: { id: true }
    })

    if (!adminRole) {
      console.log('Admin role not found')
      return
    }

    console.log(`Admin role found: ${adminRole.id}`)

    // Create the missing 'projects.access' permission
    const permission = await prisma.permissions.create({
      data: {
        title: 'projects.access',
        description: 'Permission to access projects',
        module: 'projects',
        action: 'access'
      }
    })

    console.log(`Created permission: ${permission.title}`)

    // Assign to Admin role
    await prisma.roles_permissions.create({
      data: {
        role_id: adminRole.id,
        permission_id: permission.id
      }
    })

    console.log(`Assigned ${permission.title} to Admin role`)

    // Verify the setup
    const permissionCount = await prisma.roles_permissions.count({
      where: { role_id: adminRole.id }
    })

    console.log(`Admin role now has ${permissionCount} permissions`)

    // Check if the permission exists
    const checkPermission = await prisma.permissions.findFirst({
      where: { title: 'projects.access' },
      select: { title: true }
    })

    console.log(`Permission verification: ${checkPermission?.title || 'Not found'}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixProjectPermission().catch(console.error)
