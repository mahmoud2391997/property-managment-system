'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getBaseUrl } from '@/utils/get-base-url'

export async function POST(request: NextRequest) {
  try {
    const { user, staff: currentStaff, error } = await getUserAndStaff()

    if (error) return error

    const formData = await request.formData()

    // Common fields
    const tenantType = formData.get('tenantType') as string // 'existing' | 'new'
    const propertyId = formData.get('propertyId') as string
    const roomId = formData.get('roomId') as string | null
    const moveInDate = formData.get('moveInDate') as string
    const amount = formData.get('amount') as string
    const receiptUrl = formData.get('receiptUrl') as string

    // Existing tenant fields
    const existingTenantId = formData.get('tenantId') as string | null

    // New tenant fields
    const identityType = formData.get('identityType') as string | null
    const identityNumber = formData.get('identityNumber') as string | null
    const firstName = formData.get('firstName') as string | null
    const lastName = formData.get('lastName') as string | null
    const phoneNumber = formData.get('phoneNumber') as string | null
    const email = formData.get('email') as string | null
    const profileImage = formData.get('profileImage') as Blob | null
    const profileThumb = formData.get('profileThumb') as Blob | null

    // ─── Validation ───
    if (!tenantType || !['existing', 'new'].includes(tenantType)) {
      return NextResponse.json(
        { error: 'Invalid tenant type' },
        { status: 400 }
      )
    }

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    if (!moveInDate) {
      return NextResponse.json(
        { error: 'Move-in date is required' },
        { status: 400 }
      )
    }

    const bookingAmount = parseFloat(amount)
    if (isNaN(bookingAmount) || bookingAmount <= 0) {
      return NextResponse.json(
        { error: 'A valid booking amount is required' },
        { status: 400 }
      )
    }

    if (!receiptUrl) {
      return NextResponse.json(
        { error: 'Receipt is required' },
        { status: 400 }
      )
    }

    if (tenantType === 'existing' && !existingTenantId) {
      return NextResponse.json(
        { error: 'Please select a tenant' },
        { status: 400 }
      )
    }

    if (tenantType === 'new') {
      if (!identityType || !['mykad', 'passport'].includes(identityType.toLowerCase())) {
        return NextResponse.json(
          { error: 'Valid identity type is required' },
          { status: 400 }
        )
      }
      if (!identityNumber?.trim()) {
        return NextResponse.json(
          { error: 'Identity number is required' },
          { status: 400 }
        )
      }
      if (!firstName?.trim()) {
        return NextResponse.json(
          { error: 'First name is required' },
          { status: 400 }
        )
      }
      if (!phoneNumber?.trim()) {
        return NextResponse.json(
          { error: 'Phone number is required' },
          { status: 400 }
        )
      }
      if (!email?.trim()) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        )
      }
    }

    // ─── Determine tenant ID ───
    let tenantId: string

    // Track resources created outside the transaction for cleanup on failure
    let createdAuthUserId: string | null = null
    let uploadedImagePaths: string[] = []

    const supabase = await createClient()

    if (tenantType === 'existing') {
      tenantId = existingTenantId!
    } else {
      // ─── Create new tenant ───

      // Check for duplicate identity number
      const existingByIdentity = await prisma.individual_tenants.findUnique({
        where: { identity_number: identityNumber!.trim() }
      })

      if (existingByIdentity) {
        return NextResponse.json(
          { error: 'A tenant with this identity number already exists' },
          { status: 400 }
        )
      }

      const supabaseAdmin = createAdminClient()

      // Create auth user (pending state, no email sent)
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: email!.trim(),
        options: {
          redirectTo: `${getBaseUrl()}/api/auth/confirm-tenant`,
          data: {
            user_type: 'tenant'
          }
        }
      })

      if (linkError || !linkData.user) {
        console.error('Error creating auth user for booking tenant:', linkError)

        if (linkError?.status === 422 || linkError?.code === '23505') {
          return NextResponse.json(
            { error: 'A tenant with this email address already exists' },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { error: 'Failed to create user account. Please try again.' },
          { status: 500 }
        )
      }

      tenantId = linkData.user.id
      createdAuthUserId = tenantId

      // Upload profile images if provided
      let profilePicUrl: string | null = null
      let profileThumbUrl: string | null = null

      if (profileImage && profileThumb) {
        const mainImageBuffer = Buffer.from(await profileImage.arrayBuffer())
        const { data: mainData, error: mainError } = await supabase.storage
          .from('tenants')
          .upload(`${tenantId}/profile.jpg`, mainImageBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          })

        if (mainError) {
          console.error('Error uploading main image:', mainError)
          await supabaseAdmin.auth.admin.deleteUser(tenantId)
          return NextResponse.json(
            { error: 'Failed to upload profile image' },
            { status: 500 }
          )
        }
        uploadedImagePaths.push(mainData.path)

        const thumbImageBuffer = Buffer.from(await profileThumb.arrayBuffer())
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('tenants')
          .upload(`${tenantId}/thumb.jpg`, thumbImageBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          })

        if (thumbError) {
          console.error('Error uploading thumbnail:', thumbError)
          await supabase.storage.from('tenants').remove([mainData.path])
          await supabaseAdmin.auth.admin.deleteUser(tenantId)
          return NextResponse.json(
            { error: 'Failed to upload thumbnail image' },
            { status: 500 }
          )
        }
        uploadedImagePaths.push(thumbData.path)

        const { data: mainUrl } = supabase.storage
          .from('tenants')
          .getPublicUrl(mainData.path)
        const { data: thumbUrl } = supabase.storage
          .from('tenants')
          .getPublicUrl(thumbData.path)

        profilePicUrl = mainUrl.publicUrl
        profileThumbUrl = thumbUrl.publicUrl
      }

      // Create tenant records in transaction
      try {
        await prisma.$transaction(async (tx) => {
          await tx.tenants.create({
            data: {
              id: tenantId,
              type: 'Individual',
              profile_pic: profilePicUrl,
              profile_thumb: profileThumbUrl,
              created_by: user!.id
            }
          })

          await tx.individual_tenants.create({
            data: {
              tenant_id: tenantId,
              identity_type: identityType!.toLowerCase() as 'mykad' | 'passport',
              identity_number: identityNumber!.trim(),
              first_name: firstName!.trim(),
              last_name: lastName?.trim() || null,
              phone_number: phoneNumber!.trim()
            }
          })

          await tx.organizations_tenants.create({
            data: {
              tenant_id: tenantId,
              organization_id: currentStaff!.organization_id,
              created_by: user!.id
            }
          })
        })
      } catch (dbError: any) {
        console.error('Error creating tenant records:', dbError)
        // Clean up auth user and images
        const supabaseAdmin2 = createAdminClient()
        await supabaseAdmin2.auth.admin.deleteUser(tenantId)
        if (uploadedImagePaths.length > 0) {
          await supabase.storage.from('tenants').remove(uploadedImagePaths)
        }

        if (dbError.code === 'P2002') {
          return NextResponse.json(
            { error: 'A tenant with this identity number already exists' },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { error: 'Failed to create tenant. Please try again.' },
          { status: 500 }
        )
      }
    }

    // ─── Create booking + payment in transaction ───
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Generate booking reference_id: BK-YYYY-#### (e.g., BK-2026-0001)
        const currentYear = new Date().getFullYear()
        const bookingYearPrefix = `BK-${currentYear}-`

        const latestBooking = await tx.bookings.findFirst({
          where: {
            reference_id: {
              startsWith: bookingYearPrefix
            },
            properties: {
              organization_id: currentStaff!.organization_id
            }
          },
          orderBy: {
            reference_id: 'desc'
          },
          select: {
            reference_id: true
          }
        })

        let bookingSequence = 1
        if (latestBooking) {
          const lastSeq = parseInt(latestBooking.reference_id.slice(-4))
          bookingSequence = lastSeq + 1
        }

        const bookingReferenceId = `${bookingYearPrefix}${bookingSequence
          .toString()
          .padStart(4, '0')}`

        // Create booking
        const booking = await tx.bookings.create({
          data: {
            tenant_id: tenantId,
            property_id: propertyId,
            room_id: roomId || null,
            move_in_timestamp: new Date(moveInDate),
            reference_id: bookingReferenceId,
            status: 'Current',
            created_by: currentStaff!.id
          }
        })

        // Generate payment reference_id: PY-YYYY00000001
        const paymentYearPrefix = `PY-${currentYear}`

        const latestPayment = await tx.payments.findFirst({
          where: {
            organization_id: currentStaff!.organization_id,
            reference_id: {
              startsWith: paymentYearPrefix
            }
          },
          orderBy: {
            reference_id: 'desc'
          },
          select: {
            reference_id: true
          }
        })

        let paymentSequence = 1
        if (latestPayment) {
          const lastSeq = parseInt(latestPayment.reference_id.slice(-8))
          paymentSequence = lastSeq + 1
        }

        const paymentReferenceId = `${paymentYearPrefix}${paymentSequence
          .toString()
          .padStart(8, '0')}`

        // Create payment (type: Booking, linked to booking_id)
        const payment = await tx.payments.create({
          data: {
            reference_id: paymentReferenceId,
            booking_id: booking.id,
            type: 'Booking',
            status: 'Paid',
            due_payment_timestamp: null,
            organization_id: currentStaff!.organization_id,
            created_by: currentStaff!.id,
            charges: {
              create: {
                title: 'Booking',
                amount: bookingAmount,
                is_taxed: false,
                is_refunded: false,
                created_by: currentStaff!.id
              }
            }
          }
        })

        // Create payment_history record
        await tx.payment_history.create({
          data: {
            payment_id: payment.id,
            amount: bookingAmount,
            payment_method: 'Bank_Transfer',
            paid_at: new Date(),
            registrar_role: 'staff',
            registrar: currentStaff!.id,
            receipt_image: receiptUrl,
            status: 'Success'
          }
        })

        return { booking, bookingReferenceId, paymentReferenceId }
      })

      return NextResponse.json(
        {
          success: true,
          booking: {
            id: result.booking.id,
            referenceId: result.bookingReferenceId
          }
        },
        { status: 201 }
      )
    } catch (dbError: any) {
      console.error('Error creating booking:', dbError)

      // If we created a new tenant for this booking and the booking failed,
      // we need to clean up the tenant too
      if (createdAuthUserId) {
        try {
          const supabaseAdmin = createAdminClient()
          // Delete tenant records first, then auth user
          await prisma.$transaction(async (tx) => {
            await tx.organizations_tenants.deleteMany({
              where: { tenant_id: createdAuthUserId! }
            })
            await tx.individual_tenants.deleteMany({
              where: { tenant_id: createdAuthUserId! }
            })
            await tx.tenants.deleteMany({
              where: { id: createdAuthUserId! }
            })
          })
          await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)
          if (uploadedImagePaths.length > 0) {
            await supabase.storage.from('tenants').remove(uploadedImagePaths)
          }
        } catch (cleanupError) {
          console.error('Error cleaning up tenant after booking failure:', cleanupError)
        }
      }

      // Check for specific constraint violations
      if (dbError.message?.includes('Cannot create property booking') ||
          dbError.message?.includes('Cannot create room booking')) {
        return NextResponse.json(
          { error: dbError.message },
          { status: 409 }
        )
      }

      // Check for unique index violations (duplicate current booking)
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'A current booking already exists for this property or room' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create booking. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in booking creation:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
