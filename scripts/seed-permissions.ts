// Seed Permissions Script
// Upserts all permissions from the catalog into the database

import { PrismaClient } from '@prisma/client'
import { PERMISSIONS } from '@/lib/permissions-catalog'

const prisma = new PrismaClient()

async function seedPermissions() {
  console.log('Seeding permissions...')
  
  try {
    let createdCount = 0
    let updatedCount = 0

    for (const permission of PERMISSIONS) {
      try {
        const existing = await prisma.permissions.findFirst({
          where: { 
            title: permission.title 
          }
        })

        if (existing) {
          // Update existing permission
          await prisma.permissions.update({
            where: { id: existing.id },
            data: {
              module: permission.module,
              action: permission.action,
              description: permission.description
            }
          })
          updatedCount++
          console.log(`Updated: ${permission.title}`)
        } else {
          // Create new permission
          await prisma.permissions.create({
            data: {
              title: permission.title,
              module: permission.module,
              action: permission.action,
              description: permission.description
            }
          })
          createdCount++
          console.log(`Created: ${permission.title}`)
        }
      } catch (error) {
        console.error(`Error processing ${permission.title}:`, error)
      }
    }

    console.log(`\nSeeding complete!`)
    console.log(`Created: ${createdCount} permissions`)
    console.log(`Updated: ${updatedCount} permissions`)
    console.log(`Total: ${createdCount + updatedCount} permissions`)

    // Verify total count
    const totalPermissions = await prisma.permissions.count()
    console.log(`Database now has ${totalPermissions} permissions`)

  } catch (error) {
    console.error('Seeding error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedPermissions().catch(console.error)
