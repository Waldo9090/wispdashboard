'use client'

import { useEffect } from 'react'
import { posthog } from '@/lib/posthog'
import { useAuth } from '@/context/auth-context'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    // Track in both development and production for testing
    if (user) {
      // Identify user when they log in
      posthog.identify(user.uid, {
        email: user.email,
        name: user.displayName,
      })
    } else {
      // Reset user when they log out
      posthog.reset()
    }
  }, [user])

  return <>{children}</>
} 