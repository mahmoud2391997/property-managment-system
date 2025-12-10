import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Update app_metadata to mark password as set
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          password_set: true,
          password_set_at: new Date().toISOString()
        }
      }
    )

    if (error) {
      console.error('Error updating user metadata:', error)
      return NextResponse.json(
        { error: 'Failed to update user metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
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
