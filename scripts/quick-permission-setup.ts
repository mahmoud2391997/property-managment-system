// Quick Permission Setup - Recreate basic permissions for Admin role

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function quickPermissionSetup() {
  console.log('Setting up basic permissions for Admin role...')

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

    // Create basic permissions
    const basicPermissions = [
      'Access Dashboard',
      'Access Properties',
      'Create Property',
      'Update Property',
      'Access Rooms',
      'Create Room',
      'Update Room',
      'Access Leases',
      'Create Lease',
      'Update Lease',
      'Access Tenants',
      'Create Tenant',
      'Update Tenant',
      'Access Payments',
      'Create Payment',
      'Update Payment',
      'Access Expenses',
      'Create Expense',
      'Update Expense',
      'Access Tasks',
      'Create Task',
      'Update Task',
      'Delete Task',
      'Access Staff',
      'Access Projects',
      'Access Reports'
    ]

    console.log(`Creating ${basicPermissions.length} basic permissions...`)

    // Create permissions and assign to Admin role
    let createdCount = 0
    for (const permissionTitle of basicPermissions) {
      try {
        // Create permission
        const permission = await prisma.permissions.create({
          data: {
            title: permissionTitle,
            description: `Permission to ${permissionTitle.toLowerCase()}`,
            module: permissionTitle.split(' ')[0].toLowerCase(),
            action: permissionTitle.split(' ')[1]?.toLowerCase() || 'access'
          }
        })

        // Assign to Admin role
        await prisma.roles_permissions.create({
          data: {
            role_id: adminRole.id,
            permission_id: permission.id
          }
        })

        createdCount++
        console.log(`  Created and assigned: ${permissionTitle}`)

      } catch (error) {
        console.log(`  Error creating ${permissionTitle}: ${error}`)
      }
    }

    console.log(`Successfully created and assigned ${createdCount} permissions to Admin role`)

    // Verify the setup
    const permissionCount = await prisma.roles_permissions.count({
      where: { role_id: adminRole.id }
    })

    console.log(`Admin role now has ${permissionCount} permissions`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickPermissionSetup().catch(console.error)
