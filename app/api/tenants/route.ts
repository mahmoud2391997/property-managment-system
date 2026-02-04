import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { getBaseUrl } from '@/utils/get-base-url'
import { transformTenant } from '@/lib/tenants-utils'

// Shared select for tenant queries via organizations_tenants junction table
const tenantSelect = {
  tenants: {
    select: {
      id: true,
      type: true,
      profile_pic: true,
      profile_thumb: true,
      invite_sent: true,
      individual_tenants: {
        select: {
          identity_type: true,
          identity_number: true,
          first_name: true,
          last_name: true,
          phone_number: true
        }
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { staff: currentStaff, error } = await getUserAndStaff()

    if (error) return error

    const { searchParams } = new URL(request.url)

    // Pagination and search params
    const paginate = searchParams.get('paginate') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')?.trim() || ''
    const skipCount = searchParams.get('skipCount') === 'true'

    // Advanced filter params
    const rentalStatusFilter = searchParams.get('rental_status')?.trim() || ''
    const typeFilter = searchParams.get('type')?.trim() || ''
    const identityTypeFilter = searchParams.get('identity_type')?.trim() || ''
    const accountStatusFilter = searchParams.get('account_status')?.trim() || ''
    const nameFilter = searchParams.get('name')?.trim() || ''
    const emailFilter = searchParams.get('email')?.trim() || ''
    const identityNumberFilter = searchParams.get('identity_number')?.trim() || ''
    const phoneNumberFilter = searchParams.get('phone_number')?.trim() || ''

    // Check if we need frontend filtering (for calculated fields)
    const needsFrontendFiltering =
      (rentalStatusFilter && rentalStatusFilter !== 'all') ||
      accountStatusFilter ||
      emailFilter

    if (paginate) {
      // Build where clause with search and filters
      // Search is done on individual_tenants fields via tenants relation
      const whereClause: any = {
        organization_id: currentStaff.organization_id,
        tenants: {
          type: typeFilter || 'Individual',
          ...(identityTypeFilter && {
            individual_tenants: {
              identity_type: identityTypeFilter
            }
          })
        }
      }

      // Build OR conditions for search and text filters
      const orConditions: any[] = []

      // Search across multiple fields
      if (search) {
        orConditions.push(
          { tenants: { individual_tenants: { first_name: { contains: search, mode: 'insensitive' } } } },
          { tenants: { individual_tenants: { last_name: { contains: search, mode: 'insensitive' } } } },
          { tenants: { individual_tenants: { identity_number: { contains: search, mode: 'insensitive' } } } },
          { tenants: { individual_tenants: { phone_number: { contains: search, mode: 'insensitive' } } } }
        )
      }

      if (orConditions.length > 0) {
        whereClause.OR = orConditions
      }

      // Add AND conditions for specific text filters
      const andConditions: any[] = []

      if (nameFilter) {
        andConditions.push({
          OR: [
            { tenants: { individual_tenants: { first_name: { contains: nameFilter, mode: 'insensitive' } } } },
            { tenants: { individual_tenants: { last_name: { contains: nameFilter, mode: 'insensitive' } } } }
          ]
        })
      }

      if (identityNumberFilter) {
        andConditions.push({
          tenants: { individual_tenants: { identity_number: { contains: identityNumberFilter, mode: 'insensitive' } } }
        })
      }

      if (phoneNumberFilter) {
        andConditions.push({
          tenants: { individual_tenants: { phone_number: { contains: phoneNumberFilter, mode: 'insensitive' } } }
        })
      }

      if (andConditions.length > 0) {
        whereClause.AND = andConditions
      }

      // Fetch tenants - if frontend filtering needed, get all matching records
      // Otherwise use server-side pagination
      const organizationTenants = await prisma.organizations_tenants.findMany({
        where: whereClause,
        select: tenantSelect,
        orderBy: { created_at: 'desc' },
        ...(needsFrontendFiltering ? {} : {
          skip: (page - 1) * limit,
          take: limit
        })
      })

      // Get tenant IDs for active lease count query
      const tenantIds = organizationTenants.map(ot => ot.tenants.id)

      // Get active lease counts for all tenants in one query
      let leaseCountMap = new Map<string, number>()

      if (tenantIds.length > 0) {
        // Get all active leases for these tenants
        const activeLeases = await prisma.leases.findMany({
          where: {
            tenant_id: { in: tenantIds },
            organization_id: currentStaff.organization_id,
            status: 'Current'
          },
          select: { tenant_id: true }
        })

        // Count leases per tenant
        for (const lease of activeLeases) {
          const currentCount = leaseCountMap.get(lease.tenant_id) || 0
          leaseCountMap.set(lease.tenant_id, currentCount + 1)
        }
      }

      // Get active booking counts for all tenants in one query
      let bookingCountMap = new Map<string, number>()

      if (tenantIds.length > 0) {
        const activeBookings = await prisma.bookings.findMany({
          where: {
            tenant_id: { in: tenantIds },
            properties: {
              organization_id: currentStaff.organization_id
            },
            status: 'Current'
          },
          select: { tenant_id: true }
        })

        for (const booking of activeBookings) {
          const currentCount = bookingCountMap.get(booking.tenant_id) || 0
          bookingCountMap.set(booking.tenant_id, currentCount + 1)
        }
      }

      // Get account activation status and email from Supabase Auth for this page of tenants
      const supabaseAdmin = createAdminClient()
      const tenantsWithStatus = await Promise.all(
        organizationTenants.map(async (ot) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(ot.tenants.id)

          const wasInvited = !!authUser?.user?.invited_at
          const passwordSet = authUser?.user?.app_metadata?.password_set === true
          const isActivated = wasInvited ? passwordSet : true
          const email = authUser?.user?.email || ''
          const accountStatus = isActivated ? 'Activated' as const : 'Pending' as const
          const activeLeaseCount = leaseCountMap.get(ot.tenants.id) || 0
          const activeBookingCount = bookingCountMap.get(ot.tenants.id) || 0

          return transformTenant(ot, email, accountStatus, activeLeaseCount, activeBookingCount)
        })
      )

      // Apply frontend filtering for calculated fields
      let filteredTenants = tenantsWithStatus

      // Filter by rental status
      if (rentalStatusFilter && rentalStatusFilter !== 'all') {
        filteredTenants = filteredTenants.filter(t => t.rental_status === rentalStatusFilter)
      }

      // Filter by account status (calculated from Supabase auth)
      if (accountStatusFilter) {
        filteredTenants = filteredTenants.filter(t => t.accountStatus === accountStatusFilter)
      }

      // Filter by email (from Supabase auth)
      if (emailFilter) {
        filteredTenants = filteredTenants.filter(t =>
          t.email.toLowerCase().includes(emailFilter.toLowerCase())
        )
      }

      // Calculate total and apply pagination for frontend-filtered results
      const finalTotal = needsFrontendFiltering ? filteredTenants.length : await prisma.organizations_tenants.count({ where: whereClause })
      const paginatedTenants = needsFrontendFiltering
        ? filteredTenants.slice((page - 1) * limit, page * limit)
        : filteredTenants

      return NextResponse.json({
        success: true,
        data: paginatedTenants,
        total: finalTotal,
        page,
        pageSize: limit
      })
    }

    // Legacy mode: return all tenants (for backward compatibility)
    const organizationTenants = await prisma.organizations_tenants.findMany({
      where: {
        organization_id: currentStaff.organization_id
      },
      select: tenantSelect,
      orderBy: { created_at: 'desc' }
    })

    // Filter for Individual type only
    const tenants = organizationTenants.filter(ot => ot.tenants.type === 'Individual')

    // Get tenant IDs for active lease count query
    const tenantIds = tenants.map(ot => ot.tenants.id)

    // Get active lease counts for all tenants in one query
    let leaseCountMap = new Map<string, number>()

    if (tenantIds.length > 0) {
      // Get all active leases for these tenants
      const activeLeases = await prisma.leases.findMany({
        where: {
          tenant_id: { in: tenantIds },
          organization_id: currentStaff.organization_id,
          status: 'Current'
        },
        select: { tenant_id: true }
      })

      // Count leases per tenant
      for (const lease of activeLeases) {
        const currentCount = leaseCountMap.get(lease.tenant_id) || 0
        leaseCountMap.set(lease.tenant_id, currentCount + 1)
      }
    }

    // Get active booking counts for all tenants in one query
    let bookingCountMap = new Map<string, number>()

    if (tenantIds.length > 0) {
      const activeBookings = await prisma.bookings.findMany({
        where: {
          tenant_id: { in: tenantIds },
          properties: {
            organization_id: currentStaff.organization_id
          },
          status: 'Current'
        },
        select: { tenant_id: true }
      })

      for (const booking of activeBookings) {
        const currentCount = bookingCountMap.get(booking.tenant_id) || 0
        bookingCountMap.set(booking.tenant_id, currentCount + 1)
      }
    }

    // Get account activation status and email from Supabase Auth
    const supabaseAdmin = createAdminClient()
    const tenantsWithStatus = await Promise.all(
      tenants.map(async (ot) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(ot.tenants.id)

        const wasInvited = !!authUser?.user?.invited_at
        const passwordSet = authUser?.user?.app_metadata?.password_set === true
        const isActivated = wasInvited ? passwordSet : true
        const email = authUser?.user?.email || ''
        const accountStatus = isActivated ? 'Activated' as const : 'Pending' as const
        const activeLeaseCount = leaseCountMap.get(ot.tenants.id) || 0
        const activeBookingCount = bookingCountMap.get(ot.tenants.id) || 0

        return transformTenant(ot, email, accountStatus, activeLeaseCount, activeBookingCount)
      })
    )

    return NextResponse.json(tenantsWithStatus)
  } catch (error: any) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}

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

    // ============ OLD (uncomment when ready to send emails) ============
    // // Create auth user first (unconfirmed, will manually send invite)
    // const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    //   email: email.trim(),
    //   email_confirm: false,
    //   user_metadata: {
    //     user_type: 'tenant'
    //   }
    // })

    // if (authError || !authData.user) {
    //   console.error('Error creating auth user:', authError)
    //   return NextResponse.json(
    //     { error: authError?.message || 'Failed to create user account' },
    //     { status: 500 }
    //   )
    // }

    // // Send invitation email with tenant-specific redirect
    // const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    //   email.trim(),
    //   {
    //     redirectTo: `${getBaseUrl()}/api/auth/confirm-tenant`
    //   }
    // )

    // if (inviteError) {
    //   console.error('Error sending invite email:', inviteError)
    //   // Clean up the created user
    //   await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    //   return NextResponse.json(
    //     { error: 'Failed to send confirmation email' },
    //     { status: 500 }
    //   )
    // }
    // ============ END OLD ============

    // ============ TEMPORARY NEW (remove when ready to send emails) ============
    // Use generateLink with type 'invite' to create user in invited/pending state WITHOUT sending email
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email.trim(),
      options: {
        redirectTo: `${getBaseUrl()}/api/auth/confirm-tenant`,
        data: {
          user_type: 'tenant'
        }
      }
    })

    if (linkError || !linkData.user) {
      console.error('Error creating auth user:', linkError)

      // Check for duplicate email error - Supabase returns status 422 for duplicate emails
      if (linkError?.status === 422 || linkError?.code === '23505') {
        return NextResponse.json(
          { error: 'A tenant with this email address already exists' },
          { status: 400 }
        )
      }

      // Don't expose internal error details to users
      return NextResponse.json(
        { error: 'Failed to create user account. Please try again.' },
        { status: 500 }
      )
    }

    const authData = { user: linkData.user }
    // ============ END TEMPORARY NEW ============

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

      // Check for specific database constraint violations
      // PostgreSQL error code 23505 is for unique constraint violations
      if (dbError.code === 'P2002' || dbError.code === '23505') {
        // Prisma code P2002 means unique constraint failed
        const target = dbError.meta?.target || []
        if (target.includes('identity_number')) {
          return NextResponse.json(
            { error: 'A tenant with this identity number already exists' },
            { status: 400 }
          )
        }
      }

      // Don't expose internal database errors to users
      return NextResponse.json(
        { error: 'Failed to create tenant. Please try again.' },
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
