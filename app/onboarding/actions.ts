'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { organization_type } from '@prisma/client'

type OrganizationData = {
  title: string
  type: 'Owner' | 'Property_Manager' | ''
}

type StaffData = {
  first_name: string
  last_name: string
  phone_number: string
  organization_id: string
  role_id: string
}

export async function createOrganization(data: OrganizationData): Promise<{ error?: string; organizationId?: string; roleId?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'You must be logged in to create an organization' }
  }

  // Validation
  if (!data.title.trim()) {
    return { error: 'Organization name is required' }
  }

  if (!data.type) {
    return { error: 'Organization type is required' }
  }

  try {
    // Create organization and admin role in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create organization
      const org = await tx.organizations.create({
        data: {
          title: data.title,
          type: data.type as organization_type,
          created_by: user.id,
        },
      })

      // Step 2: Create default "Admin" role for the organization
      const role = await tx.roles.create({
        data: {
          title: 'Admin',
          organization_id: org.id,
          created_by: user.id,
        },
      })

      return { org, role }
    })

    return { organizationId: result.org.id, roleId: result.role.id }
  } catch (error: any) {
    console.error('Error creating organization:', error)
    return { error: error.message || 'Failed to create organization. Please try again.' }
  }
}

export async function completeStaffProfile(data: StaffData): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'You must be logged in to complete your profile' }
  }

  // Validation
  if (!data.first_name.trim()) {
    return { error: 'First name is required' }
  }

  if (!data.phone_number.trim()) {
    return { error: 'Phone number is required' }
  }

  if (!data.organization_id) {
    return { error: 'Organization ID is required' }
  }

  if (!data.role_id) {
    return { error: 'Role ID is required' }
  }

  try {
    // Generate next staff_id for this organization
    const lastStaff = await prisma.staff.findFirst({
      where: { organization_id: data.organization_id },
      orderBy: { created_at: 'desc' },
      select: { staff_id: true }
    })

    let nextNumber = 1
    if (lastStaff?.staff_id) {
      // Extract number from STF-####
      const match = lastStaff.staff_id.match(/STF-(\d{4})/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const generatedStaffId = `STF-${nextNumber.toString().padStart(4, '0')}`

    // Create staff record in public.staff table
    await prisma.staff.create({
      data: {
        id: user.id, // Use auth user's ID as staff ID (primary key)
        staff_id: generatedStaffId,
        first_name: data.first_name,
        last_name: data.last_name || null,
        phone_number: data.phone_number,
        role_id: data.role_id,
        organization_id: data.organization_id,
        created_by: user.id,
      },
    })

    return {}
  } catch (error: any) {
    console.error('Error creating staff profile:', error)
    return { error: error.message || 'Failed to create staff profile. Please try again.' }
  }
}
