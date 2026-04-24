/**
 * Seed & Verify Permissions Script
 * 
 * Usage:
 *   npm run seed:permissions    # Verify permission system is ready
 *   npm run seed:owner        # Create/update Owner role with all permissions
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyPermissions() {
  console.log('🔍 Verifying permissions in database...')

  const dbPerms = await prisma.permissions.findMany({
    select: { id: true, module: true, action: true }
  })

  const { PERMISSIONS } = await import('@/lib/permissions-catalog')

  console.log(`  DB: ${dbPerms.length} permissions`)
  console.log(`  Catalog: ${PERMISSIONS.length} permissions`)

  if (dbPerms.length === PERMISSIONS.length) {
    console.log('✅ Counts match!')
    return true
  }

  const dbKeys = new Set(dbPerms.map(p => `${p.module}.${p.action}`))
  const missing = PERMISSIONS.filter(perm => !dbKeys.has(`${perm.module}.${perm.action}`))

  if (missing.length > 0) {
    console.log(`\n⚠️  Missing in DB (${missing.length}):`)
    missing.slice(0, 10).forEach(p => console.log(`  - ${p.module}.${p.action}`))
    if (missing.length > 10) console.log(`  ... and ${missing.length - 10} more`)
  }

  return false
}

async function verifyRoles() {
  console.log('\n🔍 Verifying roles...')

  const roles = await prisma.roles.findMany({
    select: {
      id: true,
      title: true,
      _count: { select: { roles_permissions: true, staff: true } }
    }
  })

  for (const role of roles) {
    console.log(`  ${role.title}: ${role._count.roles_permissions} perms, ${role._count.staff} staff`)
  }

  return roles.length > 0
}

async function seedOwnerRole() {
  console.log('\n🌱 Ensuring Owner role has all permissions...')

  const ownerRole = await prisma.roles.findFirst({
    where: { title: 'Owner' }
  })

  if (!ownerRole) {
    console.log('❌ No Owner role found!')
    return false
  }

  const dbPerms = await prisma.permissions.findMany({
    select: { id: true }
  })

  const existingRolePerms = await prisma.roles_permissions.findMany({
    where: { role_id: ownerRole.id },
    select: { permission_id: true }
  })
  const existingSet = new Set(existingRolePerms.map(rp => rp.permission_id))

  let added = 0
  for (const perm of dbPerms) {
    if (!existingSet.has(perm.id)) {
      await prisma.roles_permissions.create({
        data: { role_id: ownerRole.id, permission_id: perm.id }
      })
      added++
    }
  }

  const finalCount = await prisma.roles_permissions.count({
    where: { role_id: ownerRole.id }
  })

  if (added > 0) console.log(`  ✅ Added ${added} permissions`)
  console.log(`  📊 Owner has ${finalCount} permissions`)

  return finalCount >= 100
}

async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'verify'

  console.log('='.repeat(50))
  console.log('📋 PERMISSION SYSTEM')
  console.log('='.repeat(50))

  const permOk = await verifyPermissions()
  const roleOk = await verifyRoles()

  if (mode === 'seed' || mode === 'owner') {
    console.log('\n--- SEEDING OWNER ROLE ---')
    await seedOwnerRole()
  }

  console.log('\n' + '='.repeat(50))
  if (permOk && roleOk) {
    console.log('✅ SYSTEM IS READY')
  } else {
    console.log('⚠️  SOME ISSUES NEED ATTENTION')
  }
  console.log('='.repeat(50))

  await prisma.$disconnect()
}

main()
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })