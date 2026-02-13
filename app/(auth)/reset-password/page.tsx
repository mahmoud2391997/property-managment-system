'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle2, Loader2Icon, ArrowLeft } from 'lucide-react'
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

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

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

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      // Sign out the user after password reset
      await supabase.auth.signOut()

      setIsSuccess(true)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password')
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Password Reset Successfully</CardTitle>
              <CardDescription>
                Your password has been updated. You can now log in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login" className="w-full">
                <Button className="w-full">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Create a new strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {/* Password Input */}
                <div className="grid gap-3">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                  />
                </div>

                {/* Confirm Password Input */}
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
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
                  {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </Button>

                <Link href="/login" className="w-full">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
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
        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
      )}
      <span className={cn("text-sm", met ? "text-green-700" : "text-muted-foreground")}>
        {text}
      </span>
    </div>
  )
}
