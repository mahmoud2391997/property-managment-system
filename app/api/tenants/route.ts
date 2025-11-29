import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { user, staff: currentStaff, error } = await getUserAndStaff()

    if (error) return error

    const formData = await request.formData()
    const identityType = formData.get('identityType') as string
    const identityNumber = formData.get('identityNumber') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string | null
    const phoneNumber = formData.get('phoneNumber') as string
    const email = formData.get('email') as string
    const profileImage = formData.get('profileImage') as Blob | null
    const profileThumb = formData.get('profileThumb') as Blob | null

    // Validation
    if (!identityType || !['mykad', 'passport'].includes(identityType.toLowerCase())) {
      return NextResponse.json(
        { error: 'Valid identity type is required (mykad or passport)' },
        { status: 400 }
      )
    }

    if (!identityNumber || !identityNumber.trim()) {
      return NextResponse.json(
        { error: 'Identity number is required' },
        { status: 400 }
      )
    }

    if (!firstName || !firstName.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if identity number already exists
    const existingTenant = await prisma.individual_tenants.findUnique({
      where: { identity_number: identityNumber.trim() }
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'A tenant with this identity number already exists' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Create auth user first (unconfirmed, will manually send invite)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      email_confirm: false,
      user_metadata: {
        user_type: 'tenant'
      }
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Send invitation email with tenant-specific redirect
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim(),
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4000'}/api/auth/confirm-tenant`
      }
    )

    if (inviteError) {
      console.error('Error sending invite email:', inviteError)
      // Clean up the created user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    let profilePicUrl: string | null = null
    let profileThumbUrl: string | null = null

    // Upload images to Supabase Storage if provided
    if (profileImage && profileThumb) {
      const tenantId = authData.user.id

      // Upload main profile image
      const mainImageBuffer = Buffer.from(await profileImage.arrayBuffer())
      const { data: mainData, error: mainError } = await supabase.storage
        .from('tenants')
        .upload(`${tenantId}/profile.jpg`, mainImageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (mainError) {
        console.error('Error uploading main image:', mainError)
        // Clean up auth user if image upload fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json(
          { error: 'Failed to upload profile image' },
          { status: 500 }
        )
      }

      // Upload thumbnail
      const thumbImageBuffer = Buffer.from(await profileThumb.arrayBuffer())
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('tenants')
        .upload(`${tenantId}/thumb.jpg`, thumbImageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (thumbError) {
        console.error('Error uploading thumbnail:', thumbError)
        // Clean up main image and auth user if thumb upload fails
        await supabase.storage.from('tenants').remove([mainData.path])
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json(
          { error: 'Failed to upload thumbnail image' },
          { status: 500 }
        )
      }

      // Get public URLs
      const { data: mainUrl } = supabase.storage
        .from('tenants')
        .getPublicUrl(mainData.path)

      const { data: thumbUrl } = supabase.storage
        .from('tenants')
        .getPublicUrl(thumbData.path)

      profilePicUrl = mainUrl.publicUrl
      profileThumbUrl = thumbUrl.publicUrl
    }

    // Create tenant, individual_tenant, and organizations_tenants records in a transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create tenant record
        const newTenant = await tx.tenants.create({
          data: {
            id: authData.user.id,
            type: 'Individual', // tenant_type enum value
            profile_pic: profilePicUrl,
            profile_thumb: profileThumbUrl,
            created_by: user.id
          }
        })

        // Create individual_tenant record
        // tenant_id references tenants.id (the Supabase user UUID)
        const newIndividualTenant = await tx.individual_tenants.create({
          data: {
            tenant_id: authData.user.id,
            identity_type: identityType.toLowerCase() as 'mykad' | 'passport',
            identity_number: identityNumber.trim(),
            first_name: firstName.trim(),
            last_name: lastName?.trim() || null,
            phone_number: phoneNumber.trim()
          }
        })

        // Link tenant to organization
        const organizationTenant = await tx.organizations_tenants.create({
          data: {
            tenant_id: authData.user.id,
            organization_id: currentStaff.organization_id,
            created_by: user.id
          }
        })

        return { newTenant, newIndividualTenant, organizationTenant }
      })

      return NextResponse.json(
        {
          success: true,
          tenant: {
            id: result.newTenant.id,
            firstName: result.newIndividualTenant.first_name,
            lastName: result.newIndividualTenant.last_name,
            email: email.trim(),
            identityType: result.newIndividualTenant.identity_type,
            identityNumber: result.newIndividualTenant.identity_number,
            phoneNumber: result.newIndividualTenant.phone_number,
            profilePic: result.newTenant.profile_pic,
            profileThumb: result.newTenant.profile_thumb
          }
        },
        { status: 201 }
      )
    } catch (dbError: any) {
      console.error('Error creating tenant record:', dbError)
      // Clean up auth user and images if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      if (profilePicUrl && profileThumbUrl) {
        await supabase.storage.from('tenants').remove([
          `${authData.user.id}/profile.jpg`,
          `${authData.user.id}/thumb.jpg`
        ])
      }
      return NextResponse.json(
        { error: dbError.message || 'Failed to create tenant record' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, staff: currentStaff, error } = await getUserAndStaff()

    if (error) return error

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('id')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Verify the tenant exists and belongs to the same organization
    const organizationTenant = await prisma.organizations_tenants.findFirst({
      where: {
        tenant_id: tenantId,
        organization_id: currentStaff.organization_id
      }
    })

    if (!organizationTenant) {
      return NextResponse.json(
        { error: 'Tenant not found or unauthorized' },
        { status: 404 }
      )
    }

    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Delete tenant records from database (cascade will handle individual_tenants)
    await prisma.tenants.delete({
      where: { id: tenantId }
    })

    // Delete profile images from storage if they exist
    const { data: files } = await supabase.storage
      .from('tenants')
      .list(tenantId)

    if (files && files.length > 0) {
      const filePaths = files.map(file => `${tenantId}/${file.name}`)
      await supabase.storage
        .from('tenants')
        .remove(filePaths)
    }

    // Delete user from Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(tenantId)

    return NextResponse.json(
      {
        success: true,
        message: 'Tenant deleted successfully'
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    )
  }
}
