import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const token = searchParams.get('token')

  const supabase = await createClient()

  // Handle new token_hash format
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error && data.user) {
      // Redirect to password setup page (keep user signed in temporarily)
      return NextResponse.redirect(new URL('/setup-password', request.url))
    }
  }

  // Handle legacy token format
  if (token) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: 'signup',
      token_hash: token,
    })

    if (!error && data.user) {
      // Redirect to password setup page (keep user signed in temporarily)
      return NextResponse.redirect(new URL('/setup-password', request.url))
    }
  }

  // Redirect to error page with countdown
  return NextResponse.redirect(new URL('/error?reason=invalid_link', request.url))
}
