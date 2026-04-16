import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { staff: currentStaff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'tenants.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { tenantId } = await params

    // Verify the tenant exists and belongs to the same organization
    const organizationTenant = await prisma.organizations_tenants.findFirst({
      where: {
        tenant_id: tenantId,
        organization_id: currentStaff.organization_id
      },
      include: {
        tenants: {
          include: {
            individual_tenants: true,
            company_tenants: true
          }
        }
      }
    })

    if (!organizationTenant) {
      return NextResponse.json(
        { error: 'Tenant not found or unauthorized' },
        { status: 404 }
      )
    }

    const tenant = organizationTenant.tenants

    // Get account activation status and email from Supabase Auth
    const supabaseAdmin = createAdminClient()
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(tenantId)

    const wasInvited = !!authUser?.user?.invited_at
    const passwordSet = authUser?.user?.app_metadata?.password_set === true
    const isActivated = wasInvited ? passwordSet : true
    const email = authUser?.user?.email || ''
    const accountStatus = isActivated ? 'Activated' : 'Pending'

    // Get active leases with property, room, scheduled change, and pending payment details
    const leases = await prisma.leases.findMany({
      where: {
        tenant_id: tenantId,
        organization_id: currentStaff.organization_id
      },
      include: {
        properties: {
          select: {
            id: true,
            code: true,
            street_address: true,
            city: true,
            type: true
          }
        },
        rooms: {
          select: {
            id: true,
            title: true
          }
        },
        scheduled_rental_changes: {
          where: {
            status: 'Scheduled'
          },
          select: {
            id: true,
            old_monthly_rent: true,
            new_monthly_rent: true,
            effective_from: true
          },
          take: 1
        },
        payments: {
          where: {
            type: 'Rental',
            status: 'Pending'
          },
          select: {
            id: true,
            due_payment_timestamp: true,
            charges: {
              select: {
                amount: true,
                is_taxed: true
              }
            }
          },
          orderBy: {
            due_payment_timestamp: 'asc'
          },
          take: 1
        }
      },
      orderBy: [
        { status: 'asc' }, // Current first
        { start_date: 'desc' }
      ]
    })

    // Format lease data
    const formattedLeases = leases.map(lease => {
      const scheduledChange = lease.scheduled_rental_changes[0]
      const pendingPayment = lease.payments[0]

      // Calculate pending payment amount from charges
      let pendingRentAmount = Number(lease.monthly_rent)
      let pendingDueDate: string | null = null

      if (pendingPayment) {
        pendingRentAmount = pendingPayment.charges.reduce((sum, charge) => {
          const chargeAmount = Number(charge.amount)
          const tax = charge.is_taxed ? chargeAmount * 0.08 : 0
          return sum + chargeAmount + tax
        }, 0)
        pendingDueDate = pendingPayment.due_payment_timestamp?.toISOString() || null
      }

      return {
        id: lease.id,
        reference_id: lease.reference_id,
        status: lease.status,
        monthly_rent: pendingRentAmount, // Use pending payment amount if available
        payment_day: lease.payment_day,
        start_date: lease.start_date.toISOString(),
        number_of_months: lease.number_of_months,
        ended_at: lease.ended_at?.toISOString() || null,
        due_date: pendingDueDate,
        property: {
          id: lease.properties.id,
          code: lease.properties.code,
          address: lease.properties.street_address,
          city: lease.properties.city,
          type: lease.properties.type
        },
        room: lease.rooms ? {
          id: lease.rooms.id,
          title: lease.rooms.title
        } : null,
        // Determines if this is a room lease or property lease
        isRoomLease: !!lease.room_id,
        // Scheduled rental change (if any)
        scheduled_change: scheduledChange
          ? {
              id: scheduledChange.id,
              old_rent: scheduledChange.old_monthly_rent,
              new_rent: scheduledChange.new_monthly_rent,
              effective_from: scheduledChange.effective_from.toISOString()
            }
          : null
      }
    })

    // Get tenant details based on type
    let tenantDetails: any = {
      id: tenant.id,
      type: tenant.type,
      profile_pic: tenant.profile_pic,
      profile_thumb: tenant.profile_thumb,
      email,
      accountStatus,
      inviteSent: tenant.invite_sent ?? false,
      identityDocumentUrl: tenant.identity_card_url || null,
      createdAt: organizationTenant.created_at.toISOString()
    }

    if (tenant.type === 'Individual' && tenant.individual_tenants) {
      tenantDetails = {
        ...tenantDetails,
        first_name: tenant.individual_tenants.first_name,
        last_name: tenant.individual_tenants.last_name,
        phone_number: tenant.individual_tenants.phone_number,
        identity_type: tenant.individual_tenants.identity_type,
        identity_number: tenant.individual_tenants.identity_number
      }
    } else if (tenant.type === 'Company' && tenant.company_tenants) {
      tenantDetails = {
        ...tenantDetails,
        company_name: tenant.company_tenants.company_name,
        registration_no: tenant.company_tenants.registration_no,
        contact_person_first_name: tenant.company_tenants.contact_person_first_name,
        contact_person_last_name: tenant.company_tenants.contact_person_last_name,
        phone_number: tenant.company_tenants.phone_number
      }
    }

    return NextResponse.json({
      success: true,
      tenant: tenantDetails,
      leases: formattedLeases,
      activeLeaseCount: formattedLeases.filter(l => l.status === 'Current').length,
      totalLeaseCount: formattedLeases.length
    })
  } catch (error: any) {
    console.error('Error fetching tenant details:', error)
    return NextResponse.json({ error: 'Failed to fetch tenant details' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { staff: currentStaff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'tenants.update'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { tenantId } = await params

    // Verify the tenant exists and belongs to the same organization
    const organizationTenant = await prisma.organizations_tenants.findFirst({
      where: {
        tenant_id: tenantId,
        organization_id: currentStaff.organization_id
      },
      include: {
        tenants: {
          include: {
            individual_tenants: true,
            company_tenants: true
          }
        }
      }
    })

    if (!organizationTenant) {
      return NextResponse.json(
        { error: 'Tenant not found or unauthorized' },
        { status: 404 }
      )
    }

    const tenant = organizationTenant.tenants
    const formData = await request.formData()

    const identityType = formData.get('identityType') as string | null
    const identityNumber = formData.get('identityNumber') as string | null
    const firstName = formData.get('firstName') as string | null
    const lastName = formData.get('lastName') as string | null
    const phoneNumber = formData.get('phoneNumber') as string | null
    const email = formData.get('email') as string | null
    const profileImage = formData.get('profileImage') as Blob | null
    const profileThumb = formData.get('profileThumb') as Blob | null

    // Check account activation status from Supabase Auth
    const supabaseAdmin = createAdminClient()
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(tenantId)

    const wasInvited = !!authUser?.user?.invited_at
    const passwordSet = authUser?.user?.app_metadata?.password_set === true
    const isActivated = wasInvited ? passwordSet : true
    const currentEmail = authUser?.user?.email || ''

    // Validation for Individual tenant
    if (tenant.type === 'Individual') {
      if (identityType && !['mykad', 'passport'].includes(identityType.toLowerCase())) {
        return NextResponse.json(
          { error: 'Valid identity type is required (mykad or passport)' },
          { status: 400 }
        )
      }

      if (identityNumber !== null && !identityNumber.trim()) {
        return NextResponse.json(
          { error: 'Identity number cannot be empty' },
          { status: 400 }
        )
      }

      if (firstName !== null && !firstName.trim()) {
        return NextResponse.json(
          { error: 'First name cannot be empty' },
          { status: 400 }
        )
      }

      if (phoneNumber !== null && !phoneNumber.trim()) {
        return NextResponse.json(
          { error: 'Phone number cannot be empty' },
          { status: 400 }
        )
      }

      // Check if identity number already exists (if changed)
      if (identityNumber && identityNumber.trim() !== tenant.individual_tenants?.identity_number) {
        const existingTenant = await prisma.individual_tenants.findUnique({
          where: { identity_number: identityNumber.trim() }
        })

        if (existingTenant) {
          return NextResponse.json(
            { error: 'A tenant with this identity number already exists' },
            { status: 400 }
          )
        }
      }
    }

    // Email validation and update (only allowed if account is not activated)
    if (email && email.trim() !== currentEmail) {
      // if (isActivated) {
      //   return NextResponse.json(
      //     { error: 'Cannot change email for an activated account' },
      //     { status: 400 }
      //   )
      // }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Update email in Supabase Auth
      const { error: updateEmailError } = await supabaseAdmin.auth.admin.updateUserById(
        tenantId,
        { email: email.trim() }
      )

      if (updateEmailError) {
        console.error('Error updating email:', updateEmailError)
        return NextResponse.json(
          { error: updateEmailError.message || 'Failed to update email' },
          { status: 500 }
        )
      }
    }

    const supabase = await createClient()

    let profilePicUrl: string | null = tenant.profile_pic
    let profileThumbUrl: string | null = tenant.profile_thumb

    // Upload new images to Supabase Storage if provided
    if (profileImage && profileThumb) {
      // Delete old images if they exist
      if (tenant.profile_pic || tenant.profile_thumb) {
        await supabase.storage.from('tenants').remove([
          `${tenantId}/profile.jpg`,
          `${tenantId}/thumb.jpg`
        ])
      }

      // Upload main profile image
      const mainImageBuffer = Buffer.from(await profileImage.arrayBuffer())
      const { data: mainData, error: mainError } = await supabase.storage
        .from('tenants')
        .upload(`${tenantId}/profile.jpg`, mainImageBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (mainError) {
        console.error('Error uploading main image:', mainError)
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
          upsert: true
        })

      if (thumbError) {
        console.error('Error uploading thumbnail:', thumbError)
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

    // Update tenant records in a transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update tenant record (profile pics)
        const updatedTenant = await tx.tenants.update({
          where: { id: tenantId },
          data: {
            profile_pic: profilePicUrl,
            profile_thumb: profileThumbUrl
          }
        })

        // Update individual_tenant record if applicable
        if (tenant.type === 'Individual') {
          const updateData: any = {}

          if (identityType) updateData.identity_type = identityType.toLowerCase() as 'mykad' | 'passport'
          if (identityNumber) updateData.identity_number = identityNumber.trim()
          if (firstName) updateData.first_name = firstName.trim()
          if (lastName !== null) updateData.last_name = lastName?.trim() || null
          if (phoneNumber) updateData.phone_number = phoneNumber.trim()

          if (Object.keys(updateData).length > 0) {
            await tx.individual_tenants.update({
              where: { tenant_id: tenantId },
              data: updateData
            })
          }
        }

        return updatedTenant
      })

      // Fetch updated tenant data
      const updatedTenantData = await prisma.individual_tenants.findUnique({
        where: { tenant_id: tenantId }
      })

      return NextResponse.json({
        success: true,
        tenant: {
          id: tenantId,
          firstName: updatedTenantData?.first_name,
          lastName: updatedTenantData?.last_name,
          identityType: updatedTenantData?.identity_type,
          identityNumber: updatedTenantData?.identity_number,
          phoneNumber: updatedTenantData?.phone_number,
          profilePic: profilePicUrl,
          profileThumb: profileThumbUrl
        }
      })
    } catch (dbError: any) {
      console.error('Error updating tenant record:', dbError)
      return NextResponse.json(
        { error: dbError.message || 'Failed to update tenant record' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}
