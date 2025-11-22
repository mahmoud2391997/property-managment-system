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

  // Handle new token_hash format
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/confirm?status=success', request.url))
    }
  }

  // Handle legacy token format (if Supabase sends old-style links)
  if (token) {
    const { error } = await supabase.auth.verifyOtp({
      type: 'signup',
      token_hash: token,
    })

    if (!error) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/confirm?status=success', request.url))
    }
  }

  // Redirect to error page
  return NextResponse.redirect(new URL('/confirm?status=error', request.url))
}
