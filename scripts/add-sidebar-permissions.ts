// Add Missing Sidebar Permissions

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addSidebarPermissions() {
  console.log('Adding missing sidebar permissions...')

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

    // Permissions that the sidebar expects but we don't have
    const missingPermissions = [
      'dashboard.access',
      'properties.access',
      'rooms.access',
      'payments.access',
      'expenses.access',
      'tenants.access',
      'owners.access',
      'agents.access',
      'vendors.access',
      'staff.access',
      'tenant_screening.access',
      'tickets.access',
      'tasks.access',
      'notices.access',
      'notifications.access',
      'reports.access',
      'leases.access'
    ]

    let addedCount = 0

    for (const permissionTitle of missingPermissions) {
      try {
        // Check if permission already exists
        const existingPermission = await prisma.permissions.findFirst({
          where: { title: permissionTitle }
        })

        if (existingPermission) {
          console.log(`  Permission already exists: ${permissionTitle}`)
          continue
        }

        // Create permission
        const permission = await prisma.permissions.create({
          data: {
            title: permissionTitle,
            description: `Permission to ${permissionTitle.replace('.access', ' access')}`,
            module: permissionTitle.split('.')[0],
            action: 'access'
          }
        })

        // Assign to Admin role
        await prisma.roles_permissions.create({
          data: {
            role_id: adminRole.id,
            permission_id: permission.id
          }
        })

        addedCount++
        console.log(`  Created and assigned: ${permissionTitle}`)

      } catch (error) {
        console.log(`  Error creating ${permissionTitle}: ${error}`)
      }
    }

    console.log(`Successfully created and assigned ${addedCount} new permissions to Admin role`)

    // Verify the setup
    const permissionCount = await prisma.roles_permissions.count({
      where: { role_id: adminRole.id }
    })

    console.log(`Admin role now has ${permissionCount} total permissions`)

    // Show all permissions
    const allPermissions = await prisma.permissions.findMany({
      select: { title: true },
      orderBy: { title: 'asc' }
    })

    console.log('\nAll permissions:')
    allPermissions.forEach(p => console.log(`  - ${p.title}`))

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSidebarPermissions().catch(console.error)
