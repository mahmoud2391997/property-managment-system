'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function PasswordSetupGuard({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [needsRedirect, setNeedsRedirect] = useState(false)

  useEffect(() => {
    const checkUserStatus = async () => {
      // Skip check if already on setup-password page
      if (pathname === '/setup-password') {
        setIsChecking(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setIsChecking(false)
          return
        }

        const userType = user.user_metadata?.user_type

        // Check if user was invited
        const wasInvited = !!user.invited_at
        if (!wasInvited) {
          setIsChecking(false)
          return
        }

        // Check password_set in app_metadata
        const passwordSet = user.app_metadata?.password_set === true

        if (!passwordSet) {
          // Password not set - redirect to setup
          setNeedsRedirect(true)
          router.replace('/setup-password')
        } 
        //else if (userType === 'tenant') {
        //   // Tenant with password set - redirect to welcome page
        //   setNeedsRedirect(true)
        //   router.replace('/tenant-welcome')
        // } 
        else {
          setIsChecking(false)
        }
      } catch (error) {
        console.error('Error checking user status:', error)
        setIsChecking(false)
      }
    }

    checkUserStatus()
  }, [pathname, router])

  if (isChecking || needsRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
