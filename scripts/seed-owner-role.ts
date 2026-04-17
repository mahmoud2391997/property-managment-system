// Seed Owner Role Script
// Creates an "Owner" role with all permissions for every organization

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedOwnerRole() {
  console.log('Seeding Owner role...')
  
  try {
    // Get all organizations
    const organizations = await prisma.organizations.findMany({
      select: { id: true, title: true }
    })

    if (organizations.length === 0) {
      console.log('No organizations found. Please create an organization first.')
      return
    }

    console.log(`Found ${organizations.length} organizations`)

    // Get all permissions
    const allPermissions = await prisma.permissions.findMany({
      select: { id: true, title: true }
    })

    if (allPermissions.length === 0) {
      console.log('No permissions found. Please run seed-permissions.ts first.')
      return
    }

    console.log(`Found ${allPermissions.length} permissions`)

    let createdRoles = 0
    let updatedRoles = 0

    for (const organization of organizations) {
      console.log(`\nProcessing organization: ${organization.title}`)

      // Check if Owner role exists for this organization
      let ownerRole = await prisma.roles.findFirst({
        where: {
          title: 'Owner',
          organization_id: organization.id
        }
      })

      if (!ownerRole) {
        // Create Owner role
        ownerRole = await prisma.roles.create({
          data: {
            title: 'Owner',
            organization_id: organization.id
          }
        })
        createdRoles++
        console.log(`  Created Owner role for ${organization.title}`)
      } else {
        updatedRoles++
        console.log(`  Owner role already exists for ${organization.title}`)
      }

      // Clear existing role-permission relationships for Owner role
      await prisma.roles_permissions.deleteMany({
        where: { role_id: ownerRole.id }
      })

      // Assign all permissions to Owner role
      const rolePermissions = allPermissions.map(permission => ({
        role_id: ownerRole.id,
        permission_id: permission.id
      }))

      await prisma.roles_permissions.createMany({
        data: rolePermissions
      })

      console.log(`  Assigned ${allPermissions.length} permissions to Owner role`)

      // Verify the assignment
      const permissionCount = await prisma.roles_permissions.count({
        where: { role_id: ownerRole.id }
      })
      console.log(`  Owner role now has ${permissionCount} permissions`)
    }

    console.log(`\nSeeding complete!`)
    console.log(`Created: ${createdRoles} Owner roles`)
    console.log(`Updated: ${updatedRoles} existing Owner roles`)
    console.log(`Total organizations processed: ${organizations.length}`)

    // Get final statistics
    const totalRoles = await prisma.roles.count({
      where: { title: 'Owner' }
    })
    console.log(`Total Owner roles in database: ${totalRoles}`)

  } catch (error) {
    console.error('Seeding error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedOwnerRole().catch(console.error)
