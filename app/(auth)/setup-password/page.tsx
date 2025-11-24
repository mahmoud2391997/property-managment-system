'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle2, Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetupPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(error === 'invalid_link' ? 'Invalid or expired confirmation link' : '')

  // Password validation rules
  const passwordRules = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const isPasswordValid = Object.values(passwordRules).every(Boolean)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordValid) {
      setErrorMessage('Password does not meet all requirements')
      return
    }

    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const supabase = createClient()

      // Get user metadata to determine user type
      const { data: { user } } = await supabase.auth.getUser()
      const userType = user?.user_metadata?.user_type

      // Update user password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      // Mark password as set in app_metadata (requires API call with service role)
      await fetch('/api/auth/mark-password-set', {
        method: 'POST'
      })

      // Sign out the user
      await supabase.auth.signOut()

      // Redirect based on user type
      if (userType === 'staff') {
        router.push('/login/staff?message=password_set')
      } else {
        router.push('/login?message=password_set')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to set password')
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Set Your Password</CardTitle>
            <CardDescription>
              Create a strong password for your staff account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {/* Password Input */}
                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {/* Confirm Password Input */}
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                {/* Password Requirements */}
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium mb-3">Password Requirements:</p>
                  <PasswordRequirement met={passwordRules.minLength} text="At least 8 characters" />
                  <PasswordRequirement met={passwordRules.hasUpperCase} text="One uppercase letter" />
                  <PasswordRequirement met={passwordRules.hasLowerCase} text="One lowercase letter" />
                  <PasswordRequirement met={passwordRules.hasNumber} text="One number" />
                  <PasswordRequirement met={passwordRules.hasSpecialChar} text="One special character (!@#$%^&*...)" />
                  {confirmPassword && (
                    <PasswordRequirement met={passwordsMatch} text="Passwords match" />
                  )}
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <p className="text-destructive text-sm">{errorMessage}</p>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isPasswordValid || !passwordsMatch || isLoading}
                >
                  {isLoading && <Loader2Icon className="animate-spin" />}
                  {isLoading ? 'Setting Password...' : 'Set Password & Continue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper component for password requirements
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
      )}
      <span className={cn("text-sm", met ? "text-green-700" : "text-muted-foreground")}>
        {text}
      </span>
    </div>
  )
}
