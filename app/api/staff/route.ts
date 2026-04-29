import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/utils/get-base-url'

export async function GET (request: Request) {
  try {
    const { user, staff: currentStaff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'staff.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { searchParams } = new URL(request.url)
    const selectParam = searchParams.get('select')

    // Build select object based on query parameter
    let selectObject: any = {}

    if (selectParam) {
      // Parse comma-separated fields: ?select=id,first_name,last_name
      const fields = selectParam.split(',').map(f => f.trim())
      fields.forEach(field => {
        selectObject[field] = true
      })
    } else {
      // If no select param, return all fields
      selectObject = {
        id: true,
        staff_id: true,
        first_name: true,
        last_name: true,
        role_id: true,
        profile_pic: true,
        profile_thumb: true,
        created_at: true,
        created_by: true
      }
    }

    // If no select param provided, include roles relation by default
    if (!selectParam) {
      selectObject.roles = {
        select: {
          title: true
        }
      }
    }

    // Fetch staff for the organization
    const staff = await prisma.staff.findMany({
      where: {
        organization_id: currentStaff.organization_id
      },
      select: selectObject,
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json(
      {
        success: true,
        staff
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

async function generateStaffId (organizationId: string): Promise<string> {
  // Get all staff IDs for this organization and find the highest number
  const staffMembers = await prisma.staff.findMany({
    where: { organization_id: organizationId },
    select: { staff_id: true }
  })

  if (!staffMembers || staffMembers.length === 0) {
    return 'STF-0001'
  }

  // Extract numeric parts and find the highest
  const numbers = staffMembers
    .map(s => parseInt(s.staff_id.split('-')[1]))
    .filter(n => !isNaN(n))
  
  const maxNumber = Math.max(...numbers)
  const newNumber = maxNumber + 1
  return `STF-${newNumber.toString().padStart(4, '0')}`
}

export async function POST (request: Request) {
  const supabaseAdmin = createAdminClient()
  
  // Declare at function scope to be accessible in catch block
  let authUserId: string | null = null
  let profilePicUrl: string | null = null
  let profileThumbUrl: string | null = null
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null
  
  try {
    const { user, staff: currentStaff, permissions, error } = await getUserAndStaff()

    if (error) return error

    if (!hasPermission(permissions, 'staff.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const formData = await request.formData()
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string | null
    const email = formData.get('email') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const roleId = formData.get('roleId') as string
    const profileImage = formData.get('profileImage') as Blob | null
    const profileThumb = formData.get('profileThumb') as Blob | null

    // Validation
    if (!firstName || !firstName.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!roleId || !roleId.trim()) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    // Verify role belongs to organization
    const role = await prisma.roles.findFirst({
      where: {
        id: roleId,
        organization_id: currentStaff.organization_id
      }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      )
    }

    const supabaseOrNull = await createClient()
    supabase = supabaseOrNull

    // Create auth user first (unconfirmed, will manually send invite)
    const { data: newAuthUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        email_confirm: false,
        user_metadata: {
          user_type: 'staff'
        }
      })

    if (authError || !newAuthUser?.user) {
      console.error('Error creating auth user:', authError)

      // Check for duplicate email error - Supabase returns status 422 for duplicate emails
      if (authError?.status === 422 || authError?.code === '23505') {
        return NextResponse.json(
          { error: 'A staff member with this email address already exists' },
          { status: 400 }
        )
      }

      // Don't expose internal error details to users
      return NextResponse.json(
        { error: 'Failed to create user account. Please try again.' },
        { status: 500 }
      )
    }

    authUserId = newAuthUser.user.id

    // Send custom confirmation email with staff-specific redirect
    const { error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
        redirectTo: `${getBaseUrl()}/api/auth/confirm-staff`
      })

    if (inviteError) {
      console.error('Error sending invite email:', inviteError)
      // Clean up the created user
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    // Upload images to Supabase Storage if provided
    if (profileImage && profileThumb) {
      const staffId = authUserId!

      // Upload main profile image
      const mainImageBuffer = Buffer.from(await profileImage.arrayBuffer())
      const { data: mainData, error: mainError } = await supabase!.storage
        .from('staff')
        .upload(`${staffId}/profile.jpg`, mainImageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (mainError) {
        console.error('Error uploading main image:', mainError)
        // Clean up auth user if image upload fails
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
        return NextResponse.json(
          { error: 'Failed to upload profile image' },
          { status: 500 }
        )
      }

      // Upload thumbnail
      const thumbImageBuffer = Buffer.from(await profileThumb.arrayBuffer())
      const { data: thumbData, error: thumbError } = await supabase!.storage
        .from('staff')
        .upload(`${staffId}/thumb.jpg`, thumbImageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (thumbError) {
        console.error('Error uploading thumbnail:', thumbError)
        // Clean up main image and auth user if thumb upload fails
        await supabase!.storage.from('staff').remove([mainData.path])
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
        return NextResponse.json(
          { error: 'Failed to upload thumbnail image' },
          { status: 500 }
        )
      }

      // Get public URLs
      const { data: mainUrl } = supabase!.storage
        .from('staff')
        .getPublicUrl(mainData.path)

      const { data: thumbUrl } = supabase!.storage
        .from('staff')
        .getPublicUrl(thumbData.path)

      profilePicUrl = mainUrl.publicUrl
      profileThumbUrl = thumbUrl.publicUrl
    }

    // Generate staff ID (with retry logic for race conditions)
    let staffId: string = ''
    let newStaff: any
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      try {
        staffId = await generateStaffId(currentStaff.organization_id)
        break
      } catch (error) {
        attempts++
        if (attempts >= maxAttempts) {
          throw new Error('Failed to generate staff ID after multiple attempts')
        }
        // Small delay to allow other concurrent operations to complete
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Create staff record with retry logic
    attempts = 0
    
    while (attempts < maxAttempts) {
      try {
        newStaff = await prisma.staff.create({
          data: {
            id: authUserId,
            staff_id: staffId,
            first_name: firstName.trim(),
            last_name: lastName?.trim() || null,
            phone_number: phoneNumber.trim(),
            role_id: roleId,
            profile_pic: profilePicUrl,
            profile_thumb: profileThumbUrl,
            organization_id: currentStaff.organization_id,
            created_by: user.id
          }
        })
        break
      } catch (dbError: any) {
        attempts++
        
        // If it's a unique constraint violation on staff_id, regenerate and retry
        if (dbError.code === 'P2002' && dbError.meta?.target?.includes('staff_id') && attempts < maxAttempts) {
          staffId = await generateStaffId(currentStaff.organization_id)
          continue
        }
        
        // For other errors or max attempts reached, throw
        throw dbError
      }
    }

    return NextResponse.json(
      {
        success: true,
        staff: {
          id: newStaff.id,
          staffId: newStaff.staff_id,
          firstName: newStaff.first_name,
          lastName: newStaff.last_name,
          email: email.trim(),
          roleId: newStaff.role_id,
          profilePic: newStaff.profile_pic,
          profileThumb: newStaff.profile_thumb
        }
      },
      { status: 201 }
    )
  } catch (dbError: any) {
    console.error('Error creating staff record:', dbError)
    // Clean up auth user and images if database insert fails
    if (authUserId) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
    }
    if (profilePicUrl && profileThumbUrl && authUserId && supabase) {
      await supabase!.storage
        .from('staff')
        .remove([
          `${authUserId}/profile.jpg`,
          `${authUserId}/thumb.jpg`
        ])
    }

    // Check for specific database constraint violations
    // PostgreSQL error code 23505 is for unique constraint violations
    if (dbError.code === 'P2002' || dbError.code === '23505') {
      // Prisma code P2002 means unique constraint failed
      const target = dbError.meta?.target || []
      if (target.includes('staff_id')) {
        return NextResponse.json(
          { error: 'A staff member with this ID already exists' },
          { status: 400 }
        )
      }
    }

    // Don't expose internal database errors to users
    return NextResponse.json(
      { error: 'Failed to create staff member. Please try again.' },
      { status: 500 }
    )
  }
}

export async function DELETE (request: Request) {
  try {
    const { user, staff: currentStaff, permissions, error } = await getUserAndStaff()

// ... (rest of the code remains the same)


    if (!hasPermission(permissions, 'staff.delete'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('id')

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      )
    }

    // Verify the staff member exists and belongs to the same organization
    const targetStaff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        organization_id: true
      }
    })

    if (!targetStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    if (targetStaff.organization_id !== currentStaff?.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Prevent self-deletion
    if (staffId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if target staff is the organization creator
    const organization = await prisma.organizations.findUnique({
      where: { id: currentStaff?.organization_id },
      select: { created_by: true }
    })

    if (organization?.created_by === staffId) {
      return NextResponse.json(
        { error: 'Cannot delete the organization owner' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Delete staff record from database
    await prisma.staff.delete({
      where: { id: staffId }
    })

    // Delete profile images from storage if they exist
    const { data: files } = await supabase.storage.from('staff').list(staffId)

    if (files && files.length > 0) {
      const filePaths = files.map(file => `${staffId}/${file.name}`)
      await supabase.storage.from('staff').remove(filePaths)
    }

    // Delete user from Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(staffId)

    return NextResponse.json(
      {
        success: true,
        message: 'Staff member deleted successfully'
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting staff:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff' },
      { status: 500 }
    )
  }
}
