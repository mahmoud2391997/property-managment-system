import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // Also check for legacy token format
  const token = searchParams.get('token')

  const supabase = await createClient()

  // Handle new token_hash format (works for both 'recovery' and 'invite' types)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Keep user signed in temporarily to allow password update
      return NextResponse.redirect(new URL('/setup-password', request.url))
    }
  }

  // Handle legacy token format
  if (token) {
    const { error } = await supabase.auth.verifyOtp({
      type: 'recovery',
      token_hash: token,
    })

    if (!error) {
      return NextResponse.redirect(new URL('/setup-password', request.url))
    }
  }

  // Redirect to error page with 3 second countdown
  return NextResponse.redirect(new URL('/error?reason=invalid_link', request.url))
}
