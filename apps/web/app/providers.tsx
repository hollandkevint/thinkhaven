'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, type ReactNode } from 'react'
import { Suspense } from 'react'
import { FeedbackModal } from './components/feedback/FeedbackModal'
import { OnboardingModal } from './components/onboarding/OnboardingModal'
import { usePathname, useSearchParams } from 'next/navigation'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? '/ingest'
const ONBOARDING_HIDDEN_ROUTES = ['/app', '/auth', '/login', '/signup', '/waitlist']

if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask]',
    },
  })
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname && posthog.config?.token) {
      let url = window.origin + pathname
      const params = searchParams.toString()
      if (params) {
        url = url + '?' + params
      }
      posthog.capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams])

  return null
}

function GlobalModals() {
  const pathname = usePathname()
  const hideOnboarding = ONBOARDING_HIDDEN_ROUTES.some(route =>
    pathname?.startsWith(route)
  )

  return (
    <>
      <FeedbackModal />
      {!hideOnboarding && <OnboardingModal />}
    </>
  )
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  if (!POSTHOG_KEY) {
    return <>{children}<GlobalModals /></>
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
      <GlobalModals />
    </PHProvider>
  )
}
