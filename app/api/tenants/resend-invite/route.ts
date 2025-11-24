import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    // Verify current user is staff
    const { staff: currentStaff, error } = await getUserAndStaff()
    if (error) return error

    const { tenantId } = await req.json()

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

    // Check if account is already activated via Supabase Auth
    const supabaseAdmin = createAdminClient()
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(tenantId)

    if (!authUser?.user) {
      return NextResponse.json(
        { error: 'Tenant account not found' },
        { status: 404 }
      )
    }

    // Check if user has already set their password (account is activated)
    const wasInvited = !!authUser.user.invited_at
    const passwordSet = authUser.user.app_metadata?.password_set === true
    const isActivated = wasInvited ? passwordSet : true

    if (isActivated) {
      return NextResponse.json(
        { error: 'Account is already activated' },
        { status: 400 }
      )
    }

    // Determine which flow to use based on user state:
    // Case 1: User has invited_at AND email is confirmed BUT no password set
    //         → Use password reset (they clicked link but didn't set password)
    // Case 2: User has invited_at BUT email is NOT confirmed
    //         → Use invite (they never clicked the original link)

    const hasInvitedAt = !!authUser.user.invited_at
    const isEmailConfirmed = !!authUser.user.email_confirmed_at

    let successMessage = 'Email sent successfully'

    if (hasInvitedAt && isEmailConfirmed && !passwordSet) {
      // Case 1: Send password reset link
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
        authUser.user.email!,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4000'}/api/auth/confirm-tenant`
        }
      )

      if (resetError) {
        console.error('Error sending password setup link:', resetError)
        return NextResponse.json(
          { error: 'Failed to send password setup link' },
          { status: 500 }
        )
      }
      successMessage = 'Password setup link sent successfully'
    } else {
      // Case 2: Send new invite link
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        authUser.user.email!,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4000'}/api/auth/confirm-tenant`
        }
      )

      if (inviteError) {
        console.error('Error resending invite:', inviteError)
        return NextResponse.json(
          { error: 'Failed to resend invitation' },
          { status: 500 }
        )
      }
      successMessage = 'Invitation email sent successfully'
    }

    return NextResponse.json(
      { success: true, message: successMessage },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error resending invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
