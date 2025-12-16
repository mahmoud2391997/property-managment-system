import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('mark-password-set API called')
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('User from session:', user?.id)

    if (!user) {
      console.log('No user found - returning 401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Get current user data to preserve existing app_metadata
    const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(user.id)
    const existingAppMetadata = currentUser?.user?.app_metadata || {}
    console.log('Existing app_metadata:', existingAppMetadata)

    // Update app_metadata to mark password as set (merge with existing)
    const { data: updateData, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...existingAppMetadata,
          password_set: true,
          password_set_at: new Date().toISOString()
        }
      }
    )

    console.log('Update result:', { updateData: updateData?.user?.app_metadata, error })

    if (error) {
      console.error('Error updating user metadata:', error)
      return NextResponse.json(
        { error: 'Failed to update user metadata' },
        { status: 500 }
      )
    }

    console.log('Password marked as set successfully')
    return NextResponse.json(
      { success: true, timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error marking password as set:', error)
    return NextResponse.json(
      { error: 'Failed to update password status' },
      { status: 500 }
    )
  }
}
