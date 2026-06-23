import { PrismaClient } from '@prisma/client'
import { createAdminClient } from '@/utils/supabase/admin'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding second Owner staff...')

  const org = await prisma.organizations.findFirst()
  if (!org) {
    console.error('No organization found')
    process.exit(1)
  }

  const ownerRole = await prisma.roles.findFirst({
    where: { organization_id: org.id, title: 'Owner' }
  })
  if (!ownerRole) {
    console.error('No Owner role found')
    process.exit(1)
  }

  // Count existing Owner staff
  const existingOwners = await prisma.staff.count({
    where: { organization_id: org.id, role_id: ownerRole.id }
  })
  console.log(`Existing Owner staff: ${existingOwners}`)

  // Get org creator to use as created_by
  const orgCreator = org.created_by

  const email = `owner2@tenancypilot.dev`
  const password = 'Tenant123!'

  const supabaseAdmin = createAdminClient()

  // Create auth user
  const { data: newAuthUser, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { user_type: 'staff' }
    })

  if (authError || !newAuthUser?.user) {
    if (authError?.code === '23505' || authError?.status === 422) {
      console.log(`Auth user with email ${email} already exists, fetching...`)
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
      const usersList = usersData?.users || []
      const existing = (usersList as any[]).find(u => u.email === email)
      if (existing) {
        console.log('Using existing auth user:', existing.id)
        const existingStaff = await prisma.staff.findUnique({ where: { id: existing.id } })
        if (existingStaff) {
          console.log('Owner staff already exists:', existingStaff.first_name)
          return
        }
        // Auth user exists but no staff record - create one
        await prisma.staff.create({
          data: {
            id: existing.id,
            staff_id: 'OWNER002',
            first_name: 'Second Owner',
            last_name: null,
            phone_number: '+60199999999',
            role_id: ownerRole.id,
            organization_id: org.id,
            created_by: orgCreator
          }
        })
        console.log('Created Owner staff for existing auth user')
        return
      }
    }
    console.error('Error creating auth user:', authError)
    process.exit(1)
  }

  console.log('Created auth user:', newAuthUser.user.id)

  // Generate staff ID
  const staffCount = await prisma.staff.count({ where: { organization_id: org.id } })
  const staffId = `OWNER${String(staffCount + 1).padStart(3, '0')}`

  // Create staff record
  await prisma.staff.create({
    data: {
      id: newAuthUser.user.id,
      staff_id: staffId,
      first_name: 'Second Owner',
      last_name: null,
      phone_number: '+60199999999',
      role_id: ownerRole.id,
      organization_id: org.id,
      created_by: orgCreator
    }
  })

  console.log(`Created Owner staff: ${staffId} (${email})`)
  console.log(`Password: ${password}`)
  console.log(`Total Owner staff: ${existingOwners + 1}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
