import { NextResponse } from 'next/server'
import { login } from '@/app/(auth)/login/actions'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const result = await login(formData)
    
    if (result) {
      // Return error message
      return NextResponse.json({ error: result }, { status: 400 })
    }
    
    // Login successful - let the redirect happen
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
