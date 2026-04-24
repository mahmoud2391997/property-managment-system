/**
 * Seed Owner Role Script
 * 
 * Usage:
 *   npm run seed:owner
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function ensureOwnerRole() {
  console.log('🌱 Ensuring Owner role has all permissions...')

  // Find or create Owner role in first organization
  let ownerRole = await prisma.roles.findFirst({
    where: { title: 'Owner' }
  })

  const org = await prisma.organizations.findFirst()
  if (!org) {
    console.log('❌ No organization found!')
    return false
  }

  if (!ownerRole) {
    console.log('  Creating Owner role...')
    const firstStaff = await prisma.staff.findFirst()
    ownerRole = await prisma.roles.create({
      data: {
        title: 'Owner',
        organization_id: org.id,
        created_by: firstStaff?.id || org.id
      }
    })
    console.log(`  ✅ Created Owner role: ${ownerRole.id}`)
  }

  // Get all permissions
  const allPerms = await prisma.permissions.findMany({ select: { id: true } })
  const existingPerms = await prisma.roles_permissions.findMany({
    where: { role_id: ownerRole.id },
    select: { permission_id: true }
  })
  const existingSet = new Set(existingPerms.map(p => p.permission_id))

  // Bulk insert missing permissions
  const missingPerms = allPerms.filter(p => !existingSet.has(p.id))
  
  if (missingPerms.length > 0) {
    await prisma.roles_permissions.createMany({
      data: missingPerms.map(p => ({
        role_id: ownerRole.id,
        permission_id: p.id
      })),
      skipDuplicates: true
    })
    console.log(`  ✅ Added ${missingPerms.length} permissions`)
  }

  const count = await prisma.roles_permissions.count({
    where: { role_id: ownerRole.id }
  })
  console.log(`\n✨ Owner role has ${count} permissions`)

  return count >= 100
}

ensureOwnerRole()
  .then(async (ok) => {
    await prisma.$disconnect()
    if (!ok) process.exit(1)
  })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })